# Architecture diagram sources

The plugin subsystem pages use static SVGs so diagrams render without a Mermaid dependency in the documentation site. The matching `.mmd` files are the editable sources. Commit source and SVG changes together.

From the documentation repository root, render with the pinned CLI:

```sh
npm exec --yes --package=@mermaid-js/mermaid-cli@11.12.0 -- node scripts/render-plugin-diagrams.mjs
```

The CLI uses Puppeteer. If using an existing Chrome installation, set `PUPPETEER_EXECUTABLE_PATH` to its executable and `PUPPETEER_SKIP_DOWNLOAD=true` before installing/running the CLI. Otherwise use the browser installation supported by the CLI. These are authoring tools; they are not site runtime dependencies.

Check generated diagrams at desktop and narrow viewport widths. Text must remain readable, arrows must identify their direction, and each image must have a useful description in the page that embeds it.
