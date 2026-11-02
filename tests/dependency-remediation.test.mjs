import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { transform, transformSync } from "@esbuild-kit/core-utils";
import { strFromU8, unzipSync } from "fflate";
import writeExcelFile from "write-excel-file/node";

const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);

function atLeast(actual, minimum) {
  const a = actual.split(".").map(Number);
  const b = minimum.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

test("every locked instance of the affected packages meets the security floor", () => {
  const minimumVersions = {
    minimatch: "9.0.6",
    glob: "10.5.0",
    qs: "6.16.2",
    rollup: "4.59.0",
    esbuild: "0.25.0",
    vite: "6.4.5",
    lodash: "4.18.1",
    "on-headers": "1.1.0",
    "brace-expansion": "2.0.2",
  };
  for (const [path, pkg] of Object.entries(lock.packages)) {
    assert.ok(!path.endsWith("node_modules/xlsx"), "Unpatched xlsx must not return");
    for (const [name, minimum] of Object.entries(minimumVersions)) {
      if (path.endsWith(`node_modules/${name}`)) {
        assert.ok(atLeast(pkg.version, minimum), `${path}: ${pkg.version} < ${minimum}`);
      }
    }
  }
});

test("the database toolkit's legacy loader works with patched esbuild", async () => {
  const source = "export const result: number = 42;";
  const cjs = transformSync(source, "/tmp/security-smoke.cts");
  const context = { module: { exports: {} } };
  vm.runInNewContext(cjs.code, context);
  assert.equal(context.module.exports.result, 42);

  const esm = await transform(source, "/tmp/security-smoke.mts");
  const result = await import(`data:text/javascript,${encodeURIComponent(esm.code)}`);
  assert.equal(result.result, 42);
});

test("Excel writer preserves the sheet, column order, text and international characters", async () => {
  const buffer = await writeExcelFile(
    [
      ["Name", "Email", "Phone"],
      ["Test & <Guest> Å", "sample@example.invalid", "+0012345"],
      ["=1+1", "other@example.invalid", ""],
    ],
    { sheet: "Notification List" },
  ).toBuffer();
  const files = unzipSync(buffer);
  const workbook = strFromU8(files["xl/workbook.xml"]);
  const worksheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
  const strings = strFromU8(files["xl/sharedStrings.xml"]);
  assert.match(workbook, /name="Notification List"/);
  assert.match(worksheet, /r="A1"[^>]*t="s"/);
  assert.match(worksheet, /r="C2"[^>]*t="s"/);
  assert.ok(strings.indexOf(">Name<") < strings.indexOf(">Email<"));
  assert.ok(strings.indexOf(">Email<") < strings.indexOf(">Phone<"));
  assert.match(strings, /Test &amp; &lt;Guest&gt; Å/);
  assert.match(strings, /\+0012345/);
  assert.match(strings, /=1\+1/);
  assert.doesNotMatch(worksheet, /<f[ >]/, "Contact values must not become formulas");
});
