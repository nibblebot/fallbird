import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import babel from "rollup-plugin-babel"
import serve from "rollup-plugin-serve"
import { terser } from "rollup-plugin-terser"
import copy from "rollup-plugin-copy"
import del from "rollup-plugin-delete"

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH

export default {
	input: "src/index.js",
	output: {
		file: "dist/bundle.js",
		format: "cjs",
		sourcemap: true
	},
	plugins: [
		resolve(), // resolve node_modules
		commonjs(), // resolve commonjs modules to ES6
		babel({
			exclude: "node_modules/**" // only transpile our source code
		}),
		del({ targets: "dist/*" }),
		copy({
			targets: [
				{ src: "src/index.html", dest: "dist" },
				{ src: "src/index.css", dest: "dist" },
				{ src: "src/assets/*", dest: "dist/assets" }
			]
		}),
		!production && serve("dist"), // use static web server at location
		production && terser()
	]
}
