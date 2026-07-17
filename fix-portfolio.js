const fs = require("fs");
const path = "E:/Projects/Thumbnail Portfolio/js/portfolio.js";
let content = fs.readFileSync(path, "utf8");
content = content.replace(
  "Manate.renderVisual(item, { width: 1920, height: 1080, responsive: true })",
  "Manimate.renderVisual(item, { width: 1920, height: 1080, responsive: true, context: \"portfolio\" })"
);
fs.writeFileSync(path, content);
console.log("Fixed");
