import * as React from "react";
import { HashRouter, Redirect, Route, Switch } from "react-router-dom";
import config from "../../config.json";
import Fx from "../../Utils/Fx";
import paragraphs from "../../items.json";
import "./Layout.scss";
import Icon from "../../Utils/Components/Icon/Icon";

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

export interface ILayoutProps {}

export interface ILayoutState {
  showExamplebar: boolean;
  activeReq?: IReq;
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
                )}/${encodeURIComponent(y.title.toLowerCase())}`)
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
        className={Fx.c([
          "Request_Component",
          this.state.showExamplebar &&
            this.state.activeReq &&
            this.state.activeReq.route === req.route &&
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
        <div
          className="req-open-example"
          onClick={() =>
            this.setState({ activeReq: req, showExamplebar: true })
          }
        >
          <Icon icon="chevron-right" />
        </div>
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
            this.renderReq(JSON.parse(x.slice("REQ_DEF:".length)))
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

  public render() {
    const isWelcome =
      config.welcome &&
      typeof config.welcome === "object" &&
      Array.isArray(config.welcome);
    return (
      <HashRouter basename={config.hostedAt}>
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
                  <img src="./logo.png" alt="" />
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
                            (window.location.hash = "/welcome/introduction")
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
                </div>
                <main
                  className={Fx.c([
                    this.state.showExamplebar && "examplebar-active",
                  ])}
                >
                  {isWelcome &&
                  props.match.params.route === "welcome" &&
                  props.match.params.item === "introduction"
                    ? this.renderWelcome()
                    : this.renderRoute(
                        props.match.params.route,
                        props.match.params.item
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
                            <h1>{req.shortDesc}</h1>
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
                                {config.apiBase}
                                {req.route}
                              </span>
                            </div>
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
                                  <tr key={i}>
                                    <td>
                                      {x.attr}
                                      <span>{x.type}</span>
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
                                ))}
                              </tbody>
                            </table>
                            <br />
                            <br />
                            <br />
                            <h3>Headers</h3>
                            <code className="headers">
                              {Object.entries(req.headers).map(([k, v], i) => (
                                <div>
                                  <span className="k">{k}</span>:{" "}
                                  <span className="v">{v}</span>
                                </div>
                              ))}
                            </code>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          />
          <Route
            path="*"
            render={() => <Redirect to="/welcome/introduction" />}
          />
        </Switch>
      </HashRouter>
    );
  }
}
