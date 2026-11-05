# Blog comments

The blog uses its own Cloudflare Worker and D1 database. Visitors do not need a
GitHub account. The frontend is `components/PostComments.vue` and the API entry
is `src/index.mjs`.

- Worker: `nash-web-comments`
- API: `https://nash-web-comments.nashaiomos.workers.dev`
- Database: `nash-web-comments` (APAC)
- Production browser origin: `https://nashaiomos.github.io`

## Visitor identity and avatars

On the first visit, the browser generates a cryptographically random anonymous
credential and saves it locally. The API stores only its SHA-256 hash, alongside
a separate public visitor ID and nickname. A nickname is not an authentication
credential and does not have to be unique. The default avatar uses the public ID
for a stable color and the nickname's first character as its label.

No canvas, hardware, font or other device fingerprint is collected. Clearing
browser storage, using private browsing or switching browsers creates a new
visitor. Without the original browser credential, a visitor cannot delete their
old comments. If local storage is unavailable, the UI explains that identity
lasts only until the current page is refreshed or closed.

Comments are plain text. HTML in names or comments is displayed as text and is
never rendered as markup. Visitors may delete only comments associated with
their anonymous credential. Changing a nickname on a new submission updates the
name on that visitor's earlier comments.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Database connectivity check |
| GET | `/api/comments?post=/blog/my-story` | First 30 comments, total and current visitor |
| GET | `/api/comments?post=...&cursor=...` | Next page |
| POST | `/api/comments` | Publish a comment or safely retry the same request ID |
| DELETE | `/api/comments/:id` | Delete the current visitor's own comment |

Authenticated requests use `Authorization: Bearer <browser-credential>`. Keep
credentials out of URLs, HTML, logs and source control. Write requests also
require a permitted `Origin`. Production does not allow localhost origins.
Responses containing visitor information are not cached.

POST JSON contains `id` (a UUID v4 idempotency key), `postPath`, `name`, `content`
and an empty `website` honeypot field. Nicknames are limited to 40 UTF-16 code
units, comment text to 3000 and request bodies to 16 KiB. Article paths are
restricted to `/blog/`, `/life/` and `/novel/` namespaces.

Rate limits are enforced in D1 with atomic counters: one new comment per visitor
per 20 seconds, 10 attempts per visitor per hour, 50 per IP per hour and 1000 per
UTC day for the service. Delete operations have a separate limit. The database
stores a salted daily hash for IP rate limiting, not the original IP address.
Expired rate counters are cleaned after successful submissions. The
`RATE_LIMIT_SALT` secret is already configured in Cloudflare and is not committed.

## Local development and tests

Use the same Node.js and pnpm versions as the blog. Wrangler is pinned in the
commands below so it does not need to be a dependency of the static website.

Create an ignored `workers/comments/.dev.vars` file containing a local-only
`RATE_LIMIT_SALT`, then initialize the local database:

```sh
npx wrangler@4.157.0 d1 migrations apply nash-web-comments --local --config workers/comments/wrangler.jsonc
npx wrangler@4.157.0 dev --local --ip 127.0.0.1 --port 8787 --var ENVIRONMENT:development --config workers/comments/wrangler.jsonc
```

In another terminal, run the integration suite against that local API or start
the frontend:

```sh
pnpm test:comments
NUXT_PUBLIC_COMMENTS_API_URL=http://127.0.0.1:8787 pnpm dev
```

The integration suite checks actual D1 persistence, isolation, authorization,
input validation, idempotency, concurrent rate limiting and pagination. It uses
only the local database and removes its test comments and visitors afterward.

## Deploying and maintaining

The GitHub Actions workflow deploys the static frontend. Deploy backend changes
separately with the authenticated Cloudflare CLI:

```sh
npx wrangler@4.157.0 d1 migrations apply nash-web-comments --remote --config workers/comments/wrangler.jsonc
npx wrangler@4.157.0 deploy --config workers/comments/wrangler.jsonc
```

For a new account or Worker, update `wrangler.jsonc`, create the database, set
`RATE_LIMIT_SALT` with `wrangler secret put`, and update the public API URL in
`nuxt.config.ts`. Do not enable development origins in production.

The blog owner can inspect, export or remove comments through Cloudflare's D1
dashboard using their own Cloudflare login. The `comments` table contains the
article path, comment ID, content and author reference; the `guests` table
contains the public ID, nickname and hashed credential. Do not expose database
credentials or a moderation token in the public frontend.
