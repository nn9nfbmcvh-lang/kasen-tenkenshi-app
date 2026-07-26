/* 河川点検士アプリ 300問版 追加問題データ
 * 既存のQ001〜Q100は変更せず、Q101〜Q300を追加する。
 * 写真問題は選定済みの55枚を、異なる点検着眼点で再利用する。
 */
(() => {
  "use strict";

  const baseQuestions = Array.isArray(window.QUESTION_BANK)
    ? [...window.QUESTION_BANK]
    : [];

  if (baseQuestions.length >= 300) return;

  const photoSources = baseQuestions.filter((question) => question.type === "写真");
  const knowledgeSources = baseQuestions.filter((question) => question.type === "知識");

  if (baseQuestions.length !== 100 || photoSources.length !== 55 || knowledgeSources.length !== 45) {
    throw new Error("300問版の追加元となる100問データを確認できません。");
  }

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const unique = (items) => [...new Set(items.filter(Boolean))];

  const arrangeChoices = (correct, distractors, seed) => {
    const fallbacks = [
      "点検記録を残さず、印象だけで判断する",
      "周辺状況を確認せず、写真一枚だけで完結させる",
      "安全確認を省略して変状へ近づく"
    ];
    const source = unique([correct, ...distractors, ...fallbacks]).slice(0, 4);
    const shift = seed % source.length;
    const choices = [...source.slice(shift), ...source.slice(0, shift)];
    return {
      choices,
      answer: choices.indexOf(correct)
    };
  };

  const relatedTo = (source) => unique([source.id, ...(source.related || [])]).slice(0, 3);

  const photoTemplates = [
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」を経年比較するとき、最も再現性の高い記録方法はどれか。`,
      correct: () => "位置・範囲・寸法を同じ撮影方向と基準点で記録し、過去記録と比較する",
      distractors: () => [
        "変状名だけを書き、位置や大きさは省略する",
        "最も目立つ一部分だけを接写して全景は残さない",
        "過去記録を見ず、今回の印象だけで進行性を決める"
      ],
      note: "経年比較では、位置、範囲、寸法、撮影方向、基準点をそろえることで進行性を判断しやすくなる。",
      keyword: "経年比較"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」を撮影するとき、状況を第三者へ最も伝えやすい組み合わせはどれか。`,
      correct: () => "施設全体が分かる遠景、周辺との関係が分かる中景、スケール付き近景を残す",
      distractors: () => [
        "スケールのない近景一枚だけを残す",
        "変状が写らない方向から全景だけを撮る",
        "写真番号と位置情報を付けずに保存する"
      ],
      note: "遠景・中景・近景を組み合わせ、方向、位置、スケールを対応させると記録の再現性が高まる。",
      keyword: "写真記録"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」を周辺まで確認する主な理由はどれか。`,
      correct: (source) => `単独の変状か、周辺の${source.middle}と連続する変状かを判断するため`,
      distractors: () => [
        "写真の色合いを統一するため",
        "点検時間を長くするため",
        "施設名称を推測するため"
      ],
      note: "変状の連続性と周辺構造との関係は、原因や機能への影響を考える重要な手掛かりになる。",
      keyword: "周辺確認"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」が急に拡大している場合、点検者の初動として最も適切なものはどれか。`,
      correct: () => "安全を確保し、位置・規模・周辺状況を記録して定められた連絡系統へ報告する",
      distractors: () => [
        "原因を確かめるため単独で危険箇所へ立ち入る",
        "変状を手で動かして元の状態へ戻す",
        "次回点検まで記録せずに放置する"
      ],
      note: "急激な進行や機能低下が疑われる場合は、点検者の安全を優先し、客観的記録と速やかな報告を行う。",
      keyword: "初動対応"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」について、原因を考える際に有効な確認はどれか。`,
      correct: () => "水位・降雨・出水履歴、周辺地形、隣接する変状を合わせて確認する",
      distractors: () => [
        "撮影端末の機種だけを確認する",
        "写真の明るさだけで原因を決める",
        "現地条件を見ず、名称だけで原因を断定する"
      ],
      note: "変状の原因は一つとは限らない。外力、地形、材料、周辺変状、履歴を組み合わせて考える。",
      keyword: "原因推定"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」を計測するとき、記録として不足が少ないものはどれか。`,
      correct: () => "最大値だけでなく、測定位置・方向・単位・範囲と使用した基準を残す",
      distractors: () => [
        "単位を書かずに数字だけを残す",
        "測定位置を変えるたびに基準を変える",
        "最小値だけを記録して範囲を省略する"
      ],
      note: "測定値は、位置、方向、単位、基準、範囲がそろって初めて再測定と比較に使える。",
      keyword: "計測"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」を評価するとき、変状名と併せて確認すべき事項はどれか。`,
      correct: (source) => `${source.field}の機能への影響、進行性、周辺変状との関連を確認する`,
      distractors: () => [
        "写真の余白の広さだけを確認する",
        "点検者の経験年数だけで評価を決める",
        "施設の外観色だけを評価する"
      ],
      note: "同じ変状種別でも、規模、進行性、機能への影響、周辺との関連によって対応の優先度は変わる。",
      keyword: "機能影響"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」が一時的な現象か継続的な変状かを見分ける方法として適切なものはどれか。`,
      correct: () => "水位や天候条件を記録し、条件の異なる時期に同じ位置を再確認する",
      distractors: () => [
        "一度の写真だけで継続性を断定する",
        "天候と水位の記録を残さない",
        "毎回違う場所を撮影して比較する"
      ],
      note: "水位、降雨、季節、運転状況などを記録し、同じ位置を再確認することで一時性と継続性を判断しやすくなる。",
      keyword: "再確認"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で「${source.small}」を発見した際、見落とし防止のため追加して確認する範囲はどれか。`,
      correct: (source) => `${source.middle}の上下流・前後区間と、接合部や隣接部材を連続して確認する`,
      distractors: () => [
        "変状の中心一点だけを確認する",
        "施設と無関係な遠方だけを確認する",
        "接合部を避けて平坦な箇所だけを見る"
      ],
      note: "変状は接合部や境界、上下流方向へ連続する場合があるため、点ではなく範囲として確認する。",
      keyword: "連続確認"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」を点検記録へ登録するとき、最も適切な記載はどれか。`,
      correct: (source) => `「${source.small}」と判断した根拠、位置、規模、写真番号、今後の確認事項を対応させる`,
      distractors: () => [
        "「異常あり」とだけ記載する",
        "位置を記載せず写真だけを保存する",
        "判断根拠を残さず優先度だけを決める"
      ],
      note: "第三者が同じ場所を再確認できるよう、判断根拠と位置・規模・写真・対応を結び付けて記録する。",
      keyword: "記録品質"
    }
  ];

  let serial = 100;
  const additions = [];

  photoSources.forEach((source, sourceIndex) => {
    [0, 1].forEach((variant) => {
      serial += 1;
      const template = photoTemplates[(sourceIndex * 2 + variant) % photoTemplates.length];
      const correct = template.correct(source);
      const arranged = arrangeChoices(correct, template.distractors(source), serial);
      additions.push({
        id: `Q${String(serial).padStart(3, "0")}`,
        number: serial,
        type: "写真",
        typeLabel: "写真問題",
        question: template.prompt(source),
        choices: arranged.choices,
        answer: arranged.answer,
        explanation: `${source.explanation} ${template.note}`,
        field: source.field,
        middle: source.middle,
        small: source.small,
        difficulty: clamp(source.difficulty + (variant === 1 ? 1 : 0), 1, 5),
        trend: clamp(source.trend - (variant === 1 ? 5 : 0), 10, 100),
        priority: source.priority,
        keywords: unique([...source.keywords, template.keyword]).slice(0, 4),
        related: relatedTo(source),
        scene: {
          ...source.scene,
          alt: `${source.scene.alt}（${source.small}の追加確認問題）`
        }
      });
    });
  });

  const classification = (question) => `${question.field}／${question.middle}／${question.small}`;
  const applicationPrompt = (source) => {
    if (source.question.includes("不十分")) {
      return `「${source.middle}」のうち「${source.small}」について、不十分な記録はどれか。`;
    }
    if (source.question.includes("関連が薄い")) {
      return `「${source.middle}」のうち「${source.small}」について、点検との関連が最も薄いものはどれか。`;
    }
    if (source.question.includes("断定してはいけない")) {
      return `「${source.middle}」のうち「${source.small}」について、直ちに断定してはいけないものはどれか。`;
    }
    if (source.question.includes("避けるべき")) {
      return `「${source.middle}」のうち「${source.small}」について、避けるべき条件はどれか。`;
    }
    if (/不適切|誤っている|適切でない/.test(source.question)) {
      return `「${source.middle}」のうち「${source.small}」について、不適切な状況・行動はどれか。`;
    }
    return `「${source.middle}」のうち「${source.small}」について、現場で基本とすべき判断はどれか。`;
  };

  knowledgeSources.forEach((source, sourceIndex) => {
    serial += 1;
    const applicationChoices = arrangeChoices(
      source.choices[source.answer],
      source.choices.filter((_, index) => index !== source.answer),
      serial
    );
    additions.push({
      id: `Q${String(serial).padStart(3, "0")}`,
      number: serial,
      type: "知識",
      typeLabel: "知識問題",
      question: applicationPrompt(source),
      choices: applicationChoices.choices,
      answer: applicationChoices.answer,
      explanation: `${source.explanation} 現場では、最新の基準、個別条件、河川管理者の指示も併せて確認する。`,
      field: source.field,
      middle: source.middle,
      small: source.small,
      difficulty: clamp(source.difficulty + 1, 1, 5),
      trend: source.trend,
      priority: source.priority,
      keywords: unique([...source.keywords, "現場判断"]).slice(0, 4),
      related: relatedTo(source),
      scene: null
    });

    serial += 1;
    const distractorIndexes = [7, 17, 29].map(
      (offset) => (sourceIndex + offset) % knowledgeSources.length
    );
    const correctClass = classification(source);
    const classChoices = arrangeChoices(
      correctClass,
      distractorIndexes.map((index) => classification(knowledgeSources[index])),
      serial
    );
    additions.push({
      id: `Q${String(serial).padStart(3, "0")}`,
      number: serial,
      type: "知識",
      typeLabel: "知識問題",
      question: `次の説明が扱っている主な点検テーマはどれか。${source.explanation}`,
      choices: classChoices.choices,
      answer: classChoices.answer,
      explanation: `この説明は「${source.small}」を扱っている。${source.keywords.join("・")}が判断の手掛かりとなる。`,
      field: source.field,
      middle: source.middle,
      small: source.small,
      difficulty: clamp(source.difficulty, 1, 5),
      trend: clamp(source.trend - 5, 10, 100),
      priority: source.priority,
      keywords: unique([...source.keywords, "テーマ判別"]).slice(0, 4),
      related: relatedTo(source),
      scene: null
    });
  });

  if (serial !== 300 || additions.length !== 200) {
    throw new Error(`追加問題数が不正です（${additions.length}問）。`);
  }

  window.QUESTION_BANK = Object.freeze([...baseQuestions, ...additions]);
})();
