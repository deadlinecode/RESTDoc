import path from "path";
import fs from "fs/promises";

class Fx {
  static instance = new Fx();
  private constructor() {}

  fs_utils = {
    exists: async (path: string) => {
      try {
        await fs.stat(path);
      } catch {
        return false;
      }
      return true;
    },
  };

  res = (pth: string[]) =>
    path.join(require.main?.path as string, "..", ...pth);

  mergeNodes = (arr: any[], sep: string, merge: string) => {
    const clone: any[] = [];
    arr.forEach((x) =>
      clone.find((y) => y[sep] === x[sep])
        ? clone
            .find((y) => y[sep] === x[sep])
            [merge].push("<br />", ...x[merge])
        : clone.push(x)
    );
    return clone;
  };
}

export default Fx.instance;
