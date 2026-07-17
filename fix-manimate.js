const fs = require("fs");
const path = "E:/Projects/Thumbnail Portfolio/js/manimate.js";
let content = fs.readFileSync(path, "utf8");
content = content.replace(/item\.title\.replace\(\/\"\/g, \"\"\"\)/g, 'item.title.replace(/\\"/g, """)');
fs.writeFileSync(path, content);
console.log("Fixed");
