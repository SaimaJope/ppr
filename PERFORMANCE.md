# Scrolling performance - 6 October 2026

## Latest change

Scrolling moves content under a stationary pointer. Gallery controls and home
service links were therefore repeatedly starting hover transitions, even when
visitors did not move the mouse. Removing those transitions avoids continuous
style updates and repainting between scroll updates.

- Gallery arrows and photo-opening controls now respond immediately to hover,
  focus and presses. Their colours, opacity endpoints, positions, glass effect
  and keyboard focus indicators are unchanged.
- Home service links still turn blue and move their arrow 4px on hover/focus;
  the change is immediate instead of animated over 200ms.
- The sticky header keeps its original blur, transparency, colours and shadows
  at all times. Layout, text, photographs, fonts and image treatments are
  unchanged. No header rendering fallback was introduced.
- Version `loader.js` as `20261006-hover-perf` in every template.

Previously published improvements remain: section entrance animations are
removed, slideshow setup/repair uses observers instead of recurring polling,
active navigation observes a small DOM scope, and automatic slides pause while
scrolling, offscreen or in hidden tabs. Manual controls and the loading curtain
remain available.

## Measurements

Comparison: frozen commit `c19e126` versus the actual candidate, Chrome 154,
1366x768 viewport, device scale 2, 4x CPU throttling and software graphics.
The pointer remains over the content while identical wheel sequences reverse
at page bounds. First scrolling and subsequent scrolling are recorded
separately. The original header blur is active in both versions.

| Subsequent-scroll workload | Before | After |
| --- | --- | --- |
| Home style recalculations | 169 | 26 |
| Services style recalculations | 288 | 42 |
| Home main-thread task time | 678 ms | 352 ms |
| Services main-thread task time | 730 ms | 391 ms |
| Home display drawing time | 753 ms | 526 ms |
| Services display drawing time | 705 ms | 368 ms |

First-scroll samples also improved: home task time 684 to 331ms and services
745 to 460ms. An independent diagnostic override produced the same direction
of improvement before the source edit. These are local workload measurements,
not measured frame rates on the reported laptop. They show about 85% fewer
style updates and roughly half the subsequent-scroll main-thread work in these
samples. No scroll long tasks over 50ms appeared in either version. Frame
callback timing is not presented GPU FPS; actual compositor layer data was
unavailable. Raw traces and reports are retained outside the published site.

Extra header layer promotion did not show a clear benefit. Removing header
blur reduced drawing cost but changed its appearance, so neither experiment
was shipped. The hover transition fix preserves the original header.

## Verification

All 13 repository tests pass, including language/default routing, metadata,
admin preview configuration and 61 distinct public page/resource URLs at each
of the `/` and `/ppr/` mounts.

All 14 focused browser checks pass: desktop/mobile pages, English/Swedish
subpath navigation, menu rerender and touch swipe, billing links, gallery
controls and photo dialogs, plus mouse and keyboard hover/focus behavior.
The original header blur/background and service-link colour/4px arrow endpoint
are verified. Six visual fixtures also pass across desktop, tablet and narrow
mobile layouts with both URL mounts. There are no unexpected runtime errors
or broken rendered images; inherited raw-template image placeholders are
recorded separately.

## Files in this update

| File | Change |
| --- | --- |
| `loader.js` | Remove gallery-control hover transitions; retain their complete visual states and actions. |
| `index.html` | Remove service-row transition; version the loader. |
| `Etusivu.dc.html` | Same home-template changes. |
| `index.php/index.html` | Same changes in the old home alias. |
| `Palvelut.dc.html` | Update loader version. |
| `Referenssit.dc.html` | Update loader version. |
| `Yhteystiedot.dc.html` | Update loader version. |
| `Yritys.dc.html` | Update loader version. |
| `palvelut/index.html` | Update loader version in the clean services route. |
| `referenssit/index.html` | Update loader version in the clean references route. |
| `yhteystiedot/index.html` | Update loader version in the clean contact route. |
| `yritys/index.html` | Update loader version in the clean company route. |
| `palvelut.php/index.html` | Update loader version in the old services alias. |
| `yhteys.php/index.html` | Update loader version in the old contact alias. |
| `PERFORMANCE.md` | Current changes, measurements, limits and file inventory. |
