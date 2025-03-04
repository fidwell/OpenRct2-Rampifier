/// <reference path="../lib/openrct2.d.ts" />

import { activateTool } from "./main";

registerPlugin({
  name: "Rampifier",
  version: "1.0",
  authors: ["fidwell"],
  type: "local",
  licence: "MIT",
  targetApiVersion: 104,
  main: startup,
});

function startup() {
  if (typeof ui !== "undefined") {
    ui.registerMenuItem("Rampifier", () => {
      activateTool();
    });
  }
}
