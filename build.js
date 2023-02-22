const fs = require("fs"),
  { execSync } = require("child_process");

fs.copyFileSync("./web/src/config.json", "./build/example.json");
fs.cpSync("./web", "./build/web", {
  recursive: true,
  force: true,
  filter: (src) => !src.includes("node_modules"),
});

execSync("npm i", {
  cwd: "./build",
});

execSync("npm i", {
  cwd: "./build/web",
});

execSync(
  'caxa -i . -o ../release/RESTDoc.exe -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/src/index.js"',
  {
    cwd: "./build",
  }
);
