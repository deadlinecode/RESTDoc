import * as React from "react";
import { HashRouter, Redirect, Route, Switch } from "react-router-dom";
import config from "../../config.json";
import Fx from "../../Utils/Fx";
import paragraphs from "../../items.json";
import "./Layout.scss";
import Icon from "../../Utils/Components/Icon/Icon";
import logo from "../../../public/logo.png";
import Explorer from "../Explorer/Explorer";

interface IReqBodyBase {
  attr: string;
  type: string;
  desc: string;
  optional: boolean;
}
interface IReqBody extends IReqBodyBase {
  children?: IReqBody[];
}

interface IReqRspBody {
  [_: string]: {
    type: string;
    desc: string;
    children?: IReqRspBody;
  };
}

export interface IReq {
  path?: string;
  lines?: string;
  route: string;
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  shortDesc: string;
  headers: {
    [key: string]: string;
  };
  body: IReqBody[];
  rsp_body?: IReqRspBody;
  rsp_status?: {
    [status: string]: string;
  };
  title: string;
}

export interface ILayoutProps {}

export interface ILayoutState {
  showExamplebar: boolean;
  activeReq?: IReq;
  activeReqBodyObj?: IReqBody;
}

export default class Layout extends React.Component<
  ILayoutProps,
  ILayoutState
> {
  constructor(props: ILayoutProps) {
    super(props);

    this.state = {
      showExamplebar: false,
    };
  }

  renderWelcome = () => (
    <div>
      <h4>Welcome</h4>
      <h1>Introduction</h1>
      <hr />
      {config.welcome.map((x, i) => (
        <div
          key={i}
          className="Rendered_Content"
          dangerouslySetInnerHTML={{
            __html: x,
          }}
        />
      ))}
    </div>
  );

  renderRouteNavigations = (route: string, item: string) =>
    paragraphs.map((x, i) => (
      <div className="Sidebar__Item" key={i}>
        <span>{x.title}</span>
        <div className="Sidebar__Item__Children">
          {x.items.map((y, yi) => (
            <span
              key={yi}
              className={Fx.c([
                route === x.title.toLowerCase() &&
                  item === y.title.toLowerCase() &&
                  "active",
              ])}
              onClick={() =>
                (window.location.hash = `/${encodeURIComponent(
                  x.title.toLowerCase()
                )}/${encodeURIComponent(y.title.toLowerCase())}`) &&
                this.setState({
                  showExamplebar: false,
                  activeReq: undefined,
                  activeReqBodyObj: undefined,
                })
              }
            >
              {y.title}
            </span>
          ))}
        </div>
      </div>
    ));

  renderReq = (req: IReq) => {
    return (
      <div
        onClick={() =>
          this.setState({
            activeReq: req,
            activeReqBodyObj: undefined,
            showExamplebar: true,
          })
        }
        className={Fx.c([
          "Request_Component",
          this.state.showExamplebar &&
            this.state.activeReq &&
            this.state.activeReq.route === req.route &&
            this.state.activeReq.method === req.method &&
            "active",
        ])}
      >
        <div className="req-infos">
          <span
            className={Fx.c([
              "req-method",
              `method-${req.method.toUpperCase()}`,
            ])}
          >
            {req.method.toUpperCase()}
          </span>
          <span className="req-route">
            {req.route}
            <span className="req-short-desc">{req.shortDesc}</span>
          </span>
        </div>
        <div className="req-open-example">
          <Icon icon="chevron-right" />
        </div>
        {req.path && (
          <div className="rendered-by">
            {req.path}
            {req.lines && `:${req.lines}`}
          </div>
        )}
      </div>
    );
  };

  renderRoute = (route: string, item: string) => {
    const paragraph = paragraphs.find((x) => x.title.toLowerCase() === route);
    if (!paragraph) return <Redirect to="/" />;
    const paragraphItem = paragraph.items.find(
      (x) => x.title.toLowerCase() === item
    );
    if (!paragraphItem) return <Redirect to="/" />;
    return (
      <div>
        <h4>{paragraph.title}</h4>
        <h1 style={{ marginTop: "31px" }}>{paragraphItem.title}</h1>
        <hr />
        {paragraphItem.body.map((x, i) =>
          x.startsWith("REQ_DEF:") ? (
            (() => {
              try {
                return this.renderReq(JSON.parse(x.slice("REQ_DEF:".length)));
              } catch (err) {
                try {
                  return this.renderReq(
                    JSON.parse(x.slice("REQ_DEF:".length).replace(/\\/g, ""))
                  );
                } catch (err) {
                  console.log(x);
                  console.error(err);
                  return null;
                }
              }
            })()
          ) : (
            <div
              key={i}
              className="Rendered_Content"
              dangerouslySetInnerHTML={{
                __html: x,
              }}
            />
          )
        )}
      </div>
    );
  };

  renderRsp = (rsp: IReqRspBody, alignLvL = 0) =>
    Object.entries(rsp).map(([k, v], i) => (
      <div key={i} className="req-rsp">
        {v.children ? (
          <div className="align">
            {new Array(alignLvL)
              .fill(0)
              .map(() => <>&nbsp;</>)
              .join("")}
            {`${k}: {`}
            <div>{this.renderRsp(v.children, alignLvL + 2)}</div>
            {new Array(alignLvL)
              .fill(0)
              .map(() => <>&nbsp;</>)
              .join("")}
            {`},`}
          </div>
        ) : (
          <>
            {new Array(alignLvL).fill(0).map(() => (
              <>&nbsp;</>
            ))}
            {`${k}[${v.type}]: ${v.desc},`}
          </>
        )}
      </div>
    ));

  public render() {
    const isWelcome =
      config.welcome &&
      typeof config.welcome === "object" &&
      Array.isArray(config.welcome);
    return (
      <HashRouter>
        <Switch>
          <Route
            path="/:route"
            exact
            render={(props) => (
              <Redirect
                to={
                  isWelcome && props.match.params.route === "welcome"
                    ? "/welcome/introduction"
                    : `/${props.match.params.route}/${paragraphs
                        .find(
                          (x) =>
                            x.title.toLowerCase() === props.match.params.route
                        )
                        ?.items[0].title.toLocaleLowerCase()}`
                }
              />
            )}
          />
          <Route
            path="/:route/:item"
            render={(props) => (
              <div id="Layout">
                <div className="Sidebar">
                  <div className="Sidebar__Logo">
                    <img src={logo} alt="" />
                    <h3>{config.productName}</h3>
                  </div>
                  {isWelcome && (
                    <div className="Sidebar__Item">
                      <span>Welcome</span>
                      <div className="Sidebar__Item__Children">
                        <span
                          className={Fx.c([
                            props.match.params.route === "welcome" &&
                              props.match.params.item === "introduction" &&
                              "active",
                          ])}
                          onClick={() =>
                            (window.location.hash = "/welcome/introduction") &&
                            this.setState({
                              showExamplebar: false,
                              activeReq: undefined,
                              activeReqBodyObj: undefined,
                            })
                          }
                        >
                          Introduction
                        </span>
                      </div>
                    </div>
                  )}
                  {this.renderRouteNavigations(
                    props.match.params.route,
                    props.match.params.item
                  )}
                  <div className="Sidebar__Explorer">
                    <button
                      onClick={() => (window.location.hash = "#/explorer/init")}
                    >
                      Try it out 😄
                    </button>
                  </div>
                </div>
                <main
                  className={Fx.c([
                    this.state.showExamplebar && "examplebar-active",
                  ])}
                >
                  {props.match.params.route === "explorer" ? (
                    <Explorer page={props.match.params.item} />
                  ) : isWelcome &&
                    props.match.params.route === "welcome" &&
                    props.match.params.item === "introduction" ? (
                    this.renderWelcome()
                  ) : (
                    this.renderRoute(
                      props.match.params.route,
                      props.match.params.item
                    )
                  )}
                </main>
                <div
                  className={Fx.c([
                    "Examplebar",
                    this.state.showExamplebar && "active",
                  ])}
                >
                  <div className="Examplebar__Container">
                    <div
                      className="times"
                      onClick={() => this.setState({ showExamplebar: false })}
                    >
                      <Icon icon="times" />
                    </div>
                    {(() => {
                      const req = this.state.activeReq as IReq;
                      if (!req) return null;
                      return (
                        <>
                          <div className="section">
                            <h1>{req.title}</h1>
                          </div>
                          <hr />
                          <div className="section">
                            <div className="flex">
                              <span
                                className={Fx.c([
                                  "req-method",
                                  `method-${req.method.toUpperCase()}`,
                                ])}
                              >
                                {req.method.toUpperCase()}
                              </span>
                              <span className="req-route">
                                {config.apiBase === "SAME_ORIGIN"
                                  ? window.location.origin
                                  : config.apiBase}
                                {req.route}
                              </span>
                            </div>
                            {req.body && req.body.length !== 0 && (
                              <>
                                <br />
                                <br />
                                <br />
                                <br />
                                <h3>Request</h3>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Attribute</th>
                                      <th>Description</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {req.body.map((x, i) => (
                                      <tr
                                        key={i}
                                        className={Fx.c([
                                          this.state.activeReqBodyObj &&
                                            x.attr ===
                                              this.state.activeReqBodyObj
                                                .attr &&
                                            "active",
                                        ])}
                                      >
                                        <td>
                                          {this.state.activeReqBodyObj &&
                                            x.attr ===
                                              this.state.activeReqBodyObj
                                                .attr &&
                                            "active" && (
                                              <div className="activeObj">
                                                <Icon icon="chevron-right" />
                                              </div>
                                            )}
                                          {x.attr}
                                          <span
                                            onClick={() =>
                                              x.type === "object" &&
                                              x.children &&
                                              this.setState({
                                                activeReqBodyObj:
                                                  this.state.activeReqBodyObj &&
                                                  this.state.activeReqBodyObj
                                                    .attr === x.attr
                                                    ? undefined
                                                    : x,
                                              })
                                            }
                                            className={Fx.c([
                                              x.type === "object" &&
                                                x.children &&
                                                "obj",
                                            ])}
                                          >
                                            {x.optional && "[optional] "}
                                            {x.type}
                                          </span>
                                        </td>
                                        <td>
                                          {x.desc.split("`")[0]}
                                          {x.desc.split("`").length > 1 && (
                                            <code>
                                              {x.desc
                                                .split("`")
                                                .slice(1)
                                                .join("")
                                                .split("\\n")
                                                .map((y) => (
                                                  <>
                                                    {y}
                                                    <br />
                                                  </>
                                                ))}
                                            </code>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </>
                            )}
                            <br />
                            <br />
                            <br />
                            <h3>Headers</h3>
                            <code className="headers">
                              {Object.entries(req.headers).map(([k, v], i) => (
                                <div key={i}>
                                  <span className="k">{k}</span>:{" "}
                                  <span className="v">{v}</span>
                                </div>
                              ))}
                            </code>
                            <br />
                            <br />
                            <br />
                            <h3>Response</h3>
                            {req.rsp_status && (
                              <>
                                <br />
                                <h4>Status codes</h4>
                                {Object.entries(req.rsp_status).map(
                                  ([k, v], i) => (
                                    <div
                                      key={i}
                                      style={{
                                        boxSizing: "border-box",
                                        paddingLeft: "10px",
                                      }}
                                    >
                                      <b>{k}</b> - {v}
                                    </div>
                                  )
                                )}
                              </>
                            )}
                            {req.rsp_body && (
                              <>
                                <br />
                                <h4>Body</h4>
                                <code className="headers">
                                  {this.renderRsp(req.rsp_body)}
                                </code>
                              </>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div
                  className={Fx.c([
                    "Examplebar__ActiveObj",
                    this.state.activeReqBodyObj && "active",
                  ])}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Attribute</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(this.state.activeReqBodyObj?.children || []).map(
                        (x, i) => (
                          <tr
                            key={i}
                            className={Fx.c([
                              this.state.activeReqBodyObj &&
                                x.attr === this.state.activeReqBodyObj.attr &&
                                "active",
                            ])}
                          >
                            <td>
                              {this.state.activeReqBodyObj &&
                                x.attr === this.state.activeReqBodyObj.attr &&
                                "active" && (
                                  <div className="activeObj">
                                    <Icon icon="chevron-right" />
                                  </div>
                                )}
                              {x.attr}
                              <span
                                onClick={() =>
                                  x.type === "object" &&
                                  x.children &&
                                  this.setState({
                                    activeReqBodyObj:
                                      this.state.activeReqBodyObj &&
                                      this.state.activeReqBodyObj.attr ===
                                        x.attr
                                        ? undefined
                                        : x,
                                  })
                                }
                                className={Fx.c([
                                  x.type === "object" && x.children && "obj",
                                ])}
                              >
                                {x.type}
                                {x.optional && " [optional]"}
                              </span>
                            </td>
                            <td>
                              {x.desc.split("`")[0]}
                              {x.desc.split("`").length > 1 && (
                                <code>
                                  {x.desc.split("`").slice(1).join("")}
                                </code>
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
                <footer>
                  &copy; {config.companyName} {new Date().getFullYear()}
                </footer>
              </div>
            )}
          />
          <Route
            path="*"
            render={(props) => {
              var code = new URLSearchParams(window.location.search).get(
                "code"
              );
              if (code) return window.opener.closePopup(code);
              return <Redirect to="/welcome/introduction" />;
            }}
          />
        </Switch>
      </HashRouter>
    );
  }
}
