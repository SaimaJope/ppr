# Chrome scrolling adjustments — 6 October 2026

The reported laptop stutter was not reproduced on the available desktop's
RTX 3070 Ti, including Chrome with 4× CPU throttling. CPU throttling does not
simulate a laptop GPU. These changes remove verified unnecessary rendering
work without changing the page content, photos, typography or header blur.

## Changes

- Remove permanent `will-change: transform, opacity` from reveal classes.
  ScrollReveal still performs the same one-time animations and cleans up its
  inline styles. The browser can release resources after each animation.
- Update slideshow styles, attributes and captions only when their values
  change. Keep the repair check needed after React menu rerenders.
- Pause autoplay outside the viewport and in hidden tabs; resume with a full
  slide interval. Manual arrows, swipes and the photo dialog remain available.
  Clean up timers and observers when a slideshow is removed.
- Limit navigation observation to the rendered navigation and its ancestor
  replacements, and avoid rewriting unchanged active-link classes.
- Wait for the actual React content and first hero image before lifting the
  existing loading screen. Prepare slideshow controls and reveal styles while
  the screen is still opaque. Preserve the bounded loading fallback; if the
  reveal script arrives late, keep visible content visible.
- Version the three changed scripts in every template so browsers request
  the updated files.

A loading screen helps cover initial rendering; it cannot fix ongoing scroll
work. The persistent-work changes above are therefore separate from loading.
The sticky header's blur and service-photo backgrounds remain unchanged:
temporary blur-removal experiments did not reproduce or resolve scroll stalls
on this test machine. The existing dormant hero parallax was not activated.

## Verification

Chrome comparisons use a frozen copy of commit `bdb48ce`, a 1366×768 viewport,
4× CPU throttling, normal motion, and identical wheel sequences on the home
and services pages. Cold loading, first scrolling and subsequent scrolling
are captured separately. These are local comparisons, not field measurements
or a guarantee of a particular frame rate on other hardware.

| Local observation | Before | After |
| --- | --- | --- |
| DOM mutation records during 3 seconds on idle services page | 228 | 0 |
| Elements with an explicit `will-change` hint, home | 19 | 1 |
| Elements with an explicit `will-change` hint, services | 18 | 0 |
| New DOM nodes over the steady home scroll sequence | 6 | 0 |
| New DOM nodes over the steady services scroll sequence | 30 | 0 |

No scroll long tasks over 50 ms were observed before or after; the measured
95th-percentile animation-frame interval remained about 16.8 ms. Style work
fell in these samples, but overall CPU timings varied. No frame-rate speedup
or measured GPU-memory saving is claimed. CDP layer-tree data was unavailable;
element hint counts must not be interpreted as actual compositor layer counts.

The 13 existing automated tests pass, including both `/` and `/ppr/` mounts,
locale routing, assets and admin previews. The eight source/alias pairs remain
synchronized. All 24 focused browser regression cases pass: desktop/mobile
pages, English/Swedish and subpath navigation, mobile menu and touch swipe,
slideshow autoplay/pause/resume, photo dialog controls, billing anchors,
delayed content and hero-image loading, a blocked reveal CDN, reduced motion,
and the loading timeout. No unexpected runtime/network failures or broken
rendered images were found. Desktop/mobile screenshots were visually reviewed.
Two initial test cases tried to click intentionally hidden hero controls;
they were corrected to exercise touch swipe and visible service controls.
The original diagnostics and successful reruns are retained outside the
public site along with the performance traces.

## Files changed

| File | Change |
| --- | --- |
| `loader.js` | Idempotent slideshow updates, visibility-aware autoplay, cleanup, rendered-content loading gate and preparation event. |
| `scroll-reveal.js` | Initialize against rendered content behind the loader; keep content visible when scripts arrive late. |
| `active-nav.js` | Scope mutation observation and update only changed link state. |
| `index.html` | Remove permanent reveal promotion and update the three script versions. |
| `Etusivu.dc.html` | Same home-template CSS and script versions. |
| `Palvelut.dc.html` | Same shared CSS and script versions. |
| `Referenssit.dc.html` | Same shared CSS and script versions. |
| `Yhteystiedot.dc.html` | Same shared CSS and script versions. |
| `Yritys.dc.html` | Same shared CSS and script versions. |
| `palvelut/index.html` | Synchronized services template. |
| `referenssit/index.html` | Synchronized references template. |
| `yhteystiedot/index.html` | Synchronized contact template. |
| `yritys/index.html` | Synchronized company template. |
| `index.php/index.html` | Synchronized legacy home template. |
| `palvelut.php/index.html` | Synchronized legacy services template. |
| `yhteys.php/index.html` | Synchronized legacy contact template. |
| `PERFORMANCE.md` | Change summary, verification limits and file inventory. |

For the reasoning behind avoiding persistent layer hints, see
[MDN's will-change guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change).
