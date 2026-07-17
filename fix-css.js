const fs = require("fs");
const path = "E:/Projects/Thumbnail Portfolio/css/styles.css";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /(\.why-cell--image:hover \{[\s\S]*?)transform: scale\(1\.05\);/,
  "$1transform: translateY(-5px) scale(1.05);"
);

content = content.replace(
  /(\.why-cell--image:hover \.why-cell-media \{[\s\S]*?)transform: scale\(1\.02\);/,
  "$1transform: translateZ(14px);"
);

fs.writeFileSync(path, content);
console.log("Done");
