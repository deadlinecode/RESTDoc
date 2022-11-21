import config from "../config.json";
import RESTDoc from "./helpers/RESTDoc";

console.clear();

(async () => {
  await RESTDoc.index(config.folders);
  await RESTDoc.start(config);
})();
