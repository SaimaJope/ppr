# Move the site to ppr.fi

The preparation branch is `codex/ppr-domain-prep`. The domain-day branch is
`codex/ppr-domain-cname`; its extra commit adds only `CNAME`, containing exactly
`ppr.fi`. Publish the preparation branch first. Keep the domain-day branch local
until cutover. A normal push of a branch containing both commits sends both.

## Before cutover

1. Review and merge the preparation changes into the current Pages publishing
   branch. Keep publishing from the repository root. The existing `.nojekyll`
   marker is now empty, so this plain static site bypasses Jekyll.
2. Deploy the updated admin Worker with its current `SITE_URL` value
   (`https://saimajope.github.io/ppr/`). This configuration now controls all admin
   logos, favicon, image thumbnails, open-site links and preview requests.
3. Optionally verify `ppr.fi` in **SaimaJope account Settings → Pages**. GitHub
   supplies the TXT value for `_github-pages-challenge-SaimaJope.ppr.fi`.
   Retain that TXT record after verification.
4. Keep the repository's **Settings → Pages → Custom domain** unchanged until
   cutover. Saving it early can add a remote `CNAME` commit and switch routing.

## On DNS cutover day

1. On the up-to-date publishing branch, cherry-pick the CNAME-only commit from
   `codex/ppr-domain-cname`, then push that publishing branch. Identify the commit
   with `git log -1 --oneline codex/ppr-domain-cname`. Example, after merging the
   preparation changes into `main`:

   ```powershell
   git switch main
   git pull --ff-only
   git cherry-pick codex/ppr-domain-cname
   git push origin main
   ```

   If GitHub's custom-domain setting has already created an identical `CNAME`,
   that cherry-pick is unnecessary. Keep `CNAME` at the publishing root.
2. Set **SaimaJope/ppr → Settings → Pages → Custom domain** to `ppr.fi` before
   changing DNS. For branch publishing, GitHub uses the CNAME file; if publishing
   ever changes to a custom Actions workflow, set the domain in Pages settings
   because Actions ignores CNAME.
3. Set the following DNS records. Remove conflicting existing website A/AAAA
   records; preserve unrelated mail/TXT records.

   | Host | Type | Value |
   | --- | --- | --- |
   | `@` | A | `185.199.108.153` |
   | `@` | A | `185.199.109.153` |
   | `@` | A | `185.199.110.153` |
   | `@` | A | `185.199.111.153` |
   | `www` | CNAME | `saimajope.github.io` |

   Optional IPv6: add apex AAAA records `2606:50c0:8000::153`,
   `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
   The `www` CNAME has no scheme or `/ppr/` path. With these records and `ppr.fi`
   as the Pages custom domain, GitHub redirects `www.ppr.fi` to `ppr.fi`.
4. Once the certificate is available, enable **Enforce HTTPS** in Pages settings.
   If your DNS has CAA records, allow `letsencrypt.org` for certificate issuance.
5. Once `https://ppr.fi/` serves the new site, change the admin Worker's **Variables
   and Secrets → SITE_URL** to `https://ppr.fi/` and deploy the change. Also update
   `SITE_URL` in `worker/wrangler.toml` to the same value so later CLI deployments
   retain it. Alternatively edit that variable in the file and run your usual
   Wrangler deployment from `worker/`.
6. Verify `https://ppr.fi/`, `https://www.ppr.fi/`, all five pages, all three
   languages, admin image thumbnails, **Avaa sivusto** and all page previews.
   Submit `https://ppr.fi/sitemap.xml` in Search Console for the new domain property.

## Admin settings that stay the same

The admin is a separate Cloudflare Worker; it does not run on GitHub Pages.
Keep opening the current Worker address. Login uses `ADMIN_PASSWORD` and a signed
session cookie. GitHub writes use the server-side `GITHUB_TOKEN` personal access
token. There is no OAuth application, callback URL, cross-origin API call, CORS
allowlist or old-site origin check to change. Keep `ADMIN_PASSWORD`,
`SESSION_SECRET`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`,
`CONTENT_PATH` and `ASSETS_DIR` as currently configured.

## Routing and metadata

- `index.html` directly renders the existing front page. `Etusivu.dc.html` remains
  a working alias with the same template. Future layout edits to the front page
  should update both HTML files; admin content edits still update the shared JSON.
- Without `?lang=`, the site uses Finnish even if another language was previously
  stored. Explicit `?lang=fi`, `?lang=en`, `?lang=sv`, cross-page navigation and
  language switches retain the selected language. Navigation and assets are
  relative, supporting both the domain root and `/ppr/`.
- Canonical, Open Graph URL and language alternates target `https://ppr.fi`.
  The home aliases canonicalize to `/`; other pages retain their filenames.
  Finnish canonical URLs omit the query; English/Swedish use `?lang=en`/`?lang=sv`.
  The sitemap includes all 15 page/language combinations and reciprocal alternates.
- HTML metadata has a Finnish fallback. As in the existing site, translations
  render in JavaScript; the selected language also updates canonical, Open Graph,
  title and description in the browser. Crawlers that do not run JavaScript see
  the Finnish fallback metadata.
- Preparation metadata already names the future domain. Publish preparation near
  cutover if you want to minimize the period when canonicals target the new host
  before it is live.

## Local verification

Run from the repository root with Node.js:

```powershell
node --test tests/*.test.mjs
```

The migration suite starts local HTTP servers serving the real repository both
at `/` and `/ppr/`, requests pages and referenced local resources, and exercises
language routing and SEO. The existing content/language tests and admin domain
tests also run. Admin network tests use mocked upstream responses; they do not
modify GitHub or require production secrets.

Chromium checks compare rendered text, typography and colors with the original
repository for all page/language combinations at both mount points, check final
images and local links, and click each language switch from the directory root.
The existing favicon declaration is now in the real HTML head, preventing an
initial automatic `/favicon.ico` request. The existing client-rendered templates
still trigger transient requests for literal `{{...}}` image placeholders before
rendering; the original repository does this too. These are recorded separately
from real asset or navigation failures. Final rendered images use the real files.

## Changed files

| File | Change |
| --- | --- |
| `index.html` | Full existing front-page template instead of a redirect, relative home links, Finnish fallback and production metadata. |
| `Etusivu.dc.html` | Keep old front-page URL working; relative home links to index, Finnish fallback and production metadata. |
| `Palvelut.dc.html` | Relative home links, Finnish fallback and production metadata. |
| `Yritys.dc.html` | Relative home links, Finnish fallback and production metadata. |
| `Referenssit.dc.html` | Relative home links, Finnish fallback and production metadata. |
| `Yhteystiedot.dc.html` | Relative home links, Finnish fallback and production metadata. |
| `language.js` | Finnish default without query, relative language/content links, root/index routing and locale-aware metadata. |
| `active-nav.js` | Recognize index and directory URLs as home and keep home highlighting. |
| `worker/src/index.js` | Render configured admin URLs and normalize/escape preview base URLs. |
| `worker/src/ui.js` | Replace fixed GitHub Pages URLs with SITE_URL; relative admin API/form URLs. |
| `worker/wrangler.toml` | Explain SITE_URL cutover; keep the current URL until DNS day. |
| `sitemap.xml` | Add ppr.fi URLs for all pages/languages with language alternates. |
| `robots.txt` | Allow crawling and point to the ppr.fi sitemap. |
| `.nojekyll` | Make the existing marker zero bytes. |
| `tests/languages.test.mjs` | Update routing and root-page checks for the new behavior. |
| `tests/domain-migration.test.mjs` | Test both HTTP mount points, resources, language routes and metadata. |
| `tests/admin-domain.test.mjs` | Test configured admin assets/links and previews on project, apex and www URLs. |
| `DEPLOY.md` | Update Finnish-default explanation and link this cutover guide. |
| `DOMAIN-MIGRATION.md` | Cutover instructions, configuration details and complete change list. |
| `CNAME` | Domain-day commit only; exactly `ppr.fi`. |

All existing content JSON, photos, styles and other public scripts remain unchanged.

## Sources

- [GitHub Pages custom domain and DNS configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Verify a GitHub Pages domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Cloudflare Worker variables](https://developers.cloudflare.com/workers/wrangler/configuration/#environment-variables)
- [Google canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google language alternates](https://developers.google.com/search/docs/specialty/international/localized-versions)
