const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "assets", "icon.svg");

Promise.all([180, 192, 512].map((size) => (
  sharp(source)
    .resize(size, size)
    .png()
    .toFile(path.join(root, "assets", `icon-${size}.png`))
))).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
