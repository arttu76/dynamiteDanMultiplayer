export function range(maxExclusive: number) {
  return Array.from(Array(maxExclusive).keys());
}

export function repeat(value: number, amount: number) {
  return new Array(amount).fill(value);
}

export function d(hexNumber: string): number {
  return parseInt(hexNumber, 16);
}

export function h(value: number): string {
  return value.toString(16);
}

export function b(value: number): string {
  const str = value.toString(2);
  return "00000000".substring(0, 8 - str.length) + str;
}
