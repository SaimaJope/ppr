# Scrolling performance — 6 October 2026

## Current changes

The follow-up removes section entrance animations with the site owner's
approval. Content now appears in its final position immediately. The layout,
text, typography, colours, photographs, header blur, image treatments and
manual controls are unchanged.

- Remove ScrollReveal and its initialization script from all 13 templates.
  There are no reveal scroll callbacks, hidden waiting sections or offscreen
  reveal transforms. Remove the associated backface-hiding style.
- Retain a small, harmless `scroll-reveal.js` compatibility file for previously
  cached HTML. New pages do not request it or the external animation library.
- Replace the slideshow's one-second repair timers and 30-second startup scan
  with DOM observers. Only changed/new content requires repair. Detached
  slideshows release timers and observers; reinserted nodes reuse their state
  and controls without duplicate event handlers.
- Pause automatic slide changes during scrolling. One passive shared scroll
  listener pauses the timers, then returns immediately on subsequent events.
  Native `scrollend` resumes a full slide interval. Older browsers use a
  trailing 150 ms timer. An existing crossfade can finish; manual navigation
  remains available throughout.
- Keep offscreen/hidden-tab pausing, reduced-motion handling, the photo dialog,
  swipe controls, loading curtain and billing-anchor behavior.
- Version `loader.js` as `20261006-smooth-scroll` in every template.

The loading curtain covers startup, not ongoing scrolling. The first pass
(commit `6d8d72a`) already made DOM writes conditional, scoped active-navigation
observation, removed permanent reveal `will-change` hints and prepared rendered
content before lifting the curtain. Those changes are retained.

## Measurements and limits

The reported laptop frame-rate problem was not reproduced on the available
desktop. CPU throttling and software rendering are useful comparisons, but do
not recreate that laptop's GPU, drivers or browser configuration. No guaranteed
frame rate or hardware GPU-memory saving is claimed.

The follow-up compares frozen `6d8d72a` with the candidate in Chrome 154,
1366×768, device scale 2, 4× CPU throttling and software graphics. The same
continuous wheel sequence reverses at page bounds. Motion is enabled in both
runs, and the baseline animation library was confirmed active. SVG assets use
the correct MIME type. Raw traces and reports are retained outside the site.

| Local observation | Before | After |
| --- | --- | --- |
| Hidden targets with reveal transforms just after load, home | 13 | 0 |
| Hidden targets with reveal transforms just after load, services | 12 | 0 |
| Display drawing time during first home scroll sequence | 848 ms | 719 ms |
| Display drawing time during first services scroll sequence | 864 ms | 683 ms |
| Script time during first home scroll sequence | 60 ms | 51 ms |
| Script time during first services scroll sequence | 73 ms | 68 ms |

These are single local workload samples, not FPS improvements. Subsequent
scroll timings were mixed: display drawing fell slightly on both pages while
overall main-thread time rose slightly. No scroll long tasks over 50 ms were
observed in either version. Animation-frame callbacks are not measurements of
presented GPU frames. CDP layer-tree data was unavailable.

The earlier first-pass comparison reduced idle services-page mutation records
from 228 to 0 over three seconds. This follow-up removes the remaining recurring
slideshow polling itself, as well as the entrance animations.

## Verification

- All 13 repository tests pass, covering routing, locale/default language,
  metadata, admin preview configuration and assets at both `/` and `/ppr/`.
  Both mounts serve all 61 distinct tested page/resource URLs successfully.
- Six browser visual fixtures pass at desktop, tablet and narrow mobile widths,
  including `/ppr/`. Page dimensions, zoom, heading geometry, hero crop/filter
  and header blur match the baseline. Screenshots were visually reviewed;
  small text-edge rasterization differences remain after removing transforms.
  Rendered images load without failures.
- All 50 focused browser regression cases pass: all five pages and three
  languages at both mounts, mobile pages/menu/swipe, photo controls, billing
  anchors, autoplay visibility/scroll pausing and resumption, delayed slideshow
  insertion, detach/reinsert, idle observer stability, reduced motion and
  delayed/failed loading. The older-browser scrollend fallback also passes
  with real scrolling and mobile touch swipe. There are no unexpected errors.
  Existing raw-template image placeholders are recorded separately from
  rendered images.

## Files in this follow-up

| File | Change |
| --- | --- |
| `loader.js` | Event-driven slideshow setup/repair, lifecycle cleanup, scrolling pause/resume. |
| `scroll-reveal.js` | Small compatibility entry point; entrance animations removed. |
| `index.html` | Remove reveal scripts/backface hiding; version the loader. |
| `Etusivu.dc.html` | Same shared changes in the legacy home template. |
| `Palvelut.dc.html` | Same shared changes in the services template. |
| `Referenssit.dc.html` | Same shared changes in the references template. |
| `Yhteystiedot.dc.html` | Same shared changes in the contact template. |
| `Yritys.dc.html` | Same shared changes in the company template. |
| `palvelut/index.html` | Synchronized clean services route. |
| `referenssit/index.html` | Synchronized clean references route. |
| `yhteystiedot/index.html` | Synchronized clean contact route. |
| `yritys/index.html` | Synchronized clean company route. |
| `index.php/index.html` | Synchronized old home alias. |
| `palvelut.php/index.html` | Synchronized old services alias. |
| `yhteys.php/index.html` | Synchronized old contact alias. |
| `PERFORMANCE.md` | Current changes, measurements, limitations and file inventory. |
