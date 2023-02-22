import * as React from "react";
import Loader from "../../Utils/Components/Loader/Loader";
import Fx from "../../Utils/Fx";
import config from "../../config.json";

export interface IInitProps {}

export interface IInitState {
  loading: boolean;
  reqAccess?: boolean;
}

export default class Init extends React.Component<IInitProps, IInitState> {
  constructor(props: IInitProps) {
    super(props);

    this.state = {
      loading: true,
    };
  }

  componentDidMount = () => {
    try {
      const accessToken = localStorage.getItem("TMDOCS_AT");
      if (
        !accessToken ||
        Fx.parseJwt(accessToken).exp <= new Date().getTime() / 1000
      )
        return this.setState({ loading: false, reqAccess: true });
      window.location.hash = "#/explorer/home";
    } catch {}
  };

  auth = () => {
    this.setState({ loading: true });
    const width = 500,
      height = 765;
    var gotCode = false;

    var popup: Window | null;
    (window as any).closePopup = async (code: string) => {
      popup?.close();
      if (!code) return;
      gotCode = true;
      try {
        const rsp = await fetch(config.explorer.access_token_endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            Code: code,
          }),
        });
        if (rsp.status === 400) {
          alert(
            "It looks like the Teams Manager is not installed on your tenant.\nPlease make sure you logged in with the right account"
          );
          this.setState({ loading: false, reqAccess: true });
        }
        if (rsp.status !== 200)
          return this.setState({ loading: false, reqAccess: true });
        const body = JSON.parse(await rsp.json());
        if (!body.access_token)
          return this.setState({ loading: false, reqAccess: true });
        localStorage.setItem("TMDOCS_AT", body.access_token);
        window.location.hash = "#/explorer/home";
      } catch {
        this.setState({ loading: false, reqAccess: true });
      }
    };
    popup = window.open(
      `https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize?client_id=${
        config.explorer.client_id
      }&response_type=code&redirect_uri=${encodeURIComponent(
        window.location.host === "localhost:3000"
          ? "http://localhost:3000"
          : config.explorer.redirect_uri
      )}&response_mode=query&scope=${encodeURIComponent(
        config.explorer.scopes.join(" ")
      )}&state=12345`,
      `${config.productName} Docs Auth`,
      [
        ["popup", "yes"],
        ["width", width],
        ["height", height],
        ["left", (window.screen.width / 2 - width / 2).toFixed(0)],
        ["top", (window.screen.height / 2 - height / 2).toFixed(0)],
        ["status", "no"],
        ["location", "no"],
        ["menubar", "no"],
        ["scrollbars", "no"],
        ["resizable", "no"],
      ]
        .map((x) => x.join("="))
        .join(",")
    );
    (popup as any).onunload = () =>
      (!(popup as any) || (popup as any).closed) &&
      !gotCode &&
      this.setState({ loading: false, reqAccess: true });
  };

  render = () =>
    this.state.loading ? (
      <Loader absolute />
    ) : this.state.reqAccess ? (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <div>
          <h1>Just one more step...</h1>
          <br />
          <p>
            Looks like your access token expired or you are using the explorer
            for the first time
            <br />
            <br />
            But dont worry!
            <br />
            We just need you to sign in real quick and you're good to go 😉
          </p>
          <br />
          <button onClick={this.auth}>Sign in</button>
        </div>
      </div>
    ) : null;
}
