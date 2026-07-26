/* 河川点検士 500問版「合格可能性の目安」
 * 公式合格基準そのものではなく、学習データから安全側に推定する。
 */
(() => {
  "use strict";

  const bands = Object.freeze([
    { minimum: 85, key: "very-high", label: "合格可能性「かなり高い」" },
    { minimum: 75, key: "pass-range", label: "合格圏" },
    { minimum: 65, key: "borderline", label: "ボーダーライン" },
    { minimum: 0, key: "review", label: "要復習" }
  ]);

  const clampRate = (value) => Math.max(0, Math.min(100, Math.round(value)));
  const rate = (correct, total) => total > 0 ? clampRate((correct / total) * 100) : null;
  const bandFor = (score) => bands.find((band) => score >= band.minimum) || bands.at(-1);

  const calculate = (questions, store) => {
    const stats = store?.stats || {};
    const studiedQuestions = questions.filter((question) => (stats[question.id]?.attempts || 0) > 0);
    const studied = studiedQuestions.length;

    const attempts = studiedQuestions.reduce(
      (sum, question) => sum + (stats[question.id].attempts || 0),
      0
    );
    const correct = studiedQuestions.reduce(
      (sum, question) => sum + (stats[question.id].correct || 0),
      0
    );
    const overall = rate(correct, attempts);

    const firstAttemptStats = studiedQuestions
      .map((question) => stats[question.id])
      .filter((stat) => typeof stat.firstAttemptCorrect === "boolean" || stat.attempts === 1);
    const firstAttempt = rate(
      firstAttemptStats.filter((stat) => (
        typeof stat.firstAttemptCorrect === "boolean"
          ? stat.firstAttemptCorrect
          : (stat.correct || 0) > 0
      )).length,
      firstAttemptStats.length
    );

    const recentExams = (store?.history || [])
      .filter((item) => item.mode === "exam" && item.total === 50)
      .slice(0, 3);
    const mockExam = recentExams.length
      ? clampRate(recentExams.reduce((sum, item) => sum + ((item.correct / item.total) * 100), 0) / recentExams.length)
      : null;

    const sStats = studiedQuestions
      .filter((question) => question.priority === "S")
      .map((question) => stats[question.id]);
    const sAttempts = sStats.reduce((sum, stat) => sum + (stat.attempts || 0), 0);
    const sCorrect = sStats.reduce((sum, stat) => sum + (stat.correct || 0), 0);
    const rankS = rate(sCorrect, sAttempts);

    const fieldScores = [...new Set(questions.map((question) => question.field))]
      .map((field) => {
        const fieldStats = studiedQuestions
          .filter((question) => question.field === field)
          .map((question) => stats[question.id]);
        const fieldAttempts = fieldStats.reduce((sum, stat) => sum + (stat.attempts || 0), 0);
        const fieldCorrect = fieldStats.reduce((sum, stat) => sum + (stat.correct || 0), 0);
        return {
          field,
          studied: fieldStats.length,
          value: rate(fieldCorrect, fieldAttempts)
        };
      })
      .filter((item) => item.studied >= 3 && item.value !== null)
      .sort((left, right) => left.value - right.value);
    const weakestField = fieldScores[0] || null;

    const weakStats = studiedQuestions
      .map((question) => stats[question.id])
      .filter((stat) => (stat.wrong || 0) > 0 && (stat.attempts || 0) > 1);
    const weakRecovery = weakStats.length
      ? clampRate(weakStats.reduce((sum, stat) => {
          if (typeof stat.lastCorrect === "boolean") return sum + (stat.lastCorrect ? 100 : 0);
          return sum + (((stat.correct || 0) / (stat.attempts || 1)) * 100);
        }, 0) / weakStats.length)
      : null;

    const components = [
      { key: "overall", label: "総合正解率", value: overall, weight: 0.30, detail: `${attempts}回答` },
      {
        key: "first",
        label: "初回回答",
        value: firstAttempt,
        weight: 0.20,
        detail: firstAttemptStats.length ? `${firstAttemptStats.length}問` : studied ? "旧記録は未集計" : "未回答"
      },
      { key: "mock", label: "直近の模擬試験", value: mockExam, weight: 0.25, detail: recentExams.length ? `${recentExams.length}回平均` : "未実施" },
      { key: "rank-s", label: "Sランク", value: rankS, weight: 0.10, detail: `${sStats.length}問` },
      {
        key: "field",
        label: "分野別最低値",
        value: weakestField?.value ?? null,
        weight: 0.10,
        detail: weakestField?.field || "データ不足"
      },
      {
        key: "recovery",
        label: "苦手問題の再回答",
        value: weakRecovery,
        weight: 0.05,
        detail: weakStats.length ? `${weakStats.length}問` : studied ? "再回答なし" : "未回答"
      }
    ];

    const available = components.filter((component) => component.value !== null);
    const totalWeight = available.reduce((sum, component) => sum + component.weight, 0);
    const score = totalWeight
      ? clampRate(available.reduce((sum, component) => sum + (component.value * component.weight), 0) / totalWeight)
      : 0;
    const ready = studied >= 100 || recentExams.length >= 1;
    const confidence = studied >= 400 && recentExams.length >= 3
      ? "高"
      : studied >= 200 && recentExams.length >= 2
        ? "中"
        : "低";
    const band = ready
      ? bandFor(score)
      : { key: "preparing", label: "判定準備中", minimum: null };

    return {
      score,
      ready,
      band,
      confidence,
      studied,
      total: questions.length,
      remainingForPrediction: Math.max(0, 100 - studied),
      components,
      officialThreshold: 60
    };
  };

  window.PASS_PREDICTION = Object.freeze({
    bands,
    bandFor,
    calculate
  });
})();
