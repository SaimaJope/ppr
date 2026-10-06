# ppr.fi deployment and clean URLs

The domain cutover was configured on 6 October 2026. GitHub Pages serves the site
at `https://ppr.fi/`; `https://www.ppr.fi/` is configured to redirect there. The
historical cache incident and observed recovery are described below. The repository
already has `CNAME` containing `ppr.fi`, and **Enforce HTTPS** is enabled in Pages
settings. Keep the existing domain setting and CNAME when publishing this release.

The release branch is `codex/ppr-clean-urls`. Commit `55520e3` published the
original domain preparation and clean page addresses alongside the live CNAME.
The follow-ups add compatibility for old indexed PHP addresses, footer
navigation to billing details and Finnish mobile headline wrapping. Keep
publishing the static site from the repository root.

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

## Old indexed PHP addresses

The earlier website used `index.php`, `palvelut.php` and `yhteys.php`; existing
search results or bookmarks can still request those addresses. GitHub Pages does
not execute PHP. Each compatibility path is a directory containing a full static
HTML template, with the same relative root base and visible content as its
corresponding page:

| Old requested address | Static file | Clean destination |
| --- | --- | --- |
| `/index.php` | `index.php/index.html` | `/` |
| `/palvelut.php` | `palvelut.php/index.html` | `/palvelut/` |
| `/yhteys.php` | `yhteys.php/index.html` | `/yhteystiedot/` |

GitHub Pages first redirects a directory address without its trailing slash to
the slash form. The static template then uses the existing `language.js`
`location.replace` redirect to reach the clean destination, preserving the
selected language, other query parameters and the fragment. The alias templates
declare the clean canonical and Open Graph URL; the sitemap continues to list
only the clean addresses. Include these templates in future layout updates.

During the 6 October cutover, a separate compressed response for
`https://www.ppr.fi/` was observed returning a cached GitHub Pages missing-site
404 while the apex and other www paths worked. On the tested network, a fresh
gzip request at 07:02 UTC returned the correct 301 redirect with `Age: 0`.
At 07:03 UTC, fresh desktop Chrome and Pixel 7 emulation followed www to the
apex, returned HTTP 200 and loaded the rendered images; 16 protocol variations
also returned the expected responses. These are observations from the tested
network, not a guarantee that every network's cache had expired at the same time.
The PHP aliases provide old-path compatibility; they did not purge the CDN
response or change DNS/Pages settings.

## Billing details footer link

The existing billing link in every footer now targets the clean contact page's
`#laskutustiedot` anchor, retaining the selected language. For Finnish, the
destination is `yhteystiedot/#laskutustiedot`; English and Swedish include their
language query before the fragment. The label, content and visual design stay
the same.

The three contact templates render the billing section's actual DOM ID from
`billingAnchorId: 'laskutustiedot'`. Scrolling waits for the asynchronous content
to render, the fonts to finish loading and the next animation frame; it ignores
the hidden source template. Hash changes and the `ppr:loaded` event also trigger
the scroll, and the component removes those listeners when unmounted.
`scroll-margin-top:88px` keeps the section below the sticky header. These contact
changes are in `Yhteystiedot.dc.html`, `yhteystiedot/index.html` and
`yhteys.php/index.html`.

All 13 HTML templates have the updated footer link:

- Root templates: `index.html`, `Etusivu.dc.html`, `Palvelut.dc.html`,
  `Yritys.dc.html`, `Referenssit.dc.html`, `Yhteystiedot.dc.html`.
- Clean directory templates: `palvelut/index.html`, `yritys/index.html`,
  `referenssit/index.html`, `yhteystiedot/index.html`.
- Indexed PHP compatibility templates: `index.php/index.html`,
  `palvelut.php/index.html`, `yhteys.php/index.html`.

## Finnish mobile home headline

The Finnish home headline's display value now inserts discretionary soft hyphens
after `Rakennus` and `palve` within `Rakennuspalvelut`. Its `hyphens: manual`
setting lets the browser use those break points without adding a fixed line break.
English and Swedish keep their original title value and `hyphens: auto` behavior.
The stored content JSON is unchanged.

At viewport widths of **370px or less**, only the Finnish home heading uses
**36px** instead of the previous 38px mobile size. This narrow adjustment supports
keeping `lut teollisuudelle.` together; wider layouts and the English/Swedish
font sizes remain unchanged. The change is in exactly three home templates:
`index.html`, `Etusivu.dc.html` and `index.php/index.html`.

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

Browser verification should visit all five clean pages, all six HTML file aliases
and the three indexed PHP compatibility paths in Finnish, English and Swedish at
both mount points. Check the PHP paths with and without trailing slashes, and
their static `index.html` forms. Click navigation and
language switches, inspect rendered images, and exercise a legacy alias and its
anchor. Also verify that admin previews remain on the Worker preview URL.
Click the billing footer link from each page and open the contact anchor directly
with delayed content loading; check all three languages and the sticky-header
offset at both mount points.
Existing literal `{{...}}` image placeholders can make transient requests before
rendering; final rendered images must use real files. The favicon declaration is
in the actual HTML head.

## Changed files

The preparation column describes commit `f48cbc6` relative to the earlier site.
These changes are included in this release and were not in remote `main` at
`9ccb3cb`, the live CNAME-only commit. The clean-URL column describes the subsequent
work on `codex/ppr-clean-urls`, including indexed-PHP compatibility, billing
footer and Finnish mobile headline follow-ups. The billing section above lists
all 13 footer templates; the headline section identifies its three home templates.
CNAME is already live and unchanged by this release.

| File | Original domain preparation | Clean-URL release |
| --- | --- | --- |
| `index.html` | Full existing front-page template, relative home links, Finnish fallback and production metadata. | Clean home navigation; Finnish discretionary headline breaks and 36px heading at widths up to 370px. |
| `Etusivu.dc.html` | Keep the old front-page template, relative home links and production metadata. | Complete alias/preview template; clean redirect plus the same Finnish headline wrapping and narrow 36px setting. |
| `Palvelut.dc.html` | Relative home links, Finnish fallback and production metadata. | Shared clean navigation, `/palvelut/` canonical and normal-browser alias redirect. |
| `Yritys.dc.html` | Relative home links, Finnish fallback and production metadata. | Shared clean navigation, `/yritys/` canonical and normal-browser alias redirect. |
| `Referenssit.dc.html` | Relative home links, Finnish fallback and production metadata. | Shared clean navigation, `/referenssit/` canonical and normal-browser alias redirect. |
| `Yhteystiedot.dc.html` | Relative home links, Finnish fallback and production metadata. | Clean navigation/canonical and alias redirect; rendered billing anchor, asynchronous scroll and header offset. |
| `palvelut/index.html` | — | New full services template with relative root base and clean metadata. |
| `yritys/index.html` | — | New full company template with relative root base and clean metadata. |
| `referenssit/index.html` | — | New full references template with relative root base and clean metadata. |
| `yhteystiedot/index.html` | — | Full clean contact template; billing footer link, rendered anchor, asynchronous scroll and header offset. |
| `index.php/index.html` | — | Static old front-page alias; clean redirect/metadata plus the same Finnish headline wrapping and narrow 36px setting. |
| `palvelut.php/index.html` | — | Static compatibility template for the old indexed services address; redirect to `/palvelut/` with clean metadata. |
| `yhteys.php/index.html` | — | Static contact compatibility template; clean redirect/metadata, billing anchor, asynchronous scroll and header offset. |
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
| `tests/domain-migration.test.mjs` | Test HTTP mount points, resources, language routes and metadata. | Check clean pages, HTML and indexed PHP aliases, query/hash preservation and production metadata. |
| `tests/admin-domain.test.mjs` | Test configured assets, links and previews for project, apex and www URLs. | Add preview routing compatibility assertions. |
| `DEPLOY.md` | Explain Finnish defaults and link the migration guide. | Record the live domain, clean addresses, indexed PHP compatibility and unchanged Worker hosting. |
| `DOMAIN-MIGRATION.md` | Explain cutover, configuration and the original change list. | Record cutover, clean routes, PHP aliases, billing/footer and headline follow-ups, plus observed CDN cache recovery. |
| `CNAME` | Originally prepared as a separate domain-day commit. | Already present in remote `main`; keep exactly `ppr.fi`. |

The original domain and clean-URL migration preserved the visible content and
design. Later requested changes adjust billing-anchor navigation and the narrow
Finnish home headline's font size and wrapping as described above. Stored content
JSON and photos remain unchanged; the billing scroll margin affects only the
section's position after anchor navigation.

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
- [GitHub Pages static publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Cloudflare Worker variables](https://developers.cloudflare.com/workers/wrangler/configuration/#environment-variables)
- [Google canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google language alternates](https://developers.google.com/search/docs/specialty/international/localized-versions)
