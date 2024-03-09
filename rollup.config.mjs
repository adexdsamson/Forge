import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

import packageJson from "./package.json" assert { type: "json" };

export default [
  {
    input: "src/web/index.ts",
    external: ["react-dom", "react-native", "react"],
    output: {
      dir: packageJson.module,
      format: "esm",
      sourcemap: true,
      // exports: "named",
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json", exclude: ["app/src/App.tsx"] }),
    ],
  },
];
