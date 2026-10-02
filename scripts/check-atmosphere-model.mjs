import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";

// Compile only the pure TypeScript model using the repository's existing compiler.
const require = createRequire(import.meta.url);
const ts = require("typescript");
const cache = new Map();
function load(path) {
  const filename = resolve(path);
  if (cache.has(filename)) return cache.get(filename);
  const compiledModule = { exports: {} };
  cache.set(filename, compiledModule.exports);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    module: compiledModule, exports: compiledModule.exports,
    require: specifier => load(specifier.startsWith("@/") ? `src/${specifier.slice(2)}.ts` : resolve(dirname(filename), `${specifier}.ts`)),
  }, { filename });
  return compiledModule.exports;
}

const { seededRandom } = load("src/lib/atmosphere/random.ts");
const { atmosphereIntensity, atmosphereProfiles } = load("src/data/atmosphere-config.ts");
const { AtmosphereField } = load("src/lib/atmosphere/field.ts");
const first = seededRandom(123), second = seededRandom(123);
for (let index = 0; index < 1000; index++) assert.equal(first(), second(), "seed determines repeatable sequence");
for (const [path, expected] of [
  ["/", "home"], ["/vi/", "home"], ["/projects", "medium"], ["/vi/terminal/", "medium"],
  ["/contact/", "medium-low"], ["/about", "light"], ["/vi/writeups", "light"], ["/log", "light"],
  ["/operations/secure-api-gateway", "light"], ["/vi/log/entry/", "very-light"], ["/writeups/future-article", "very-light"],
]) assert.equal(atmosphereIntensity(path), expected, path);
console.log("PASS deterministic PRNG and normalized route/intensity mapping");

const moves = [], lines = [];
const context = {
  clearRect() {}, beginPath() {}, arc() {}, fill() {}, fillRect() {}, stroke() {},
  moveTo(x, y) { moves.push([x, y]); }, lineTo(x, y) { lines.push([x, y]); },
  createLinearGradient() { return { addColorStop() {} }; },
};
for (const width of [430, 768, 1440, 1920]) {
  for (const intensity of Object.keys(atmosphereProfiles)) {
    const field = new AtmosphereField(23);
    field.configure(intensity, width, 900, 0);
    const expectedDensity = width < 768 ? .5 : width < 1024 ? .75 : 1;
    assert.equal(field.starCount, Math.round(atmosphereProfiles[intensity].stars * expectedDensity));
    const initialDue = field.nextEvent;
    field.configure(intensity, width, 900, 100);
    assert.equal(field.nextEvent, initialDue, "route/config update preserves pending event schedule");
    for (let now = 0; now <= 240000; now += 32) {
      field.tick(now);
      assert.ok(field.meteorCount <= (width < 768 ? 1 : 2), "bounded active meteor count");
      field.draw(context, now, true, [], 0);
    }
    field.suspend(240001);
    assert.equal(field.active, false, "suspension discards active objects");
    assert.ok(field.nextEvent > 240001, "suspension discards event backlog");
    const lineCount = lines.length;
    field.draw(context, 240002, false, [], 0);
    assert.equal(lines.length, lineCount, "static mode draws no meteor trail");
  }
}
assert.ok(lines.length > 0);
for (let index = 0; index < lines.length; index++) {
  assert.ok(lines[index][0] > moves[index][0] && lines[index][1] > moves[index][1], "meteor travels top-left to bottom-right");
}
console.log("PASS density, bounded meteors, diagonal trails, static rendering and pause across four-minute simulations");
