import ColorAttribute from "./colorAttribute";
import DrawSurface from "./drawSurface";
import { range, h, d, b } from "./util";
import * as ROM from "./rom";
import XY from "./xy";

console.log("-- rom init --");

const buffer = require("arraybuffer-loader!../resources/dynamite-dan");
const array = new Uint8Array(buffer);

let viewerVisible = false;
let viewerOffset = 0;
let viewerSurfaces: DrawSurface[];

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

export function isViewerVisible() {
  return viewerVisible;
}

function redrawMemoryViewer() {
  viewerSurfaces=[];
  for(let y=0;y<20;y++) {
    for(let x=0;x<20;x++) {
      viewerSurfaces.push(
        new DrawSurface(
          new XY(x*8, y*8),
          8,
          8,
          false,
          false,
          new ColorAttribute(7, 1, true),
          ROM.copy(viewerOffset+y*20*8+x*8, 8)
        )
          .attachToHtml()
          .setStyle({ "z-index": "1000" })
          .show()
    
      );
    }
  }
}

export function toggleMemoryViewer() {
  viewerVisible = !viewerVisible;

  if (viewerVisible) {
    redrawMemoryViewer();
  } else {
    viewerSurfaces.forEach(vs => vs.hide());
  }

  console.log("visible: " + viewerVisible);
}

export function adjustMemoryViewerOffset(offset: number) {
  viewerOffset = Math.max(0, viewerOffset + offset);
  redrawMemoryViewer();
}
