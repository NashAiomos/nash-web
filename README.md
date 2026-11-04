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

## Article images

Article images are stored in the Cloudflare R2 Standard bucket `nash-web-images`.
Articles use absolute image URLs under:

```text
https://pub-61f1a97788f1425894bfc0ead4718906.r2.dev/images/posts/
```

`docs/image-sources.json` records every original URL, R2 object key, public URL,
and SHA-256 checksum. All 207 migrated images were downloaded through their new
public URLs and checked against the original file checksums before updating articles.
The unrecoverable first image in `content/blog/my-story.md` was removed.

The `r2.dev` address is a rate-limited development endpoint and does not provide
Cloudflare CDN caching. Bind a custom domain to the bucket for production caching;
then replace the public URL prefix in the articles and source manifest.

Original downloaded files are kept in the ignored `.image-backup/posts/` directory
of the local checkout. They are not committed to Git or included in the website build.
Future image uploads should use unique object keys and a correct image content type.
Keep Cloudflare credentials out of the repository; the blog needs no credentials to
display images from their public URLs.

## Icon
- [icon-park-outline](https://icones.js.org/collection/icon-park-outline)
- [simple-icons](https://icones.js.org/collection/simple-icons)
