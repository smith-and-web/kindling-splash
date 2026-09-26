# Application components · Press 0.3.0

22 reusable Svelte 5 controls and surfaces, an opt-in NovelEditor / ProseToolbar entry, 22 standalone live examples, 12 composition recipes, and 147 original baseline references. Open the **Application** section of `index.html`. The live examples import the public Svelte components; the images below them are reference inputs, not screenshots of this library.

## Incremental adoption

The existing kindling application remains the owner of its stores, APIs, command dispatch, editor, persistence, and export implementation. This package supplies UI pieces. It is intentionally neither an application rewrite nor a drop-in replacement for every existing component.

1. Keep the application's current Press tokens and fonts. Add the optional application stylesheet after them.
2. Replace a small repeated element inside an existing app component: a button, field, status label, or panel.
3. Keep that component's handlers and external props. Adapt values at the boundary when necessary.
4. Adopt larger compositions only when useful. Sidebar selection, editor mounting, autosave, import, sync, and export remain in existing app code.

```svelte
<script lang="ts">
  import { Button, Field } from '@kindling/design-system/svelte';
  import '@kindling/design-system/application.css';

  // These can remain the existing RenameDialog props.
  let { currentName, onSave }: {
    currentName: string;
    onSave: (newName: string) => Promise<void>;
  } = $props();
  let name = $state(currentName);
  let saving = $state(false);
  let error = $state('');

  async function save() {
    if (!name.trim()) { error = 'Enter a name to continue.'; return; }
    saving = true;
    error = '';
    try { await onSave(name.trim()); }
    catch (cause) { error = cause instanceof Error ? cause.message : 'Could not save. Try again.'; }
    finally { saving = false; }
  }
</script>

<div class="press-app">
  <Field label="Name" bind:value={name} {error} disabled={saving} required />
  <Button busy={saving} onclick={save}>{saving ? 'Saving…' : 'Save name'}</Button>
</div>
```

The wrapper owns asynchronous errors and loading. Keep your existing success/close logic around `save`; no API endpoint or store needs to change. `Field` has a string value; adapt `null` to `''` and parse numbers only at the existing app boundary. Do not replace domain validation with browser form validation.

## Imports and styles

```svelte
<script lang="ts">
  import { Button, Dialog } from '@kindling/design-system/svelte';
  // New consumers need all three; kindling already supplies fonts and tokens.
  import '@kindling/design-system/fonts.css';
  import '@kindling/design-system/tokens.css';
  import '@kindling/design-system/application.css';
</script>
```

Use a Svelte-aware bundler. The `svelte` entry exports editable `.svelte`/TypeScript sources; it is not directly executable Node JavaScript. Svelte `^5.53.11` is an optional peer so CSS-only users are unaffected. The reference build uses Svelte 5.56.4 and esbuild 0.27.2.

Reusable selectors use the `ka-` prefix. Wrap compositions in `.press-app` for inherited UI typography. `application.css` does not import the legacy global component reset or Tailwind. It contains scoped component rules, structural layout helpers, and new `--ka-*` variables. Existing aggregate CSS and Website entries are unchanged.

Themes inherit the existing root `data-theme` semantic tokens. Apply the application's existing system-theme resolver; the component package does not install another one. The reference theme control changes the catalog. Manuscript surfaces intentionally retain light paper and dark ink in dark chrome.

The app's hero type caps at 48px through `--ka-heading`; the canonical foundation `--text-hero` remains unchanged at its 60px maximum. Compact labels retain Press's 12–15px UI roles; narrative catalog text uses 16px or larger. These are continuations of the app and brand, not new universal defaults.

## Read-only metadata and literal values

Two CSS-only patterns, added in 0.11.0 because a real download page needed them and the nearest existing component was for a different job. Both are application-layer because the same shape appears in the app: Settings → About, project details and the reference custom-field list are all key/value metadata, and export paths, error detail and the project path are all literal strings a user copies.

`.ka-facts` is key/value metadata at label scale. Wrap each pair in a `display: contents` div so the two tracks stay in one grid, and drop to one column below 600px:

```html
<dl class="ka-facts">
  <div><dt>Size</dt><dd>~10 MB</dd></div>
  <div><dt>Licence</dt><dd>MIT</dd></div>
</dl>
```

It is not `.ka-stats`, which is the figure display — `dd` reordered above `dt` at clamped 24–36px Fraunces, for a word count — and it is not `.ka-badge`, which is a status chip. There are no internal hairlines; row separation is padding, as in `.ka-stats`.

`.ka-code` is a literal string the reader is expected to copy — a command, a checksum, a path. Inline `<code>` is already styled by `website.css` inside `.press-web`; this is a block with an action attached.

```html
<div class="ka-code">
  <code>shasum -a 256 Kindling_1.3.0_universal.dmg</code>
  <button type="button" class="ka-button ka-button--secondary">Copy</button>
</div>
```

Pair the copy control with `.ka-button--secondary`, **not** `--ghost`. Ghost's only hover feedback is a `--color-surface-sunken` background, which is this block's own background, so its hover state would be exactly invisible.

## The workspace shell

CSS-only, added in 0.13.0. Press has owned every control a writing workspace holds — `.ka-tree`, `.ka-beat`, `.ka-manuscript`, `.ka-panel`, `.ka-segment` — and no layout to seat them in, so the shell was composed locally three times: the application kit (`.kit-layout`), the reference catalog (`.ac-workspace`) and the kindling-splash home-page specimen. The regions and their default widths are the application's: a 304px project outline, the scene column, a 288px references inspector.

```html
<section class="press-app ka-workspace ka-workspace--embedded" aria-label="Sample writing workspace">
  <header class="ka-workspace-bar">…project name, status badge…</header>
  <div class="ka-workspace-panes">
    <fieldset class="ka-segments">
      <legend class="ka-sr">Workspace region</legend>
      <div class="ka-segment-track">
        <label class="ka-segment"><input type="radio" name="region" value="outline">Project</label>
        <label class="ka-segment"><input type="radio" name="region" value="main" checked>Writing</label>
        <label class="ka-segment"><input type="radio" name="region" value="inspector">References</label>
      </div>
    </fieldset>
  </div>
  <div class="ka-workspace-grid">
    <aside class="ka-workspace-outline" aria-label="Project">
      <div class="ka-workspace-body"><nav class="ka-tree">…</nav></div>
    </aside>
    <div class="ka-workspace-main">
      <div class="ka-workspace-body">…scene heading, beats, manuscript…</div>
      <footer class="ka-statusbar"><span>Scene: 212 words</span><span>Project: 1,480 words</span></footer>
    </div>
    <aside class="ka-workspace-inspector" aria-label="References">
      <div class="ka-workspace-body">…</div>
    </aside>
  </div>
</section>
```

| Class | Contract |
| --- | --- |
| `.ka-workspace` | The container, and the named `ka-workspace` inline-size container every rule below queries. Holds an optional title bar, an optional pane switcher and the grid. |
| `.ka-workspace-grid` | The three regions. A separate element because a container query cannot restyle its own container. Tracks are `auto`, so an absent outline or inspector takes no space; only main is required. |
| `.ka-workspace-outline`, `-main`, `-inspector` | Region columns. Outline and inspector sit on `--color-surface` with a hairline toward the scene; main sits on `--color-bg`. Each holds an optional `.ka-workspace-bar`, a `.ka-workspace-body`, and in main an optional `.ka-statusbar`. |
| `.ka-workspace-bar` | A region's header row, or placed directly in `.ka-workspace`, a title bar across it. Owns layout only — put `.ka-button`, `.ka-badge` and `.ka-icon-button` inside. Every bar is at least a 44px control tall plus its padding, so a text-only bar matches one holding an icon button and adjacent regions' header rules meet in one line. A heading in the bar looks the same at `h2`, `h3` or `h4`; choose the level the surrounding page's outline needs. |
| `.ka-workspace-body` | A region's content, padded. Scrolls when the workspace is bounded; give it `tabindex="0"` then so the scroll is keyboard-reachable, and it shows the control focus pair. |
| `.ka-statusbar` | The persistent strip of counts at the foot of the scene column, as `WritingStatusBar` draws it: small muted Inter, tabular figures, one `span` per count, wrapping. `.ka-stats` is the figure display for the same numbers and the wrong scale here. |
| `.ka-workspace-panes` | Below a 900px workspace, one region shows at a time and this row switches. Radios carry `value="outline"`, `"main"` or `"inspector"`; with none checked, main shows. Hidden at wider workspaces, where every region shows regardless of the choice. |
| `.ka-workspace--embedded` | A bounded specimen on another surface: hairline, `--ka-radius`, clipped corners. No shadow — the workspace is not a floating overlay. |
| `.ka-disclosure-icon` | The plain-HTML chevron for a `details` summary. Draw one right-pointing chevron; it turns down when its own `details` opens. `BeatItem` and `NavigationTree` swap two icons in script; static markup cannot. |

### The scene column, beats and references

The regions' contents, as the application draws them in 0.13.0.

```html
<div class="ka-scene-column">
  <header class="ka-scene-header">
    <p>Chapter · The Letter</p>
    <h3>On the Cliff</h3>
  </header>
  <section class="ka-scene-section">
    <header><h4>Synopsis</h4></header>
    <p class="ka-scene-synopsis">Eleanor discovers a letter…</p>
  </section>
  <section class="ka-scene-section">
    <header><h4>Beats</h4></header>
    <details class="ka-beat">
      <summary>
        <svg class="ka-icon ka-disclosure-icon" …>…right chevron…</svg>
        <span class="ka-beat-number">1</span>
        <span class="ka-beat-title">Eleanor reads the mysterious letter</span>
        <span class="ka-beat-count">34 words</span>
        <span class="ka-beat-preview" aria-hidden="true"><span>Eleanor Blackwood had always known…</span></span>
      </summary>
      <div class="ka-beat-body">
        <article class="ka-manuscript"><div class="ka-manuscript-prose"><p>…</p><p>…</p></div></article>
      </div>
    </details>
  </section>
</div>
```

| Class | Contract |
| --- | --- |
| `.ka-tree-label` | A tree row's label held to one line with an ellipsis, as the application's sidebar truncates titles; it fills the row, so a trailing `small` count stays right-aligned. A disabled tree button is inert — no pointer, no hover fill — and keeps its ink. |
| `.ka-tree` radio rows | The plain-HTML form of `NavigationTree`'s selection: a `label` holding a visually hidden radio renders as a tree row, and the checked row takes the selected accent fill. One radio group across the tree lets a static surface switch scenes with `:has()`; the row shows keyboard focus, and arrow keys move through the group. |
| `.ka-scene-column` | The scene panel's centred column, held to 720px. |
| `.ka-scene-header` | A small muted eyebrow `p` over the scene title (`h1`–`h3`) at `--ka-heading`. |
| `.ka-scene-section` | A hairline-headed section. Its `header` holds the heading (`h2`–`h4`, set at `--text-h3`) and an optional action, and is a 44px row so a heading with and without an action align. |
| `.ka-scene-synopsis` | The synopsis: italic Newsreader at `--text-body-lg`, held to `--measure`. |
| `.ka-beat` closed | Only the open beat carries the accent. A closed beat's `.ka-beat-number` is an outlined circle in muted ink; an open beat's summary takes a hairline above its draft. |
| `.ka-beat-title`, `.ka-beat-count` | The title truncates to one line; the word count trails it, small, muted and tabular. |
| `.ka-beat-preview` | A closed beat's draft as a strip of light paper three lines deep. It sits inside the `summary` — a closed `details` shows nothing else — as a block `span` around one inline element, so the whole strip opens the beat. Mark it `aria-hidden="true"`: it would otherwise join the summary's accessible name, and the body holds the full draft. Hidden while open. |
| `.ka-reference` | A story reference in the inspector: `summary` > `.ka-reference-avatar`, `.ka-reference-text` (`.ka-reference-name`, `.ka-reference-description`), and a down-pointing `.ka-disclosure-icon` that turns up when open. `.ka-reference-body` holds the description as a `p` in Newsreader and a `.ka-facts` at label scale. The one-line description hides once open, because the body repeats it. |

**Manuscript paragraphs indent, as the editor's do.** `.ka-manuscript-prose` sets every paragraph but its container's first at a 1.5em first-line indent with no space between — so the paragraph after a quotation indents too — matching `NovelEditor`'s `--kp-line-indent`; through 0.12.0 it spaced them 16px apart. A `blockquote` is the editor's callout: italic, `--color-prose-callout-bg`, a 4px `--color-prose-blockquote-border` rule. `--ka-line-indent` holds the value and `system:check` asserts it matches the editor's.

**Height is the consumer's.** Set `--ka-workspace-block` to bound the workspace — the window, in the application — and bodies scroll; give each scrolling body `tabindex="0"`. Unset, the workspace takes its content's height. On a website, bound it to the screen whenever its content would run past one: kindling-splash's specimen measured 783px on a laptop and over 1,000px on a phone unbounded, so no common device showed it whole, and it now uses `clamp(24rem, calc(100svh - 8rem), 40rem)`. The cost is a scroll area inside a scrolling page, which a phone visitor can catch with a swipe; keep the chrome inside a narrow bounded workspace to one row per bar so the box spends its height on content.

**Region widths clamp against the workspace** (defaults `clamp(12rem, 24cqi, 19rem)` and `clamp(12rem, 22cqi, 18rem)`). A specimen narrower than an application window keeps a readable scene column, and at a full window both settle at the application's own widths. Set `--ka-workspace-outline` and `--ka-workspace-inspector` on the workspace or any ancestor rather than overriding the tracks; the defaults are `var()` fallbacks, so an inherited value wins.

**A manuscript inside the workspace pads like the application's beat view** — 16px × 24px, and 16px below a 900px workspace — rather than `.ka-manuscript`'s viewport-scaled 24–48px, which inside a scene column spent a quarter of the width and most of a bounded region's height on margin.

**Nesting in a website surface needs nothing.** As of 0.13.0 the `.press-web` element defaults — heading family, size, weight and line height, and the 65ch paragraph cap — stop at a nested `.press-app`, so a workspace inside a website page renders with application type. Through 0.12.0 it did not: a `.ka-manuscript` heading measured 24px instead of 48px. Do not add a local reset.

**Accent inside an embedded workspace.** A bounded, interactive `.press-app` specimen is an application surface even on an editorial page, so its real selection, beat numbers, focus and status are exempt from the editorial accent budget, as they are in the application. Decoration and calls to action inside it are not exempt merely for being inside it. See `DESIGN.md`.

## Notes on existing controls

**`.ka-segment` works without JavaScript as of 0.11.0.** Its selected rule was `.ka-segment.ka-selected` alone — a class the Svelte component toggles — while the radio inside is visually hidden. On a plain-HTML surface, clicking a segment checked the input and nothing moved, so the control reported the wrong choice. `.ka-segment:has(input:checked)` is now matched alongside the class; `.ka-selected` stays for the component. If you use `.ka-segment` outside Svelte, the native markup is a `<fieldset>`, a radio group, and one `<label class="ka-segment">` per choice inside a `.ka-segment-track`.

**A manuscript can sit inside a `.ka-beat-body` as of 0.13.0.** `.ka-beat-body p` sets the beat's own note paragraphs at `--text-body-lg` and named the `p` directly, which beat the `--text-body` / `--leading-relaxed` that `.ka-manuscript-prose` sets on itself — so a draft seated in a beat read at 18px/1.7 instead of the editor's 17px. The rule now excludes paragraphs inside a `.ka-manuscript`, at unchanged specificity.

**`.ka-notice` sets its own `display: grid`.** It previously declared `gap: 12px` with no display, so the gap was inert. Unlike `.ka-field` — a layout-agnostic wrapper the consumer pairs with `od-field` to say "stack" — a notice already styles its own `p` and does not leave its internal arrangement to the consumer.

Worth knowing either way: `.od-stack` and the other `od-*` primitives live in `@layer od-layout` and the `ka-` rules do not. Unlayered rules beat layered ones regardless of specificity, so **`--od-gap` has no effect on a paired `ka-`/`od-` element** — including the documented `.ka-field od-field`, where `.ka-field`'s own `gap: 8px` wins. Setting `--od-gap` there looks like it should work and does nothing.

## Component API

The 22 controls and presentation components are exported from `design-system/svelte/index.ts`. Rich prose editing uses the separate `design-system/svelte/editor/index.ts` entry described below. Callback props use the app's existing `onChange` / `onSelect` style; native button props use Svelte 5 `onclick`. Bindable props may be used with `bind:`. Callbacks notify the consumer; they do not invoke a desktop service.

| Component | Props and callbacks | Behavior |
| --- | --- | --- |
| `Button` | Native button attributes; `variant='primary'` (`primary`, `secondary`, `ghost`, `danger`); `busy=false`; `children` snippet | Defaults to `type='button'`. Busy disables interaction and sets `aria-busy`; supply meaningful busy text. |
| `IconButton` | Required `label`, `icon`; native button attributes | Accessible name and title; 44px target. Uses the local Lucide subset. |
| `Field` | Required `label`; bindable string `value=''`; `type='text'` (`text`, `email`, `number`, `date`, `url`, `search`); `multiline`, `helper`, `error`, `required`, `disabled`, `readonly`, `placeholder`, `name`, `id`; `onChange(value)`, `onBlur(value)` | Persistent label, adjacent error, native input/textarea. Native validity is reported on blur; parent supplies domain/server errors. Does not submit or persist. |
| `Checkbox` | Required `label`; bindable `checked=false`; `disabled`, `helper`; `onChange(boolean)` | Native checkbox with an associated label. |
| `Select` | Required `label`, `options: Option[]`; bindable `value=''`; `helper`, `disabled`; `onChange(value)` | Native single select, including disabled options. Use one select per field. |
| `SegmentedControl` | Required `label`, `options: Option[]`; bindable `value=''`; `onChange(value)` | Native radio group with visible selected state. Supply an initial value. |
| `Tabs` | Required `label`, `items: Option[]`; bindable `value=''`; `onChange(value)`; `children(activeValue)` snippet | Roving keyboard focus, arrows/Home/End, selected tab and associated panel. First enabled item is the fallback selection. Store editable panel data outside the snippet. |
| `Badge` | Required `label`; `tone='neutral'` (`neutral`, `accent`, `success`, `error`, `warning`) | Text carries status meaning independently of color. |
| `TagPicker` | `label='Tags'`; required `options: Option[]`; bindable `value: string[]=[]`; `onChange(ids)` | Filter available tags, choose existing IDs, remove selected IDs. Creation and saving stay in the app. |
| `Progress` | Required `label`, numeric `value`; `max=100` | Labeled progress with explicit counts; visual progress clamps to valid bounds. |
| `EmptyState` | Required `title`, `description`; `icon='file-text'`; optional `children` snippet | Explains the empty state and accepts a useful action. |
| `Notice` | Required `title`, `message`; `tone='info'` (`info`, `success`, `error`, `warning`); `children` | Error uses `role=alert`; other variants use `role=status`. Keep status copy explicit. |
| `Dialog` | Required `title`; bindable `open=false`; `subtitle`, `wide=false`; `children`, `footer` snippets; `onClose()` | Native modal dialog, close button, Escape, focus containment and native restoration. Mount it outside containers hidden by a recipe/panel. Avoid nesting dialogs. |
| `Menu` | `label='More actions'`; required `items: MenuItem[]`; `onSelect(id)` | In-flow disclosure menu. Arrow/Home/End navigation; Escape closes and returns focus; outside click closes. |
| `CommandPalette` | Bindable `open=false`; required `commands: Command[]`; `onSelect(id)`, `onClose()` | Search over label/keywords, arrows/Enter/Escape, empty results, shortcuts. Uses case-insensitive substring matching; the app's fuzzy ranking is intentionally not moved here. |
| `NavigationTree` | Required `label`, `nodes: TreeNode[]`; bindable `selected=''`; `onSelect(id)` | Recursive disclosure navigation with active leaf. Uses semantic lists and native details rather than claiming ARIA tree keyboard behavior. Domain nodes are mapped by the owner. |
| `Panel` | Required `title`; `subtitle`; `children`, `actions` snippets | Reusable titled surface with a separate action area. |
| `BeatItem` | Required `number`, `title`; bindable `open=false`; `children` | Native disclosure beat row with numbered marker and expandable content. |
| `ManuscriptSurface` | Required `title`; `subtitle`; `children` | Mounted paper surface, typography, full-flow prose. It is not a rich-text editor. Preserve the app's existing Tiptap editor and selection logic. |
| `StatGroup` | Required `items: {label, value: string \| number, unit?}[]` | Responsive definition list, values above captions, attached units. |
| `ShortcutRecorder` | Required `label`; bindable `value=''`; `onChange(shortcut)`; optional `isReserved(shortcut,event)` | Records while its button is focused. Escape cancels, Tab leaves; common editing/window combinations are reserved. Inject the app's authoritative reservation/conflict policy. |
| `SearchResults` | Required `items: SearchResult[]`; `query=''`; `onSelect(id)` | Escaped text highlighting, full excerpts, empty state, pagination in batches of 10. Search execution/replacement are consumer-owned. |

```ts
interface Option { value: string; label: string; disabled?: boolean }
interface MenuItem { id: string; label: string; shortcut?: string; disabled?: boolean; danger?: boolean }
interface Command extends MenuItem { keywords?: string[]; group?: string }
interface TreeNode {
  id: string; label: string; description?: string; meta?: string;
  expanded?: boolean; disabled?: boolean; children?: TreeNode[];
}
interface SearchResult { id: string; title: string; path?: string; excerpt: string }
```

The internal icon helper is not a general icon library. Available names: plus, x, search, chevron-down, chevron-right, home, settings, file-text, book-open, message-square, history, check, copy, arrow-right, arrow-left, ellipsis, download, keyboard, tag, info, triangle-alert, undo-2, pencil, panel-left, check-check. Unknown names use the information glyph. Lucide notices are in `licenses/LUCIDE.txt`.

## Small composition examples

```svelte
<IconButton icon="plus" label="Add scene" onclick={addScene} />
<Field label="Synopsis" multiline bind:value={synopsis} />
<Checkbox label="Show guidance tips" bind:checked={guidance} />
<Select label="Scene status" options={statusOptions} bind:value={status} />
<Badge label="Fixed" tone="accent" />
<Notice title="Could not save" message={saveError} tone="error" />
<EmptyState title="No references" description="Add a character to begin.">
  <Button onclick={openReferenceForm}>Add character</Button>
</EmptyState>
<Panel title="References">
  {#snippet actions()}<IconButton icon="plus" label="Add reference" onclick={openReferenceForm} />{/snippet}
  <p>Your existing reference list goes here.</p>
</Panel>
```

These fragments use application-owned variables and handlers. Full, self-contained recipe source appears in the reference and in `reference/application/recipes.json`.

## Existing app ownership and adapters

| Current app source under `src/lib/components/` | Adoptable pieces | Keep in the app |
| --- | --- | --- |
| `RenameDialog.svelte`, `NewProjectDialog.svelte`, `DialogHeader.svelte`, `ConfirmDialog.svelte` | Button, Field, IconButton, Dialog | Existing `onSave`, `onClose`, `onConfirm`, `onCancel`; async errors; business validation. Adopt controls inside the old dialog first if replacing the modal shell would widen scope. |
| `Sidebar.svelte`, `ScenePanel.svelte` | NavigationTree, SegmentedControl, Select, Badge | `currentProject`, scene/chapter operations, routing, autosave, selection and scroll restoration. Map IDs/labels to `TreeNode`; route selected IDs back into existing handlers. |
| `BeatView.svelte`, `PageView.svelte`, `NovelEditor.svelte`, `ProseToolbar.svelte` | BeatItem; opt-in NovelEditor and ProseToolbar | Existing HTML callbacks, prose save queues, split actions, session persistence, shortcut store and command ownership. Keep current editors when adopting only the toolbar or paper styling. |
| `TagSelector.svelte`, `TagManager.svelte` | TagPicker, Badge, Field | Tag creation, `tag_entity` / `untag_entity` calls, stable tag colors and data. Diff selected IDs against existing IDs and invoke existing operations; do not introduce another tag store. |
| `ReferenceEditDialog.svelte`, `ReferencesPanel.svelte`, `CopyReferencesDialog.svelte` | Dialog, Panel, Field, SearchResults, EmptyState | Reference types, custom field definitions, copy rules, persistence and entity relationships. |
| `FieldRenderer.svelte` | Field, Checkbox, Select | `FieldDefinition`, JSON option decoding, multiselect serialization, nullable values. Preserve its `onChange(string \| null)` external contract through a local adapter. |
| `AppearanceSettings.svelte`, `SettingsDialog.svelte`, `ProjectSettings.svelte`, `AuthorSettings.svelte` | SegmentedControl, Checkbox, Field, Select, Panel | Settings stores, theme resolver, author/project updates, applying changes immediately. |
| `CommandPalette.svelte`, `KeyboardSettings.svelte` | CommandPalette, ShortcutRecorder | Command definitions/actions, fuzzy scoring if desired, shortcuts store, authoritative conflicts/reservations. Map IDs to existing actions instead of replacing command dispatch. |
| `FindReplaceDialog.svelte` | Field, Checkbox, SearchResults, Dialog, Notice | Project search, locked scene rules, replacement operations, transaction history and undo. The catalog only mutates a sample string. |
| `WritingProgress.svelte`, `WritingStatusBar.svelte`, `SnapshotsPanel.svelte`, `Previously.svelte` | Progress, StatGroup, Panel, BeatItem, EmptyState | Writing statistics stores, reset API, snapshot persistence and real previous-session data. |
| `EditorialWorkspace.svelte`, `ReviewSidebar.svelte`, `SuggestionCard.svelte` | Tabs, Panel, ManuscriptSurface, Notice | Review mode, manuscript editor, comment anchors, suggestions, draft revisions and review packages. |
| `ExportWorkspace.svelte`, `ExportDialog.svelte`, `ClassicExportDialog.svelte` | Select, Checkbox, NavigationTree, Button, ManuscriptSurface | Existing `scope`, `scopeId`, `onClose`, `onClassic`; profiles, `exportPrototype` utilities, selected chapters, document compilation, validation, native save dialogs and file output. |
| `AboutDialog.svelte`, `FeedbackDialog.svelte`, `ErrorToast.svelte` | Dialog, Notice, Field, Button | App metadata, feedback submission, error sources and update lifecycle. |

### Value adaptation

```svelte
<!-- Preserve FieldRenderer's string | null contract. -->
<Field label={definition.name} value={value ?? ''}
  onChange={(text) => onChange(text === '' ? null : text)} />

<!-- Preserve existing command action objects and dispatcher. -->
<CommandPalette bind:open commands={commands.map(({ id, label, keywords }) => ({ id, label, keywords }))}
  onSelect={(id) => commands.find(command => command.id === id)?.action()} />
```

The first value adapter does not automatically support every `FieldDefinition` subtype. Keep the existing renderer's date, boolean, multiselect, numeric, and URL conversion branches, replacing only the presentation for the branch being adopted. Shortcut strings use `Ctrl`, `Meta`, `Alt`, `Shift` plus the key; adapt to the existing shortcuts serializer.

## Recipes and state coverage

| Recipe | Component-level interaction demonstrated |
| --- | --- |
| Actions & fields | Required/disabled/busy states, validation, local success, destructive confirmation |
| Project navigation | Recursive expand/collapse, active scene, sample scene insertion |
| Writing surfaces | Metadata choices, beat disclosure, rich-text formatting, undo/redo, read-only state, shared mounted editors across Beats/Page |
| Tags & status | Filter, select, remove, empty filtered list, explicit status labels |
| Reference library | Empty list → validated creation → filtering → full reference details |
| Settings & custom fields | Appearance preference, guidance checkbox, custom field label/type/value |
| Dialogs & menus | Open, cancel, save, Escape, close, deletion and undo, action selection |
| Commands & shortcuts | Command filtering/invocation, shortcut filtering/recording/cancel/reservation feedback |
| Find & replace | Highlighted matches, no results, full scene detail, confirmed replacement and undo |
| Progress & history | Counts, daily progress, session reset, previous prose disclosure, sample snapshots |
| Editorial review | Manuscript surface, Review/References tabs, comment creation |
| Export workspace | Profile/format, content selection, settings navigation, sample reading surface, local profile feedback, callback request |

Recipe state lives in memory and is preserved while switching recipes. Reloading resets it. Existing legacy Controls/Prose examples retain their previous browser storage behavior. Library components do not persist user data or send requests. Export and command feedback explicitly identifies the requested callback and does not claim backend work occurred.

## Page-like WYSIWYG prose

The BeatItem example and Writing surfaces recipe use Tiptap on the same paper treatment as kindling's `NovelEditor.svelte`. Prose is HTML throughout; it never passes through a textarea or plain-text conversion. `ManuscriptSurface` remains a read-only presentation wrapper for review and export samples. It is not the replacement for the app's editor.

The page continues the existing Newsreader body typography, 36rem text measure, manuscript margins, paragraph indentation, light paper in either surrounding theme, and paper shadow. Desktop sheets retain the app's 40rem minimum height. Narrow layouts reduce the gutters and wrap the toolbar; prose stays at reading size. Toolbar targets are 44px, larger than the original compact controls, to support touch and visible keyboard focus.

The optional entry is `@kindling/design-system/svelte/editor`, exporting `NovelEditor`, `ProseToolbar`, and their integration types. It leaves the existing controls entry unchanged. New editor consumers install these optional peers together:

```sh
npm install @tiptap/core@3.20.1 @tiptap/starter-kit@3.20.1 @tiptap/extension-underline@3.20.1 @tiptap/extension-text-align@3.20.1 @tiptap/pm@3.20.1
```

kindling already supplies these packages. This project declares the optional peers and development versions without modifying the linked app. Its reference bundle includes the runtime locally, with notices in `licenses/EDITOR_DEPENDENCIES.txt`.

```svelte
<script lang="ts">
  import { NovelEditor } from '@kindling/design-system/svelte/editor';
  import '@kindling/design-system/fonts.css';
  import '@kindling/design-system/tokens.css';
  import '@kindling/design-system/application.css';
  let html = $state('<p>A new scene begins.</p>');
</script>

<div class="press-app">
  <NovelEditor content={html} label="Scene prose" onUpdate={(value) => html = value} />
</div>
```

### Behavior carried over

- Bold, italic, underline, strikethrough keyboard command, monospace, paragraph alignment, blockquotes, indentation, undo and redo.
- Native rich-text selection, paragraph editing, clipboard behavior, history and HTML output through Tiptap.
- Read-only state, word count, externally supplied saving/error feedback, and editor-instance access for app operations.
- The original schema disables headings, lists, code blocks and horizontal rules. These are existing prose restrictions, not removed capabilities. StarterKit's bundled underline is disabled so the explicit underline extension is registered only once.
- Toolbar selection states follow editor transactions, and toolbar clicks retain the text selection. Undo/redo controls reflect whether history is available.
- Tab inserts an indent; Shift+Tab follows browser focus navigation. Escape focuses the visible Leave editor control, from which Tab continues through the page. This provides an explicit exit from the editor's Tab handling.

The writing recipe retains both beat editor instances when switching views. Page mode removes beat disclosure chrome and exposes the same sheets. The view switch does not call `setContent`, flatten marks, or remount editors. Undo history and selection are retained per beat; it does not claim a cross-beat undo stack. `WritingExample.svelte` is both the live implementation and the generated copyable recipe source.

### Editor API and app adapters

| Prop or method | Contract |
| --- | --- |
| `content: string` | HTML from the existing app state. Echoed `onUpdate` values do not reset the editor. A genuinely external content replacement updates without emitting another save callback. |
| `onUpdate(html)` | Called for user document changes; connect the existing prose save handler. No API or storage operation runs inside this component. |
| `label`, `placeholder` | Accessible editor name and empty-page prompt. |
| `readonly=false` | Locks content and hides editing controls while retaining the paper and word count. |
| `saveStatus='idle'` | `idle`, `saving`, or `error`, supplied by the existing save queue. Catalog edits remain in memory and do not claim persistence. |
| `onEditorReady(editor)` | Receives the actual Tiptap editor, retaining the app's split-at-cursor and command integration pattern. |
| `getSplitBeforeParagraph()` | Exported component method: zero-based top-level paragraph index, or null before initialization. Access through `bind:this`. |
| `shortcuts: ShortcutAdapter` | `match(event): string | null` and `label(command): string`. Supply wrappers around the existing shortcuts store. Absent an adapter, defaults match the app's editor bindings. Reassigned built-in formatting bindings are suppressed as in the original KeyboardFormatting extension. |
| `projectId`, `sceneId`, `beatId` | Optional identifiers forwarded to the attachment hook; no session store is imported. |
| `onAttach({editor, scroller, projectId, sceneId, beatId})` | Attach existing cursor/scroll tracking and return its cleanup function. Cleanup runs on attachment/identity change or unmount. |

Inside the existing app, the adapter is small and keeps its current services:

```svelte
<script lang="ts">
  import { NovelEditor } from '@kindling/design-system/svelte/editor';
  import { shortcuts } from '../stores/shortcuts.svelte';
  import { trackEditorPosition } from '../utils/editorPosition';
  import type { Editor } from '@tiptap/core';
  import type { EditorAttachment, SaveStatus } from '@kindling/design-system/svelte/editor';
  let { content, onUpdate, projectId, sceneId, beatId = null, saveStatus = 'idle', onEditorReady }: {
    content: string; onUpdate: (html: string) => void;
    projectId: string; sceneId: string; beatId?: string | null;
    saveStatus?: SaveStatus; onEditorReady?: (editor: Editor) => void;
  } = $props();
  const keyAdapter = {
    match: (event: KeyboardEvent) => shortcuts.match(event),
    label: (id: string) => shortcuts.label(id)
  };
  function attach({ editor, scroller, projectId, sceneId, beatId }: EditorAttachment) {
    if (projectId && sceneId) return trackEditorPosition(editor, scroller, projectId, sceneId, beatId);
  }
</script>
<NovelEditor {content} {onUpdate} {projectId} {sceneId} {beatId} {saveStatus}
  {onEditorReady} shortcuts={keyAdapter} onAttach={attach} />
```

Those relative imports assume the existing `src/lib/components` location. Keep the existing `handleEditorUpdate(beat.id)`, prose save queues, split actions and scene identity at their current boundaries. Consumers can also adopt just `ProseToolbar` by passing their existing editor and a revision updated on transactions, with no editor replacement.

The adaptation references `NovelEditor.svelte`, `ProseToolbar.svelte`, `PageView.svelte`, `BeatView.svelte`, `keyboardFormatting.ts`, `keyboardShortcuts.ts`, and `editorPosition.ts` under the linked kindling `src/lib` directory. Those inputs were read without modification. The app's existing editor remains the behavior reference; this entry does not implement its backend, review model, or save queues.

## Baseline references

All 147 PNGs were copied unchanged from the supplied `qa/visual/baselines` directory, representing 49 scenarios × light/dark/narrow variants. Original SHA-256 values were matched to the supplied manifest during input preparation. `docs/APPLICATION_SOURCES.json` records dimensions, filenames, expectations, source mappings, and hashes.

- Light/dark originals: 3200 × 1936 px; 1600 × 968 logical pixels at 2×.
- Narrow originals: 2200 × 1336 px; 1100 × 668 logical pixels at 2×.
- Catalog frames: consistent 4:3, contained full images, 16px padding (8px on small screens). The image is never cropped or stretched.
- The browser loads only the selected reference image, with lazy loading. Full originals open through ordinary links.
- Baseline manifest revision: `223a249e97bac6618dae83478cb9c067314921ff`.
- Inspected app HEAD: `a5305576b0345a552d4fcbd57c372178d9d7f437`.

The images govern visual reference states. Current source informs component APIs and ownership. Their revisions differ; this library does not claim pixel equivalence. The manifest mentions known audit findings: those remain separate from this library, and the reference does not constitute QA acceptance. The narrow screenshot variant is still desktop-sized; the catalog also reflows at 375, 768, 1024 and 1440px.

## Build and maintenance

The distributed `index.html` loads local CSS, fonts and `reference/application/catalog.js`; it requires no development server or framework installation to open.

```sh
npm install
npm run reference:application
```

The build compiles `reference/application/main.ts`, `Catalog.svelte`, `Recipe.svelte`, and the exported components into an IIFE browser bundle. It does not render, preview, or test the page. The declared exact dev dependencies make the initial toolchain reproducible; consumers should commit their own resolved lockfile. Initial generation used those same locally available versions from the linked app checkout via an explicit `--toolchain` option, not a runtime dependency on that checkout.

Edit shared components in `design-system/svelte/`, shared rules in `design-system/application.css`, and catalog-only rules in `reference/application/catalog.css`. Examples and baseline data are local TypeScript modules so they work on `file://` without fetch. Keep recipe snippets in `recipes.json` and `recipes.ts` aligned when updating usage documentation. `reference:website` continues to own only its existing website marker region.

No automated visual suite, browser preview, post-generation test, or acceptance pass was run for this delivery. Existing baseline review notes describe the supplied inputs only. The app and its baseline directory were not modified.

## Complete individual examples

The Application section of `index.html` now includes a dedicated, always-expanded specimen for every public app component. Use the component index to jump to one of the 22 entries. Each entry includes its applicable states and complete Svelte source behind **Usage & Svelte source**.

Live example files are in `reference/application/examples/`. Their imports, state, handlers, markup, and child snippets are self-contained. The build reads those exact files to generate the registry and copyable code, changing only the package import paths and adding the three stylesheet imports for standalone consumers. This keeps copied examples aligned with the live specimens.

To update an example, edit its `*Example.svelte` file and run `npm run reference:application`. Edit descriptions/state labels in `examples/manifest.json`. The original twelve recipes, baseline browser, and legacy foundation examples remain available.
