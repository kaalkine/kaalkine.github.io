const fs = require("fs");
const path = "E:/Projects/Thumbnail Portfolio/js/lightbox.js";
let content = fs.readFileSync(path, "utf8");
content = content.replace(
  "Manimate.renderVisual(visualItem, { lazy: false })",
  "Manimate.renderVisual(visualItem, { lazy: false, context: \"lightbox\" })"
);
fs.writeFileSync(path, content);
console.log("Fixed");
