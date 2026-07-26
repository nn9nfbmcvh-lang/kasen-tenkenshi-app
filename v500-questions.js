/* 河川点検士アプリ 500問版 追加問題データ
 * Q001〜Q300は変更せず、Q301〜Q500を追加する。
 * イラスト問題は追加せず、選定済みの55枚を別の点検着眼点で使用する。
 */
(() => {
  "use strict";

  const baseQuestions = Array.isArray(window.QUESTION_BANK)
    ? [...window.QUESTION_BANK]
    : [];

  if (baseQuestions.length >= 500) return;
  if (baseQuestions.length !== 300) {
    throw new Error("500問版の追加元となる300問データを確認できません。");
  }

  const originalQuestions = baseQuestions.slice(0, 100);
  const photoSources = originalQuestions.filter((question) => question.type === "写真");
  const knowledgeSources = originalQuestions.filter((question) => question.type === "知識");

  if (photoSources.length !== 55 || knowledgeSources.length !== 45) {
    throw new Error("500問版の写真・知識問題の追加元を確認できません。");
  }

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const unique = (items) => [...new Set(items.filter(Boolean))];
  const firstSentence = (text) => {
    const sentence = String(text).split("。")[0];
    return `${sentence}。`;
  };

  const arrangeChoices = (correct, distractors, seed) => {
    const fallbacks = [
      "対象位置や周辺条件を確認せず、外観だけで判断する",
      "点検記録を残さず、担当者の記憶だけに頼る",
      "安全確認と連絡を省略して作業を継続する"
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
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」について、次回点検の時期を判断する際に最も重視すべきものはどれか。`,
      correct: () => "機能への影響、進行速度、出水など外力が作用する時期を総合して決める",
      distractors: () => [
        "写真の明るさだけで点検時期を決める",
        "変状の規模に関係なく一律に最長間隔とする",
        "過去の点検日だけを見て進行性を確認しない"
      ],
      note: "監視頻度は、変状の進行性、施設機能、出水期など外力の作用時期、第三者影響を踏まえて設定する。",
      keyword: "監視頻度"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」の範囲を平面図へ記録するとき、最も適切な方法はどれか。`,
      correct: () => "起終点、上下流方向、距離標や構造物などの基準位置と変状範囲を対応させる",
      distractors: () => [
        "河川名だけを書き、位置は記録しない",
        "上下流方向を示さず一点だけを記す",
        "毎回異なる基準位置から距離を測る"
      ],
      note: "平面図では上下流方向、距離標、施設番号、起終点など再確認できる基準と変状範囲を結び付ける。",
      keyword: "位置図"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」が施設機能へ影響する経路を確認する方法として適切なものはどれか。`,
      correct: (source) => `変状の位置から${source.field}の必要機能まで、周辺部材や地形を含めて影響の連鎖を確認する`,
      distractors: () => [
        "変状名だけで影響を断定する",
        "施設機能を確認せず写真枚数で評価する",
        "周辺部材との接続を見ず単独の傷として扱う"
      ],
      note: "変状から機能低下へ至る経路を考えると、追加確認箇所と対応の優先度を整理しやすい。",
      keyword: "影響経路"
    },
    {
      prompt: (source) => `出水後、「${source.middle}」の写真で見られる「${source.small}」を確認する際、比較条件として残すべき情報はどれか。`,
      correct: () => "出水ピーク、水位履歴、降雨、確認時の水位と撮影位置を記録する",
      distractors: () => [
        "撮影者の氏名だけを残す",
        "出水規模を確認せず写真だけを保存する",
        "確認時の水位を記録せず過去写真と比較する"
      ],
      note: "外力と変状の関係を評価するには、出水規模、水位・降雨履歴、確認条件を写真と対応させる。",
      keyword: "出水履歴"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」を複数人で再確認するとき、判断のばらつきを抑える方法はどれか。`,
      correct: () => "判定基準、測定位置、単位、写真方向を事前に共有し、同じ様式で記録する",
      distractors: () => [
        "各自が異なる単位と基準で記録する",
        "判断理由を共有せず結論だけを集める",
        "撮影位置を毎回変えて比較する"
      ],
      note: "判定基準と測定・撮影方法を統一し、根拠を記録することで点検者間のばらつきを小さくできる。",
      keyword: "判定統一"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」へ近づけない場合の記録方法として適切なものはどれか。`,
      correct: () => "安全な位置から全景と位置関係を記録し、未確認範囲と追加調査の必要性を明記する",
      distractors: () => [
        "危険を承知で単独接近する",
        "確認できなかった事実を記録しない",
        "遠景だけで寸法を断定する"
      ],
      note: "接近できない場合は安全を優先し、確認できた範囲、限界、推定と事実の区別、追加調査を記録する。",
      keyword: "確認限界"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」に応急措置を行った後、点検で確認すべきものはどれか。`,
      correct: () => "措置の状態、変状の進行、周辺への新たな影響、恒久対策への引継ぎを確認する",
      distractors: () => [
        "応急措置済みとして以後の点検対象から外す",
        "措置部分の色だけを確認する",
        "元の変状位置を記録から削除する"
      ],
      note: "応急措置後も効果と副作用、原変状の進行を追跡し、原因調査や恒久対策へ確実に引き継ぐ。",
      keyword: "措置後確認"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」の計測値に不確かさがある場合、適切な記録はどれか。`,
      correct: () => "測定方法、読取精度、測定できない範囲を記し、推定値と実測値を区別する",
      distractors: () => [
        "推定値を実測値として記録する",
        "測定方法と単位を省略する",
        "都合のよい一回の値だけを採用する"
      ],
      note: "測定精度と確認限界を明示し、実測・推定を区別することで経年比較の信頼性を保つ。",
      keyword: "測定精度"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」について、補修の要否を検討する前に整理すべき内容はどれか。`,
      correct: () => "原因、進行性、機能影響、施工条件と監視で対応できる範囲を整理する",
      distractors: () => [
        "変状写真の色合いだけを整理する",
        "原因を考えず補修材料を先に決める",
        "周辺状況と施工時の安全条件を確認しない"
      ],
      note: "対策検討では原因と機能影響、緊急性、施工条件、監視の可否を整理し、対策目的を明確にする。",
      keyword: "対策検討"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」を健全部と比較する際、適切な比較対象はどれか。`,
      correct: () => "同じ構造・材料で、外力や地形条件が近い上下流または隣接区間を選ぶ",
      distractors: () => [
        "構造も外力条件も異なる遠方の施設だけを選ぶ",
        "最も状態の悪い一箇所だけを基準にする",
        "比較位置と条件を記録しない"
      ],
      note: "健全部比較では構造、材料、築造条件、外力、地形が近い区間を選び、比較条件を記録する。",
      keyword: "健全部比較"
    },
    {
      prompt: (source) => `「${source.middle}」の写真で見られる「${source.small}」について、専門調査へ引き継ぐ記録として最も有効なものはどれか。`,
      correct: () => "位置・規模・進行履歴・周辺条件・安全上の制約と、未解明の事項を整理する",
      distractors: () => [
        "変状名だけを一行で伝える",
        "過去記録を付けず最新写真だけを渡す",
        "確認できていない原因を確定事項として伝える"
      ],
      note: "専門調査へは、既知の事実、推定、未確認事項、安全制約を分け、過去からの変化が分かる資料を渡す。",
      keyword: "専門調査"
    }
  ];

  let serial = 300;
  const additions = [];

  photoSources.forEach((source, sourceIndex) => {
    serial += 1;
    const template = photoTemplates[sourceIndex % photoTemplates.length];
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
      difficulty: clamp(source.difficulty + 1, 1, 5),
      trend: clamp(source.trend - 5, 10, 100),
      priority: source.priority,
      keywords: unique([...source.keywords, template.keyword]).slice(0, 4),
      related: relatedTo(source),
      scene: {
        ...source.scene,
        alt: `${source.scene.alt}（${source.small}の500問版確認問題）`
      }
    });
  });

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
      question: `現地点検で「${source.middle}／${source.small}」に関する判断を行う。基本として最も適切なものはどれか。`,
      choices: applicationChoices.choices,
      answer: applicationChoices.answer,
      explanation: `${source.explanation} 実務では現地条件と最新の基準、河川管理者の指示を併せて確認する。`,
      field: source.field,
      middle: source.middle,
      small: source.small,
      difficulty: clamp(source.difficulty + 1, 1, 5),
      trend: source.trend,
      priority: source.priority,
      keywords: unique([...source.keywords, "現場適用"]).slice(0, 4),
      related: relatedTo(source),
      scene: null
    });

    serial += 1;
    const principle = firstSentence(source.explanation);
    const principleChoices = arrangeChoices(
      principle,
      [
        `「${source.small}」は外観だけで判断できるため、位置や条件の記録は必要ない。`,
        `「${source.small}」は過去記録と比較せず、今回の印象だけで評価する。`,
        `「${source.small}」は施設機能や安全性との関係を確認しなくてよい。`
      ],
      serial
    );
    additions.push({
      id: `Q${String(serial).padStart(3, "0")}`,
      number: serial,
      type: "知識",
      typeLabel: "知識問題",
      question: `「${source.middle}／${source.small}」を評価する根拠として、最も適切な説明はどれか。`,
      choices: principleChoices.choices,
      answer: principleChoices.answer,
      explanation: `${source.explanation} 判断根拠を位置・写真・計測値と対応させて記録する。`,
      field: source.field,
      middle: source.middle,
      small: source.small,
      difficulty: clamp(source.difficulty, 1, 5),
      trend: clamp(source.trend - 5, 10, 100),
      priority: source.priority,
      keywords: unique([...source.keywords, "判断根拠"]).slice(0, 4),
      related: relatedTo(source),
      scene: null
    });

    serial += 1;
    const keywordGroup = source.keywords.join("・");
    const offsets = [7, 16, 29].map((offset) => (sourceIndex + offset) % knowledgeSources.length);
    const keywordChoices = arrangeChoices(
      keywordGroup,
      offsets.map((index) => knowledgeSources[index].keywords.join("・")),
      serial
    );
    additions.push({
      id: `Q${String(serial).padStart(3, "0")}`,
      number: serial,
      type: "知識",
      typeLabel: "知識問題",
      question: `「${source.middle}／${source.small}」の点検判断に直接関係するキーワードの組合せはどれか。`,
      choices: keywordChoices.choices,
      answer: keywordChoices.answer,
      explanation: `「${source.small}」では${keywordGroup}が主な確認語となる。${source.explanation}`,
      field: source.field,
      middle: source.middle,
      small: source.small,
      difficulty: clamp(source.difficulty + 1, 1, 5),
      trend: clamp(source.trend - 10, 10, 100),
      priority: source.priority,
      keywords: unique([...source.keywords, "関連語"]).slice(0, 4),
      related: relatedTo(source),
      scene: null
    });
  });

  const integratedQuestions = [
    {
      question: "出水期前点検で、堤防天端の亀裂と法尻の湿潤を同じ区間で確認した。最も適切な初動はどれか。",
      correct: "位置関係と規模を記録し、浸透・すべりの可能性を考えて周辺を連続確認し報告する",
      distractors: ["亀裂だけを補修して湿潤は記録しない", "法尻へ単独で掘削して原因を確認する", "出水後まで何も記録せず待つ"],
      explanation: "天端亀裂と法尻湿潤が同一区間にある場合、堤体内の浸透や変形との関連を考え、位置関係、進行性、周辺変状を確認して報告する。",
      field: "堤防", middle: "土堤", small: "複合変状", difficulty: 5, trend: 95, priority: "S",
      keywords: ["天端亀裂", "法尻湿潤", "浸透"], related: ["Q001", "Q013", "Q056"]
    },
    {
      question: "護岸基礎の洗掘と河床低下が確認された場合、評価で最も重要な組合せはどれか。",
      correct: "基礎の支持状態、洗掘深、上下流河床、護岸の沈下・変形を一体で確認する",
      distractors: ["護岸表面の色と周辺植生だけを確認する", "洗掘深を測らず基礎は健全と判断する", "上流側だけを見て下流側を確認しない"],
      explanation: "基礎洗掘と河床低下は護岸の支持機能に影響するため、基礎、河床、上下流、護岸本体の変形を系として評価する。",
      field: "河川構造物", middle: "護岸", small: "基礎洗掘", difficulty: 5, trend: 95, priority: "S",
      keywords: ["護岸基礎", "洗掘", "河床低下"], related: ["Q021", "Q026", "Q061"]
    },
    {
      question: "樋門の操作点検中に異音と過熱臭を確認した。最も適切な対応はどれか。",
      correct: "所定手順で安全を確保し、無理な運転を続けず状態を記録して設備担当へ連絡する",
      distractors: ["保護装置を解除して操作を続ける", "原因確認のため通電部へ手を入れる", "臭いが消えれば記録せず再運転する"],
      explanation: "異音・異臭・過熱は設備故障の兆候である。操作権限と停止手順に従い、状態を記録して設備担当へ確実に引き継ぐ。",
      field: "河川構造物", middle: "樋門・樋管", small: "操作時異常", difficulty: 4, trend: 100, priority: "S",
      keywords: ["異音", "過熱", "操作安全"], related: ["Q063", "Q064", "Q084"]
    },
    {
      question: "出水後の巡視で、流木閉塞、局所洗掘、護岸変形を同時に発見した。確認順序として適切なものはどれか。",
      correct: "安全と退路を確保し、流況・閉塞と洗掘範囲、施設変形の位置関係を記録して緊急度を判断する",
      distractors: ["流木へ直ちに乗って除去する", "護岸の近景だけを撮り流況を確認しない", "発見順に個別処理し相互関係を記録しない"],
      explanation: "出水後は二次災害を避け、流況、閉塞、洗掘、構造物変形を関連付けて確認し、機能影響と緊急度を整理する。",
      field: "点検・診断", middle: "出水後点検", small: "複合被害", difficulty: 5, trend: 100, priority: "S",
      keywords: ["出水後", "閉塞", "洗掘"], related: ["Q045", "Q046", "Q082"]
    },
    {
      question: "補修済み護岸の境界に新しいひび割れと漏水を確認した。最も適切な評価はどれか。",
      correct: "補修境界の再劣化として位置・進行を記録し、元の原因と補修効果を再評価する",
      distractors: ["補修済みなので点検対象外とする", "漏水を拭き取り記録を残さない", "補修材の色が同じなら健全とする"],
      explanation: "補修境界のひび割れや漏水は再劣化の兆候となる。原変状、原因、補修範囲、周辺への影響を追跡する。",
      field: "維持管理", middle: "補修管理", small: "再劣化", difficulty: 4, trend: 95, priority: "S",
      keywords: ["補修境界", "再劣化", "漏水"], related: ["Q066", "Q067", "Q075"]
    },
    {
      question: "点検写真に個人宅と重要施設が写り、現場は圏外だった。記録管理として適切なものはどれか。",
      correct: "端末内へ安全に保存し、アクセス権と共有先を守り、通信復帰後に同期結果と重複を確認する",
      distractors: ["個人SNSへ送ってバックアップする", "位置情報を誰でも見られる状態で公開する", "同期前のデータを端末から削除する"],
      explanation: "圏外では端末内保存を確実にし、個人情報・重要施設情報の管理ルールを守る。復帰後は同期、重複、競合を確認する。",
      field: "点検・診断", middle: "データ管理", small: "安全なオフライン運用", difficulty: 3, trend: 90, priority: "S",
      keywords: ["オフライン", "個人情報", "同期"], related: ["Q078", "Q099", "Q100"]
    },
    {
      question: "河道内の樹木群が拡大し、洪水流の偏りと重要な生物の生息も確認された。検討として適切なものはどれか。",
      correct: "流下能力・偏流への影響と環境価値を整理し、管理目的と時期を関係者で調整する",
      distractors: ["環境を確認せず全て即時伐採する", "治水影響を確認せず全て保存する", "位置と範囲を記録せず印象で決める"],
      explanation: "樹木管理では治水機能と河川環境の双方を評価し、繁殖・営巣時期や管理目的を踏まえて関係者と調整する。",
      field: "河川環境", middle: "植生管理", small: "治水と環境の調整", difficulty: 5, trend: 85, priority: "A",
      keywords: ["河道内樹木", "偏流", "環境配慮"], related: ["Q052", "Q076", "Q097"]
    },
    {
      question: "河川区域内で補修用の仮設物を設置する計画がある。着手前の確認として適切なものはどれか。",
      correct: "河川管理への影響、必要な許可・協議、出水時撤去、安全計画を管理者と確認する",
      distractors: ["短期間なら手続は常に不要と考える", "点検者の判断だけで占用を許可する", "出水時の対応を決めず設置する"],
      explanation: "河川区域内の仮設物も内容により許可・協議が関係する。管理者と最新条件、出水対応、安全計画を事前に確認する。",
      field: "河川法令", middle: "河川区域", small: "仮設物設置", difficulty: 4, trend: 90, priority: "S",
      keywords: ["河川区域", "許可", "仮設物"], related: ["Q069", "Q070", "Q079"]
    },
    {
      question: "応急対策後の監視で変状が再び拡大した。次の対応として適切なものはどれか。",
      correct: "安全確保と再報告を行い、原因・機能影響を再評価して監視強化や恒久対策を検討する",
      distractors: ["応急対策済みとして放置する", "記録を消して新しい変状として扱う", "原因を確認せず同じ応急対策だけを繰り返す"],
      explanation: "再拡大は応急対策の限界や原因の継続を示す。緊急度を見直し、監視条件と恒久対策への移行を検討する。",
      field: "維持管理", middle: "対策", small: "応急対策後の再進行", difficulty: 4, trend: 95, priority: "S",
      keywords: ["応急対策", "再進行", "恒久対策"], related: ["Q066", "Q067", "Q091"]
    },
    {
      question: "暑熱下の水際点検中に上流の雷雨情報と水位上昇傾向を確認した。適切な判断はどれか。",
      correct: "作業を中止して水辺から退避し、全員の体調と所在を確認して管理者へ連絡する",
      distractors: ["現在地で雨が降るまで作業を続ける", "ライフジャケットがあれば増水中も続ける", "単独者だけを残して観測を継続する"],
      explanation: "上流降雨、雷、水位上昇、暑熱が重なる場合は早期中止が必要である。退避、点呼、体調確認、連絡を確実に行う。",
      field: "安全管理", middle: "気象・水文", small: "複合気象リスク", difficulty: 3, trend: 100, priority: "S",
      keywords: ["雷", "急増水", "熱中症"], related: ["Q080", "Q082", "Q085"]
    }
  ];

  integratedQuestions.forEach((spec) => {
    serial += 1;
    const arranged = arrangeChoices(spec.correct, spec.distractors, serial);
    additions.push({
      id: `Q${String(serial).padStart(3, "0")}`,
      number: serial,
      type: "知識",
      typeLabel: "知識問題",
      question: spec.question,
      choices: arranged.choices,
      answer: arranged.answer,
      explanation: spec.explanation,
      field: spec.field,
      middle: spec.middle,
      small: spec.small,
      difficulty: spec.difficulty,
      trend: spec.trend,
      priority: spec.priority,
      keywords: spec.keywords,
      related: spec.related,
      scene: null
    });
  });

  if (serial !== 500 || additions.length !== 200) {
    throw new Error(`500問版の追加問題数が不正です（${additions.length}問）。`);
  }

  window.QUESTION_BANK = Object.freeze([...baseQuestions, ...additions]);
})();
