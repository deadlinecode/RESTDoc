import fs from "fs/promises";
import path from "path";

export interface IConfig {
  logo: string;
  folders: string[];
  welcome?: string[];
  hostedAt?: string;
  apiBase?: string;
  colors?: {
    pri?: string;
    sec?: string;
    bg?: string;
    onBg?: string;
    secBg?: string;
    onSecBg?: string;
  };
}

class RESTDoc {
  static instance = new RESTDoc();
  private nodes: string[][] = [];
  private constructor() {}

  private readDir = async (dir: string) => {
    await Promise.all(
      (
        await fs.readdir(dir)
      ).map(async (f) =>
        (await fs.lstat(path.join(dir, f))).isDirectory()
          ? await this.readDir(path.join(dir, f))
          : await this.parseFile(
              (await fs.readFile(path.join(dir, f))).toString()
            )
      )
    );
  };

  private parseFile = async (content: string) => {
    var reading = false,
      node: any[] = [];
    content.split("\n").forEach((line) => {
      if (!reading && line.trim() === "// RESTDOC_START")
        return (reading = true) && (node = []);
      if (reading && line.trim() === "// RESTDOC_END")
        return !(reading = false) && this.nodes.push(node);
      if (!(reading && line.trim().startsWith("//"))) return;
      line.trim().slice(2).trim() && node.push(line.trim().slice(2).trim());
    });
  };

  index = (folders: string[]) =>
    Promise.all(folders.map((f) => this.readDir(f)));

  private parse = async () => {};

  private checkConfig = (config: IConfig) =>
    (
      [
        [() => !config.logo, "Logo is required"],
        [() => !config.logo.endsWith(".png"), "Logo must be png"],
        [() => !config.folders, "Folders is required"],
        [
          () =>
            typeof config.folders !== "object" ||
            !Array.isArray(config.folders) ||
            config.folders.some((x) => typeof x !== "string"),
          "Folders has to be a string array",
        ],
        [
          () =>
            config.welcome !== undefined &&
            (typeof config.welcome !== "object" ||
              !Array.isArray(config.welcome) ||
              config.welcome.some((x) => typeof x !== "string")),
          "welcome has to be a string array",
        ],
        [
          () =>
            config.hostedAt !== undefined &&
            typeof config.hostedAt !== "string",
          "hostedAt has to be a string",
        ],
        [
          () =>
            config.colors &&
            (typeof config.colors !== "object" || Array.isArray(config.colors)),
          "Colors has to object",
        ],
        [
          () =>
            config.colors &&
            ["pri", "sec", "bg", "onBg", "secBg", "onSecBg"].some((x) =>
              (config.colors as any)[x] !== undefined
                ? typeof (config.colors as any)[x] !== "string"
                : false
            ),
          "Color value has to be a string",
        ],
        [
          () => config.apiBase && typeof config.apiBase !== "string",
          "apiBase has to be a string",
        ],
      ] as const
    ).forEach(([check, err]) => {
      if (check()) throw new Error(`[ CONFIG ERROR ] ${err}`);
    });

  private execConfig = async (config: IConfig) => {
    this.checkConfig(config);

    //
    // Replacing Colors
    //
    if (config.colors && Object.entries(config.colors).length) {
      var colors = (
          await fs.readFile("./web/src/Utils/_globals.scss")
        ).toString(),
        changed = false;
      const replaceColor = (k: string, v: string) =>
        (colors = colors
          .split(";")
          .map((x) => {
            if (x.trim().split(":")[0] !== k) return x;
            changed = true;
            return `${x.split(":")[0]}: ${v}`;
          })
          .join(";"));
      Object.entries(config.colors).forEach(([k, v]) =>
        replaceColor(`$${k}`, v)
      );
      changed && (await fs.writeFile("./web/src/Utils/_globals.scss", colors));
    }

    //
    // Replacing the logo
    //
    await fs.copyFile(config.logo, "./web/public/logo.png");

    //
    // Replace internal config
    //
    var internalConfig = JSON.parse(
        (await fs.readFile("./web/src/config.json")).toString()
      ),
      changed = false;
    (["welcome", "hostedAt", "apiBase"] as const).forEach(
      (x) => config[x] && (changed = true) && (internalConfig[x] = config[x])
    );
    internalConfig.apiBase = internalConfig.apiBase.slice(
      internalConfig.apiBase.endsWith("/") ? 1 : 0
    );
    changed &&
      (await fs.writeFile(
        "./web/src/config.json",
        JSON.stringify(internalConfig, null, 2)
      ));
  };

  start = async (config: IConfig) => {
    if (!this.nodes.length) throw new Error("Nothing to parse");
    await this.parse();
    await this.execConfig(config);
  };
}

export default RESTDoc.instance;
