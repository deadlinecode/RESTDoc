import fs from "fs/promises";
import path from "path";
import RESTDoc from "./helpers/RESTDoc";

process.stdout.write("\u001b[3J\u001b[1J");
console.clear();

(async () => {
  const config = JSON.parse(
    (await fs.readFile(path.join(process.cwd(), "config.json"))).toString()
  );
  if (process.argv.slice(2).some((x) => x === "--dev"))
    return RESTDoc.dev(config);
  await RESTDoc.index(config.folders);
  await RESTDoc.build(config);
})();
