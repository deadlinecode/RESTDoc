import fs from "fs/promises";
import chokidar from "chokidar";
import path from "path";
import Fx from "../Utils/Fx";
import { parse as html } from "node-html-parser";
import pkg from "../../package.json";
import react from "@vitejs/plugin-react";
import vite from "vite";

export interface IConfig {
  logo: string;
  folders: string[];
  apiBase: string;
  productName: string;
  companyName: string;
  welcome?: string[];
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
  explorer?: {
    type: "graph";
    client_id: string;
    redirect_uri: string;
    scopes: string[];
    access_token_endpoint: string;
  };
}

interface IReqBodyNormal {
  attr: string;
  type: string;
  desc: string;
}
interface IReqBodyObj {
  attr: string;
  type: "object";
  desc: string;
  children: IReqBody[];
}

type IReqBody = IReqBodyNormal | IReqBodyObj;

interface IReq {
  route: string;
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  shortDesc: string;
  headers: {
    [_: string]: string;
  };
  body: IReqBody[];
}

interface INode {
  path: string;
  lines: string;
  content: string[];
}

class RESTDoc {
  static instance = new RESTDoc();
  private isDev = false;
  private nodes: INode[] = [];
  private parseCache: { path: string; content: any }[] = [];
  private extParseChache: {
    title: string;
    folder: string;
    items: { title: string; path: string; body: string[] }[];
  }[] = [];
  private folderWatch?: chokidar.FSWatcher;
  private extraPagesWatch?: chokidar.FSWatcher;
  private constructor() {
    if (process.env.NODE_ENV === "development") return;
    process.on("uncaughtException", (err) => {
      process.stdout.write("\u001b[3J\u001b[1J");
      console.clear();
      console.log(err.stack || err.message);
      process.exit(1);
    });
  }

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

  private watchFolders = (config: IConfig) => {
    this.folderWatch?.close();
    (this.folderWatch = chokidar.watch(config.folders, {
      depth: 99,
    })).on("change", async (path) => {
      process.stdout.write("\u001b[3J\u001b[1J");
      console.clear();
      console.log(
        `\x1b[46m\x1b[30m REBUILD \x1b[0m '${path}' changed. Building...`
      );
      const start = new Date().getTime();
      await this.parseFile(path);
      await this.parse(config, true, path);
      const end = new Date(new Date().getTime() - start);
      console.log(
        `\x1b[46m\x1b[30m REBUILD \x1b[0m Done in ${end.getMilliseconds()} ms`
      );
    });
  };

  private watchExtraPages = (config: IConfig) => {
    this.extraPagesWatch?.close();
    (this.extraPagesWatch = chokidar.watch(
      (config.extraPages as NonNullable<typeof config.extraPages>).map(
        (x) => x.folder
      ),
      { depth: 1 }
    )).on("change", async (file, stats) => {
      const folder =
        file.startsWith("/") || file.startsWith("C:") ? file : `./${file}`;
      if (!config.extraPages?.find((x) => x.folder === path.dirname(folder)))
        return;
      process.stdout.write("\u001b[3J\u001b[1J");
      console.clear();
      console.log(
        `\x1b[46m\x1b[30m REBUILD \x1b[0m '${file}' changed. Building...`
      );
      const start = new Date().getTime();
      await this.parseExt(
        config,
        true,
        config.extraPages?.find((x) => x.folder === path.dirname(folder))
      );
      const end = new Date(new Date().getTime() - start);
      console.log(
        `\x1b[46m\x1b[30m REBUILD \x1b[0m Done in ${end.getMilliseconds()} ms`
      );
    });
  };

  dev = async (config: IConfig) => {
    this.isDev = true;
    console.log("Starting...");
    const start = new Date().getTime();
    try {
      await this.execConfig(config);
    } catch (err) {
      return console.log((err as Error).message);
    }
    await this.index(config.folders);
    await this.parseExt(config);
    await this.parse(config, true);
    chokidar
      .watch(path.join(process.cwd(), "config.json"))
      .on("change", async () => {
        process.stdout.write("\u001b[3J\u001b[1J");
        console.clear();
        console.log(
          `\x1b[46m\x1b[30m REBUILD \x1b[0m Config changed. Building...`
        );
        const start = new Date().getTime(),
          content = (
            await fs.readFile(path.join(process.cwd(), "config.json"))
          ).toString();
        var newConfig: IConfig;
        try {
          newConfig = JSON.parse(content);
        } catch {
          return console.log(
            `\x1b[41m\x1b[30m ERROR \x1b[0m Couldn't parse config!`
          );
        }
        try {
          await this.execConfig(newConfig);
        } catch (err) {
          return console.log((err as Error).message);
        }

        if (
          newConfig.folders.some((x) => !config.folders.includes(x)) ||
          config.folders.some((x) => !newConfig.folders.includes(x))
        )
          this.watchFolders(newConfig);

        if (
          newConfig.extraPages === undefined &&
          config.extraPages !== undefined &&
          this.extraPagesWatch
        ) {
          this.extraPagesWatch.close();
          this.extraPagesWatch = undefined;
        }

        if (
          (newConfig.extraPages !== undefined &&
            config.extraPages === undefined) ||
          (newConfig.extraPages !== undefined &&
            config.extraPages !== undefined &&
            (newConfig.extraPages.some((x) =>
              (config.extraPages as NonNullable<typeof config.extraPages>).find(
                (y) => y.folder === x.folder
              )
            ) ||
              config.extraPages.some((x) =>
                (
                  newConfig.extraPages as NonNullable<
                    typeof newConfig.extraPages
                  >
                ).find((y) => y.folder === x.folder)
              )))
        )
          this.watchExtraPages(newConfig);

        config = newConfig;
        await this.index(config.folders);
        await this.parseExt(config);
        await this.parse(config, true);
        const end = new Date(new Date().getTime() - start);
        console.log(
          `\x1b[46m\x1b[30m REBUILD \x1b[0m Done in ${end.getMilliseconds()} ms`
        );
      });
    config.extraPages && this.watchExtraPages(config);
    this.watchFolders(config);
    await (
      await vite.createServer({
        plugins: [react()],
        server: {
          port: 3000,
        },
        root: Fx.res(["./web"]),
        logLevel: "silent",
      })
    ).listen();
    const end = new Date(new Date().getTime() - start);
    process.stdout.write("\u001b[3J\u001b[1J");
    console.clear();
    console.log(
      `\n  \x1b[1m\x1b[32m${pkg.name} v${
        pkg.version
      } \x1b[0m\x1b[2m ready in\x1b[0m ${end.getMilliseconds()} ms\n\n  Preview at http://localhost:3000\n  \x1b[2mWaiting for changes...\x1b[0m`
    );
  };

  index = (folders: string[]) =>
    Promise.all(folders.map((f) => this.readDir(f)));

  private parseExt = async (
    config: IConfig,
    directRender?: boolean,
    page?: NonNullable<IConfig["extraPages"]>[number]
  ) => {
    if (!config.extraPages) return;
    !page && (this.extParseChache = []);
    await Promise.all(
      (page ? [page] : config.extraPages).map(async (x) => {
        const elm = {
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
                  var parsed = html((await fs.readFile(y.path)).toString());
                  parsed.querySelectorAll("html body pre[req]").forEach((x) => {
                    var data: any;
                    try {
                      data = JSON.parse(
                        x.innerHTML
                          .trim()
                          .replace(/\r/g, "")
                          .split("\n")
                          .map((x) => x.trimStart())
                          .join(" ")
                      );
                    } catch {
                      return;
                    }
                    data.path = y.path;
                    !this.isDev && delete data.path;
                    data.lines && delete data.lines;
                    x.replaceWith(`REQ_DEF:${JSON.stringify(data)}`);
                  });
                  const title =
                      parsed.querySelector("html head title")?.innerText,
                    body = parsed.querySelector("html body")?.innerHTML;
                  if (!(title && body)) return undefined;
                  return {
                    title,
                    path: this.isDev ? y.path : undefined,
                    body: body
                      .trim()
                      .split("\n")
                      .map((x) => x.trim()),
                  };
                })
            )
          ).filter((x) => x !== undefined) as any,
        };
        page && this.extParseChache.find((x) => x.folder === page.folder)
          ? (this.extParseChache = this.extParseChache.map((x) =>
              x.folder === page.folder ? elm : x
            ))
          : this.extParseChache.push(elm);
      })
    );
    if (!directRender) return;
    await fs.writeFile(
      Fx.res(["./web/src/items.json"]),
      JSON.stringify(
        [
          {
            title: config.generatedDefsTitle || "API Reference",
            items: this.parseCache.map((x) => x.content),
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

  private parseObj = (chunk: string[], prefix?: string): any =>
    Object.fromEntries(
      chunk
        .filter((x) => (prefix ? x.startsWith(prefix) : true))
        .map((x) =>
          !prefix &&
          x.includes(".") &&
          chunk.find(
            (y) =>
              y.startsWith(x.split(".")[0]) && y.split(" | ")[1] === "object"
          )
            ? [undefined]
            : [
                x.split(" | ")[0].substring(prefix?.length || 0),
                {
                  type: x.split(" | ")[1],
                  desc: x.split(" | ")[2],
                  ...(x.split(" | ")[1] === "object" &&
                  chunk.find((y) =>
                    y.startsWith(`${x.split(" | ")[0]}.${prefix || ""}`)
                  )
                    ? {
                        children: this.parseObj(
                          chunk,
                          `${x.split(" | ")[0]}.${prefix || ""}`
                        ),
                      }
                    : {}),
                },
              ]
        )
    );

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
                    ["DESC", "BODY", "HEADERS", "RSP_STATUS", "RSP_BODY"].some(
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
              ["route", "string"],
              ["method", "string"],
              ["desc", "array"],
              ["headers", "array"],
            ].every(([k, t]) =>
              t === "array"
                ? typeof x[k] === "object" && Array.isArray(x[k])
                : typeof x[k] === t
            )
          )
          .map((x) => {
            var obj: string[] = [];
            const parseBody = (chunk: string, prefix?: string) => {
              var children = undefined;
              if (
                chunk.split(" | ")[1] === "object" &&
                (children = x.body.filter((y: string) =>
                  y.split(" | ")[0].startsWith(`${chunk.split(" | ")[0]}.`)
                )).length
              ) {
                obj.push(chunk.split(" | ")[0]);
                children = children.map((child: string) =>
                  parseBody(child, chunk.split(" | ")[0])
                );
              } else children = undefined;
              const attr = chunk
                .split(" | ")[0]
                .substring(prefix ? prefix.length + 1 : 0);
              return {
                attr: attr.trim().startsWith("?") ? attr.slice(1) : attr,
                type: chunk.split(" | ")[1],
                desc: chunk.split(" | ").slice(2).join(" | "),
                optional: attr.trim().startsWith("?"),
                children,
              };
            };
            return {
              title: x.col,
              body: [
                `<h3>${x.title}</h3>`,
                `REQ_DEF:${JSON.stringify({
                  ...(cached ? { path: x.path, lines: x.lines } : {}),
                  title: x.title,
                  route: x.route,
                  method: x.method,
                  shortDesc: x.shortDesc,
                  headers: Object.fromEntries(
                    x.headers.map((y: string) => [
                      y.split(" | ")[0],
                      y.split(" | ").slice(1).join(" | "),
                    ])
                  ),
                  ...(x.body
                    ? {
                        body: x.body
                          .map(parseBody)
                          .filter(
                            (y: any) =>
                              !obj.find((z) => y.attr.startsWith(`${z}.`))
                          ),
                      }
                    : {}),
                  ...(x.rsp_status
                    ? {
                        rsp_status: Object.fromEntries(
                          x.rsp_status.map((y: string) => [
                            y.split(" | ")[0],
                            y.split(" | ").slice(1).join(" | "),
                          ])
                        ),
                      }
                    : {}),
                  ...(x.rsp_body
                    ? {
                        rsp_body: this.parseObj(x.rsp_body),
                      }
                    : {}),
                } as IReq)}`,
                ...x.desc,
              ],
            };
          }),
        "title",
        "body"
      );
    cached &&
      path &&
      (parsed = [
        ...this.parseCache.filter((x) => x.path === path).map((x) => x.content),
        ...parsed,
      ]);
    cached &&
      (this.parseCache = parsed.map((x) => ({
        path: x.path,
        lines: x.lines,
        content: x,
      })));
    await fs.writeFile(
      Fx.res(["./web/src/items.json"]),
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
        [() => !config.logo, "logo is required"],
        [() => !config.logo.endsWith(".png"), "logo must be png"],
        [() => !config.folders, "folders is required"],
        [() => !config.apiBase, "apiBase is required"],
        [() => !config.productName, "productName is required"],
        [() => !config.companyName, "companyName is required"],
        [
          () => typeof config.productName !== "string",
          "productName has to be a string",
        ],
        [
          () => typeof config.companyName !== "string",
          "companyName has to be a string",
        ],
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
          () => typeof config.apiBase !== "string",
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
        [
          () =>
            config.explorer &&
            (typeof config.explorer !== "object" ||
              Array.isArray(config.explorer)),
          "explorer has to be Object",
        ],
        [
          () => config.explorer && config.explorer.type !== "graph",
          "explorer.type has to be 'graph'",
        ],
        [
          () =>
            config.explorer &&
            (
              [
                "client_id",
                "redirect_uri",
                "type",
                "access_token_endpoint",
              ] as const
            ).some((x) => typeof (config.explorer as any)[x] !== "string"),
          "explorer.client_id, explorer.redirect_uri, explorer.access_token_endpoint and explorer.type have to be a string",
        ],
        [
          () =>
            config.explorer &&
            (typeof config.explorer.scopes !== "object" ||
              !Array.isArray(config.explorer.scopes) ||
              config.explorer.scopes.some((x) => typeof x !== "string")),
          "explorer.scopes has to be a string array",
        ],
      ] as const
    ).forEach(([check, err]) => {
      if (check())
        throw new Error(`\x1b[41m\x1b[30m CONFIG ERROR \x1b[0m ${err}`);
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
          await fs.readFile(Fx.res(["./web/src/Utils/_globals.scss"]))
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
        replaceColor(`$${k}`, v as string)
      );
      changed &&
        (await fs.writeFile(Fx.res(["./web/src/Utils/_globals.scss"]), colors));
    }

    //
    // Replacing the logo
    //
    await fs.copyFile(config.logo, Fx.res(["./web/public/logo.png"]));

    //
    // Replace internal config
    //
    if (!(await Fx.fs_utils.exists(path.join(process.cwd(), "./config.json"))))
      await fs.copyFile(Fx.res(["./example.json"]), "./config.json");
    var internalConfig = JSON.parse(
        (await fs.readFile(Fx.res(["./web/src/config.json"]))).toString()
      ),
      changed = false;
    (
      ["welcome", "apiBase", "productName", "companyName", "explorer"] as const
    ).forEach(
      (x) => config[x] && (changed = true) && (internalConfig[x] = config[x])
    );
    internalConfig.apiBase = internalConfig.apiBase.slice(
      internalConfig.apiBase.endsWith("/") ? 1 : 0
    );
    changed &&
      (await fs.writeFile(
        Fx.res(["./web/src/config.json"]),
        JSON.stringify(internalConfig, null, 2)
      ));
  };

  private buildInternal = () =>
    vite.build({
      root: Fx.res(["./web"]),
      build: {
        outDir: path.join(process.cwd(), "./docs"),
      },
      base: "./",
      logLevel: "silent",
    });

  build = async (config: IConfig) => {
    if (!this.nodes.length) throw new Error("Nothing to parse");
    console.log("Reading config...");
    await this.execConfig(config);
    config.extraPages && console.log("Parsing extra pages...");
    await this.parseExt(config);
    console.log("Parsing folders...");
    await this.parse(config);
    console.log("Building files...");
    await this.buildInternal();
    console.log("\nDone!");
  };
}

export default RESTDoc.instance;
