---
title: Importing Projects
description: Import story outlines into Kindling from Plottr, Scrivener, Markdown, yWriter, or Longform/Obsidian.
---

Kindling supports importing story outlines from multiple sources. This guide explains how to prepare your files for a successful import and how reference data is handled.

## Importing a Project

1. Choose **Import** from the start screen or project menu.
2. Select a source file (Plottr, Scrivener, Markdown, yWriter) or a Longform/Obsidian vault folder.
3. Review the import summary and finish the import.

## Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| [Plottr](#plottr-pltr) | `.pltr` | Plottr project files |
| [Scrivener](#scrivener-scriv) | `.scriv` | Scrivener 3 project bundles |
| [Markdown](#markdown-md) | `.md` | Plain text markdown outlines |
| [yWriter](#ywriter-yw7) | `.yw7` | yWriter 7 project files |
| [Longform/Obsidian](#longformobsidian-md) | `.md` index or vault folder | Longform index + scene files |

---

## Post-import Reference Classification

If Kindling detects references during import, it opens a classification dialog so you can confirm or adjust reference types before continuing. You can skip this step and refine reference types later in the References panel.

---

## Plottr (.pltr)

Plottr is a visual story planning tool. Kindling imports the full project structure including characters, locations, and scene cards.

### What Gets Imported

- **Project metadata** — Series name, premise, genre, theme
- **Chapters** — Plottr "beats" become chapters (typically acts)
- **Scenes** — Scene cards with titles and descriptions
- **Characters** — Names, descriptions, and custom attributes (Role, Gender, etc.)
- **Locations** — Places with descriptions and notes
- **Relationships** — Which characters and locations appear in each scene

### File Requirements

- Export from Plottr as a `.pltr` file (the native format)
- The file must be valid JSON
- Supports Plottr file format version 2023+

### Notes

- Rich text formatting (bold, italic) is stripped to plain text
- Custom character/location attributes are preserved
- Scene card descriptions become beat content
- Tags are read but not yet displayed in the UI

---

## Scrivener (.scriv)

Kindling supports importing Scrivener 3 project bundles, making it easy to move a project you've already started in Scrivener into Kindling's outline-and-draft workflow.

### What Gets Imported

- **Project structure** — Binder hierarchy becomes chapters and scenes
- **Scene titles and synopses** — Preserved from Scrivener's metadata
- **Prose content** — RTF scene content is converted to plain text
- **Characters and locations** — If stored as named notes in dedicated binder sections

### File Requirements

- Use a Scrivener 3 `.scriv` bundle (the folder package created by Scrivener on macOS/Windows)
- Open the `.scriv` package as a folder and select the project root

### Notes

- Scrivener's compile settings are not imported — export formatting is handled by Kindling
- Rich text styles (bold, italic, tables) are preserved where possible; complex formatting may simplify
- Scrivener labels and status fields are mapped to Kindling scene type and status where possible

---

## Markdown (.md)

For users who prefer plain text, Kindling supports a simple markdown outline format.

### What Gets Imported

- **Project name** — Derived from the filename
- **Chapters** — H1 headers (`# Chapter Title`)
- **Scenes** — H2 headers (`## Scene Title`)
- **Beats** — List items or paragraphs under scenes

### File Format

```markdown
# Act One

## The Opening

- Introduce the protagonist
- Establish the ordinary world
- Show the character's flaw

## The Inciting Incident

- Something disrupts the status quo
- The protagonist must respond

# Act Two

## Rising Action

The stakes begin to escalate.

- Or you can mix list items
- With paragraph content
```

### Syntax Reference

| Element | Syntax | Example |
|---------|--------|---------|
| Chapter | `# ` + title | `# Chapter One` |
| Scene | `## ` + title | `## The Beginning` |
| Beat (list) | `- ` or `* ` + content | `- Hero wakes up` |
| Beat (paragraph) | Plain text under a scene | `The sun rose slowly.` |

### Rules and Behavior

1. **Chapters require H1** — Lines starting with `# ` become chapters
2. **Scenes require H2** — Lines starting with `## ` become scenes
3. **Scenes need chapters** — H2 headers are ignored if no H1 chapter exists yet
4. **Beats need scenes** — List items and paragraphs are ignored if no scene exists yet
5. **H3+ are treated as beats** — `###` and beyond become paragraph-style beats, not structure
6. **Empty list items are skipped** — A line with just `- ` is ignored

### Tips for Best Results

1. **Start with a chapter** — Begin your file with `# Chapter Name`
2. **Keep it simple** — The parser intentionally ignores complex markdown (tables, code blocks, etc.)
3. **One thought per beat** — Each list item or paragraph becomes a separate beat

### Edge Cases

| Input | Result |
|-------|--------|
| Empty file | Creates a default "Chapter 1" |
| Only H2 headers (no H1) | Creates default chapter, but scenes are ignored |
| Only list items (no headers) | Creates default chapter, but beats are ignored |
| Only H1 headers | Chapters with no scenes or beats |

---

## yWriter (.yw7)

yWriter stores projects in a single XML file. Kindling imports the outline, metadata, and reference data.

### What Gets Imported

- **Project metadata** — Title, author, description, word target
- **Chapters and parts** — Normal chapters are imported; notes/todo chapters are skipped
- **Scenes** — Titles, synopsis, status, and type
- **Beats** — Goal/Conflict/Outcome become beats
- **Prose** — Scene content is preserved as prose
- **References** — Characters, locations, and items
- **Scene links** — Character and location links per scene

### File Requirements

- Use a `.yw7` file from yWriter 7
- The file must be valid XML (UTF-8 or UTF-16)

### Notes

- Items are imported as reference items (type: items)
- Scenes marked as unused are skipped

---

## Longform/Obsidian (.md)

Kindling supports Longform/Obsidian projects by reading a Longform index file and its scene files. You can import either:

- The **index file** (recommended), or
- The **vault folder**, if it contains exactly one Longform index

Kindling enhances the Obsidian workflow — it doesn't replace it. Keep research and worldbuilding in Obsidian, and use Kindling for structured outlining, scene planning, and export-ready manuscripts.

### What Gets Imported

- **Project metadata** from the Longform index
- **Chapters and scenes** based on the `longform.scenes` list
- **Scene status, synopsis, and prose**
- **Reference types** via frontmatter, tags, folders, and wikilinks
- **Reference notes** from character/location/item/objective/organization notes

### Recommended Vault Structure

```text
My Novel/
  index.md
  scenes/
    Scene One.md
    Scene Two.md
  characters/
  locations/
  items/
  objectives/
  organizations/
```

### Longform Index Frontmatter

Longform index files must include YAML frontmatter with a `longform` block:

```yaml
---
longform:
  format: scenes
  title: My Project
  sceneFolder: scenes
  scenes:
    - Chapter One
    - - Scene One
      - Scene Two
---
```

- `format: scenes` is required (single-scene Longform projects are not supported yet)
- `sceneFolder` points to your scene files
- `scenes` supports nested lists for chapter grouping

### Scene Frontmatter Conventions

Scene files can include frontmatter fields to help Kindling parse metadata and reference types:

```yaml
---
status: draft
synopsis: The inciting incident begins.
pov: "[[;Mara]]"
characters:
  - "[[;Mara]]"
  - "[[;Jon]]"
setting: "[[~Old Harbor]]"
items: [[Ancient Map]]
objectives: Find the relic
organizations: "[[Guild of Tides]]"
---
```

Supported fields: `status`, `synopsis`, `pov`, `characters`, `setting` / `locations`, `items` / `objects`, `objectives` / `goals`, `organizations` / `factions` / `groups` / `teams`.

You can also use Dataview-style fields (`characters::`, `setting::`) or `#status/final` tags.

### Reference Notes and Best Practices

- Use folders like `characters/`, `locations/`, `items/`, `objectives/`, `organizations/`
- Add `type`, `category`, or `tags` in frontmatter (e.g., `type: character`)
- Use `[[;Name]]` for characters and `[[~Place]]` for locations when a name could be ambiguous
- Keep a single Longform index file per vault to avoid import ambiguity

---

## Format Comparison

| Feature | Plottr | Scrivener | Markdown | yWriter | Longform/Obsidian |
|---------|--------|-----------|----------|---------|------------------|
| Chapters | ✓ | ✓ | ✓ (H1) | ✓ | ✓ |
| Scenes | ✓ | ✓ | ✓ (H2) | ✓ | ✓ |
| Beats | ✓ | — | ✓ | ✓ | ✓ |
| Synopsis | ✓ | ✓ | — | ✓ | ✓ |
| Prose | — | ✓ | — | ✓ | ✓ |
| Characters | ✓ | ✓ | — | ✓ | ✓ |
| Locations | ✓ | ✓ | — | ✓ | ✓ |
| Items/Objectives/Orgs | — | — | — | Items only | ✓ |
| Scene–reference links | ✓ | — | — | Characters/locations | ✓ |

---

## Troubleshooting

### "Could not read file"

Check that the file exists and you have read permissions.

### "Invalid file structure"

- **Plottr**: Ensure the file is valid JSON (not corrupted)
- **Scrivener**: Ensure you're selecting the `.scriv` bundle folder, not a file inside it
- **Markdown**: Check for encoding issues (file should be UTF-8)
- **Longform/Obsidian**: Ensure the index has `longform.format: scenes`

### Missing Content After Import

- **No chapters**: Make sure your file has the expected structure markers
- **No scenes**: Scenes require a parent chapter to exist first
- **No beats**: Beats require a parent scene to exist first
- **No characters/locations**: These are only imported from Plottr, Scrivener, yWriter, or Longform/Obsidian

### Missing References or Notes

- Confirm reference notes live in recognizable folders (e.g., `characters/`, `locations/`)
- Add `type`, `category`, or `tags` frontmatter to classify notes
- Use `[[;Name]]` and `[[~Place]]` prefixes for ambiguous names
- Run the post-import reference classification dialog to adjust types

---

## Known Limitations

- Longform import supports `format: scenes` only (single-scene format is not supported yet)
- Markdown imports outline structure only; it does not include reference types
- Sync/reimport updates outline structure but does not enrich references for Markdown sources
- Scrivener import does not carry over compile settings or style sheets
