const fs = require("fs");
const path = "E:/Projects/Thumbnail Portfolio/js/manimate.js";
let content = fs.readFileSync(path, "utf8");
// Fix all occurrences of triple quotes in replace calls
content = content.replace(/.replace\(\/\\"\/g, """"\)/, .replace(/\\"/g, "\\"")");
content = content.replace(/item\.title\.replace\(\/\"\/g, \"\"\"\)/g, 'item.title.replace(/"/g, "\"")');
fs.writeFileSync(path, content);
console.log("Fixed");
