class Fx {
  static instance = new Fx();
  private constructor() {}

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
