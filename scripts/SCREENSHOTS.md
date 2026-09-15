# Product screenshots

## Reusing app QA images

The export guides use detail crops from the app's isolated visual QA runner.
These lossless 2× PNGs come from `WKWebView.takeSnapshot`; reusing them requires
no display changes, app interaction, or new capture run. Use the `-2x.png`
masters, not the smaller JPEG review previews. Check the run report and inspect
each image before selecting it: validation scenarios may deliberately show
errors that would misrepresent a normal workflow.

The four images below come from
`../kindling/qa/visual/results/2026-09-11T17-24-08-968Z-socket/`, app revision
`2be16a7ee246485f8e85220e7d72a679bae91558`, capture profile
`wkwebview-snapshot-2x-png-v1`. All sources are 2200×1336 pixels.
Crop coordinates are source pixels, measured from the top left.

| Output in `public/docs/` | Source PNG | Left, top, width, height |
| --- | --- | --- |
| `export-profile.png` | `22-01-export-epub-narrow-2x.png` | 88, 242, 646, 136 |
| `export-ebook-details.png` | `22-01-export-epub-narrow-2x.png` | 426, 546, 826, 528 |
| `export-project-options.png` | `22-02-export-project-narrow-2x.png` | 426, 424, 826, 668 |
| `export-treatment-options.png` | `22-03-export-treatment-narrow-2x.png` | 426, 416, 826, 548 |

Five further crops use the earlier run
`../kindling/qa/visual/results/2026-09-11T17-14-55-198Z-socket/` at the same app
revision and capture profile. These sources are 3200×1936 pixels.

| Output in `public/docs/` | Source PNG | Left, top, width, height |
| --- | --- | --- |
| `export-simple-formats.png` | `23-01-custom-profile-default-light-2x.png` | 1112, 394, 976, 602 |
| `export-manuscript-preview.png` | `19-01-export-overview-light-2x.png` | 1648, 416, 1450, 1080 |
| `export-typography.png` | `19-02-export-typography-light-2x.png` | 562, 674, 1044, 638 |
| `export-html-options.png` | `19-03-export-html-light-2x.png` | 562, 980, 1044, 478 |
| `export-filename.png` | `19-03-export-html-light-2x.png` | 562, 650, 1044, 302 |

The simple-format image shows the first two rows of the current format picker;
Scrivener and Custom are below the crop. It illustrates the direct export
choices without presenting an older dialog that predates the Custom tile.
The manuscript preview illustrates layout, not a completed book. Typography
values are examples, not submission requirements. The source checkpoints have
no accepted baselines; they were visually inspected for documentation use, not
approved as a regression baseline. Both source runs cleaned up their fixtures.

Crop with Sharp's `extract({ left, top, width, height }).png()` without resizing.
The docs render each crop at half its pixel dimensions, retaining native 2×
detail, and shrink it to fit on mobile. These nine crops are separate from the
28 targets in the legacy capture script below. The Markdown and text scenarios
from this run intentionally show incomplete-setting errors and are not used.

## Legacy foreground capture

Run from the website repository, with the Kindling demo app open on the main
display. See `../CLAUDE.md` for fixture setup and capture targets.

```bash
npm run shots -- --dry-run                 # inspect display modes; change nothing
npm run shots                             # capture and install all 28 images
npm run shots -- --only keyboard-shortcuts # capture one target
npm run shots -- --keep                    # capture without replacing site assets
npm run build                             # rebuild the site afterward
```

Requires macOS, Xcode Command Line Tools (`xcrun swiftc`), and `cliclick`,
ImageMagick, and `oxipng`. Kindling must run in dev mode with the demo fixtures
and its local MCP socket available. Keep the machine free for the capture pass:
it changes display scaling temporarily, moves the pointer, focuses the app, and
resizes its window. Do not run two capture passes at once.

## Why the September 10 screenshots are sharper

The LG Ultra HD display was running at **3840×2160 workspace points and physical
pixels**: a 1× desktop. We temporarily selected **1920×1080 workspace points
rendered into the same 3840×2160 physical pixels**: a 2× HiDPI desktop. The
physical resolution and refresh rate stayed the same; the interface became
larger and each point received two pixels in each direction.

For example, the start-screen crop measures 448×330 points:

| Capture mode | PNG size | Total pixels |
| --- | --- | --- |
| 1× | 448×330 | 147,840 |
| 2× HiDPI | 896×660 | 591,360 |

The app renders its text, icons, and controls at that density **before** the
picture is taken. Nothing is enlarged afterward. At the same website display
size, the image carries twice the resolution in each direction, which preserves
fine text and edges on Retina screens.

macOS `screencapture -R` captures a measured screen rectangle to lossless PNG.
`oxipng` reduces file size without reducing resolution or image quality. The
website then renders the image in its existing figure slot.

## Automatic mode selection and restoration

`npm run shots` runs `capture-hidpi.sh`, which compiles the small CoreGraphics
helper `capture-display.swift` into a temporary directory. The helper:

1. Reads the main display's current mode and available modes.
2. Keeps the current mode if it already renders at 2× with enough workspace.
   Otherwise selects a 2× mode with the same physical dimensions and refresh
   rate, and at least a 1200×1000 workspace for the app's capture windows.
3. Writes the original display ID and mode ID to a recovery file before making
   any change, then applies the capture mode for the session.
4. Runs `capture-screenshots.mjs` after a short display-settling pause.
5. Restores the exact original mode when capture completes, fails, or receives
   Ctrl+C, SIGTERM, or SIGHUP. Capture failures retain their nonzero exit status.

If a matching mode is unavailable, capture stops without substituting a lower
quality image. The capture script checks **every** PNG for at least two pixels
per captured point, plus the existing marketing minimum dimensions and aspect
ratios. Keep Kindling on the main display so it uses the selected density.

The mode switch does not change app content or website layout. The capture
script still navigates demo UI and leaves the Kindling window resized. `--keep`
prevents asset installation; it still changes display scaling during capture.

## Recovery after a force-quit

SIGKILL, a crash of the wrapper, or power loss cannot run shell cleanup. The
wrapper prints its recovery-file path before switching modes. If automatic
restoration fails, it preserves that file and prints the restore command:

```bash
npm run shots -- --restore /path/printed/by/the/script/display.json
```

Reconnect the original display first if necessary. You can also restore your
preferred scaling in macOS **System Settings → Displays**. Do not upscale a
small screenshot to bypass the capture checks.
