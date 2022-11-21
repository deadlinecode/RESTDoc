class Fx {
  static instance = new Fx();
  private constructor() {}

  c = (classes: any[]) => classes.filter((x) => !!x).join(" ");
}

export default Fx.instance;
