---
title: Architecture
description: An overview of the Kindling codebase for contributors — how the pieces fit together and where to find things.
---

This document provides an overview of the Kindling codebase for contributors.

## High-Level Overview

Kindling is a desktop application built with [Tauri](https://tauri.app/), which combines a Rust backend with a web-based frontend. The frontend uses Svelte 5 and communicates with the Rust backend via Tauri's IPC (Inter-Process Communication) system.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Desktop Window                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                  Svelte 5 Frontend                      │   │
│   │  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐   │   │
│   │  │ Sidebar  │  │  Scene   │  │  References Panel   │   │   │
│   │  │          │  │  Panel   │  │                     │   │   │
│   │  └──────────┘  └──────────┘  └─────────────────────┘   │   │
│   │                     │                                   │   │
│   │              ┌──────┴──────┐                            │   │
│   │              │   Stores    │  (Svelte 5 runes)          │   │
│   │              └──────┬──────┘                            │   │
│   └─────────────────────┼───────────────────────────────────┘   │
│                         │ invoke()                              │
│   ┌─────────────────────┼───────────────────────────────────┐   │
│   │                Tauri IPC Bridge                         │   │
│   └─────────────────────┼───────────────────────────────────┘   │
│                         │                                       │
│   ┌─────────────────────┼───────────────────────────────────┐   │
│   │                  Rust Backend                           │   │
│   │  ┌──────────┐  ┌────┴─────┐  ┌──────────────────────┐   │   │
│   │  │ Parsers  │  │ Commands │  │      Database        │   │   │
│   │  │ (import) │  │  (IPC)   │  │      (SQLite)        │   │   │
│   │  └──────────┘  └──────────┘  └──────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
kindling/
├── src/                      # Svelte frontend
│   ├── lib/
│   │   ├── components/       # UI components
│   │   ├── stores/           # State management (Svelte 5 runes)
│   │   └── types.ts          # TypeScript interfaces
│   ├── App.svelte            # Root component
│   └── main.ts               # Entry point
│
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs            # App initialization, command registration
│   │   ├── commands/         # Tauri IPC command handlers (by module)
│   │   ├── models/           # Data structures
│   │   ├── db/               # SQLite schema and queries
│   │   └── parsers/          # Import format parsers
│   └── tauri.conf.json       # Tauri configuration
│
├── e2e/                      # End-to-end tests (WebdriverIO)
└── test-data/                # Test fixtures
```

## Frontend Architecture

### Components (`src/lib/components/`)

| Component | Purpose |
| --------- | ------- |
| `App.svelte` | Root component, routes between StartScreen and Editor |
| `StartScreen.svelte` | Project selection and import UI |
| `Sidebar.svelte` | Chapter/scene tree navigation |
| `ScenePanel.svelte` | Main editing area with beats |
| `ReferencesPanel.svelte` | Reference cards (characters, locations, items, objectives, organizations) |
| `Onboarding.svelte` | First-launch tutorial flow |
| `ContextMenu.svelte` | Right-click context menus |

### State Management (`src/lib/stores/`)

Kindling uses Svelte 5's runes-based reactivity with class-based stores:

**`project.svelte.ts`** — Project data state:

```typescript
currentProject.value;    // Current Project or null
currentProject.chapters; // Chapter[]
currentProject.scenes;   // Scene[] (for current chapter)
currentProject.beats;    // Beat[] (for current scene)
currentProject.characters; // Character[]
currentProject.locations;  // Location[]
```

**`ui.svelte.ts`** — UI state:

```typescript
ui.currentView;                  // 'start' | 'editor'
ui.sidebarCollapsed;             // boolean
ui.referencesPanelCollapsed;     // boolean
ui.focusMode;                    // boolean
```

### Data Flow

1. User interacts with a component
2. Component calls `invoke()` to send a command to Rust
3. Rust processes the command and returns data
4. Component updates the store
5. Reactive UI updates automatically

```typescript
import { invoke } from "@tauri-apps/api/core";
import { currentProject } from "./lib/stores/project.svelte";

async function loadChapters(projectId: string) {
  const chapters = await invoke("get_chapters", { projectId });
  currentProject.setChapters(chapters);
}
```

## Backend Architecture

### Commands (`src-tauri/src/commands/`)

All frontend–backend communication goes through Tauri commands:

```rust
#[tauri::command]
pub async fn get_chapters(
    project_id: String,
    state: State<'_, AppState>
) -> Result<Vec<Chapter>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::get_chapters(&conn, &project_id).map_err(|e| e.to_string())
}
```

**Command categories:**

| Category | Commands |
|----------|---------|
| Import | `import_plottr`, `import_markdown`, `import_ywriter`, `import_longform` |
| CRUD | `get_*`, `create_*`, `delete_*`, `rename_*` |
| Reorder | `reorder_chapters`, `reorder_scenes`, `move_scene_to_chapter` |
| Sync | `get_sync_preview`, `apply_sync`, `reimport_project` |
| Export | `export_to_docx`, `export_to_markdown`, `export_to_longform`, `export_to_epub` |
| Settings | `get_app_settings`, `update_app_settings`, `update_project_settings` |

### Models (`src-tauri/src/models/`)

| Model | Description |
| ----- | ----------- |
| `Project` | Top-level container, tracks source file |
| `Chapter` | Groups scenes, has position for ordering |
| `Scene` | Writing unit, contains synopsis and prose |
| `Beat` | Story beat within a scene |
| `Character` | Character reference with attributes |
| `Location` | Location reference with attributes |

### Database (`src-tauri/src/db/`)

SQLite, stored in the app's data directory (`kindling.db`).

```
projects → chapters → scenes → beats
    ↓
characters, locations, reference_items (with scene reference links)
```

Key concepts:
- `source_id` — links imported items back to their source file IDs (for re-import sync)
- `position` — integer for ordering within parent
- `archived` — soft-delete flag
- `locked` — prevents editing

### Parsers (`src-tauri/src/parsers/`)

| Parser | File Type | Notes |
| ------ | --------- | ----- |
| `plottr.rs` | `.pltr` | JSON-based, extracts timeline/beats |
| `markdown.rs` | `.md` | Heading-based outline format |
| `ywriter.rs` | `.yw7` | yWriter project import |
| `longform.rs` | `.md` | Longform/Obsidian index or vault import |

Each parser returns a `ParsedProject` struct that gets inserted into the database.

## Testing

| Type | Location | Framework | Command |
|------|----------|-----------|---------|
| Frontend | `src/**/*.test.ts` | Vitest + Testing Library | `npm test` |
| Backend | `src-tauri/src/**/*.rs` | Rust built-in | `cd src-tauri && cargo test` |
| E2E | `e2e/specs/` | WebdriverIO + Tauri driver | See `e2e/README.md` |

## Adding a New Feature

### New Tauri command

1. Add function in the appropriate `src-tauri/src/commands/` module
2. Register in `lib.rs` invoke_handler
3. Add TypeScript types to `types.ts`
4. Call via `invoke()` from the frontend

### New component

1. Create `.svelte` file in `src/lib/components/`
2. Add `data-testid` attributes for E2E tests
3. Import and use in parent component

### New database field

1. Add migration in `schema.rs`
2. Update model struct
3. Update relevant queries
4. Update TypeScript types

## Resources

- [Tauri Documentation](https://tauri.app/v2/start/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [rusqlite](https://docs.rs/rusqlite/latest/rusqlite/)
- [GitHub Repository](https://github.com/smith-and-web/kindling)
