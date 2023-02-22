import * as React from "react";
import Dropdown from "../../Utils/Components/Dropdown/Dropdown";
import "./Engine.scss";
import config from "../../config.json";
import items from "../../items.json";
import { IReq } from "../Layout/Layout";
import Fx from "../../Utils/Fx";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Req2Code from "../../Utils/Req2Code";
import Loader from "../../Utils/Components/Loader/Loader";

export interface IEngineProps {}

export interface IEngineState {
  endpoint?: string;
  codeLang?: string;
  activeTab: number;
  responseStatus?: string;
  loading?: boolean;
  response?: {
    time: number;
    status: string;
    body: string;
    isJSON: boolean;
  };
}

const reqs: IReq[] = [];
items.forEach((item) =>
  item.items.forEach((x) =>
    reqs.push(
      ...x.body
        .filter((body) => body.startsWith("REQ_DEF"))
        .map((body) => {
          try {
            return JSON.parse(body.slice("REQ_DEF:".length));
          } catch {
            try {
              return JSON.parse(
                body.slice("REQ_DEF:".length).replace(/\\/g, "")
              );
            } catch (err) {
              console.log(x);
              console.error(err);
              return null;
            }
          }
        })
        .filter((x) => x !== null)
    )
  )
);

export default class Engine extends React.Component<
  IEngineProps,
  IEngineState
> {
  private bodyMap: {
    [key: string]: React.RefObject<HTMLInputElement>;
  } = {};
  private urlParamsMap: {
    [key: string]: React.RefObject<HTMLInputElement>;
  } = {};
  constructor(props: IEngineProps) {
    super(props);

    this.state = {
      activeTab: 0,
    };
  }

  makeReq = async (route: IReq) => {
    if (
      !window.location.host.startsWith("localhost") &&
      (!localStorage.getItem("TMDOCS_AT") ||
        Fx.parseJwt(localStorage.getItem("TMDOCS_AT") || "").exp <=
          new Date().getTime() / 1000)
    )
      return (window.location.hash = "#/explorer/init");
    if (
      Object.entries(this.urlParamsMap).length &&
      Object.values(this.urlParamsMap).some(
        (inp) => !inp.current || !inp.current.value || !inp.current.value.trim()
      )
    )
      return this.setState(
        {
          activeTab: 0,
        },
        () =>
          Object.values(this.urlParamsMap).forEach(
            (inp) =>
              inp.current &&
              (!inp.current.value || !inp.current.value.trim()) &&
              inp.current.reportValidity()
          )
      );
    if (
      Object.entries(this.bodyMap).length &&
      Object.entries(this.bodyMap).some(
        ([k, inp]) =>
          (!inp.current || !inp.current.value || !inp.current.value.trim()) &&
          route.body.find((x) => x.attr === k) &&
          !route.body.find((x) => x.attr === k)?.optional
      )
    )
      return this.setState(
        {
          activeTab: route.route.match(/{([^}]*)}/g)?.length ? 1 : 0,
        },
        () =>
          Object.entries(this.bodyMap).forEach(
            ([k, inp]) =>
              inp.current &&
              (!inp.current.value || !inp.current.value.trim()) &&
              route.body.find((x) => x.attr === k) &&
              !route.body.find((x) => x.attr === k)?.optional &&
              inp.current.reportValidity()
          )
      );
    this.setState({ loading: true });
    const startTime = new Date().getTime();
    try {
      const rsp = await fetch(
          (config.apiBase === "SAME_ORIGIN"
            ? window.location.origin
            : config.apiBase) + route.route,
          {
            method: route.method,
            headers: {
              "Content-Type": "application/json",
              Authorization: localStorage.getItem("TMDOCS_AT") || "",
            },
            ...(route.method !== "GET" && route.body.length
              ? {
                  body: JSON.stringify(
                    Object.fromEntries(
                      route.body.map((x) => [
                        x.attr,
                        x.type === "boolean"
                          ? this.bodyMap[x.attr].current?.checked
                          : x.type === "number"
                          ? !this.bodyMap[x.attr].current?.value
                            ? undefined
                            : parseInt(
                                this.bodyMap[x.attr].current?.value || "0"
                              )
                          : !this.bodyMap[x.attr].current?.value
                          ? undefined
                          : this.bodyMap[x.attr].current?.value,
                      ])
                    )
                  ),
                }
              : {}),
          }
        ),
        body = await rsp.text();
      try {
        this.setState({
          loading: false,
          response: {
            time: new Date().getTime() - startTime,
            body: JSON.stringify(JSON.parse(JSON.parse(body)), null, 2),
            status: [rsp.status, rsp.statusText].join(" - "),
            isJSON: true,
          },
        });
      } catch {
        this.setState({
          loading: false,
          response: {
            time: new Date().getTime() - startTime,
            body: body,
            status: [rsp.status, rsp.statusText].join(" - "),
            isJSON: false,
          },
        });
      }
    } catch (err: any) {
      this.setState({
        loading: false,
        response: {
          time: new Date().getTime() - startTime,
          status: "ERROR",
          body: err.message || err,
          isJSON: false,
        },
      });
    }
  };

  public render() {
    const route = reqs.find((x) => x.route === this.state.endpoint);
    const tabs = {
      ...(route && route.route.match(/{([^}]*)}/g)?.length
        ? {
            URL: (
              <div id="URLInput">
                <div className="table">
                  {(route.route.match(/{([^}]*)}/g) as string[])
                    .map((x) => x.slice(1, -1))
                    .map((x, i) => (
                      <>
                        <div key={i} className="table__item">
                          {x}
                        </div>
                        <div className="table__item table__input">
                          <input
                            required
                            ref={(this.urlParamsMap[x] = React.createRef())}
                            type="text"
                            placeholder={`${x}...`}
                          />
                        </div>
                      </>
                    ))}
                </div>
              </div>
            ),
          }
        : {}),
      Body: (
        <div id="BodyInput">
          {route ? (
            !route.body ? (
              <span>No body</span>
            ) : (
              <div className="table">
                {route.body.map((x, i) => (
                  <>
                    <div key={i} className="table__item">
                      {x.attr}
                    </div>
                    <div className="table__item table__input">
                      {x.type === "boolean" ? (
                        <label className="checkbox_container">
                          <input
                            required={!x.optional}
                            ref={
                              (this.bodyMap[x.attr] =
                                React.createRef<HTMLInputElement>())
                            }
                            type="checkbox"
                          />
                          <span className="checkmark" />
                        </label>
                      ) : (
                        <input
                          ref={
                            (this.bodyMap[x.attr] =
                              React.createRef<HTMLInputElement>())
                          }
                          type={x.type === "number" ? "number" : "text"}
                          placeholder={`${x.type}...`}
                        />
                      )}
                    </div>
                  </>
                ))}
              </div>
            )
          ) : (
            <span>Please select a route</span>
          )}
        </div>
      ),
      Code: (
        <div>
          <Dropdown
            defaultTitle="Select a language..."
            value={this.state.codeLang}
            options={[
              {
                title: "C#",
                value: "csharp",
              },
              {
                title: "JavaScript",
                value: "javascript",
              },
              { title: "Java", value: "java" },
              {
                title: "PowerShell",
                value: "powershell",
              },
            ]}
            onChange={(codeLang) => this.setState({ codeLang: codeLang })}
          />
          {route && (
            <SyntaxHighlighter
              customStyle={{
                borderRadius: "5px",
                padding: "15px",
                backgroundColor: "transparent",
              }}
              language={this.state.codeLang}
              style={atomOneDark}
              children={Req2Code.run(
                {
                  url:
                    (config.apiBase === "SAME_ORIGIN"
                      ? window.location.origin
                      : config.apiBase) + route.route,
                  method: route.method,
                },
                this.state.codeLang as any
              )}
            />
          )}
        </div>
      ),
    } as const;
    return (
      <div id="Engine">
        <h1>API Explorer</h1>
        <br />
        <div className="Header">
          <div
            className={Fx.c([
              "box method",
              route?.method && `method-${route?.method}`,
            ])}
          >
            {route?.method}
          </div>
          <div className="box">
            {config.apiBase === "SAME_ORIGIN"
              ? window.location.origin
              : config.apiBase}
          </div>
          <Dropdown
            defaultTitle="Please select a Endpoint..."
            value={this.state.endpoint}
            options={reqs.map((x) => ({ title: x.route, value: x.route }))}
            onChange={(endpoint) =>
              (this.bodyMap = {}) &&
              (this.urlParamsMap = {}) &&
              this.setState({ endpoint })
            }
          />
          &nbsp;&nbsp;
          <button
            disabled={!route || this.state.loading}
            onClick={() => route && this.makeReq(route)}
          >
            {this.state.loading ? <Loader /> : "Run query"}
          </button>
        </div>
        <div className="Tabs">
          <div className="Tabs__Header">
            {Object.entries(tabs).map(([title], i) => (
              <div
                onClick={() =>
                  i !== this.state.activeTab && this.setState({ activeTab: i })
                }
                className={Fx.c([
                  "Tabs__Header__Item",
                  i === this.state.activeTab && "active",
                ])}
              >
                {title}
              </div>
            ))}
          </div>
          <div className="Tabs__Body">
            {
              Object.entries(tabs).find(
                (_, i) => i === this.state.activeTab
              )?.[1]
            }
          </div>
        </div>
        <div className="Response">
          <h4>
            Response
            {this.state.response &&
              ` [ ${this.state.response.status} ] (${
                this.state.response.time > 1000
                  ? (this.state.response.time / 1000).toFixed(2)
                  : `${this.state.response.time}m`
              }s)`}
          </h4>
          <div className="Response__body">
            {this.state.response &&
              (this.state.response.isJSON ? (
                <SyntaxHighlighter
                  customStyle={{
                    borderRadius: "5px",
                    padding: "15px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  }}
                  language={"json"}
                  style={atomOneDark}
                  children={this.state.response.body}
                />
              ) : (
                this.state.response.body
              ))}
          </div>
        </div>
      </div>
    );
  }
}
