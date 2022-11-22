// TODO: Everything compiles except vite | https://github.com/vercel/pkg/issues/1291 | try to compile es to cjs
const fs = require("fs"),
  { execSync } = require("child_process");

fs.copyFileSync("./web/src/config.json", "./build/config.json");
fs.cpSync("./web", "./build/web", {
  recursive: true,
  force: true,
  filter: (src) => !src.includes("node_modules"),
});

execSync("npm i", {
  cwd: "./build/web",
});

fs.writeFileSync(
  "./build/web/src/Pages/Layout/Layout.tsx",
  fs
    .readFileSync("./build/web/src/Pages/Layout/Layout.tsx")
    .toString()
    .replace("../../../../.web/items.json", "../../../../../.web/items.json")
    .replace("../../../../.web/config.json", "../../../../../.web/config.json")
    .replace("../../../../.web/logo.png", "../../../../../.web/logo.png")
);
