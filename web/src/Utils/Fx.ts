class Fx {
  static instance = new Fx();
  private constructor() {}

  c = (classes: any[]) => classes.filter((x) => !!x).join(" ");

  parseJwt = (token: string) =>
    JSON.parse(
      decodeURIComponent(
        window
          .atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      )
    );
}

export default Fx.instance;
