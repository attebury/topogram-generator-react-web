const manifest = require("./topogram-generator.json");

function componentNameForScreen(screenId) {
  return `${String(screenId || "screen")
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}Page`;
}

function routeSamplePath(route) {
  return String(route || "/").replace(/:([A-Za-z0-9_]+)/g, "sample-$1");
}

function contractRoutes(contract) {
  const screensById = new Map((contract.screens || []).map((screen) => [screen.id, screen]));
  const navItems = contract.navigation?.items || [];
  const routed = navItems.length > 0
    ? navItems.map((item) => {
        const screen = screensById.get(item.screenId) || {};
        return {
          id: item.screenId || screen.id,
          route: item.route || screen.route || "/",
          title: screen.title || item.label || item.screenId || "Page",
          screen
        };
      })
    : (contract.screens || []).map((screen) => ({
        id: screen.id,
        route: screen.route || "/",
        title: screen.title || screen.id || "Page",
        screen
      }));
  return routed.filter((route) => route.id && route.route);
}

function sampleItemsForScreen(screen) {
  const title = screen?.title || screen?.id || "Resource";
  return [
    {
      id: "sample-active",
      title: `${title} sample`,
      name: `${title} sample`,
      message: `${title} sample`,
      description: "Generated from Topogram UI contract metadata.",
      category: "sample",
      priority: "medium",
      created_at: "2026-01-01"
    },
    {
      id: "sample-completed",
      title: `${title} completed sample`,
      name: `${title} completed sample`,
      message: `${title} completed sample`,
      description: "Second generated row for rendering checks.",
      category: "sample",
      priority: "low",
      created_at: "2026-01-02"
    }
  ];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function componentId(usage) {
  return usage?.component?.id || "component";
}

function componentName(usage) {
  return usage?.component?.name || usage?.component?.id || "Component";
}

function renderComponentUsage(usage) {
  const id = escapeHtml(componentId(usage));
  const name = escapeHtml(componentName(usage));
  const region = escapeHtml(usage?.region || "region");
  return [
    '<section className="component-card component-generic" data-topogram-component="' + id + '">',
    '  <p className="component-eyebrow">' + region + ' component</p>',
    '  <h2>' + name + '</h2>',
    '  <p className="muted">Rendered from the Topogram component contract.</p>',
    '</section>'
  ].join("\n");
}

function renderComponentSections(screen) {
  return (screen?.components || []).map(renderComponentUsage).filter(Boolean).join("\n\n");
}

function renderSampleRowsSection() {
  return [
    '        <section className="card">',
    '          <h2>Sample rows</h2>',
    '          <ul className="resource-list">',
    '            {items.map((item) => (',
    '              <li key={item.id}>',
    '                <div className="resource-meta">',
    '                  <strong>{item.title}</strong>',
    '                  <span className="muted">{item.description}</span>',
    '                </div>',
    '                <span className="badge">{Object.keys(item).length} fields</span>',
    '              </li>',
    '            ))}',
    '          </ul>',
    '        </section>'
  ].join("\n");
}

function componentUsageRecordsForScreen(screen) {
  return (screen?.components || []).map((usage) => ({
    component: componentId(usage),
    region: usage?.region || null,
    rendered: true
  }));
}

function renderPackageJson(projectionId) {
  return `${JSON.stringify({
    name: projectionId,
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "vite dev",
      build: "vite build",
      preview: "vite preview",
      check: "tsc --noEmit"
    },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.30.1"
    },
    devDependencies: {
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.7.0",
      typescript: "^5.6.3",
      vite: "^7.1.11"
    }
  }, null, 2)}\n`;
}

function renderTsconfig() {
  return `${JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: "ESNext",
      moduleResolution: "Node",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx"
    },
    include: ["src"]
  }, null, 2)}\n`;
}

function renderViteConfig() {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "PUBLIC_TOPOGRAM_", "TOPOGRAM_"]
});
`;
}

function renderIndexHtml(brand) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${brand}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function renderMainTsx() {
  return `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
}

function renderHomePage(contract, routes) {
  const screens = routes.map((route) => ({
    id: route.id,
    title: route.title,
    route: route.route,
    sampleRoute: routeSamplePath(route.route)
  }));
  return `import { Link } from "react-router-dom";

const screens = ${JSON.stringify(screens, null, 2)};

export function HomePage() {
  return (
    <main>
      <div className="stack">
        <section className="card hero">
          <div>
            <p className="muted">Generated starter</p>
            <h1>${contract.projection?.name || contract.projection?.id || "Topogram React"}</h1>
            <p>This React app was generated from a Topogram UI web contract.</p>
          </div>
          <div className="button-row">
            {screens.slice(0, 2).map((screen) => (
              <Link className="button-link" to={screen.sampleRoute} key={screen.id}>{screen.title}</Link>
            ))}
          </div>
        </section>

        <section className="grid two">
          {screens.map((screen) => (
            <article className="card" key={screen.id}>
              <h2>{screen.title}</h2>
              <p><Link to={screen.sampleRoute}>Open screen</Link></p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
`;
}

function renderScreenPage(route) {
  const screen = route.screen || {};
  const items = sampleItemsForScreen(screen);
  const sampleSection = renderComponentSections(screen) || renderSampleRowsSection();
  return `const items: any[] = ${JSON.stringify(items, null, 2)};

export function ${componentNameForScreen(route.id)}() {
  return (
    <main>
      <div className="stack">
        <section className="card">
          <p className="muted">${screen.kind || "screen"}</p>
          <h1>${route.title}</h1>
          <p>This React page was generated from <code>${route.id}</code>.</p>
        </section>

        ${sampleSection}
      </div>
    </main>
  );
}
`;
}

function renderAppTsx(contract, routes) {
  const brand = contract.appShell?.brand || "Topogram React";
  const shell = contract.appShell?.shell || "topbar";
  const navItems = routes
    .map((route) => `            <Link to="${routeSamplePath(route.route)}">${route.title}</Link>`)
    .join("\n");
  const imports = routes
    .map((route) => `import { ${componentNameForScreen(route.id)} } from "./pages/${componentNameForScreen(route.id)}";`)
    .join("\n");
  const routeLines = routes
    .map((route) => `            <Route path="${routeSamplePath(route.route)}" element={<${componentNameForScreen(route.id)} />} />`)
    .join("\n");

  return `import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
${imports}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell" data-shell="${shell}">
        <header className="app-nav">
          <Link className="brand" to="/">${brand}</Link>
          <nav className="app-nav-links">
${navItems}
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<HomePage />} />
${routeLines}
        </Routes>
      </div>
    </BrowserRouter>
  );
}
`;
}

function renderCss() {
  return `:root {
  font-family: system-ui, sans-serif;
  color: #182026;
  background: linear-gradient(180deg, #f5f7fb 0%, #edf2f7 100%);
}
body { margin: 0; }
a { color: #0f5cc0; text-decoration: none; }
a:hover { text-decoration: underline; }
main { max-width: 72rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
.app-shell { min-height: 100vh; }
.app-nav { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(24, 32, 38, 0.08); background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); }
.app-nav-links { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.brand { font-weight: 700; letter-spacing: 0.01em; }
.card { background: white; border-radius: 16px; padding: 1.25rem; box-shadow: 0 12px 30px rgba(24, 32, 38, 0.08); }
.hero, .stack, .grid { display: grid; gap: 1rem; }
.grid.two { grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
.button-link { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 0.7rem 1rem; background: #0f5cc0; color: white; font-weight: 600; }
.button-row { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
.resource-list { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 0.75rem; }
.resource-list li { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1rem; border: 1px solid #e0e8f1; border-radius: 14px; background: #fbfcfe; }
.resource-meta { display: grid; gap: 0.35rem; }
.component-card { border: 1px solid #d7e1ec; border-radius: 14px; background: #fbfcfe; padding: 1rem; margin-top: 1rem; }
.component-eyebrow { margin: 0 0 0.25rem; color: #607284; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.badge { display: inline-flex; align-items: center; padding: 0.25rem 0.6rem; border-radius: 999px; background: #eef4ff; color: #0f5cc0; font-size: 0.85rem; font-weight: 600; }
.muted { color: #607284; }
@media (max-width: 640px) { .resource-list li { flex-direction: column; } .app-nav { flex-wrap: wrap; } }
`;
}

function renderCoverage(contract, files, routes) {
  const screens = routes.map((route) => {
    const page = `src/pages/${componentNameForScreen(route.id)}.tsx`;
    return {
      id: route.id,
      route: route.route,
      page,
      rendered: Boolean(files[page]),
      renderer: files[page] ? "generator" : "missing",
      component_usages: componentUsageRecordsForScreen(route.screen)
    };
  });
  const usageCount = screens.reduce((total, screen) => total + screen.component_usages.length, 0);
  return {
    type: "generation_coverage",
    surface: "web",
    generator: manifest.id,
    projection: {
      id: contract.projection?.id,
      name: contract.projection?.name,
      platform: contract.projection?.platform
    },
    summary: {
      routed_screens: screens.length,
      rendered_screens: screens.filter((screen) => screen.rendered).length,
      implementation_screens: 0,
      generator_screens: screens.filter((screen) => screen.renderer === "generator").length,
      component_usages: usageCount,
      rendered_component_usages: usageCount,
      diagnostics: 0,
      errors: 0,
      warnings: 0
    },
    screens,
    diagnostics: []
  };
}

function generate(context) {
  const contract = context.contracts?.uiWeb;
  if (!contract) {
    throw new Error("@topogram/generator-react-web requires contracts.uiWeb.");
  }
  const routes = contractRoutes(contract);
  const projectionId = contract.projection?.id || context.projection?.id || "proj_ui_web";
  const brand = contract.appShell?.brand || "Topogram React";
  const files = {
    "package.json": renderPackageJson(projectionId),
    "tsconfig.json": renderTsconfig(),
    "vite.config.ts": renderViteConfig(),
    "index.html": renderIndexHtml(brand),
    "src/main.tsx": renderMainTsx(),
    "src/vite-env.d.ts": "/// <reference types=\"vite/client\" />\n",
    "src/app.css": renderCss(),
    "src/App.tsx": renderAppTsx(contract, routes),
    "src/pages/HomePage.tsx": renderHomePage(contract, routes),
    "src/lib/topogram/api-contracts.json": `${JSON.stringify(context.contracts?.api || {}, null, 2)}\n`,
    "src/lib/topogram/ui-web-contract.json": `${JSON.stringify(contract, null, 2)}\n`
  };
  for (const route of routes) {
    files[`src/pages/${componentNameForScreen(route.id)}.tsx`] = renderScreenPage(route);
  }
  files["src/lib/topogram/generation-coverage.json"] = `${JSON.stringify(renderCoverage(contract, files, routes), null, 2)}\n`;
  return {
    files,
    artifacts: {
      generator: manifest.id,
      projection: projectionId,
      routeCount: routes.length
    },
    diagnostics: []
  };
}

module.exports = { manifest, generate };
