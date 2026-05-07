const manifest = require("./topogram-generator.json");

const DEFAULT_DESIGN_INTENT = Object.freeze({
  density: "comfortable",
  tone: "neutral",
  radiusScale: "medium",
  colorRoles: Object.freeze({ primary: "accent" }),
  typographyRoles: Object.freeze({ body: "readable", heading: "prominent" }),
  actionRoles: Object.freeze({ primary: "prominent" }),
  accessibility: Object.freeze({ contrast: "aa", focus: "visible" })
});
const DENSITY_VALUES = {
  compact: { spaceUnit: "0.75rem", pagePadding: "1.5rem 1rem 3rem", controlPadding: "0.55rem 0.75rem" },
  comfortable: { spaceUnit: "1rem", pagePadding: "2rem 1.25rem 4rem", controlPadding: "0.7rem 1rem" },
  spacious: { spaceUnit: "1.25rem", pagePadding: "2.5rem 1.5rem 5rem", controlPadding: "0.85rem 1.15rem" }
};
const RADIUS_VALUES = {
  none: { card: "0", control: "0", pill: "0" },
  small: { card: "8px", control: "8px", pill: "999px" },
  medium: { card: "14px", control: "12px", pill: "999px" },
  large: { card: "18px", control: "16px", pill: "999px" }
};
const COLOR_VALUES = { accent: "#0f5cc0", critical: "#b42318", danger: "#b42318", success: "#027a48", warning: "#b54708", neutral: "#516173", muted: "#607284" };
const TONE_VALUES = {
  neutral: { text: "#182026", muted: "#607284", background: "linear-gradient(180deg, #f5f7fb 0%, #edf2f7 100%)", surface: "#ffffff", surfaceSubtle: "#fbfcfe", border: "#d7e1ec" },
  operational: { text: "#182026", muted: "#607284", background: "linear-gradient(180deg, #f5f7fb 0%, #edf2f7 100%)", surface: "#ffffff", surfaceSubtle: "#fbfcfe", border: "#d7e1ec" },
  editorial: { text: "#1f2933", muted: "#5c6670", background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)", surface: "#ffffff", surfaceSubtle: "#f8fafc", border: "#d8dee8" },
  playful: { text: "#1f2937", muted: "#5b6472", background: "linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)", surface: "#ffffff", surfaceSubtle: "#f7fbff", border: "#d6e4f5" }
};

function cssToken(value) { return String(value || "default").replace(/[^A-Za-z0-9_-]/g, "_"); }
function mergeStringMap(source, fallback) { return { ...fallback, ...(source && typeof source === "object" ? source : {}) }; }
function normalizeDesignIntent(design) {
  const value = design && typeof design === "object" ? design : {};
  return {
    density: typeof value.density === "string" ? value.density : DEFAULT_DESIGN_INTENT.density,
    tone: typeof value.tone === "string" ? value.tone : DEFAULT_DESIGN_INTENT.tone,
    radiusScale: typeof value.radiusScale === "string" ? value.radiusScale : DEFAULT_DESIGN_INTENT.radiusScale,
    colorRoles: mergeStringMap(value.colorRoles, DEFAULT_DESIGN_INTENT.colorRoles),
    typographyRoles: mergeStringMap(value.typographyRoles, DEFAULT_DESIGN_INTENT.typographyRoles),
    actionRoles: mergeStringMap(value.actionRoles, DEFAULT_DESIGN_INTENT.actionRoles),
    accessibility: mergeStringMap(value.accessibility, DEFAULT_DESIGN_INTENT.accessibility)
  };
}
function tokenMapLines(map, prefix) {
  return Object.entries(map).sort(([left], [right]) => left.localeCompare(right)).map(([role, value]) => `  --topogram-design-${prefix}-${cssToken(role)}: ${cssToken(value)};`);
}
function renderDesignIntentCss(design) {
  const normalized = normalizeDesignIntent(design);
  const tone = TONE_VALUES[normalized.tone] || TONE_VALUES.neutral;
  const density = DENSITY_VALUES[normalized.density] || DENSITY_VALUES.comfortable;
  const radius = RADIUS_VALUES[normalized.radiusScale] || RADIUS_VALUES.medium;
  const primaryColor = COLOR_VALUES[normalized.colorRoles.primary] || COLOR_VALUES.accent;
  const dangerColor = COLOR_VALUES[normalized.colorRoles.danger] || COLOR_VALUES.critical;
  return `/* Topogram semantic design intent. Generators map normalized UI tokens to stack CSS here. */
:root {
  --topogram-design-density: ${cssToken(normalized.density)};
  --topogram-design-tone: ${cssToken(normalized.tone)};
  --topogram-design-radius-scale: ${cssToken(normalized.radiusScale)};
${tokenMapLines(normalized.colorRoles, "color").join("\n")}
${tokenMapLines(normalized.typographyRoles, "typography").join("\n")}
${tokenMapLines(normalized.actionRoles, "action").join("\n")}
${tokenMapLines(normalized.accessibility, "accessibility").join("\n")}
  --topogram-space-unit: ${density.spaceUnit};
  --topogram-page-padding: ${density.pagePadding};
  --topogram-control-padding: ${density.controlPadding};
  --topogram-radius-card: ${radius.card};
  --topogram-radius-control: ${radius.control};
  --topogram-radius-pill: ${radius.pill};
  --topogram-text-color: ${tone.text};
  --topogram-muted-color: ${tone.muted};
  --topogram-surface-background: ${tone.background};
  --topogram-surface-card: ${tone.surface};
  --topogram-surface-subtle: ${tone.surfaceSubtle};
  --topogram-border-color: ${tone.border};
  --topogram-action-primary-background: ${primaryColor};
  --topogram-action-primary-color: #ffffff;
  --topogram-action-danger-background: ${dangerColor};
  --topogram-focus-outline: 3px solid ${primaryColor};
}
`;
}
function requiredDesignMarkers(design) {
  return [
    { category: "density", role: null, value: design.density, marker: "--topogram-design-density" },
    { category: "tone", role: null, value: design.tone, marker: "--topogram-design-tone" },
    { category: "radius_scale", role: null, value: design.radiusScale, marker: "--topogram-design-radius-scale" },
    ...Object.entries(design.colorRoles).map(([role, value]) => ({ category: "color_roles", role, value, marker: `--topogram-design-color-${cssToken(role)}` })),
    ...Object.entries(design.typographyRoles).map(([role, value]) => ({ category: "typography_roles", role, value, marker: `--topogram-design-typography-${cssToken(role)}` })),
    ...Object.entries(design.actionRoles).map(([role, value]) => ({ category: "action_roles", role, value, marker: `--topogram-design-action-${cssToken(role)}` })),
    ...Object.entries(design.accessibility).map(([role, value]) => ({ category: "accessibility", role, value, marker: `--topogram-design-accessibility-${cssToken(role)}` }))
  ];
}
function buildDesignIntentCoverage(contract, files, cssPath) {
  const design = normalizeDesignIntent(contract?.design);
  const css = files[cssPath] || "";
  const markers = requiredDesignMarkers(design);
  const mapped = markers.filter((item) => css.includes(item.marker));
  const missing = markers.filter((item) => !css.includes(item.marker));
  return {
    coverage: {
      status: missing.length === 0 ? "mapped" : "unmapped",
      css_path: cssPath,
      tokens: { density: design.density, tone: design.tone, radius_scale: design.radiusScale, color_roles: design.colorRoles, typography_roles: design.typographyRoles, action_roles: design.actionRoles, accessibility: design.accessibility },
      mapped: mapped.map((item) => ({ category: item.category, role: item.role, value: item.value, marker: item.marker })),
      missing: missing.map((item) => ({ category: item.category, role: item.role, value: item.value, marker: item.marker }))
    },
    diagnostics: missing.map((item) => ({
      code: "design_intent_not_mapped",
      severity: "error",
      category: item.category,
      role: item.role,
      value: item.value,
      marker: item.marker,
      message: `UI design intent token '${item.category}${item.role ? `.${item.role}` : ""}' was not mapped into ${cssPath}.`,
      suggested_fix: "Render Topogram semantic design variables before writing the web stylesheet."
    }))
  };
}

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

function componentContractFor(usage, componentContracts) {
  const id = componentId(usage);
  return componentContracts?.[id] || {};
}

function componentPatterns(usage, componentContracts) {
  return componentContractFor(usage, componentContracts).patterns || [];
}

function componentUsagePattern(usage, componentContracts) {
  return usage?.pattern || componentPatterns(usage, componentContracts)[0] || null;
}

function componentUsageSupport(usage, componentContracts) {
  const pattern = componentUsagePattern(usage, componentContracts);
  return {
    pattern,
    supported: (manifest.componentSupport?.patterns || []).includes(pattern || "")
  };
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

function componentUsageRecordsForScreen(screen, componentContracts, diagnostics) {
  return (screen?.components || []).map((usage) => {
    const component = componentId(usage);
    const support = componentUsageSupport(usage, componentContracts);
    if (!support.supported) {
      diagnostics.push({
        code: "component_pattern_not_supported",
        severity: "error",
        screen: screen?.id || null,
        route: screen?.route || null,
        region: usage?.region || null,
        pattern: support.pattern || null,
        component,
        message: `Screen '${screen?.id || "unknown"}' uses component '${component}' with unsupported React component pattern '${support.pattern || "(missing)"}'.`,
        suggested_fix: "Use a supported component pattern for this generator or provide an implementation override."
      });
    }
    return {
      component,
      region: usage?.region || null,
      pattern: support.pattern || null,
      supported: support.supported,
      rendered: true
    };
  });
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

function renderCss(design) {
  return `${renderDesignIntentCss(design)}

:root {
  font-family: system-ui, sans-serif;
  color: var(--topogram-text-color);
  background: var(--topogram-surface-background);
}
body { margin: 0; }
a { color: var(--topogram-action-primary-background); text-decoration: none; }
a:hover { text-decoration: underline; }
main { max-width: 72rem; margin: 0 auto; padding: var(--topogram-page-padding); }
.app-shell { min-height: 100vh; }
.app-nav { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(24, 32, 38, 0.08); background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); }
.app-nav-links { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.brand { font-weight: 700; letter-spacing: 0.01em; }
.card { background: var(--topogram-surface-card); border-radius: var(--topogram-radius-card); padding: 1.25rem; box-shadow: 0 12px 30px rgba(24, 32, 38, 0.08); }
.hero, .stack, .grid { display: grid; gap: var(--topogram-space-unit); }
.grid.two { grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
.button-link { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 0.7rem 1rem; background: #0f5cc0; color: white; font-weight: 600; }
.button-row { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
.resource-list { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 0.75rem; }
.resource-list li { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1rem; border: 1px solid #e0e8f1; border-radius: 14px; background: #fbfcfe; }
.resource-meta { display: grid; gap: 0.35rem; }
.component-card { border: 1px solid #d7e1ec; border-radius: 14px; background: #fbfcfe; padding: 1rem; margin-top: 1rem; }
.component-eyebrow { margin: 0 0 0.25rem; color: #607284; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.badge { display: inline-flex; align-items: center; padding: 0.25rem 0.6rem; border-radius: 999px; background: #eef4ff; color: #0f5cc0; font-size: 0.85rem; font-weight: 600; }
.muted { color: var(--topogram-muted-color); }
@media (max-width: 640px) { .resource-list li { flex-direction: column; } .app-nav { flex-wrap: wrap; } }
`;
}

function renderCoverage(contract, files, routes) {
  const diagnostics = [];
  const designIntent = buildDesignIntentCoverage(contract, files, "src/app.css");
  diagnostics.push(...designIntent.diagnostics);
  const componentContracts = contract.components || {};
  const screens = routes.map((route) => {
    const page = `src/pages/${componentNameForScreen(route.id)}.tsx`;
    return {
      id: route.id,
      route: route.route,
      page,
      rendered: Boolean(files[page]),
      renderer: files[page] ? "generator" : "missing",
      component_usages: componentUsageRecordsForScreen(route.screen, componentContracts, diagnostics)
    };
  });
  const usageCount = screens.reduce((total, screen) => total + screen.component_usages.length, 0);
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length;
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
      rendered_component_usages: screens.reduce((total, screen) => total + screen.component_usages.filter((usage) => usage.rendered).length, 0),
      diagnostics: diagnostics.length,
      errors: errorCount,
      warnings: warningCount
    },
    design_intent: designIntent.coverage,
    screens,
    diagnostics
  };
}

function assertGenerationCoverage(coverage) {
  const errors = (coverage.diagnostics || []).filter((diagnostic) => diagnostic.severity === "error");
  if (errors.length === 0) {
    return;
  }
  const details = errors.map((diagnostic) => diagnostic.message).join("; ");
  throw new Error(`React generation coverage failed: ${details}`);
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
    "src/app.css": renderCss(contract.design),
    "src/App.tsx": renderAppTsx(contract, routes),
    "src/pages/HomePage.tsx": renderHomePage(contract, routes),
    "src/lib/topogram/api-contracts.json": `${JSON.stringify(context.contracts?.api || {}, null, 2)}\n`,
    "src/lib/topogram/ui-web-contract.json": `${JSON.stringify(contract, null, 2)}\n`
  };
  for (const route of routes) {
    files[`src/pages/${componentNameForScreen(route.id)}.tsx`] = renderScreenPage(route);
  }
  const coverage = renderCoverage(contract, files, routes);
  assertGenerationCoverage(coverage);
  files["src/lib/topogram/generation-coverage.json"] = `${JSON.stringify(coverage, null, 2)}\n`;
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
