import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workRoot = path.join(root, ".tmp", "verify");
const packRoot = path.join(workRoot, "pack");
const npmCache = path.join(workRoot, "npm-cache");
const cliPackageSpec = process.env.TOPOGRAM_CLI_PACKAGE_SPEC || defaultCliPackageSpec();
const cliDependencySpec = dependencySpecFor("@attebury/topogram", cliPackageSpec);

fs.rmSync(workRoot, { recursive: true, force: true });
fs.mkdirSync(packRoot, { recursive: true });
fs.mkdirSync(npmCache, { recursive: true });

console.log("Packing generator package...");
const pack = run("npm", ["pack", "--silent", "--pack-destination", packRoot], { cwd: root });
const tarballName = pack.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
const generatorTarball = path.join(packRoot, tarballName);
assert.equal(fs.existsSync(generatorTarball), true, `Expected ${generatorTarball}`);

const projectRoot = path.join(workRoot, "consumer");
fs.mkdirSync(projectRoot, { recursive: true });
fs.cpSync(path.join(root, "test-project-topogram"), path.join(projectRoot, "topogram"), { recursive: true });
fs.copyFileSync(path.join(root, "test-project-topogram.project.json"), path.join(projectRoot, "topogram.project.json"));
writeJson(path.join(projectRoot, "package.json"), { name: "topogram-generator-react-web-consumer", private: true, type: "module", devDependencies: { "@attebury/topogram": cliDependencySpec, "@attebury/topogram-generator-react-web": `file:${generatorTarball}` } });
writeNpmrc(projectRoot);
console.log("Installing consumer dependencies...");
run("npm", ["install"], { cwd: projectRoot, quiet: true });
const topogramBin = path.join(projectRoot, "node_modules", ".bin", process.platform === "win32" ? "topogram.cmd" : "topogram");
assert.equal(fs.existsSync(topogramBin), true, `Expected topogram binary at ${topogramBin}`);
console.log("Checking Topogram project...");
run(topogramBin, ["check"], { cwd: projectRoot });
console.log("Generating app with package-backed generator...");
run(topogramBin, ["generate"], { cwd: projectRoot });
console.log("Compiling generated app bundle...");
run("npm", ["--prefix", path.join(projectRoot, "app"), "run", "compile"], { cwd: projectRoot });
const outputRoot = path.join(projectRoot, "app", "apps", "web", "app_react");
assert.equal(fs.existsSync(path.join(projectRoot, "app", ".topogram-generated.json")), true);
assert.equal(fs.existsSync(path.join(outputRoot, "package.json")), true, `Expected generated package.json`);
assert.equal(fs.existsSync(path.join(outputRoot, "src", "App.tsx")), true, "Expected React App.tsx");
assert.equal(fs.existsSync(path.join(outputRoot, "src", "pages", "HomePage.tsx")), true, "Expected React home page");
assert.equal(fs.existsSync(path.join(outputRoot, "src", "lib", "topogram", "generation-coverage.json")), true, "Expected generation coverage artifact");
const greetingListPage = fs.readFileSync(path.join(outputRoot, "src", "pages", "GreetingListPage.tsx"), "utf8");
assert.match(greetingListPage, /data-topogram-component="component_ui_greeting_table"/);
assert.match(greetingListPage, /className="component-card component-generic"/);
const coverage = JSON.parse(fs.readFileSync(path.join(outputRoot, "src", "lib", "topogram", "generation-coverage.json"), "utf8"));
assert.equal(coverage.summary.component_usages, 1);
assert.equal(coverage.summary.rendered_component_usages, 1);
assert.deepEqual(coverage.diagnostics, []);
const generatedPackage = JSON.parse(fs.readFileSync(path.join(outputRoot, "package.json"), "utf8"));
assert.equal(generatedPackage.scripts.check, "tsc --noEmit");
assert.equal(generatedPackage.dependencies["react-router-dom"], "^6.30.1");
assert.match(fs.readFileSync(path.join(outputRoot, "src", "App.tsx"), "utf8"), /BrowserRouter/);
console.log("Package-backed @attebury/topogram-generator-react-web smoke passed.");

function run(command, args, options = {}) { const result = childProcess.spawnSync(command, args, { cwd: options.cwd || root, encoding: "utf8", env: { ...process.env, npm_config_cache: npmCache, PATH: process.env.PATH || "" } }); if (result.status !== 0) throw new Error([ `Command failed: ${command} ${args.join(" ")}`, result.stdout, result.stderr ].filter(Boolean).join("\n")); if (!options.quiet && result.stdout) process.stdout.write(result.stdout); if (!options.quiet && result.stderr) process.stderr.write(result.stderr); return result; }
function writeJson(filePath, value) { fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeNpmrc(projectRoot) { const lines = ["@attebury:registry=https://npm.pkg.github.com"]; if (process.env.NODE_AUTH_TOKEN) lines.push(`//npm.pkg.github.com/:_authToken=${process.env.NODE_AUTH_TOKEN}`); lines.push(""); fs.writeFileSync(path.join(projectRoot, ".npmrc"), lines.join("\n"), "utf8"); }
function dependencySpecFor(packageName, packageSpec) { const prefix = `${packageName}@`; return packageSpec.startsWith(prefix) ? packageSpec.slice(prefix.length) : packageSpec; }
function defaultCliPackageSpec() { const version = fs.readFileSync(path.join(root, "topogram-cli.version"), "utf8").trim(); if (!version) throw new Error("topogram-cli.version must contain the Topogram CLI version used by package smoke verification."); return `@attebury/topogram@${version}`; }
