# Topogram Generator: react

Package-backed Topogram generator for React/Vite web apps.

## Manifest

- Generator id: `@attebury/topogram-generator-react-web`
- Surface: `web`
- Projection platform: `ui_web`
- Package manifest: `topogram-generator.json`
- Adapter export: `index.cjs`

## Verify Locally

```bash
npm run check
```

The smoke test packs this generator, installs it beside `@attebury/topogram` in a temporary consumer project, runs `topogram check`, runs `topogram generate`, and verifies expected generated files.
