---
title: Sync & Reimport
description: Keep source-backed Kindling projects in sync with their original Plottr, Markdown, yWriter, or Obsidian files.
---

Kindling can keep source-backed projects in sync with their original files while preserving the prose you've written in the app.

## Sync vs. Reimport

| | Sync Preview | Reimport |
|--|---|---|
| **How it works** | Compares your source file to the current project and lets you apply selected changes | Re-reads the source file and updates the outline structure in one pass |
| **Control** | You choose which changes to apply | All outline changes are applied at once |
| **Prose** | Preserved | Preserved |

Both options preserve existing prose written in Kindling.

## Supported Sources

Sync and reimport are available for projects imported from:

- Plottr (`.pltr`)
- Markdown (`.md`)
- yWriter (`.yw7`)
- Longform/Obsidian (Longform index file)

**Scrivener is not currently supported for sync/reimport.** If you've made changes to a `.scriv` bundle and want to bring them back into Kindling, use **Export → Scrivener → Update existing** — this merges your Kindling project back into the bundle with a match preview before any changes are written.

## Sync Preview Workflow

Use sync when your outline has changed in Plottr (or another tool) and you want to review what's new before applying it:

1. Open the project
2. Choose **Sync** from the project menu to generate a preview
3. Review the list of additions and changes
4. Select which changes to apply, then confirm

## Reimport Workflow

Use reimport for a faster, all-at-once update:

1. Open the project
2. Choose **Reimport** from the project menu
3. Kindling re-reads the source file and updates the outline
4. Review the summary after completion

## What Sync Updates

Sync and reimport focus on outline structure:

- Chapter, scene, and beat **additions**
- Title and synopsis **updates**
- Beat content **updates**

Locked chapters or scenes are skipped during sync. Prose you've written inside Kindling is always preserved.

## What Sync Does Not Change

- Prose written in Kindling beats
- Reference data (characters, locations, etc.) — reference enrichment is not re-run on sync
- Locked scenes or chapters

---

## Troubleshooting

### "Project has no source path"

Sync and reimport only work for projects originally created by importing a source file. Blank projects (created without an import) cannot be synced.

### "Source file not found"

The source file has been moved or deleted. Either move the original source file back to its original location, or start a fresh import from the new path.

### Changes not detected

- Ensure the source file saved successfully before syncing
- For Markdown sources: only outline structure is synced (no references), so reference changes in the source won't appear
