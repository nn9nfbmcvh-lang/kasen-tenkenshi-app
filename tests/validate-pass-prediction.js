const assert = require("assert");
const path = require("path");

global.window = global;
require(path.resolve(__dirname, "..", "pass-prediction.js"));

const predictor = global.PASS_PREDICTION;
assert.strictEqual(predictor.bandFor(85).key, "very-high");
assert.strictEqual(predictor.bandFor(84).key, "pass-range");
assert.strictEqual(predictor.bandFor(75).key, "pass-range");
assert.strictEqual(predictor.bandFor(74).key, "borderline");
assert.strictEqual(predictor.bandFor(65).key, "borderline");
assert.strictEqual(predictor.bandFor(64).key, "review");

const questions = Array.from({ length: 500 }, (_, index) => ({
  id: `Q${String(index + 1).padStart(3, "0")}`,
  field: index % 2 ? "堤防" : "河道",
  priority: index % 3 ? "S" : "A"
}));

const insufficientStore = {
  stats: Object.fromEntries(questions.slice(0, 50).map((question) => [
    question.id,
    { attempts: 1, correct: 1, wrong: 0, firstAttemptCorrect: true, lastCorrect: true }
  ])),
  history: []
};
const insufficient = predictor.calculate(questions, insufficientStore);
assert.strictEqual(insufficient.ready, false);
assert.strictEqual(insufficient.band.key, "preparing");
assert.strictEqual(insufficient.remainingForPrediction, 50);

const readyStore = {
  stats: Object.fromEntries(questions.slice(0, 100).map((question, index) => [
    question.id,
    {
      attempts: 1,
      correct: index < 85 ? 1 : 0,
      wrong: index < 85 ? 0 : 1,
      firstAttemptCorrect: index < 85,
      lastCorrect: index < 85
    }
  ])),
  history: [
    { mode: "exam", correct: 43, total: 50 },
    { mode: "exam", correct: 42, total: 50 },
    { mode: "exam", correct: 44, total: 50 }
  ]
};
const ready = predictor.calculate(questions, readyStore);
assert.strictEqual(ready.ready, true);
assert.strictEqual(ready.confidence, "低");
assert.ok(ready.score >= 75);
assert.notStrictEqual(ready.band.key, "preparing");
assert.strictEqual(ready.components.find((component) => component.key === "mock").detail, "3回平均");

const legacyLikeStore = {
  stats: Object.fromEntries(questions.slice(0, 300).map((question) => [
    question.id,
    { attempts: 2, correct: 1, wrong: 1 }
  ])),
  history: [
    { mode: "exam", correct: 36, total: 50 },
    { mode: "exam", correct: 34, total: 50 },
    { mode: "exam", correct: 35, total: 50 }
  ]
};
const legacyLike = predictor.calculate(questions, legacyLikeStore);
assert.strictEqual(legacyLike.ready, true);
assert.strictEqual(legacyLike.studied, 300);
assert.strictEqual(legacyLike.components.find((component) => component.key === "overall").value, 50);
assert.strictEqual(legacyLike.components.find((component) => component.key === "first").value, null);
assert.strictEqual(legacyLike.components.find((component) => component.key === "mock").value, 70);

console.log("Pass prediction is valid.");
console.log(JSON.stringify({
  bands: predictor.bands,
  fixtureScore: ready.score,
  fixtureBand: ready.band.label
}, null, 2));
