import config from "../config.json";
import RESTDoc from "./helpers/RESTDoc";

process.stdout.write("\u001b[3J\u001b[1J");
console.clear();

(async () => {
  if (process.argv.slice(2).some((x) => x === "--dev")) return RESTDoc.dev(config);
  await RESTDoc.index(config.folders);
  await RESTDoc.start(config);
})();
