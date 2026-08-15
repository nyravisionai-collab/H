import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { transformAsync } from "@babel/core";

await mkdir("js/vendor", { recursive: true });
await Promise.all([
  copyFile("node_modules/core-js-bundle/minified.js", "js/vendor/polyfills.min.js"),
  copyFile("node_modules/css-vars-ponyfill/dist/css-vars-ponyfill.min.js", "js/vendor/css-vars-ponyfill.min.js")
]);

const preset = ["@babel/preset-env", {
  bugfixes: true,
  modules: false,
  useBuiltIns: false
}];
const source = await readFile("js/app.source.js", "utf8");
const peerSource = await readFile("node_modules/peerjs/dist/peerjs.min.js", "utf8");
const [result, peerResult] = await Promise.all([
  transformAsync(source, {
    filename: "js/app.source.js",
    comments: false,
    compact: false,
    sourceMaps: false,
    presets: [preset]
  }),
  transformAsync(peerSource, {
    filename: "peerjs.min.js",
    comments: false,
    compact: true,
    sourceMaps: false,
    presets: [preset]
  })
]);
await Promise.all([
  writeFile("js/app.js", `${result.code}\n`, "utf8"),
  writeFile("js/vendor/peerjs.min.js", `${peerResult.code}\n`, "utf8")
]);
console.log("Built ES5 application and browser-compatible local dependencies.");
