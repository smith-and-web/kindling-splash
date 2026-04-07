---
title: References
description: Track characters, locations, and other story elements in Kindling's References panel.
---

References help you track people, places, and story elements across scenes. Each reference can include notes and custom attributes, and you can link them to specific scenes.

## Reference Types

Kindling supports five reference types:

- **Characters** — People in your story
- **Locations** — Places where scenes occur
- **Items** — Objects that matter to the plot
- **Objectives** — Goals, quests, or missions
- **Organizations** — Groups, factions, institutions

You can enable or disable reference types per project from the References panel settings.

## References Panel Overview

The References panel sits to the right of the editor and shows tabs for each enabled reference type. From here you can create, edit, and link references to the current scene.

When a scene is selected:

- References **linked** to the scene appear at the top
- **Unlinked** references appear below
- Drag references to set per-scene ordering
- Expand/collapse state is saved per scene

## Editing Reference Details

Each reference includes:

| Field | Description |
|-------|-------------|
| **Name** | The reference's primary name |
| **Description** | A short summary or bio |
| **Notes** | Free-form notes for your own reference |
| **Custom attributes** | Key/value pairs for structured data (e.g., Eye colour: green) |

## Custom Fields (v1.2+)

In v1.2, references support **typed custom field definitions**. Instead of plain key/value pairs, you can define fields with specific types:

| Field type | Use it for |
|------------|-----------|
| Text | Names, descriptions, freeform notes |
| Number | Age, height, chapter count |
| Date | Birth dates, event dates |
| Select | Role (protagonist/antagonist/supporting) |
| Multi-select | Tags, traits, affiliations |

Custom field definitions are created per project and apply consistently across all references of that type. This means you can define "Role" once for Characters and all characters will have that field.

## Hierarchical Tags (v1.2+)

References support a **hierarchical tagging system** with up to three levels of depth. Tags can have colours and are managed project-wide from the **Tag Manager** (accessible from the References panel settings).

Example hierarchy:

```
role/
  protagonist
  antagonist
  supporting
status/
  active
  deceased
  unknown
```

Apply tags to any reference and use **saved filters** to quickly find references matching specific criteria — for example, all active characters with role/protagonist.

## Smart Reference Detection (v1.2+)

Kindling's non-AI reference detection engine can scan your prose for character, location, and item names. When matches are found, suggestions surface automatically in the References panel so you can link them with one click.

Smart detection runs on demand — it doesn't modify your prose or add anything automatically. It simply surfaces references you may have mentioned but haven't explicitly linked to a scene yet.

## Reference Type Settings

Use the settings cog (⚙) in the References panel to enable or disable reference types per project. If your story doesn't need items or objectives, disabling those types keeps the panel clean.

## References from Import

When you import a project, Kindling imports reference data where the format supports it:

| Format | Characters | Locations | Items | Objectives | Orgs |
|--------|-----------|-----------|-------|-----------|------|
| Plottr | ✓ | ✓ | — | — | — |
| Scrivener | ✓ | ✓ | — | — | — |
| Markdown | — | — | — | — | — |
| yWriter | ✓ | ✓ | ✓ | — | — |
| Longform/Obsidian | ✓ | ✓ | ✓ | ✓ | ✓ |

See [Importing Projects](importing-projects) for details on how each format handles references.
