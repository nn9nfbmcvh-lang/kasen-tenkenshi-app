const path = require("path");

global.window = global;
require(path.resolve(__dirname, "..", "photo-questions.js"));
require(path.resolve(__dirname, "..", "questions.js"));

const questions = global.QUESTION_BANK;
const failures = [];
const required = [
  "id", "number", "type", "typeLabel", "question", "choices", "answer",
  "explanation", "field", "middle", "small", "difficulty", "trend",
  "priority", "keywords", "related"
];

if (!Array.isArray(questions)) failures.push("QUESTION_BANK must be an array");
if (questions.length !== 100) failures.push(`Expected 100 questions, got ${questions.length}`);

const expectedTypes = { 写真: 40, イラスト: 15, 知識: 45 };
for (const [type, expected] of Object.entries(expectedTypes)) {
  const actual = questions.filter((question) => question.type === type).length;
  if (actual !== expected) failures.push(`${type}: expected ${expected}, got ${actual}`);
}

const ids = new Set();
for (const question of questions) {
  required.forEach((key) => {
    if (question[key] === undefined || question[key] === null || question[key] === "") {
      failures.push(`${question.id || "unknown"}: missing ${key}`);
    }
  });
  if (ids.has(question.id)) failures.push(`${question.id}: duplicate id`);
  ids.add(question.id);
  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    failures.push(`${question.id}: choices must contain 4 items`);
  }
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
    failures.push(`${question.id}: answer must be 0..3`);
  }
  if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 5) {
    failures.push(`${question.id}: difficulty must be 1..5`);
  }
  if (!Number.isInteger(question.trend) || question.trend < 10 || question.trend > 100) {
    failures.push(`${question.id}: trend must be 10..100`);
  }
  if (!["S", "A", "B", "C"].includes(question.priority)) {
    failures.push(`${question.id}: invalid priority`);
  }
  if (question.type !== "知識" && !question.scene) {
    failures.push(`${question.id}: visual question requires a scene`);
  }
  if (question.type === "写真") {
    if (typeof question.scene !== "object" || !question.scene.src || !question.scene.sourceUrl) {
      failures.push(`${question.id}: photo question requires image and source metadata`);
    } else {
      const imagePath = path.resolve(__dirname, "..", question.scene.src.replace(/^\.\//, ""));
      if (!require("fs").existsSync(imagePath)) {
        failures.push(`${question.id}: image file does not exist (${question.scene.src})`);
      }
    }
  }
  if (!question.related.length) {
    failures.push(`${question.id}: at least one related question is required`);
  }
  question.related.forEach((id) => {
    if (!questions.some((candidate) => candidate.id === id)) {
      failures.push(`${question.id}: unknown related question ${id}`);
    }
  });
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Question bank is valid.");
console.log(JSON.stringify({
  total: questions.length,
  types: Object.fromEntries(Object.keys(expectedTypes).map((type) => [
    type,
    questions.filter((question) => question.type === type).length
  ])),
  fields: [...new Set(questions.map((question) => question.field))]
}, null, 2));
