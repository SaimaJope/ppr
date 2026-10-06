# ppr.fi deployment and clean URLs

The domain cutover completed on 6 October 2026. GitHub Pages now serves the site
at `https://ppr.fi/`; `https://www.ppr.fi/` redirects to that address. The repository
already has `CNAME` containing `ppr.fi`, and **Enforce HTTPS** is enabled in Pages
settings. Keep the existing domain setting and CNAME when publishing this release.

The current release branch is `codex/ppr-clean-urls`. It combines the original
domain preparation with the live repository's CNAME commit and adds the clean
page addresses below. Publish the static site from the repository root.

## Public addresses

| Page | Finnish URL | Existing file alias |
| --- | --- | --- |
| Etusivu | `https://ppr.fi/` | `index.html`, `Etusivu.dc.html` |
| Palvelut | `https://ppr.fi/palvelut/` | `Palvelut.dc.html` |
| Yritys | `https://ppr.fi/yritys/` | `Yritys.dc.html` |
| Referenssit | `https://ppr.fi/referenssit/` | `Referenssit.dc.html` |
| Yhteystiedot | `https://ppr.fi/yhteystiedot/` | `Yhteystiedot.dc.html` |

URLs without a language parameter always use Finnish. English and Swedish append
`?lang=en` and `?lang=sv` to the same addresses. Finnish links omit `?lang=fi`;
visiting an explicit Finnish URL normalizes to the address without that parameter.
Navigation, language switches and content links use the clean addresses.

The legacy HTML files retain their complete templates. In a normal browser,
`language.js` uses `location.replace` to move file aliases to the clean address,
retaining other query parameters and the fragment. This is a JavaScript redirect:
GitHub Pages still returns the alias file with HTTP 200, rather than a server-side
301. Full templates also let the existing Worker continue fetching them for
admin previews; preview flags suppress the browser redirect.

Each new directory has an `index.html` and a relative `<base href="../">` pointing
to the site root. Shared scripts, images, JSON content and navigation therefore
resolve correctly both at the custom-domain root and under `/ppr/`. Keep the
legacy and directory templates in sync when changing layouts; admin content
edits continue to use the shared JSON files.

## Admin panel

The admin remains at its existing `workers.dev` address. It is a separate
Cloudflare Worker, and this release does not deploy it or change its domain,
routes, credentials or DNS. Its previews continue to fetch the legacy templates.

Login uses `ADMIN_PASSWORD` and a signed session cookie. GitHub writes use the
server-side `GITHUB_TOKEN` personal access token. There is no OAuth application,
callback URL, cross-origin admin API call, CORS allowlist or old-site origin check
to change. Keep `ADMIN_PASSWORD`, `SESSION_SECRET`, `GITHUB_TOKEN`, `GITHUB_OWNER`,
`GITHUB_REPO`, `GITHUB_BRANCH`, `CONTENT_PATH` and `ASSETS_DIR` as configured.

The original preparation includes configurable Worker URLs in source, but those
changes take effect only after a separate Worker deployment. If deploying that
prepared Worker later, set `SITE_URL` to `https://ppr.fi/` in both the deployment
configuration and `worker/wrangler.toml` so admin assets, open-site links and
previews use the public domain. That changes the target public site, not the
admin's `workers.dev` address. The current source value still names the old
GitHub Pages project URL; a future CLI deployment would otherwise reapply it.

## Search metadata

Canonical URLs, `og:url`, language alternates and `sitemap.xml` target the clean
addresses on `https://ppr.fi`. Finnish URLs omit the query; English and Swedish
retain their language query. Legacy aliases declare the corresponding clean
canonical. The sitemap contains all 15 page/language combinations with reciprocal
alternates; `robots.txt` allows crawling and references that sitemap.

HTML metadata provides a Finnish fallback. The existing site renders translated
content in JavaScript, which also updates the selected language's title,
description, canonical and Open Graph URL. Crawlers without JavaScript see the
Finnish fallback. Submit `https://ppr.fi/sitemap.xml` in Search Console if this
has not already been done.

## Local verification

Run from the repository root with Node.js:

```powershell
node --test tests/*.test.mjs
```

The migration tests serve the real repository at both `/` and `/ppr/` and check
pages, referenced local resources, language routing and metadata. Clean-route
checks cover the directory pages, file aliases, query/hash preservation and
navigation. Admin tests use mocked upstream responses and do not modify GitHub
or require production secrets. The release validation records the final result;
this guide does not treat an unfinished test run as a pass.

Browser verification should visit all five clean pages and all six file aliases
in Finnish, English and Swedish at both mount points, click navigation and
language switches, inspect rendered images, and exercise a legacy alias and its
anchor. Also verify that admin previews remain on the Worker preview URL.
Existing literal `{{...}}` image placeholders can make transient requests before
rendering; final rendered images must use real files. The favicon declaration is
in the actual HTML head.

## Changed files

The preparation column describes commit `f48cbc6` relative to the earlier site.
These changes are included in this release and were not in remote `main` at
`9ccb3cb`, the live CNAME-only commit. The clean-URL column describes the subsequent
work on `codex/ppr-clean-urls`. CNAME is already live and unchanged by this release.

| File | Original domain preparation | Clean-URL release |
| --- | --- | --- |
| `index.html` | Full existing front-page template, relative home links, Finnish fallback and production metadata. | Home route data, shared clean navigation and updated script versions. |
| `Etusivu.dc.html` | Keep the old front-page template, relative home links and production metadata. | Keep the complete alias for previews; normal visits redirect to `/`. |
| `Palvelut.dc.html` | Relative home links, Finnish fallback and production metadata. | Shared clean navigation, `/palvelut/` canonical and normal-browser alias redirect. |
| `Yritys.dc.html` | Relative home links, Finnish fallback and production metadata. | Shared clean navigation, `/yritys/` canonical and normal-browser alias redirect. |
| `Referenssit.dc.html` | Relative home links, Finnish fallback and production metadata. | Shared clean navigation, `/referenssit/` canonical and normal-browser alias redirect. |
| `Yhteystiedot.dc.html` | Relative home links, Finnish fallback and production metadata. | Shared clean navigation, `/yhteystiedot/` canonical and normal-browser alias redirect. |
| `palvelut/index.html` | — | New full services template with relative root base and clean metadata. |
| `yritys/index.html` | — | New full company template with relative root base and clean metadata. |
| `referenssit/index.html` | — | New full references template with relative root base and clean metadata. |
| `yhteystiedot/index.html` | — | New full contact template with relative root base and clean metadata. |
| `language.js` | Finnish default, relative content/language links and locale-aware metadata. | Shared clean route map, navigation links, alias normalization, query/hash preservation and preview exception. |
| `active-nav.js` | Recognize index and directory root as the home page. | Recognize clean directory routes, aliases and preview page selection. |
| `loader.js` | — | Expose shared `pageLinks` for template navigation. |
| `worker/src/index.js` | Render configured admin URLs; normalize and escape preview base URLs. | No additional Worker code change or deployment. |
| `worker/src/ui.js` | Replace fixed public-site URLs with `SITE_URL`; relative admin API/form URLs. | No additional Worker code change or deployment. |
| `worker/wrangler.toml` | Document the public-site `SITE_URL` setting. | No additional configuration change; review the value before a future Worker deployment. |
| `sitemap.xml` | Add production URLs and language alternates. | Replace file URLs with the five clean routes in all three languages. |
| `robots.txt` | Allow crawling; point to the production sitemap. | Unchanged. |
| `.nojekyll` | Make the existing marker empty to bypass Jekyll. | Unchanged. |
| `tests/languages.test.mjs` | Update Finnish-default, locale routing and root-page checks. | Update clean navigation, language-switch, fragment and preview expectations. |
| `tests/domain-migration.test.mjs` | Test HTTP mount points, resources, language routes and metadata. | Check clean directory pages, aliases, query/hash preservation and production metadata. |
| `tests/admin-domain.test.mjs` | Test configured assets, links and previews for project, apex and www URLs. | Add preview routing compatibility assertions. |
| `DEPLOY.md` | Explain Finnish defaults and link the migration guide. | Record the live domain, clean addresses and unchanged Worker hosting. |
| `DOMAIN-MIGRATION.md` | Explain cutover, configuration and the original change list. | Replace pending-cutover instructions with completed cutover and this release guide. |
| `CNAME` | Originally prepared as a separate domain-day commit. | Already present in remote `main`; keep exactly `ppr.fi`. |

Content JSON, photos, styles and the visible page design remain unchanged.

## Cutover history and current DNS

The original branches were `codex/ppr-domain-prep` and `codex/ppr-domain-cname`.
The latter kept CNAME in a separate commit/patch so it could be applied on DNS
day. GitHub subsequently added the live CNAME in commit `9ccb3cb` (**Create
CNAME**). That historical local CNAME commit/patch is no longer an action to
apply, and should not be cherry-picked again into this release.

The active DNS configuration uses four apex A records and the www CNAME:

| Host | Type | Value |
| --- | --- | --- |
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |
| `@` | A | `185.199.110.153` |
| `@` | A | `185.199.111.153` |
| `www` | CNAME | `saimajope.github.io` |

No DNS changes are needed for clean page paths. Preserve mail and TXT records.
If domain ownership verification is configured, retain GitHub's TXT record at
`_github-pages-challenge-SaimaJope.ppr.fi`. If CAA records are used, allow
`letsencrypt.org`. Branch publishing uses the root CNAME; a future custom Actions
publishing workflow would instead use the custom domain in Pages settings.

## Sources

- [GitHub Pages custom domain and DNS configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Verify a GitHub Pages domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Cloudflare Worker variables](https://developers.cloudflare.com/workers/wrangler/configuration/#environment-variables)
- [Google canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google language alternates](https://developers.google.com/search/docs/specialty/international/localized-versions)
