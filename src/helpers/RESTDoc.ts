import fs from "fs/promises";
import chokidar from "chokidar";
import path from "path";
import Fx from "../Utils/Fx";
import { parse as html } from "node-html-parser";

export interface IConfig {
  logo: string;
  folders: string[];
  welcome?: string[];
  hostedAt?: string;
  apiBase?: string;
  generatedDefsTitle?: string;
  extraPages?: { title: string; folder: string }[];
  colors?: {
    pri?: string;
    sec?: string;
    bg?: string;
    onBg?: string;
    secBg?: string;
    onSecBg?: string;
  };
}

interface IReq {
  route: string;
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  shortDesc: string;
  headers: {
    [_: string]: string;
  };
  body: {
    attr: string;
    type: string;
    desc: string;
  }[];
}

interface INode {
  path: string;
  lines: string;
  content: string[];
}

class RESTDoc {
  static instance = new RESTDoc();
  private nodes: INode[] = [];
  private parseCache: { path: string; content: any }[] = [];
  private extParseChache: {
    title: string;
    folder: string;
    items: { title: string; path: string; body: string[] }[];
  }[] = [];
  private constructor() {}

  private readDir = async (dir: string) => {
    await Promise.all(
      (
        await fs.readdir(dir)
      ).map(async (f) =>
        (await fs.lstat(path.join(dir, f))).isDirectory()
          ? await this.readDir(path.join(dir, f))
          : await this.parseFile(path.join(dir, f))
      )
    );
  };

  private parseFile = async (path: string) => {
    var reading = false,
      node: INode = { path, lines: "", content: [] };
    this.nodes = this.nodes.filter((x) => x.path !== path);
    (await fs.readFile(path))
      .toString()
      .split("\n")
      .forEach((line, i) => {
        if (!reading && line.trim() === "// RESTDOC_START")
          return (
            (reading = true) &&
            (node = { path, lines: `${i + 1}-`, content: [] })
          );
        if (reading && line.trim() === "// RESTDOC_END")
          return (
            !(reading = false) &&
            this.nodes.push({ ...node, lines: node.lines + (i + 1) })
          );
        if (!(reading && line.trim().startsWith("//"))) return;
        line.trim().slice(2).trim() &&
          node.content.push(line.trim().slice(2).trim());
      });
  };

  dev = async (config: IConfig) => {
    // TODO: check for file deletion
    console.log("Building...");
    const start = new Date().getTime();
    await this.index(config.folders);
    await this.parseExt(config);
    await this.parse(config, true);
    const end = new Date(new Date().getTime() - start);
    process.stdout.write("\u001b[3J\u001b[1J");
    console.clear();
    console.log(`Build done (${end.getSeconds()}.${end.getMilliseconds()}s)`);
    chokidar.watch("./config.json").on("change", async () => {
      const config = JSON.parse(
        (await fs.readFile("./config.json")).toString()
      );
      await this.index(config.folders);
      // TODO: Rewach ext with the new config --> close old listeners
      await this.parseExt(config);
      await this.parse(config, true);
    });
    // TODO: Add extraPages to hot reload
    // config.extraPages && chokidar.watch(config.extraPages, { depth: 1 });
    chokidar
      .watch(config.folders, {
        depth: 99,
      })
      .on("change", async (path) => {
        process.stdout.write("\u001b[3J\u001b[1J");
        console.clear();
        console.log("Building...");
        const start = new Date().getTime();
        await this.parseFile(path);
        await this.parse(config, true, path);
        const end = new Date(new Date().getTime() - start);
        process.stdout.write("\u001b[3J\u001b[1J");
        console.clear();
        console.log(
          `Build done (${end.getSeconds()}.${end.getMilliseconds()}s)`
        );
      });
  };

  index = (folders: string[]) =>
    Promise.all(folders.map((f) => this.readDir(f)));

  private parseExt = async (config: IConfig) => {
    if (!config.extraPages) return;
    await Promise.all(
      config.extraPages.map(async (x) =>
        this.extParseChache.push({
          title: x.title,
          folder: x.folder,
          items: (
            await Promise.all(
              (
                await Promise.all(
                  (
                    await fs.readdir(x.folder)
                  ).map(async (f) => ({
                    path: path.join(x.folder, f),
                    isDir: (
                      await fs.lstat(path.join(x.folder, f))
                    ).isDirectory(),
                  }))
                )
              )
                .filter((y) => !y.isDir && y.path.endsWith(".html"))
                .map(async (y) => {
                  const parsed = html((await fs.readFile(y.path)).toString()),
                    title = parsed.querySelector("html head title")?.innerText,
                    body = parsed.querySelector("html body")?.innerHTML;
                  if (!(title && body)) return undefined;
                  return {
                    title,
                    path: y.path,
                    body: body
                      .trim()
                      .split("\n")
                      .map((x) => x.trim()),
                  };
                })
            )
          ).filter((x) => x !== undefined) as any,
        })
      )
    );
  };

  private parse = async (config: IConfig, cached?: boolean, path?: string) => {
    var reading = "",
      readArr: string[] = [],
      parsed = Fx.mergeNodes(
        (cached && path && this.nodes.find((x) => x.path === path)
          ? [...(this.nodes.filter((x) => x.path === path) as INode[])]
          : this.nodes
        )
          .map((x) =>
            Object.fromEntries([
              ...(x.content
                .map((y) => {
                  if (reading) {
                    if (y.trim() === `${reading}_END`) {
                      const key = reading.toLowerCase();
                      reading = "";
                      return [key, readArr];
                    }
                    readArr.push(y);
                    return undefined;
                  }
                  if (
                    ["DESC", "BODY", "HEADERS"].some(
                      (x) => `${x}_START` === y.trim()
                    )
                  ) {
                    reading = y.trim().split("_").slice(0, -1).join("_");
                    readArr = [];
                    return undefined;
                  }
                  return [
                    y.split("=")[0].trim(),
                    y.split("=").slice(1).join("=").trim(),
                  ];
                })
                .filter((x) => !!x) as any),
              ["path", x.path],
              ["lines", x.lines],
            ])
          )
          .filter((x) =>
            [
              ["col", "string"],
              ["title", "string"],
              ["shortDesc", "string"],
              ["route", "string"],
              ["method", "string"],
              ["desc", "array"],
              ["body", "array"],
              ["headers", "array"],
            ].every(([k, t]) =>
              t === "array"
                ? typeof x[k] === "object" && Array.isArray(x[k])
                : typeof x[k] === t
            )
          )
          .map((x) => ({
            title: x.col,
            body: [
              `<h3>${x.title}</h3>`,
              `REQ_DEF:${JSON.stringify({
                ...(cached ? { path: x.path, lines: x.lines } : {}),
                route: x.route,
                method: x.method,
                shortDesc: x.shortDesc,
                headers: Object.fromEntries(
                  x.headers.map((y: string) => [
                    y.split(" | ")[0],
                    y.split(" | ").slice(1).join(" | "),
                  ])
                ),
                body: x.body.map((y: string) => ({
                  attr: y.split(" | ")[0],
                  type: y.split(" | ")[1],
                  desc: y.split(" | ").slice(2).join(" | "),
                })),
              } as IReq)}`,
              ...x.desc,
            ],
          })),
        "title",
        "body"
      );
    cached &&
      path &&
      (parsed = [...this.parseCache.filter((x) => x.path === path), ...parsed]);
    cached &&
      (this.parseCache = parsed.map((x) => ({
        path: x.path,
        lines: x.lines,
        content: x,
      })));
    fs.writeFile(
      "./web/src/items.json",
      JSON.stringify(
        [
          {
            title: config.generatedDefsTitle || "API Reference",
            items: parsed,
          },
          ...this.extParseChache.map((x) => ({
            ...x,
            folder: undefined,
            items: x.items.map((y) => ({ ...y, path: undefined })),
          })),
        ],
        null,
        2
      )
    );
  };

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
        [
          () =>
            config.generatedDefsTitle &&
            typeof config.generatedDefsTitle !== "string",
          "generatedDefsTitle has to be a string",
        ],
        [
          () =>
            config.extraPages &&
            (typeof config.extraPages !== "object" ||
              !Array.isArray(config.extraPages)),
          "extraPages hast to be an array",
        ],
        [
          () =>
            config.extraPages &&
            !config.extraPages.every(
              (x) =>
                typeof x === "object" &&
                !Array.isArray(x) &&
                typeof x.folder === "string" &&
                typeof x.title === "string"
            ),
          "extraPages array has to be objects including folder and title",
        ],
      ] as const
    ).forEach(([check, err]) => {
      if (check()) throw new Error(`[ CONFIG ERROR ] ${err}`);
    });

  private execConfig = async (config: IConfig) => {
    //
    // Checking config
    //
    this.checkConfig(config);

    //
    // Replacing config
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
    await this.execConfig(config);
    await this.parseExt(config);
    await this.parse(config);
  };
}

export default RESTDoc.instance;
