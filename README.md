# Topogram Generator: react

Package-backed Topogram generator for React/Vite web apps.

## Manifest

- Generator id: `@topogram/generator-react-web`
- Surface: `web`
- Projection type: `web_surface`
- Package manifest: `topogram-generator.json`
- Adapter export: `index.cjs`

## Verify Locally

```bash
npm run check
```

See [`CONSUMER_PROOF.md`](./CONSUMER_PROOF.md) for the verification standard
this repo must keep before publishing.

The smoke test packs this generator, installs it beside `@topogram/cli` in
a temporary consumer project, runs `topogram check`, runs `topogram generate`,
compiles the generated app bundle, and verifies expected generated files.
