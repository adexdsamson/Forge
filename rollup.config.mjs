import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

import packageJson from "./package.json" with { type: "json" };

// Treat every dependency / peer dependency as external so they are not bundled.
// @hookform/devtools is listed explicitly because it will be demoted from `dependencies`
// to an optional peer + devDependency in Plan 08; the externalization must survive that move
// so the synchronous require("@hookform/devtools") in Forge.tsx stays as an external call
// in both CJS and ESM output.
const external = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.peerDependencies || {}),
  "@hookform/devtools",
  "react-dropzone",
  "react-dom",
  "react/jsx-runtime",
];
const isExternal = (id) =>
  external.some((dep) => id === dep || id.startsWith(`${dep}/`));

export default [
  {
    input: "src/index.ts",
    external: isExternal,
    output: [
      { file: packageJson.main, format: "cjs", sourcemap: true },
      { file: packageJson.module, format: "esm", sourcemap: true },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        sourceMap: true,
      }),
    ],
  },
  {
    input: "src/index.ts",
    external: isExternal,
    output: [{ file: packageJson.types, format: "esm" }],
    plugins: [dts()],
  },
];
