type Lang = "csharp" | "javascript" | "java" | "powershell";

interface ReqInfos {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: { [key: string]: string };
}

class Req2Code {
  static instance = new Req2Code();
  private constructor() {}

  private ToCSharp = (infos: ReqInfos) => {
    var res = [
      "using System.Net.Http;",
      "using System.Net.Http.Headers;",
      "",
      "// Initiate client ones for your application's lifetime and reuse",
      "HttpClient client = new HttpClient();",
      'client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "XXX");',
      "",
    ];

    if (infos.body)
      res.push(
        "var values = new Dictionary<string, string>",
        "{",
        Object.entries(infos.body)
          .map(([k, v]) => `\t{ "${k}", "${v}" }`)
          .join(","),
        "};",
        "",
        "var content = new FormUrlEncodedContent(values);",
        ""
      );

    if (infos.method === "GET")
      res.push(
        `var responseString = await client.GetStringAsync("${infos.url}");`
      );
    else if (infos.method === "POST")
      res.push(
        `var response = await client.PostAsync("${infos.url}", content);`,
        "",
        "var responseString = await response.Content.ReadAsStringAsync();"
      );
    return res.join("\n");
  };

  private ToJavascript = (infos: ReqInfos) =>
    [
      `var responseString = await fetch("${infos.url}", {`,
      `\tmethod: ${infos.method},`,
      "\theaders: {",
      infos.method !== "GET" && infos.body
        ? '\t\t"Content-Type": "application/json",'
        : undefined,
      '\t\tAuthorization: "Bearer XXX"',
      "\t},",
      ...(infos.body
        ? [
            "\tbody: JSON.stringify({",
            Object.entries(infos.body)
              .map(([k, v]) => `\t\t${k}: ${v}`)
              .join(",\n"),
            "\t})",
          ]
        : []),
      "});",
    ]
      .filter((x) => !!x)
      .join("\n");

  private ToJava = (infos: ReqInfos) =>
    [
      "import java.net.URI;",
      "import java.net.http.*;",
      "import java.net.http.HttpResponse.BodyHandlers;",
      "",
      "HttpRequest request = HttpRequest.newBuilder()",
      `\t.uri(new URI("${infos.url}"))`,
      `\t.headers("Authorization", "Bearer XXX"${
        infos.method !== "GET" && infos.body
          ? `, "Content-Type", "application/json"`
          : ""
      })`,
      `\t.${infos.method.toUpperCase()}(${
        infos.body
          ? `HttpRequest.BodyPublishers.ofString("${JSON.stringify(
              infos.body
            )}")`
          : ""
      })`,
      "\t.build();",
      "",
      "HttpResponse<String> response = HttpClient.newHttpClient().send(request, BodyHandlers.ofString());",
      "String responseString = response.body();",
    ].join("\n");

  private ToPowerShell = (infos: ReqInfos) =>
    [`$Response = Invoke-WebRequest -URI ${infos.url}`].join("\n");

  run = (infos: ReqInfos, Language: Lang) => {
    switch (Language) {
      case "csharp":
        return this.ToCSharp(infos);
      case "javascript":
        return this.ToJavascript(infos);
      case "java":
        return this.ToJava(infos);
      case "powershell":
        return this.ToPowerShell(infos);
      default:
        return "";
    }
  };
}

export default Req2Code.instance;
