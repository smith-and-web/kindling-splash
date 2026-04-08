---
title: "Kindling v1.2: Light Theme, Scrivener Workflow, Screenplays & More"
description: "The biggest Kindling update yet — light theme, full-page prose editing, typed custom fields, hierarchical tags, screenplay project type, bidirectional Scrivener import/export, smart reference detection, and story structure templates."
publishedDate: "2026-04-08"
modifiedDate: "2026-04-08"
author: "Kindling"
tags: ["announcement"]
---

v1.2 is our biggest release to date. 75 files changed, approximately 14,200 lines added, 12 issues closed across five implementation phases. It touches every part of the app — from how it looks to what you can build with it.

Here's what's new, and why we built it.

## Light theme

This was our number one adoption blocker. Every competitor offers a light theme; we were dark-only. Not anymore.

Kindling now supports **light**, **dark**, and **system** themes. System mode follows your OS preference automatically — if your Mac switches to dark mode at sunset, Kindling follows. Switch manually from Settings → Appearance.

## Full-page prose editing

Since v1.0, drafting in Kindling has meant writing into individual beats — collapsible cards that act as prompts. That's still there, and many writers love it. But some writers want an uninterrupted writing surface, especially once they've internalized the scene's structure.

Now you can **toggle between beat view and page view** per scene. Page view gives you a full-page prose editor while keeping your beats available for reference in the panel alongside. Switch back and forth as needed — your prose is the same either way.

## Bidirectional Scrivener workflow

This is the headline feature. Kindling can now **import from and export to Scrivener 3**.

**Import:** Open a .scriv bundle and Kindling parses the binder hierarchy into chapters and scenes, converts RTF content preserving formatting, and extracts synopses and document metadata.

**Export:** Create a new .scriv bundle from your Kindling project, or update an existing one. The match preview dialog shows exactly how your Kindling scenes map to Scrivener documents before any changes are written — so you can review the mapping before committing.

The workflow we designed for:

1. **Plan in Plottr** — build your timeline, beats, and character arcs
2. **Import into Kindling** — your outline becomes interactive writing prompts
3. **Draft in Kindling** — write with your beats and character context visible
4. **Export to Scrivener** — hand off to Scrivener for revision and compilation

Plan in Plottr, draft in Kindling, revise in Scrivener. The full round-trip now works.

## Screenplay projects

Kindling isn't just for novelists anymore. v1.2 introduces a **Screenplay** project type with:

- **Slugline input** — INT./EXT. with time-of-day parsing
- **Page count estimator** — based on the industry standard of 250 words per page
- **Treatment generation** — export a 1-page or 5-page treatment as DOCX from your synopses

Screenplay projects otherwise work identically to novel projects — beats, references, and export all function the same way.

## Story structure templates

When you create a new project, Kindling can pre-populate your outline with a story structure template:

**Beat sheet templates:** Save the Cat (Blake Snyder), Hero's Journey (Joseph Campbell), Three-Act Structure

**Novel structure templates:** Seven-Point Story Structure (Dan Wells), Snowflake Method (Randy Ingermanson), Story Grid (Shawn Coyne)

Templates create placeholder chapters and scenes with the appropriate beat scaffolding. Customise or delete anything they generate.

## Custom fields & tags

References now support **typed custom field definitions**. Instead of plain key-value pairs, you can define fields with specific types — text, number, date, select, and multi-select. Field definitions are per-project and apply consistently across all references of a given type.

On top of that, a new **hierarchical tagging system** with up to three levels of nesting, colours, descriptions, and a dedicated Tag Manager. Apply tags to scenes, characters, locations, and other entities. Create **saved filters** to quickly surface references matching specific criteria.

## Smart reference detection

A non-AI detection engine that scans your prose for character, location, and item names. When matches are found, suggestions appear in the References panel — link them with one click, or dismiss.

No AI, no cloud, no magic. Just pattern matching against your own reference names. It reinforces our core philosophy: Kindling helps you write — it doesn't write for you.

## EPUB export hardening

Smart quote handling improvements, formatting consistency across Classic, Modern, and Minimal themes, and expanded test coverage.

---

## Get it

Kindling updates automatically — if you have v1.1.x, you'll see a banner prompting you to restart. Or download fresh from [kindlingwriter.com/download](/download/).

Full technical changelog: [v1.2.0 release on GitHub](https://github.com/smith-and-web/kindling/releases/tag/v1.2.0)

Every word in your Kindling draft is yours. That's not a limitation — it's the whole point.
