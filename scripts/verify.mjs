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
const cliDependencySpec = dependencySpecFor("@topogram/cli", cliPackageSpec);

fs.rmSync(workRoot, { recursive: true, force: true });
fs.mkdirSync(packRoot, { recursive: true });
fs.mkdirSync(npmCache, { recursive: true });

console.log("Packing generator package...");
const pack = run("npm", ["pack", "--silent", "--pack-destination", packRoot], { cwd: root });
const tarballName = pack.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1);
const generatorTarball = path.join(packRoot, tarballName);
assert.equal(fs.existsSync(generatorTarball), true, `Expected ${generatorTarball}`);
assertNoEnvFilesInTarball(generatorTarball, "@topogram/generator-react-web");

const projectRoot = path.join(workRoot, "consumer");
fs.mkdirSync(projectRoot, { recursive: true });
fs.cpSync(path.join(root, "test-project-topo"), path.join(projectRoot, "topo"), { recursive: true });
fs.copyFileSync(path.join(root, "test-project-topo.project.json"), path.join(projectRoot, "topogram.project.json"));
writeJson(path.join(projectRoot, "package.json"), { name: "topogram-generator-react-web-consumer", private: true, type: "module", devDependencies: { "@topogram/cli": cliDependencySpec, "@topogram/generator-react-web": `file:${generatorTarball}` } });
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
assert.match(greetingListPage, /data-topogram-widget="widget_ui_greeting_table"/);
assert.match(greetingListPage, /className="widget-card widget-generic"/);
const coverage = JSON.parse(fs.readFileSync(path.join(outputRoot, "src", "lib", "topogram", "generation-coverage.json"), "utf8"));
assert.equal(coverage.summary.widget_usages, 1);
assert.equal(coverage.summary.rendered_widget_usages, 1);
assert.equal(coverage.screens[0].widget_usages[0].pattern, "resource_table");
assert.equal(coverage.screens[0].widget_usages[0].supported, true);
assert.equal(coverage.screens[0].widget_usages[0].status, "rendered");
assert.equal(coverage.design_intent.status, "mapped");
assert.equal(coverage.design_intent.tokens.density, "compact");
assert.equal(coverage.design_intent.tokens.color_roles.primary, "accent");
assert.deepEqual(coverage.diagnostics, []);
const appCss = fs.readFileSync(path.join(outputRoot, "src", "app.css"), "utf8");
assert.match(appCss, /--topogram-design-density: compact;/);
assert.match(appCss, /--topogram-design-color-primary: accent;/);
const generatedPackage = JSON.parse(fs.readFileSync(path.join(outputRoot, "package.json"), "utf8"));
assert.equal(generatedPackage.scripts.check, "tsc --noEmit");
assert.equal(generatedPackage.dependencies["react-router-dom"], "^6.30.1");
assert.match(fs.readFileSync(path.join(outputRoot, "src", "App.tsx"), "utf8"), /BrowserRouter/);
const adapter = await import(path.join(root, "index.cjs"));
assert.throws(
  () => adapter.default.generate({
    projection: { id: "proj_web_surface" },
    contracts: {
      uiSurface: {
        projection: { id: "proj_web_surface", type: "web_surface" },
        appShell: { brand: "Unsupported Pattern" },
        widgets: {
          widget_lookup: { patterns: ["lookup_select"] }
        },
        screens: [
          {
            id: "lookup_screen",
            title: "Lookup",
            route: "/lookup",
            widgets: [
              {
                region: "results",
                pattern: "lookup_select",
                widget: { id: "widget_lookup", name: "Lookup" }
              }
            ]
          }
        ],
        navigation: { items: [{ screenId: "lookup_screen", label: "Lookup", route: "/lookup" }] }
      }
    }
  }),
  /unsupported React widget pattern 'lookup_select'/
);
console.log("Package-backed @topogram/generator-react-web smoke passed.");

function run(command, args, options = {}) { const result = childProcess.spawnSync(command, args, { cwd: options.cwd || root, encoding: "utf8", env: { ...process.env, npm_config_cache: npmCache, PATH: process.env.PATH || "" } }); if (result.status !== 0) throw new Error([ `Command failed: ${command} ${args.join(" ")}`, result.stdout, result.stderr ].filter(Boolean).join("\n")); if (!options.quiet && result.stdout) process.stdout.write(result.stdout); if (!options.quiet && result.stderr) process.stderr.write(result.stderr); return result; }
function writeJson(filePath, value) { fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function dependencySpecFor(packageName, packageSpec) { const prefix = `${packageName}@`; return packageSpec.startsWith(prefix) ? packageSpec.slice(prefix.length) : packageSpec; }
function assertNoEnvFilesInTarball(tarballPath, packageName) { const listing = run("tar", ["-tzf", tarballPath], { quiet: true }); const envFiles = listing.stdout.split(/\r?\n/).filter(Boolean).filter((entry) => /^(\.env.*|\.npmrc|\.DS_Store|.*\.(pem|key|p8|p12|pfx)|id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|secrets\..*|credentials\..*)$/.test(path.posix.basename(entry))); assert.deepEqual(envFiles, [], `${packageName} package must not publish restricted local or secret files`); }
function defaultCliPackageSpec() { const version = fs.readFileSync(path.join(root, "topogram-cli.version"), "utf8").trim(); if (!version) throw new Error("topogram-cli.version must contain the Topogram CLI version used by package smoke verification."); return `@topogram/cli@${version}`; }
