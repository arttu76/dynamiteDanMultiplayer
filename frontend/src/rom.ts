import { h, b, d } from "./util";

// @ts-ignore
import snapshotHexString from "./dynamite-dan.sna";

const array = new Uint8Array(snapshotHexString.length / 2);
for (let i = 0; i < snapshotHexString.length; i += 2) {
  array[i / 2] = d(snapshotHexString.substr(i, 2));
}

function getTrueOffset(val: number): number {
  return 27 + val - 16384;
}

export function peek(address: number): number {
  return array[getTrueOffset(address)];
}

export function copy(address: number, length: number): number[] {
  const base = getTrueOffset(address);
  return Array.from(array.slice(base, base + length));
}

export function pointer(data: number[], offset: number = 0): number {
  return data[offset + 1] * 256 + data[offset];
}

export function hexDump(
  pointer: number,
  length: number,
  desc: string[] = []
): void {
  console.log("-- dump -- ");
  const trueOffset = getTrueOffset(pointer);
  Array.from(array.slice(trueOffset, trueOffset + length))
    .map((val: number, idx: number) => [h(pointer + idx), h(val), val, b(val)])
    .forEach((addressAndValue: string[], idx: number) =>
      console.log(
        addressAndValue[0] +
          " ... " +
          addressAndValue[1] +
          "    => " +
          addressAndValue[2] +
          " _ " +
          addressAndValue[3] +
          (idx < desc.length ? " " + desc[idx] : "")
      )
    );
}
