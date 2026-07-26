(() => {
  "use strict";

  const questions = window.QUESTION_BANK || [];
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const app = document.querySelector("#app");
  const bottomNav = document.querySelector("#bottomNav");
  const modalRoot = document.querySelector("#modalRoot");
  const toastElement = document.querySelector("#toast");
  const networkBadge = document.querySelector("#networkBadge");
  const installButton = document.querySelector("#installButton");
  const STORE_KEY = "kasen-tenkenshi-v1";
  const AUTH_KEY = "kasen-tenkenshi-auth";
  const APP_PASSWORD = "4151";
  const INTRO_MESSAGE = "坂田さん　がんばって!!\n応援してるから";
  const OUTRO_MESSAGE = "おつかれさま！ひと休みして、また挑戦しよう！";
  const letters = ["A", "B", "C", "D"];
  let timerId = null;
  let splashTimerId = null;
  let typewriterTimerId = null;
  let installPrompt = null;
  let toastId = null;
  let audioContext = null;

  const emptyStore = () => ({
    stats: {},
    bookmarks: [],
    history: [],
    activeSession: null
  });

  const loadStore = () => {
    try {
      return { ...emptyStore(), ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
    } catch {
      return emptyStore();
    }
  };

  let store = loadStore();
  let session = store.activeSession && Array.isArray(store.activeSession.ids)
    ? store.activeSession
    : null;
  let currentView = sessionStorage.getItem(AUTH_KEY) === "ok" ? "home" : "password";

  const saveStore = () => {
    store.activeSession = session && !session.finished ? session : null;
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  };

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const shuffle = (items) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
  };

  const stars = (difficulty) => "★".repeat(difficulty) + "☆".repeat(5 - difficulty);
  const formatDate = (timestamp) => new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));

  const showToast = (message) => {
    clearTimeout(toastId);
    toastElement.textContent = message;
    toastElement.classList.add("show");
    toastId = setTimeout(() => toastElement.classList.remove("show"), 2400);
  };

  const playAnswerClick = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const play = () => {
      const startedAt = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(620, startedAt);
      oscillator.frequency.exponentialRampToValueAtTime(430, startedAt + 0.055);
      gain.gain.setValueAtTime(0.045, startedAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.055);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startedAt);
      oscillator.stop(startedAt + 0.06);
    };

    try {
      audioContext ||= new AudioContextClass();
      if (audioContext.state === "suspended") {
        audioContext.resume().then(play).catch(() => {});
      } else {
        play();
      }
    } catch {
      // 音声を利用できない環境でも回答操作は継続する。
    }
  };

  const updateNav = (active = "") => {
    bottomNav.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.action === active);
    });
  };

  const focusPage = () => {
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const render = () => {
    clearInterval(timerId);
    clearInterval(typewriterTimerId);
    clearTimeout(splashTimerId);
    timerId = null;
    typewriterTimerId = null;
    splashTimerId = null;
    document.querySelector(".topbar").hidden = ["password", "splash", "outro"].includes(currentView);
    if (currentView === "password") renderPassword();
    else if (currentView === "splash") renderSplash();
    else if (currentView === "outro") renderOutro();
    else if (currentView === "quiz" && session) renderQuiz();
    else if (currentView === "results" && session) renderResults();
    else if (currentView === "history") renderHistory();
    else if (currentView === "bookmarks") renderBookmarks();
    else renderHome();
    focusPage();
  };

  const getStats = () => {
    const values = Object.values(store.stats);
    const attempts = values.reduce((sum, item) => sum + (item.attempts || 0), 0);
    const correct = values.reduce((sum, item) => sum + (item.correct || 0), 0);
    return {
      studied: values.filter((item) => item.attempts > 0).length,
      attempts,
      correct,
      rate: attempts ? Math.round((correct / attempts) * 100) : 0
    };
  };

  function renderPassword() {
    bottomNav.hidden = true;
    app.innerHTML = `
      <section class="password-screen">
        <div class="password-card">
          <span class="password-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40"><path d="M8 11h24M7 20c7-5 10 5 17 0 4-3 6-2 9 0M7 28c7-5 10 5 17 0 4-3 6-2 9 0"/></svg>
          </span>
          <p class="eyebrow">River inspection study</p>
          <h1>河川点検士</h1>
          <p>合格するための100問</p>
          <form id="passwordForm">
            <label for="appPassword">パスワード</label>
            <div class="password-entry">
              <input id="appPassword" name="password" type="password" inputmode="numeric" autocomplete="current-password" required>
              <button type="submit">はじめる</button>
            </div>
            <small id="passwordError" role="alert"></small>
          </form>
        </div>
      </section>
    `;
    requestAnimationFrame(() => document.querySelector("#appPassword")?.focus());
  }

  const unlockApp = () => {
    const input = document.querySelector("#appPassword");
    const error = document.querySelector("#passwordError");
    if (!input || input.value !== APP_PASSWORD) {
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.select();
      }
      if (error) error.textContent = "パスワードが違います。";
      return;
    }
    sessionStorage.setItem(AUTH_KEY, "ok");
    currentView = "splash";
    render();
  };

  function renderSplash() {
    bottomNav.hidden = true;
    app.innerHTML = `
      <section class="experience-screen intro-screen" data-action="skip-intro" role="button" tabindex="0" aria-label="タップして学習画面へ">
        <img class="experience-photo" src="./assets/launch.jpg" alt="机で河川点検士の勉強をする学生と犬">
        <div class="experience-shade"></div>
        <div class="speech-bubble intro-bubble" aria-label="${INTRO_MESSAGE}">
          <span id="introMessage" aria-hidden="true"></span><i class="typing-caret" aria-hidden="true"></i>
        </div>
        <div class="intro-title">
          <small>RIVER INSPECTION STUDY</small>
          <h1>河川点検士<br><em>合格するための100問</em></h1>
          <span>タップしてはじめる</span>
        </div>
      </section>
    `;
    const message = document.querySelector("#introMessage");
    let index = 0;
    typewriterTimerId = setInterval(() => {
      if (!message || index >= INTRO_MESSAGE.length) {
        clearInterval(typewriterTimerId);
        typewriterTimerId = null;
        return;
      }
      message.textContent += INTRO_MESSAGE[index];
      index += 1;
    }, 55);
    splashTimerId = setTimeout(finishSplash, 3000);
  }

  const finishSplash = () => {
    if (currentView !== "splash") return;
    clearInterval(typewriterTimerId);
    clearTimeout(splashTimerId);
    currentView = "home";
    render();
  };

  function renderOutro() {
    bottomNav.hidden = true;
    app.innerHTML = `
      <section class="experience-screen outro-screen">
        <img class="experience-photo" src="./assets/finish.jpg" alt="休憩しながら飲み物を楽しむ犬">
        <div class="experience-shade"></div>
        <div class="speech-bubble outro-bubble">${OUTRO_MESSAGE}</div>
        <button class="outro-home" type="button" data-action="outro-home">トップへ戻る</button>
      </section>
    `;
  }

  function renderHome() {
    currentView = "home";
    bottomNav.hidden = false;
    updateNav("home");
    const stats = getStats();
    const resume = session && !session.finished ? `
      <div class="resume-card">
        <div>
          <small>進行中のセッション</small>
          <strong>${escapeHtml(session.title)}</strong>
          <span>${session.index + 1} / ${session.ids.length}問</span>
        </div>
        <button type="button" data-action="resume-session">続きから</button>
      </div>
    ` : "";
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
      && !window.matchMedia("(display-mode: standalone)").matches;

    app.innerHTML = `
      <section class="hero">
        <p class="eyebrow">River inspection study</p>
        <h1>現場を見る目を、<br><em>一問ずつ。</em></h1>
        <p class="hero-copy">写真・図解・知識の100問で、判断の根拠まで身につける。</p>
        <span class="hero-version">Ver. 1.0</span>
      </section>
      <div class="home-content">
        ${resume}
        <section class="status-card">
          <div>
            <h2>${stats.studied ? `${stats.studied}問を学習済み` : "学習をはじめましょう"}</h2>
            <p>${stats.attempts ? `累計${stats.attempts}回答・正答率${stats.rate}%` : "記録はこの端末に保存されます。オフラインでも利用できます。"}</p>
          </div>
          <div class="ring" style="--progress:${stats.studied}%"><span>${stats.studied}<small>/100</small></span></div>
        </section>

        <div class="section-heading"><h2>学習メニュー</h2><small>100 QUESTIONS</small></div>
        <section class="mode-grid">
          <button class="mode-card primary" type="button" data-action="choose-field">
            <span class="mode-default">初期選択</span>
            <span class="mode-icon">
              <svg viewBox="0 0 24 24"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22zM4 5.5V22m4-15h8m-8 4h8"/></svg>
            </span>
            <strong>学習モード</strong>
            <p>分野を選んで演習<br>回答表示後に正解と解説</p>
            <span class="arrow">→</span>
          </button>
          <button class="mode-card" type="button" data-action="start-exam">
            <span class="mode-icon">
              <svg viewBox="0 0 24 24"><path d="M7 3h10v3H7zM6 5h12v16H6zM9 10h6m-6 4h6m-6 4h4"/></svg>
            </span>
            <strong>試験モード</strong>
            <p>50問・90分<br>終了後にまとめて採点</p>
            <span class="arrow">→</span>
          </button>
        </section>

        <div class="section-heading"><h2>クイック学習</h2><small>QUICK FILTER</small></div>
        <section class="filter-list">
          ${filterButton("写真", "写真問題だけ", "現場の変状を見分ける", questions.filter((q) => q.type === "写真").length, "photo")}
          ${filterButton("法", "法令だけ", "河川法令の要点", questions.filter((q) => q.field === "河川法令").length, "law")}
          ${filterButton("S", "Sランクだけ", "最優先で復習", questions.filter((q) => q.priority === "S").length, "rank-s")}
          ${filterButton("難", "難問だけ", "難易度★★★★☆以上", questions.filter((q) => q.difficulty >= 4).length, "hard")}
          ${filterButton("90", "出題傾向90%以上", "頻出テーマを集中演習", questions.filter((q) => q.trend >= 90).length, "trend")}
        </section>

        ${ios ? `<button class="ios-install" type="button" data-action="ios-install">iPhoneのホーム画面に追加する方法</button>` : ""}
        <div class="disclaimer"><b>注</b><span>本アプリの問題は学習用オリジナルです。公式問題ではありません。法令・基準を実務で適用する際は、必ず最新の公式資料をご確認ください。</span></div>
      </div>
    `;
  }

  const filterButton = (icon, title, subtitle, count, filter) => `
    <button class="filter-button" type="button" data-action="quick-study" data-filter="${filter}">
      <span class="mini-icon">${icon}</span>
      <span><strong>${title}</strong><small>${subtitle}</small></span>
      <span>${count}問 ›</span>
    </button>
  `;

  const startSession = (mode, selected, title) => {
    if (!selected.length) {
      showToast("該当する問題がありません");
      return;
    }
    session = {
      mode,
      title,
      ids: shuffle(selected.map((question) => question.id)),
      index: 0,
      answers: {},
      revealed: [],
      reviews: [],
      recorded: [],
      startedAt: Date.now(),
      duration: mode === "exam" ? 90 * 60 : 0,
      finished: false,
      resultReviewed: false
    };
    if (mode === "exam") session.ids = session.ids.slice(0, 50);
    saveStore();
    currentView = "quiz";
    closeModal();
    render();
  };

  const resumeSession = () => {
    if (!session) return;
    currentView = "quiz";
    render();
  };

  function renderQuiz() {
    const question = questionMap.get(session.ids[session.index]);
    if (!question) {
      currentView = "home";
      render();
      return;
    }
    bottomNav.hidden = true;
    session.revealed ||= [];
    const selected = session.answers[question.id];
    const reveal = session.mode === "study" && session.revealed.includes(question.id);
    const reviewMode = session.mode === "review";
    const exitLabel = session.mode === "exam" ? "試験を終了" : "学習を終了";
    const shouldReveal = reveal || reviewMode;
    const progress = ((session.index + 1) / session.ids.length) * 100;
    const timer = session.mode === "exam" ? `
      <span class="timer" id="timer">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6"/></svg>
        <span>90:00</span>
      </span>
    ` : `<span class="tag">${session.mode === "review" ? "解答レビュー" : "学習モード"}</span>`;

    app.innerHTML = `
      <section class="quiz-shell">
        <div class="quiz-header">
          <div class="quiz-meta"><strong>QUESTION ${String(session.index + 1).padStart(2, "0")}</strong> / ${String(session.ids.length).padStart(2, "0")}　${escapeHtml(session.title)}</div>
          ${timer}
        </div>
        <div class="progress-track"><i style="--progress:${progress}%"></i></div>
        <div class="question-tags">
          <span class="tag type">${escapeHtml(question.typeLabel)}</span>
          <span class="tag">${escapeHtml(question.field)}</span>
          <span class="tag">${stars(question.difficulty)}</span>
          <span class="tag ${question.priority === "S" ? "rank-s" : ""}">復習 ${question.priority}</span>
        </div>
        <h1 class="question-title">${escapeHtml(question.question)}</h1>
        ${question.type !== "知識" ? renderVisual(question) : ""}
        <div class="choices">
          ${question.choices.map((choice, index) => {
            const selectedClass = selected === index ? "is-selected" : "";
            const answerClass = shouldReveal
              ? (index === question.answer ? "is-correct" : (selected === index ? "is-wrong" : ""))
              : "";
            return `
              <button class="choice ${selectedClass} ${answerClass}" type="button"
                data-action="answer" data-index="${index}"
                ${reviewMode || reveal ? "disabled" : ""}>
                <span class="choice-letter">${letters[index]}</span>
                <span>${escapeHtml(choice)}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${shouldReveal ? renderExplanation(question, selected) : ""}
        <div class="quiz-controls">
          <button class="control-button" type="button" data-action="previous" ${session.index === 0 ? "disabled" : ""}>← 前へ</button>
          <button class="control-button ${session.reviews.includes(question.id) ? "bookmarked" : ""}" type="button" data-action="toggle-review">${session.reviews.includes(question.id) ? "★ 見直す" : "☆ 見直す"}</button>
          <button class="control-button primary" type="button" data-action="next">${session.index === session.ids.length - 1 ? (reviewMode ? "結果へ" : "終了・採点") : "次へ →"}</button>
          ${session.mode === "study" ? `<button class="control-button answer-button" type="button" data-action="show-answer" ${selected === undefined || reveal ? "disabled" : ""}>${reveal ? "回答表示済み" : "回答を表示"}</button>` : ""}
          <button class="control-button list-button" type="button" data-action="show-list">問題一覧</button>
          ${!reviewMode ? `<button class="control-button exit-button" type="button" data-action="exit-session">${exitLabel}</button>` : ""}
        </div>
      </section>
    `;
    if (session.mode === "exam") startTimer();
  }

  const renderExplanation = (question, selected) => {
    const correct = selected === question.answer;
    return `
      <section class="answer-panel">
        <div class="answer-result ${correct ? "" : "wrong"}">${correct ? "✓ 正解" : `× 不正解　正解は ${letters[question.answer]}`}</div>
        <p>${escapeHtml(question.explanation)}</p>
        <dl>
          <dt>分野</dt><dd>${escapeHtml(question.field)}</dd>
          <dt>分類</dt><dd>${escapeHtml(question.middle)} ＞ ${escapeHtml(question.small)}</dd>
          <dt>難易度</dt><dd>${stars(question.difficulty)}</dd>
          <dt>出題傾向</dt><dd>${question.trend}%</dd>
          <dt>復習優先度</dt><dd>${question.priority}</dd>
          <dt>キーワード</dt><dd>${question.keywords.map(escapeHtml).join("・")}</dd>
          <dt>関連問題</dt><dd>${question.related.length ? question.related.join("・") : "—"}</dd>
        </dl>
      </section>
    `;
  };

  const recordAnswer = (question, selected) => {
    if (session.recorded.includes(question.id) || selected === undefined) return;
    const stat = store.stats[question.id] || { attempts: 0, correct: 0, wrong: 0 };
    stat.attempts += 1;
    if (selected === question.answer) stat.correct += 1;
    else stat.wrong += 1;
    store.stats[question.id] = stat;
    session.recorded.push(question.id);
  };

  const answerQuestion = (index) => {
    const question = questionMap.get(session.ids[session.index]);
    session.revealed ||= [];
    if (session.mode === "review" || session.revealed.includes(question.id)) return;
    playAnswerClick();
    session.answers[question.id] = index;
    saveStore();
    renderQuiz();
  };

  const revealAnswer = () => {
    if (session.mode !== "study") return;
    const question = questionMap.get(session.ids[session.index]);
    const selected = session.answers[question.id];
    if (selected === undefined) {
      showToast("回答を選択してください");
      return;
    }
    session.revealed ||= [];
    if (!session.revealed.includes(question.id)) {
      session.revealed.push(question.id);
      recordAnswer(question, selected);
      saveStore();
    }
    renderQuiz();
  };

  const moveQuestion = (delta) => {
    const nextIndex = session.index + delta;
    if (nextIndex >= 0 && nextIndex < session.ids.length) {
      session.index = nextIndex;
      saveStore();
      render();
      return;
    }
    if (delta > 0) {
      if (session.mode === "review") {
        session.mode = session.originalMode || "study";
        currentView = "results";
        render();
      } else {
        requestFinish();
      }
    }
  };

  const startTimer = () => {
    const update = () => {
      const timer = document.querySelector("#timer");
      if (!timer || session.mode !== "exam") return;
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      const remaining = Math.max(0, session.duration - elapsed);
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      timer.querySelector("span").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      timer.classList.toggle("is-urgent", remaining <= 300);
      if (remaining === 0) {
        clearInterval(timerId);
        finishSession(true);
      }
    };
    update();
    timerId = setInterval(update, 1000);
  };

  const requestFinish = () => {
    const unanswered = session.ids.filter((id) => session.answers[id] === undefined).length;
    openModal(`
      <h2>採点しますか？</h2>
      <p>${unanswered ? `未回答が${unanswered}問あります。` : "すべて回答済みです。"}終了後に正解と詳しい解説を確認できます。</p>
      <div class="modal-actions">
        <button class="wide-button primary" type="button" data-action="finish-session">終了して採点</button>
        <button class="wide-button" type="button" data-action="close-modal">問題に戻る</button>
      </div>
    `);
  };

  const requestSessionExit = () => {
    const isExam = session?.mode === "exam";
    const modeLabel = isExam ? "試験" : "学習";
    openModal(`
      <h2>${modeLabel}を終了しますか？</h2>
      <p>${isExam ? "現在の回答は採点せずに終了します。" : "回答済みの学習記録はこの端末に保存されています。"}</p>
      <div class="modal-actions">
        <button class="wide-button primary" type="button" data-action="confirm-exit-session">${modeLabel}を終了</button>
        <button class="wide-button" type="button" data-action="close-modal">${modeLabel}を続ける</button>
      </div>
    `);
  };

  const showOutro = () => {
    closeModal();
    session = null;
    saveStore();
    currentView = "outro";
    render();
  };

  const finishSession = (timedOut = false) => {
    closeModal();
    if (session.mode === "exam") {
      session.ids.forEach((id) => recordAnswer(questionMap.get(id), session.answers[id]));
    }
    session.finished = true;
    session.endedAt = Date.now();
    const result = sessionResult();
    const historyItem = {
      id: `${session.startedAt}`,
      date: session.endedAt,
      title: session.title,
      mode: session.mode,
      correct: result.correct,
      total: result.total,
      answered: result.answered
    };
    store.history.unshift(historyItem);
    store.history = store.history.slice(0, 30);
    saveStore();
    if (timedOut) showToast("制限時間になったため採点しました");
    currentView = "results";
    render();
  };

  const sessionResult = () => {
    const answeredIds = session.ids.filter((id) => session.answers[id] !== undefined);
    const correctIds = answeredIds.filter((id) => session.answers[id] === questionMap.get(id).answer);
    const wrongIds = session.ids.filter((id) => session.answers[id] !== questionMap.get(id).answer);
    return {
      total: session.ids.length,
      answered: answeredIds.length,
      correct: correctIds.length,
      wrong: wrongIds.length,
      wrongIds,
      rate: Math.round((correctIds.length / session.ids.length) * 100)
    };
  };

  function renderResults() {
    bottomNav.hidden = false;
    updateNav("");
    const result = sessionResult();
    const resultModeLabel = session.mode === "exam" ? "試験" : "学習";
    const grade = result.rate >= 90 ? "Excellent" : result.rate >= 75 ? "Good" : result.rate >= 60 ? "Keep going" : "要復習";
    app.innerHTML = `
      <div class="page-heading"><p>SESSION RESULT</p><h1>学習結果</h1></div>
      <section class="result-hero">
        <div class="score-line">
          <div><div class="score-number">${result.correct}<small> / ${result.total}</small></div><div class="score-label">${escapeHtml(session.title)}・正答率 ${result.rate}%</div></div>
          <span class="result-grade">${grade}</span>
        </div>
        <div class="score-bar"><i style="--score:${result.rate}%"></i></div>
      </section>
      <section class="stat-grid">
        <div class="stat-box"><strong>${result.answered}</strong><span>回答</span></div>
        <div class="stat-box"><strong>${result.correct}</strong><span>正解</span></div>
        <div class="stat-box"><strong>${result.wrong}</strong><span>誤答・未回答</span></div>
      </section>
      <div class="action-stack">
        <button class="wide-button primary" type="button" data-action="retry-wrong" ${result.wrong ? "" : "disabled"}>間違えた問題だけ再出題（${result.wrong}問）</button>
        <button class="wide-button" type="button" data-action="review-results">全問題の正答・解説を見る</button>
        <button class="wide-button" type="button" data-action="home">ホームへ戻る</button>
        <button class="wide-button end-study-button" type="button" data-action="confirm-exit-session">${resultModeLabel}を終了</button>
      </div>
    `;
  }

  function renderHistory() {
    currentView = "history";
    bottomNav.hidden = false;
    updateNav("show-history");
    app.innerHTML = `
      <div class="page-heading"><p>LEARNING LOG</p><h1>成績</h1></div>
      ${store.history.length ? `
        <div class="history-list">
          ${store.history.map((item) => `
            <div class="history-item">
              <div><strong>${escapeHtml(item.title)}</strong><small>${formatDate(item.date)}・${item.answered}/${item.total}問回答</small></div>
              <span class="history-score">${item.correct}/${item.total}</span>
            </div>
          `).join("")}
        </div>
      ` : `<div class="empty-state"><strong>まだ成績がありません</strong>試験または学習モードを完了すると、ここに記録されます。</div>`}
    `;
  }

  function renderBookmarks() {
    currentView = "bookmarks";
    bottomNav.hidden = false;
    updateNav("show-bookmarks");
    const bookmarked = store.bookmarks.map((id) => questionMap.get(id)).filter(Boolean);
    const wrong = questions.filter((question) => (store.stats[question.id]?.wrong || 0) > 0);
    app.innerHTML = `
      <div class="page-heading"><p>REVIEW QUEUE</p><h1>見直し</h1></div>
      ${bookmarked.length || wrong.length ? `
        <div class="review-summary">
          <div><strong>${bookmarked.length}</strong><span>後で見直す</span></div>
          <div><strong>${wrong.length}</strong><span>誤答履歴あり</span></div>
        </div>
        <div class="action-stack">
          ${bookmarked.length ? `<button class="wide-button primary" type="button" data-action="study-bookmarks">見直し問題を学習（${bookmarked.length}問）</button>` : ""}
          ${wrong.length ? `<button class="wide-button" type="button" data-action="study-history-wrong">間違えた問題を学習（${wrong.length}問）</button>` : ""}
        </div>
        <div class="review-list">
          ${bookmarked.slice(0, 20).map((question) => `
            <button type="button" data-action="study-one" data-id="${question.id}">
              <span>${question.id}</span><strong>${escapeHtml(question.question)}</strong><small>${escapeHtml(question.field)}・${stars(question.difficulty)}</small>
            </button>
          `).join("")}
        </div>
      ` : `<div class="empty-state"><strong>見直し問題はありません</strong>問題画面の「☆ 見直す」を押すと、ここに追加されます。</div>`}
    `;
  }

  const openFieldChooser = () => {
    const fields = [...new Set(questions.map((question) => question.field))];
    openModal(`
      <h2>学習する分野を選ぶ</h2>
      <p>選択後に「回答を表示」を押すと、正解・詳細解説を表示します。</p>
      <div class="modal-actions">
        <button class="modal-choice" type="button" data-action="start-field" data-field="all"><strong>全100問</strong><small>すべての分野から出題</small></button>
        ${fields.map((field) => {
          const count = questions.filter((question) => question.field === field).length;
          return `<button class="modal-choice" type="button" data-action="start-field" data-field="${escapeHtml(field)}"><strong>${escapeHtml(field)}</strong><small>${count}問</small></button>`;
        }).join("")}
      </div>
    `);
  };

  const openQuestionList = () => {
    openModal(`
      <h2>問題一覧</h2>
      <p>回答済み ${Object.keys(session.answers).length}/${session.ids.length}問。オレンジの印は「後で見直す」です。</p>
      <div class="legend"><span class="done">回答済み</span><span class="later">後で見直す</span><span>未回答</span></div>
      <div class="question-list">
        ${session.ids.map((id, index) => `
          <button class="question-cell ${session.answers[id] !== undefined ? "answered" : ""} ${session.reviews.includes(id) ? "review" : ""}"
            type="button" data-action="jump-question" data-index="${index}">${index + 1}</button>
        `).join("")}
      </div>
      <button class="wide-button modal-close" type="button" data-action="close-modal">閉じる</button>
    `);
  };

  const openModal = (content) => {
    modalRoot.innerHTML = `<section class="modal" role="dialog" aria-modal="true"><div class="modal-grip"></div>${content}</section>`;
  };
  const closeModal = () => { modalRoot.innerHTML = ""; };

  const toggleReview = () => {
    const id = session.ids[session.index];
    const enabled = !session.reviews.includes(id);
    session.reviews = enabled ? [...session.reviews, id] : session.reviews.filter((value) => value !== id);
    store.bookmarks = enabled
      ? [...new Set([...store.bookmarks, id])]
      : store.bookmarks.filter((value) => value !== id);
    saveStore();
    renderQuiz();
    showToast(enabled ? "見直しリストに追加しました" : "見直しリストから外しました");
  };

  const reviewResults = () => {
    session.originalMode = session.mode === "review" ? session.originalMode : session.mode;
    session.mode = "review";
    session.index = 0;
    currentView = "quiz";
    render();
  };

  const retryWrong = () => {
    const result = sessionResult();
    startSession("study", result.wrongIds.map((id) => questionMap.get(id)), "間違えた問題");
  };

  const quickStudy = (filter) => {
    const predicates = {
      photo: (question) => question.type === "写真",
      law: (question) => question.field === "河川法令",
      "rank-s": (question) => question.priority === "S",
      hard: (question) => question.difficulty >= 4,
      trend: (question) => question.trend >= 90
    };
    const titles = {
      photo: "写真問題",
      law: "河川法令",
      "rank-s": "Sランク",
      hard: "難問",
      trend: "出題傾向90%以上"
    };
    startSession("study", questions.filter(predicates[filter]), titles[filter]);
  };

  const navigateHome = () => {
    if (session?.finished) session = null;
    currentView = "home";
    saveStore();
    render();
  };

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "passwordForm") return;
    event.preventDefault();
    unlockApp();
  });

  document.addEventListener("keydown", (event) => {
    if (currentView === "splash" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      finishSplash();
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      if (event.target === modalRoot) closeModal();
      return;
    }
    const { action } = button.dataset;
    if (action === "skip-intro") finishSplash();
    else if (action === "outro-home") {
      currentView = "home";
      render();
    }
    else if (action === "home") navigateHome();
    else if (action === "start-exam") startSession("exam", questions, "模擬試験");
    else if (action === "choose-field") openFieldChooser();
    else if (action === "quick-study") quickStudy(button.dataset.filter);
    else if (action === "start-field") {
      const field = button.dataset.field;
      startSession("study", field === "all" ? questions : questions.filter((question) => question.field === field), field === "all" ? "全分野" : field);
    }
    else if (action === "resume-session") resumeSession();
    else if (action === "answer") answerQuestion(Number(button.dataset.index));
    else if (action === "show-answer") revealAnswer();
    else if (action === "previous") moveQuestion(-1);
    else if (action === "next") moveQuestion(1);
    else if (action === "toggle-review") toggleReview();
    else if (action === "show-list") openQuestionList();
    else if (action === "jump-question") {
      session.index = Number(button.dataset.index);
      saveStore();
      closeModal();
      render();
    }
    else if (action === "finish-session") finishSession();
    else if (action === "exit-session") requestSessionExit();
    else if (action === "confirm-exit-session") showOutro();
    else if (action === "review-results") reviewResults();
    else if (action === "retry-wrong") retryWrong();
    else if (action === "show-history") { currentView = "history"; render(); }
    else if (action === "show-bookmarks") { currentView = "bookmarks"; render(); }
    else if (action === "study-bookmarks") startSession("study", store.bookmarks.map((id) => questionMap.get(id)).filter(Boolean), "見直し問題");
    else if (action === "study-history-wrong") startSession("study", questions.filter((question) => (store.stats[question.id]?.wrong || 0) > 0), "間違えた問題");
    else if (action === "study-one") startSession("study", [questionMap.get(button.dataset.id)], "1問復習");
    else if (action === "close-modal") closeModal();
    else if (action === "ios-install") openModal(`
      <h2>iPhoneにインストール</h2>
      <p>Safariでこのページを開き、共有ボタンをタップして「ホーム画面に追加」を選んでください。追加後は全画面・オフラインで使えます。</p>
      <button class="wide-button primary" type="button" data-action="close-modal">わかりました</button>
    `);
  });

  function renderVisual(question) {
    if (question.type === "写真") {
      const photo = question.scene;
      return `
        <figure class="photo-figure">
          <div class="visual-panel photo-scene">
            <img class="question-photo" src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" decoding="async">
            <span class="visual-label">実写真</span>
          </div>
          <figcaption class="photo-source">
            出典：<a href="${escapeHtml(photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(photo.sourceTitle)} p.${photo.sourcePage}（国土交通省）</a>を加工して作成
          </figcaption>
        </figure>
      `;
    }

    const hash = [...question.scene].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const markerX = 90 + (hash % 210);
    return `
      <div class="visual-panel illustration">
        ${illustrationSvg(question.scene, markerX)}
        <span class="visual-label">模式図</span>
      </div>
    `;
  }

  const illustrationSvg = (scene, markerX) => {
    if (scene === "risk-matrix") {
      return `<svg viewBox="0 0 400 225"><rect width="400" height="225" fill="#eef0e8"/><g transform="translate(95 28)"><path d="M0 0h210v165H0z" fill="#fff" stroke="#47645e" stroke-width="2"/><path d="M0 55h210M0 110h210M70 0v165M140 0v165" stroke="#8da09b"/><path d="M140 0h70v55h-70zM70 0h70v55H70zM140 55h70v55h-70z" fill="#e5754d" opacity=".85"/><path d="M0 110h70v55H0zM0 55h70v55H0z" fill="#8ac4aa"/><text x="175" y="33" text-anchor="middle" font-size="12" font-weight="700">高</text><text x="35" y="143" text-anchor="middle" font-size="12">低</text></g><text x="200" y="212" text-anchor="middle" font-size="11">発生可能性 × 影響度</text></svg>`;
    }
    if (scene === "trend-chart") {
      return `<svg viewBox="0 0 400 225"><rect width="400" height="225" fill="#f1f1e9"/><path d="M60 28v155h290M60 150h290M60 105h290M60 60h290" stroke="#bcc7c3" stroke-width="1"/><path d="m78 157 63-12 64-30 63-19 64-48" fill="none" stroke="#e76f3c" stroke-width="5"/><g fill="#e76f3c">${[[78,157],[141,145],[205,115],[268,96],[332,48]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6"/>`).join("")}</g><text x="22" y="38" font-size="11">幅</text><text x="330" y="205" font-size="11">時間</text></svg>`;
    }
    if (scene === "river-bend") {
      return `<svg viewBox="0 0 400 225"><rect width="400" height="225" fill="#e5dfc9"/><path d="M85-20c210 70-110 151 225 270" fill="none" stroke="#548e91" stroke-width="94"/><path d="M84-20c206 70-113 151 225 270" fill="none" stroke="#d8eeee" stroke-width="4" stroke-dasharray="12 9"/><path d="m310 118 28-4-14 25" fill="#e76f3c"/><text x="290" y="101" font-size="13" font-weight="700" fill="#a94e33">外岸</text><text x="88" y="142" font-size="13" font-weight="700" fill="#4e6656">内岸</text></svg>`;
    }
    return `
      <svg viewBox="0 0 400 225" role="img" aria-label="河川構造の模式図">
        <rect width="400" height="225" fill="#f0efe5"/>
        <path d="M0 190h400" stroke="#173f3b" stroke-width="3"/>
        <path d="M22 190 95 76h210l73 114" fill="#c5b895" stroke="#6f674f" stroke-width="3"/>
        <path d="M150 190h100l-22-86h-56z" fill="#6e9ea0" opacity=".9"/>
        <path d="M151 178c22-10 43 8 65-2 14-7 23-5 34 0" fill="none" stroke="#d7eeea" stroke-width="3"/>
        <path d="M95 76h210" stroke="#173f3b" stroke-width="5"/>
        <path d="M${markerX} 72v-35" stroke="#e76f3c" stroke-width="3"/>
        <path d="m${markerX} 74-7-13h14z" fill="#e76f3c"/>
        <rect x="${Math.max(12, markerX - 40)}" y="12" width="80" height="24" rx="7" fill="#e76f3c"/>
        <text x="${markerX}" y="29" fill="#fff" font-size="11" text-anchor="middle" font-family="sans-serif" font-weight="700">確認箇所</text>
        <text x="38" y="211" fill="#5d6966" font-size="11">川裏</text><text x="330" y="211" fill="#5d6966" font-size="11">川表</text>
      </svg>
    `;
  };

  const updateNetwork = () => {
    const online = navigator.onLine;
    networkBadge.classList.toggle("is-offline", !online);
    networkBadge.querySelector("span").textContent = online ? "オンライン" : "オフライン";
  };

  window.addEventListener("online", updateNetwork);
  window.addEventListener("offline", updateNetwork);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => showToast("アプリをインストールしました"));

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {
      showToast("オフライン機能を準備できませんでした");
    }));
  }

  updateNetwork();
  render();
})();
