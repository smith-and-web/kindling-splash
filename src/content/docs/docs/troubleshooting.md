---
title: Troubleshooting
description: Solutions to common problems with Kindling — installation, import, sync, and more.
---

Can't find what's wrong? This page collects the most common issues across all areas of Kindling. For more detail on any topic, follow the links to the relevant page.

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

### Linux: No application icon

AppImages don't always integrate with desktop environments automatically. Use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) or create a `.desktop` file manually — see [Installation](installation) for the full desktop entry snippet.

→ More install help: [Installation](installation)

---

## Importing Projects

### "Could not read file"

Check that the file exists and you have read permissions.

### "Invalid file structure"

- **Plottr**: Ensure the file is valid JSON (not corrupted)
- **Scrivener**: Ensure you're selecting the `.scriv` bundle folder, not a file inside it
- **Markdown**: Check for encoding issues (file should be UTF-8)
- **Longform/Obsidian**: Ensure the index has `longform.format: scenes`

### Missing content after import

- **No chapters**: Make sure your file has the expected structure markers (H1 for Markdown, chapters in Plottr, etc.)
- **No scenes**: Scenes require a parent chapter to exist first
- **No beats**: Beats require a parent scene to exist first
- **No characters/locations**: These are only imported from Plottr, Scrivener, yWriter, or Longform/Obsidian

### Missing references or notes (Longform/Obsidian)

- Confirm reference notes live in recognizable folders (`characters/`, `locations/`, etc.)
- Add `type`, `category`, or `tags` frontmatter to classify notes
- Use `[[;Name]]` for characters and `[[~Place]]` for locations when a name could be ambiguous
- Run the post-import reference classification dialog to adjust types

→ More import help: [Importing Projects](importing-projects)

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

→ More sync help: [Sync & Reimport](sync-and-reimport)

---

## Writing & Scenes

### Prose isn't saving

Kindling auto-saves as you type — there's no manual save needed. If changes appear to be lost after a crash, check that the app has write access to its data directory. On macOS, this is `~/Library/Application Support/com.kindlingwriter.app/`.

### A scene is read-only and I can't edit it

The scene or its parent chapter is locked. Right-click the scene in the sidebar and choose **Unlock Scene** (or **Unlock Chapter** from the chapter). See [Scene Workflow](scene-workflow#scene-locking).

### Discovery notes aren't showing up

Discovery notes are per-scene and only appear when that scene is open. They don't appear in the sidebar or in exports.

---

## Exporting

### DOCX title page is blank or missing my name

Author name and contact information are set in **app-level settings** (not project settings). Open **Kindling Settings** on macOS or **File → Settings** on Windows/Linux and fill in the Author section. See [Settings](settings).

### EPUB won't open in my e-reader

Some e-readers (particularly older Kindles) are strict about EPUB compliance. Try opening the file in [Calibre](https://calibre-ebook.com/) first — it can validate and convert the file. If the issue persists, [report it on GitHub](https://github.com/smith-and-web/kindling/issues).

### Scrivener export: scenes aren't matching correctly

When using **Update existing**, the match preview shows how Kindling scenes map to Scrivener documents before any changes are written. If matches look wrong, you can adjust them in the preview dialog before confirming. See [Exporting Projects](exporting-projects#scrivener-scriv).

---

## Still stuck?

- **Search the docs** — use the search bar at the top of any docs page (powered by Pagefind)
- **Ask on Discord** — [discord.gg/g7bkj4kY8w](https://discord.gg/g7bkj4kY8w)
- **Open an issue** — [github.com/smith-and-web/kindling/issues](https://github.com/smith-and-web/kindling/issues)
