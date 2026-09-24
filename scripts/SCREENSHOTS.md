# Product screenshots

## Reusing app QA images

The export guides use detail crops from the app's isolated visual QA runner.
These lossless 2× PNGs come from `WKWebView.takeSnapshot`; reusing them requires
no display changes, app interaction, or new capture run. Use the `-2x.png`
masters, not the smaller JPEG review previews. Check the run report and inspect
each image before selecting it: validation scenarios may deliberately show
errors that would misrepresent a normal workflow.

All nine come from one run on the Press-reskinned app,
`../kindling/qa/visual/results/2026-09-24T14-45-53-926Z-socket/`, app revision
`f5a0d28` (`fix/v1.3-rc-qa`), capture profile `wkwebview-snapshot-2x-png-v1`,
produced with:

```bash
npm run tauri:qa                                             # in ../kindling
npm run qa:visual -- --only 19,22,23 --variants light,narrow # in ../kindling
```

Crop coordinates are source pixels, measured from the top left. The `narrow`
sources are 2200×1336 pixels:

| Output in `public/docs/` | Source PNG | Left, top, width, height |
| --- | --- | --- |
| `export-profile.png` | `22-01-export-epub-narrow-2x.png` | 30, 164, 904, 178 |
| `export-ebook-details.png` | `22-01-export-epub-narrow-2x.png` | 494, 526, 876, 636 |
| `export-project-options.png` | `22-02-export-project-narrow-2x.png` | 494, 506, 876, 624 |
| `export-treatment-options.png` | `22-03-export-treatment-narrow-2x.png` | 494, 504, 876, 676 |

The `light` sources are 3200×1936 pixels:

| Output in `public/docs/` | Source PNG | Left, top, width, height |
| --- | --- | --- |
| `export-simple-formats.png` | `23-01-custom-profile-default-light-2x.png` | 1025, 374, 1150, 550 |
| `export-manuscript-preview.png` | `19-01-export-overview-light-2x.png` | 1860, 360, 1340, 1420 |
| `export-typography.png` | `19-02-export-typography-light-2x.png` | 616, 630, 1184, 656 |
| `export-html-options.png` | `19-03-export-html-light-2x.png` | 616, 958, 1184, 552 |
| `export-filename.png` | `19-03-export-html-light-2x.png` | 616, 618, 1184, 328 |

The simple-format image is the Format section of the export dialog: both groups,
all seven formats. The manuscript preview illustrates layout, not a completed
book. Typography values are examples, not submission requirements. The source
checkpoints were visually inspected for documentation use, not approved as a
regression baseline. The run cleaned up its fixtures.

Crop with ImageMagick `-crop WxH+X+Y +repage` without resizing, then
`oxipng -o 2 --strip safe`. These nine crops are separate from the 28 targets
in the foreground capture script below. The Markdown and text scenarios from
this run intentionally show incomplete-setting errors and are not used.

## Display size in the docs and blog

A 2× capture referenced as Markdown `![alt](/docs/x.png)` renders at its full
pixel width, so the interface appears at double size. Every `/docs/*.png`
reference is instead an `<img>` whose `width` and `height` are half the PNG's
pixel dimensions. After any recapture or new crop, run:

```bash
node scripts/size-docs-images.mjs          # rewrite references from the files
node scripts/size-docs-images.mjs --check  # fail if any reference is stale
```

## Foreground capture

Run from the website repository, with the Kindling demo app open on the main
display. See `../CLAUDE.md` for fixture setup and capture targets.

```bash
npm run shots -- --dry-run                 # inspect display modes; change nothing
npm run shots                             # capture and install all 28 images
node scripts/size-docs-images.mjs          # refresh docs display sizes
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
