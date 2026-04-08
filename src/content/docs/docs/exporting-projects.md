---
title: Exporting Projects
description: Export your Kindling project to DOCX, Scrivener, Markdown, Longform/Obsidian, or EPUB.
---

Kindling exports your work to multiple formats so you can move between outlining, drafting, and publishing workflows.

## Export Dialog

Open **Export** from the project toolbar or menu, then choose a format and scope.

## Supported Formats

| Format | Output | Best For |
| ------ | ------ | -------- |
| DOCX | `.docx` file | Standard Manuscript Format submissions |
| Treatment | `.docx` file | 1-page or 5-page synopsis/treatment |
| Scrivener | `.scriv` bundle | Roundtrip with Scrivener 3 |
| Markdown | Folder of `.md` files | Plain text workflows or backups |
| Longform/Obsidian | Index + scene files | Roundtrip with Obsidian |
| EPUB | `.epub` file | E-readers and ebook previews |

## Export Scopes

| Scope | What It Includes |
| ----- | ---------------- |
| Project | All chapters and scenes |
| Chapter | Only the selected chapter |
| Scene | Only the selected scene |

---

## DOCX (Standard Manuscript Format)

DOCX exports are designed for manuscript submissions. Formatting options include:

- **Title page** — Uses app settings and project pen name (see [Settings](settings))
- **Chapter heading style** and page breaks
- **Scene break markers**
- **Font family** and line spacing
- Optional beat markers and scene synopses

The output follows Standard Manuscript Format conventions used by literary agents and publishers.

---

## Treatment (DOCX)

For screenplay and novel projects, Kindling can generate a **treatment document** from your synopses and scene titles. Two lengths are available:

- **1-page treatment** — A concise overview of the full project
- **5-page treatment** — A more detailed scene-by-scene breakdown

Treatments are DOCX files you can send to producers, agents, or collaborators. They pull from your scene synopses, so the more detail you've added, the richer the output.

Treatment export is available from **Export → Treatment** in the project menu.

---

## Scrivener (.scriv)

Kindling can export to Scrivener 3's native bundle format, letting you move your outline and prose into Scrivener for further drafting or compilation.

**Two export modes:**

- **New bundle** — Creates a fresh `.scriv` project from your Kindling project
- **Update existing** — Merges changes back into an existing `.scriv` bundle, with a match preview showing exactly what will change before you confirm

### What Gets Exported

- **Project structure** — Chapters and scenes as Scrivener binder items
- **Scene titles and synopses** — Written to Scrivener's metadata fields
- **Prose content** — Written to each scene document
- **References** — Characters and locations as named notes in dedicated binder sections

---

## Markdown

Markdown exports create a folder structure like:

```
My Project/
  01 - Chapter One/
    01 - Scene One.md
    02 - Scene Two.md
```

- Beat markers can be included as headings
- You can delete an existing export folder before writing new files

---

## Longform/Obsidian

Longform exports are optimised for Obsidian + Longform workflows, making it easy to round-trip between Kindling and Obsidian.

**Output layout:**

```
My Project/
  My Project.md          # Longform index
  Scene One.md
  Scene Two.md
  characters/
  locations/
  items/
  objectives/
  organizations/
```

**Scene files include:**

- YAML frontmatter (`type`, `project`, `status`, `characters`, `setting`, `synopsis`)
- Scene title heading and synopsis block
- `<!-- kindling: ... -->` metadata and beats marker

Reference notes are written into subfolders for characters, locations, items, objectives, and organizations.

---

## EPUB

EPUB exports include:

- **Metadata** — Title, author, description, language
- **Theme selection** — Classic, Modern, or Minimal
- Optional cover image
- Optional beat markers and scene synopses

**Theme descriptions:**

| Theme | Style |
|-------|-------|
| **Classic** | Serif body text, traditional chapter headings with drop caps |
| **Modern** | Clean sans-serif, minimal ornamentation, generous whitespace |
| **Minimal** | Body text only — no chapter styling, no decorative elements |

EPUB files can be opened in any e-reader app (Apple Books, Kindle, Calibre, etc.) for previewing your manuscript as a finished book.

---

## Export Settings

Several settings affect export output. See [Settings](settings) for the full list, but the key ones are:

- **Author name** and contact info — appears on DOCX title pages
- **Pen name** (project-level override) — replaces the author name for a specific project
- **Genre and description** — included in EPUB metadata

---

For importing or syncing exported content back into Kindling, see [Importing Projects](importing-projects) and [Sync & Reimport](sync-and-reimport).
