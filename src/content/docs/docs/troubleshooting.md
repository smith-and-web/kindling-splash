---
title: Troubleshooting
description: "Fixes for common kindling problems: installing on macOS, Windows and Linux, importing and syncing, shortcuts, exporting, and editorial review."
---

Can't find what's wrong? This page collects the most common issues across all areas of kindling. For more detail on any topic, follow the links to the relevant page.

---

## Installation

### macOS: App crashes immediately

Ensure you downloaded the correct version for your Mac. Check your chip: **Apple menu → About This Mac → Chip/Processor**. The universal `.dmg` works on both Apple Silicon and Intel.

### Windows: Installer fails silently

Try running the installer as Administrator:

1. Right-click the `.exe` file
2. Select **Run as administrator**

### Linux: AppImage won't start

Ensure FUSE is installed:

```bash
# Ubuntu/Debian
sudo apt install libfuse2

# Fedora
sudo dnf install fuse
```

### Linux: White window on startup

Version 1.3 includes an attempted workaround for a WebKitGTK rendering problem: it disables the DMA-BUF renderer on startup unless you have already set `WEBKIT_DISABLE_DMABUF_RENDERER` yourself. This has **not been confirmed to resolve the reported white-window issue**. If it persists, add your Linux distribution and launch details to [issue #252](https://github.com/smith-and-web/kindling/issues/252).

### Linux: No application icon

AppImages don't always integrate with desktop environments automatically. Use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) or create a `.desktop` file manually — see [Installation](/docs/installation/) for the full desktop entry snippet.

→ More install help: [Installation](/docs/installation/)

---

## Importing Projects

### "Could not read file"

Check that the file exists and you have read permissions.

### "Invalid file structure"

- **Plottr**: Ensure the file is valid JSON (not corrupted)
- **Scrivener**: Ensure you're selecting the `.scriv` bundle folder, not a file inside it
- **Markdown**: Check for encoding issues (file should be UTF-8)
- **Longform/Obsidian**: Ensure the index has `longform.format: scenes`
- **novelWriter**: Select the whole project folder containing `nwProject.nwx` and `content/`

### Missing content after import

- **No chapters**: Make sure your file has the expected structure markers (H1 for Markdown, chapters in Plottr, etc.)
- **No scenes**: Scenes require a parent chapter to exist first
- **No beats**: Beats require a parent scene to exist first
- **No characters/locations**: These are only imported from Plottr, Scrivener, yWriter, Longform/Obsidian, or novelWriter

### Missing references or notes (Longform/Obsidian)

- Confirm reference notes live in recognizable folders (`characters/`, `locations/`, etc.)
- Add `type`, `category`, or `tags` frontmatter to classify notes
- Use `[[;Name]]` for characters and `[[~Place]]` for locations when a name could be ambiguous
- Run the post-import reference classification dialog to adjust types

→ More import help: [Importing Projects](/docs/importing-projects/)

---

## Sync & Reimport

### "Project has no source path"

Sync and reimport only work for projects originally created by importing a source file. Blank projects (created without an import) cannot be synced.

### "Source file not found"

The source file has been moved or deleted. Either move the original source file back to its original location, or start a fresh import from the new path.

### Changes not detected

- Ensure the source file saved successfully before syncing
- For Markdown sources: only outline structure is synced (no references), so reference changes won't appear
- For Scrivener: sync/reimport is not supported. Use **Export → Scrivener → Update existing** to merge changes back into a `.scriv` bundle.

→ More sync help: [Sync & Reimport](/docs/sync-and-reimport/)

---

## Writing & Scenes

### Prose isn't saving

kindling auto-saves as you type. If saving fails, it keeps the unsaved draft in the current session and offers a retry. Check the error and write access to the [app data directory](/docs/settings/#project-data), then retry saving. If quitting prompts you to discard changes, choose to keep editing unless you intend to lose those unsaved edits.

Choose **Keep editing** or press **Escape** in the quit prompt to return to your editor and selection. kindling restores the selection when that editor still belongs to the same scene and project and you have not moved focus to another control outside the prompt.

### A scene is read-only and I can't edit it

The scene or its parent chapter is locked. Right-click the scene in the sidebar and choose **Unlock Scene** (or **Unlock Chapter** from the chapter). See [Scene Workflow](/docs/scene-workflow/#scene-locking).

### Discovery notes aren't showing up

Discovery notes are per-scene and only appear when that scene is open. They don't appear in the sidebar or in exports.

---

## Keyboard Shortcuts

### My shortcut does not match the guide

The guides show default bindings. Check the command's current shortcut in **Settings → Keyboard Shortcuts**, the menu, or the command palette. **Clear** leaves a command without a shortcut; **Reset all to defaults** restores all bindings.

### A combination is rejected

Use Command on macOS or Ctrl on Windows/Linux with a supported key. If another command owns the combination, clear its binding first. Standard text editing, system, and dialog-navigation keys cannot be reassigned.

### Shortcuts cannot load or save

Choose **Retry loading shortcuts** for a load error. **Reset all to defaults** can recover unusable saved bindings, but removes your customizations. If saving fails, resolve the reported error before trying again. See [Keyboard shortcuts](/docs/settings/#keyboard-shortcuts).

---

## Exporting

### Custom export is unavailable or does not show my latest writing

Check **Content** for a valid manuscript selection and finish any highlighted profile fields. The workspace loads saved writing when it opens; let your edits finish saving, then choose **Refresh saved manuscript**. If a destination already exists, use a new filename or folder name. See [Export Workspace troubleshooting](/docs/export-workspace/#if-export-is-unavailable).

### DOCX title page is blank or missing my name

Open **File → Settings → Author & Contact**, fill in your details, and choose **Save author details**. A project pen name overrides the shared author name for that project. See [Settings](/docs/settings/).

### EPUB won't open in my e-reader

Some e-readers (particularly older Kindles) are strict about EPUB compliance. Try opening the file in [Calibre](https://calibre-ebook.com/) first — it can validate and convert the file. If the issue persists, [report it on GitHub](https://github.com/smith-and-web/kindling/issues).

### Scrivener export: scenes aren't matching correctly

When using **Update existing**, the match preview shows how kindling scenes map to Scrivener documents before any changes are written. If matches look wrong, you can adjust them in the preview dialog before confirming. See [Exporting Projects](/docs/exporting-projects/#scrivener-scriv).

---

## Editorial Review

### A returned feedback file will not open in my project

Feedback must return to the original project and its registered review round. A second project with the same title is not the same project. Open the original project, then open the `.kindling-feedback` file. Unsupported package versions and invalid files are reported before import.

### A suggestion no longer matches the manuscript

If you changed the passage after exporting, compare the original, current, and suggested text. Select the intended passage and choose **Apply to selected passage**. Unlock a scene before accepting changes to it. See [Editorial Review](/docs/editorial-review/#return-and-decide-on-feedback).

### Review work cannot save

Keep the workspace open and retry, or export a recovery `.kindling-review` file. You can open that recovery file on this or another installation and continue the review. Watch the save indicator before closing.

## Still stuck?

Choose **Help → Send Feedback…** or use the feedback button in About. Sending feedback uses an internet connection when you submit the form. Writing and editorial review work locally, and the desktop app has no analytics or telemetry.


- **Search the docs** — use the search bar at the top of any docs page (powered by Pagefind)
- **Ask on Discord** — [discord.gg/g7bkj4kY8w](https://discord.gg/g7bkj4kY8w)
- **Open an issue** — [github.com/smith-and-web/kindling/issues](https://github.com/smith-and-web/kindling/issues)
