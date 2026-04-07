---
title: "Kindling v1.1: Plantser Support, Rolling Outlines & Auto-Updates"
description: "Kindling v1.1 adds Rolling Outline Mode for plantsers, blank projects, beat management, command palette, guided onboarding, and automatic updates."
publishedDate: "2026-03-16"
modifiedDate: "2026-03-16"
author: "Kindling"
tags: ["announcement"]
---

When we launched Kindling in beta, it was built around a simple idea: your outline should be visible while you write. That resonated with plotters -- writers who plan every beat before drafting. But we kept hearing from writers who don't fit neatly into the plotter box. They plan *some* things. They discover others along the way. They're plantsers.

Kindling v1.1 is our answer: a release that makes the app flexible enough for writers at every point on the plotter-to-pantser spectrum, while keeping the structured scaffolding that plotters depend on.

## Rolling Outline Mode

The headline feature in v1.1 is **Rolling Outline Mode** -- a system that lets you control how much structure each chapter and scene has. Every scene now has one of three planning states:

- **Fixed** -- full beat scaffolding, references, and discovery notes. This is the existing Kindling experience that plotters know and love.
- **Flexible** -- title and synopsis only. Beats are hidden until you're ready for them. Perfect for scenes you have a general idea about but haven't detailed yet.
- **Undefined** -- a placeholder. You know the scene exists, but you haven't planned it yet.

The key insight is that scenes can be **promoted progressively**: Undefined to Flexible to Fixed, as your story takes shape. The sidebar adapts automatically -- Undefined chapters show a placeholder, Flexible chapters show simplified title-only scene lists, and Fixed chapters show the full outline with filters and drag-and-drop.

This means you can start a project with a vague sense of your story's arc and add structure incrementally. No more needing every beat planned before you open your drafting space.

## Blank Projects

Until now, Kindling required you to import an outline from Plottr, yWriter, or Markdown. That made sense for the beta, but it was a barrier for writers who wanted to build their outline directly in Kindling.

v1.1 adds **File > New Project** (`Cmd+N`). Start with an empty chapter and build your outline from scratch. New scenes default to Undefined, so you can define structure as you go -- or jump straight to Fixed if you already know your beats.

## Beat Management

Beats are the building blocks of your scenes in Kindling. v1.1 gives you much more control over them:

- **Delete beats** via context menu or keyboard
- **Reorder beats** with drag-and-drop
- **Split prose into beats** -- break a long prose block into individual beats
- **Merge beats** -- combine adjacent beats into one
- **Beat density indicator** -- a visual gauge showing how detailed each scene is

## Inline Discovery Notes

Inspiration doesn't always arrive on schedule. Discovery notes (`Cmd+D`) let you capture ideas mid-writing without leaving your scene. They live alongside your prose and can be promoted to full beats when you're ready. Notes persist across sessions with snapshot support.

This is especially useful for plantsers: you're writing a Fixed scene and suddenly realize a character needs a subplot three chapters from now. Jot a discovery note, keep writing, and deal with it later.

## Command Palette

Press `Cmd+K` to open the command palette. Fuzzy search across all available actions -- import, export, settings, navigation, and more. Arrow keys to navigate, Enter to execute. If you've used VS Code or Raycast, you'll feel right at home.

## Guided Onboarding

First-time users now see a step-by-step guided tour covering the sidebar, scene panel, references panel, and sync. We've also added a sample project to explore immediately, plus a Quick Start guide accessible from the Help menu (`Cmd+Shift+H`).

## Sidebar UX Overhaul

The sidebar got a serious cleanup. Export, Snapshots, and Archive are now tucked behind a "more" menu. Scene filters are consolidated into a compact toggle. Scene rows are cleaner with redundant icons removed. Context menus now include a flyout for planning status selection, and Flexible/Undefined chapters support inline synopsis editing.

## Auto-Updater

This is the last version you'll need to download manually. Kindling now checks for updates automatically on launch. When a new version is available, it downloads silently in the background and shows a non-blocking banner: *"Kindling vX.Y.Z is ready -- Restart to update."*

## Start Screen Redesign

The start screen now uses a two-column golden ratio layout (38.2% / 61.8%), giving more room to recent projects. The default window size is now 1600x1000 with a minimum of 1360x800.

## Upgrading

If you have v1.0.x installed, just [download v1.1.0](/download/) and install it over your existing installation. Your projects are stored separately and will be preserved. Going forward, Kindling will handle updates for you automatically.

For the full list of changes, see the [release notes on GitHub](https://github.com/smith-and-web/kindling/releases/tag/v1.1.0).

As always, we'd love to hear from you. Join us on [Discord](https://discord.gg/g7bkj4kY8w), open an issue on [GitHub](https://github.com/smith-and-web/kindling), or just start writing. That's what Kindling is for.
