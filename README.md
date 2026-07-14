# alex-0d18-precisioncalc

Precision calculator built as a static Vite application.

## Local Development

```bash
npm ci
npm run dev
```

The development server listens on `0.0.0.0:8080`.

## Production Build

```bash
npm ci
npm run build
```

The production assets are written to `dist/`. The generated files are portable static
assets and can be served by any bare static file host.

## Bare Self-Hosted Serving

This repository includes a dependency-free Node.js static server for self-hosted
deployments:

```bash
npm run build
npm start
```

`npm start` serves `dist/` on `0.0.0.0:8080` by default. Configure it with:

```bash
HOST=0.0.0.0 PORT=8080 STATIC_DIR=dist npm start
```

The server applies long-lived caching to hashed assets under `dist/assets/`, serves
`index.html` without stale caching, and falls back to `index.html` for application
routes while returning `404` for missing static files.
