export default class ColorAttribute {
  public ink: number;
  public paper: number;
  public bright: boolean;

  public constructor(value: number);
  public constructor(ink: number, paper: number, bright: boolean);

  public constructor(...args: (number | boolean)[]) {
    if (args.length === 1) {
      const value = args[0] as number;
      this.ink = value & 0b111;
      this.paper = (value & 0b111000) >> 3;
      this.bright = !!(value & 0b1000000);
    }

    if (args.length === 3) {
      this.ink = args[0] as number;
      this.paper = args[1] as number;
      this.bright = args[2] as boolean;
    }
  }
}
