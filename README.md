<div align="center">
  <h1>Nuxt 3 Blog</h1>
</div>

## Features

- Nuxt3 technology stack, ssr rendering, more friendly to seo
- Adapt to mobile end layout
- Page loading, dark mode transition animation Simple and elegant
- Use markdown as article format
- Tag Category View Function
- Article search function
- Integrate website configuration to reduce the mental burden of modification
- Comment function based on [Giscus](https://giscus.app/zh-CN)

## Setup

Use Node.js 24 (see `.nvmrc`) and pnpm 10.33.0 (see `packageManager` in `package.json`).

Install the exact dependency versions from the committed lockfile:

```sh
pnpm install --frozen-lockfile
```

Start the development server:

```sh
pnpm dev
```

Generate the static website:

```sh
pnpm generate
```

The publish directory is `.output/public`. The site uses `/nash-web/` as its URL base path.

## GitHub Pages deployment

In **Settings → Pages**, select **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**.
Do not select `main`: it contains Nuxt source code, not the generated website.

The deployment workflow installs the locked dependencies, generates the website, checks that
`.output/public/index.html` exists, and publishes the output to `gh-pages`. Pushes to `main`
and manual workflow runs deploy the website; pull requests only run the build checks.
The workflow grants the write permission required to update the publishing branch.

Keep `pnpm-lock.yaml` under version control so dependency updates cannot silently break deployments.
The old `@chansee97/*` lint presets are no longer available on npm; the project now uses public
ESLint/Vue/TypeScript and Stylelint/SCSS/Vue configurations.

## Usage

You should modify the following files

- site.config.ts - base site config
- content - your article folder
- `pages\p\[...post].vue` - comment config, to [Giscus](https://giscus.app/zh-CN)

## Icon
- [icon-park-outline](https://icones.js.org/collection/icon-park-outline)
- [simple-icons](https://icones.js.org/collection/simple-icons)
