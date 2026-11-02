// Builds the app for Vercel using the Build Output API (https://vercel.com/docs/build-output-api):
//   .vercel/output/static/              the Vite client, served from Vercel's CDN
//   .vercel/output/functions/index.func a single self-contained bundle of the Express server
//   .vercel/output/config.json          routing: static files first, /api/* to the function,
//                                       everything else to index.html (client-side routes)
//
// Vercel's zero-config Express support compiles TypeScript file by file without bundling, which
// breaks this project's extensionless imports and the "@shared" path alias, and it cannot serve a
// client built during the same step. Bundling with esbuild avoids both.
import { execSync } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const out = ".vercel/output";
const func = `${out}/functions/index.func`;

await rm(out, { recursive: true, force: true });

console.log("Building client...");
execSync("npx vite build", { stdio: "inherit" });

console.log("Bundling server...");
await mkdir(func, { recursive: true });
await build({
  entryPoints: ["server/vercel.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: `${func}/index.cjs`,
  // Optional native driver that `pg` only loads if present.
  external: ["pg-native"],
  // esbuild wraps a default export as { default }; Vercel's handler must be the function itself.
  footer: { js: "module.exports = module.exports.default;" },
  logLevel: "info",
});

// connect-pg-simple reads table.sql from next to itself when it has to create the session table.
await cp("node_modules/connect-pg-simple/table.sql", `${func}/table.sql`);

await writeFile(
  `${func}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.cjs",
      launcherType: "Nodejs",
      // Express brings its own request helpers; Vercel's would consume the body first.
      shouldAddHelpers: false,
    },
    null,
    2,
  ),
);

await cp("dist/public", `${out}/static`, { recursive: true });

await writeFile(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        {
          // Send API calls to the function, keeping the original path for Express's router.
          src: "/api/(.*)",
          dest: "/",
          transforms: [{ type: "request.path", op: "set", args: "/api/$1" }],
        },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2,
  ),
);

console.log(`Vercel output written to ${out}`);
