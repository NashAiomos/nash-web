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
- Independent anonymous comments with Cloudflare Workers and D1; no GitHub login required

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
- [workers/comments/README.md](workers/comments/README.md) - independent comment service, local development and deployment

## Comments

Article comments are stored in the dedicated Cloudflare D1 database and served
by the blog's own Worker API. Visitors can choose a nickname, post plain-text
comments and delete their own comments. A random credential saved in the browser
recognizes returning visitors without a GitHub account or device fingerprinting.
Default avatars are generated locally from the visitor ID and nickname.

Clearing browser storage or switching browsers creates a new visitor. Input
limits, a honeypot and server-side rate limits help reduce spam. See
[the comments guide](workers/comments/README.md) for the API, testing, deployment
and owner moderation instructions.

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

The page renders committed WebP derivatives from `public/images/optimized/`, served
by GitHub Pages under the site base path. `assets/data/image-variants.json` maps original
URLs to 480, 960 and 1440 pixel variants (without upscaling). Browsers choose a variant
with `srcset`; full-size R2 originals are requested only when opening the lightbox.
The original dimensions are preserved for layout and existing article zoom styles.

To regenerate after adding images to `docs/image-sources.json`:

```sh
pnpm images:optimize
```

This uses local originals from the ignored `.image-backup/posts/` directory, or downloads
missing originals sequentially from R2, verifies their SHA-256 checksums, then generates
the derivatives. Commit both the generated WebP files and the variant manifest. Normal
builds use these committed files and require no R2 credentials or image downloads.

Write descriptive `alt` text for content images. Use the optional `caption` attribute
when a visible caption is needed; an absent caption produces no empty `figcaption`.
Set each article's frontmatter `lang` to `zh-Hans` or `en`.

The `r2.dev` endpoint still serves the full-size lightbox originals. Binding it to a
custom domain requires a domain owned by the site author and Cloudflare configuration;
no production domain is configured in this repository. After binding one, update the
URL prefix in articles and `docs/image-sources.json`, then regenerate the variant map.
Keep Cloudflare credentials out of the repository.

The generated RSS feed is available at `/nash-web/rss.xml` and is advertised in the
page head. Static `/p/` navigation uses Nuxt's generated meta refresh to `/nash-web/blog`;
GitHub Pages cannot emit the server-side HTTP 301 response itself.

## Icon
- [icon-park-outline](https://icones.js.org/collection/icon-park-outline)
- [simple-icons](https://icones.js.org/collection/simple-icons)
