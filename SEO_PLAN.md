# Kindling SEO Optimization Plan

Comparison of the 8 recommended optimizations vs. current site state, plus drafted content for anything new.

## Status summary

| # | Keyword | Recommendation | Current state | Action |
|---|---------|----------------|---------------|--------|
| 1 | `kindling software` | CTR — title/meta + schema | Title, meta, schema all present. Missing literal phrase "Kindling Software" | **Tune** homepage title/meta |
| 2 | `kindling app` | Ranking — /download/ copy + CTAs | Title has "Writing App" but not "Fiction Writing App" or "Kindling App". Body never uses phrase | **Tune** download page |
| 3 | `plottr alternative` | New blog post | **Does not exist.** `best-scrivener-alternatives-for-plotters.md` exists, but no Plottr-alternatives post | **Create** new blog post (draft below) |
| 4 | `plottr vs scrivener` | New comparison post | **Already exists** at `/plottr-vs-scrivener/`, comprehensive, with schema. Kindling positioned as "bridge" | **Reposition** — strengthen "free alternative" framing |
| 5 | `what to use for kindling` | CTR — disambiguate from fire | Homepage meta says "fiction writing software" — filters well | **No change** needed |
| 6 | `what to use as kindling` | CTR — filter fire-starter intent | Same as #5; meta is clear | **No change** needed (optionally add negative-keyword note for Google Ads) |
| 7 | `scrivener alternative free` | New landing page | Blog post exists (`best-scrivener-alternatives-for-plotters.md`); **no dedicated landing page** | **Create** `/free-scrivener-alternative/` LP (draft below) |
| 8 | `fiction writing software comparison` | Enhance `/compare/` | `/compare/` has 17-feature matrix, 6 tools, pros/cons, FAQ schema. Already strong | **Minor** — broaden meta, add ComparisonChart schema |

---

## 1. `kindling software` — homepage tuning

**Current:** [src/pages/index.astro](src/pages/index.astro)
- Title: `Kindling Writer – Free Fiction Writing Software for Plotters & Pantsers`
- Meta: `Kindling Writer is free, open-source fiction writing software…`
- `SoftwareApplication` schema present (lines 9–31)

**Gap:** The literal phrase "Kindling Software" never appears. Google's exact-phrase match weight is small but nonzero for a brand-adjacent term.

**Action:**
- Update title to include "Kindling Software" as a phrase variant:
  - **New title:** `Kindling Writer — Free Fiction Writing Software for Plotters & Pantsers`
  - Keep as-is — the dash vs. em-dash matters less than including "Kindling" + "Software" adjacent. Already present.
- Update meta description to open with the phrase:
  - **New meta:** `Kindling Writer is free fiction writing software that keeps your outline visible while you draft. Import from Plottr, Scrivener, yWriter, or Obsidian. Desktop app for macOS, Windows & Linux.` (drops "open-source" from lead — still appears on page body)
- Add an H2 on the homepage near the feature section:
  - **New H2:** `Fiction writing software built for outline-driven novelists`

**Schema:** Already complete. Verify `applicationCategory` is `"WritingApplication"` or `"ProductivityApplication"` — preferred values.

---

## 2. `kindling app` — /download/ tuning

**Current:** [src/pages/download/index.astro](src/pages/download/index.astro)
- Title: `Download Kindling Writer — Free Writing App for Mac, Windows & Linux`
- Meta: `Download Kindling Writer for macOS, Windows, or Linux. Free, open-source writing app…`
- H1: `Download Kindling`
- Phrase "Kindling app" / "fiction writing app" never appears in body

**Action:**
- **New title:** `Download Kindling — Free Fiction Writing App for Mac, Windows & Linux`
- **New meta:** `Download the Kindling app for macOS, Windows, or Linux. Free, open-source fiction writing software — no account required, works offline. Import outlines from Plottr, Scrivener, yWriter, or Obsidian.`
- Add a subheading under H1: `The free fiction writing app for plotters and pantsers`
- Ensure body includes "the Kindling app" and "fiction writing app" at least once each in trust/feature copy.

---

## 3. `plottr alternative` — new blog post (draft)

**Current:** No post targets this. Nearest is [best-scrivener-alternatives-for-plotters.md](src/content/blog/best-scrivener-alternatives-for-plotters.md) — different angle.

**Action:** Create `src/content/blog/best-plottr-alternatives-for-fiction-writers.md`.

**Drafted frontmatter + content:**

```markdown
---
title: "Best Plottr Alternatives for Fiction Writers in 2026"
description: "Plottr is great for planning, but it stops at the outline. Here are the best Plottr alternatives — including free options — for fiction writers who want a tool that takes them from outline to first draft."
pubDate: 2026-04-22
heroImage: /blog/plottr-alternatives-hero.png
tags: [plottr, alternatives, software, comparison]
---

Plottr is a beloved outlining tool. Visual timelines, beat sheets, templates for every story structure — it earns its reputation. But once you've outlined your novel in Plottr, you still have to open a different app to actually write it. That's where a lot of writers get stuck.

This post covers the best Plottr alternatives in 2026, ranked by what they do well and who they're for.

## What to look for in a Plottr alternative

Plottr's strengths are template-driven plotting, visual timelines, and structure. A worthy alternative should match at least one of those and add something Plottr doesn't do — usually, drafting.

Our shortlist weighs:

- **Outline depth** — can you break a novel into acts, sequences, scenes, and beats?
- **Drafting integration** — can you write the book in the same tool?
- **Import/export** — can you move existing Plottr projects in?
- **Price** — Plottr is ~$25/year or $99 one-time. Free alternatives exist.
- **Platform** — desktop, web, mobile, cross-sync.

## 1. Kindling Writer — best for plotters who want to draft in one tool

**Price:** Free (open-source) · **Platform:** macOS, Windows, Linux

Kindling was built for the moment Plottr stops being useful: when you have a complete outline and need to turn it into prose. It imports Plottr `.pltr` files directly, so your scenes, beats, and characters come across intact. Then it pins your outline beside the draft, so you never lose the thread while writing.

**Where it beats Plottr:**
- Drafting is first-class — you don't leave the tool to write
- Free and open-source, no subscription
- Works offline, no account required
- Scrivener and yWriter import too, if you've moved around

**Where Plottr still wins:** Visual timelines and story-structure templates. If template-driven plotting is your whole workflow, pair Plottr → Kindling.

[Download Kindling free →](/download/)

## 2. Scrivener — best for heavy-research novels

**Price:** $59 one-time · **Platform:** macOS, Windows, iOS

Scrivener's corkboard and binder have been the industry standard for 20 years. It's less template-driven than Plottr but more flexible for writers who want to restructure as they go. Scrivener's research folder and snapshots are unmatched for novels that need to track a lot of external material.

**Where it beats Plottr:** Drafting environment, research organization, compile/export.
**Where Plottr still wins:** Beat-sheet templates, visual plot timelines, shared character/worldbuilding fields.

## 3. Novelcrafter — best for AI-assisted plotting

**Price:** $4–$20/month · **Platform:** Web

Novelcrafter combines a codex (worldbuilding), scene cards, and an AI writing assistant. It's the closest thing to a modern Plottr-plus-Scrivener hybrid, but it's cloud-only and subscription-based.

**Where it beats Plottr:** AI drafting, modern UI, codex for worldbuilding.
**Where Plottr still wins:** Offline use, one-time pricing, no AI dependency.

## 4. Campfire Write — best for worldbuilding-heavy fiction

**Price:** Free tier + $4–$10/month modules · **Platform:** Web

Campfire is modular — you pay for the features you need (timelines, relationships, manuscript, etc.). It's strongest for fantasy and sci-fi writers tracking dozens of characters, locations, and magic systems.

**Where it beats Plottr:** Worldbuilding depth, relationship graphs.
**Where Plottr still wins:** Simplicity and focus on plot structure specifically.

## 5. Dabble — best cloud-based alternative

**Price:** $10/month · **Platform:** Web, macOS, Windows

Dabble is the most direct Plottr-to-drafting replacement on the list. It combines plotting, drafting, and goal tracking in one clean interface. Subscription-only.

**Where it beats Plottr:** Drafting in the same tool, cloud sync.
**Where Plottr still wins:** One-time purchase option, richer templates.

## 6. Obsidian + community plugins — best free power-user option

**Price:** Free · **Platform:** macOS, Windows, Linux, iOS, Android

With the right plugins (Longform, Novel Word Count, Kanban), Obsidian becomes a surprisingly capable novel workspace. The learning curve is steep and nothing is pre-built for fiction, but the ceiling is high.

**Where it beats Plottr:** Free, extensible, offline, graph view for character/world relationships.
**Where Plottr still wins:** Out-of-the-box plotting experience; no setup required.

## Comparison at a glance

| Tool | Outline | Draft | Free | Offline | Import Plottr |
|------|---------|-------|------|---------|---------------|
| Kindling Writer | ✓ | ✓ | ✓ | ✓ | ✓ |
| Scrivener | ✓ | ✓ | — | ✓ | — |
| Novelcrafter | ✓ | ✓ | — | — | — |
| Campfire Write | ✓ | ✓ | Partial | — | — |
| Dabble | ✓ | ✓ | — | Partial | — |
| Obsidian | Partial | ✓ | ✓ | ✓ | — |

## Migrating from Plottr: the workflow we recommend

If you already have a novel outlined in Plottr, don't start over. Here's the fastest migration:

1. Export your Plottr project as a `.pltr` file (File → Export)
2. Open Kindling and choose **Import → Plottr**
3. Your scenes, beats, chapters, and characters come across as a navigable outline
4. Draft scene-by-scene with the outline pinned beside your prose

You keep the plotting work you already did and gain a drafting environment built around it.

## Which Plottr alternative should you pick?

- **You want free + offline + to draft in one tool:** Kindling Writer
- **You want the industry-standard writing environment:** Scrivener
- **You want AI help and don't mind cloud + subscription:** Novelcrafter
- **You're worldbuilding-heavy:** Campfire Write
- **You want cloud sync and an all-in-one subscription:** Dabble
- **You're a power user who wants to build your own system:** Obsidian

The right tool is the one that gets you from "I outlined my novel" to "I drafted my novel." Plottr is excellent at the first half. Pick the alternative that handles the second.

[Download Kindling Writer — free →](/download/)
```

---

## 4. `plottr vs scrivener` — existing page, reposition Kindling

**Current:** [src/pages/plottr-vs-scrivener/index.astro](src/pages/plottr-vs-scrivener/index.astro) — exists, comprehensive, has schema. Title: `Plottr vs Scrivener (2026) — Honest Comparison + Free Alternative`. Kindling is framed as a "bridge tool" in the workflow rather than a direct alternative.

**Do NOT create a duplicate post.** Recommendation #4 ("Plottr vs Scrivener vs Kindling Writer") would be redundant.

**Action:** Strengthen Kindling's positioning within the existing page:
- Add a new H2 near the top: `Kindling Writer: the free alternative that does both`
- Summary paragraph framing Kindling as the one tool that spans Plottr's plotting + Scrivener's drafting, for writers who don't want two apps or two subscriptions.
- Keep the "bridge workflow" section further down — it's useful for writers already invested in both tools.

**Drafted insertion (place after the comparison tables, before "Where Kindling Fits"):**

```html
<h2>Kindling Writer: the free alternative that does both</h2>
<p>
  If you're choosing between Plottr and Scrivener, here's the third option most
  writers don't hear about: <strong>Kindling Writer</strong> combines Plottr-style
  outlining with Scrivener-style drafting in one free, open-source desktop app.
  You outline your novel by beat and scene, then draft with that outline pinned
  beside your prose — no app-switching, no subscription, no account.
</p>
<p>
  Kindling imports directly from both Plottr <code>.pltr</code> files and
  Scrivener projects, so nothing you've built in either tool is wasted. It's
  the shortest path from "I have an outline" to "I have a first draft."
</p>
<a href="/download/" class="cta">Download Kindling free →</a>
```

---

## 5 & 6. `what to use for kindling` / `what to use as kindling` — filter fire-starter intent

**Current:** Homepage and download meta descriptions both lead with "fiction writing software" / "writing app." That disambiguation already filters most fire-kindling traffic.

**Action:** No code change required. Optionally, if you run Google Ads:
- Add negative keywords: `fire`, `firewood`, `wood`, `tinder`, `camping`, `fireplace`, `survival`

---

## 7. `scrivener alternative free` — new landing page (draft)

**Current:** Blog post [best-scrivener-alternatives-for-plotters.md](src/content/blog/best-scrivener-alternatives-for-plotters.md) exists but is a *roundup* (positions Kindling among 5+ alternatives). No dedicated landing page where Kindling *is* the free Scrivener alternative.

**Do NOT duplicate the blog roundup.** Keep the blog as top-funnel comparison content. The new LP is bottom-funnel conversion content.

**Action:** Create `src/pages/free-scrivener-alternative/index.astro`. Use the same layout pattern as `/story-outlining-software/` and `/plottr-vs-scrivener/`.

**Drafted page metadata + body copy:**

```astro
---
// Frontmatter
const title = "Free Scrivener Alternative for Fiction Writers — Kindling Writer";
const description = "Kindling Writer is a free, open-source alternative to Scrivener for fiction writers. Outline and draft in one desktop app. Imports Scrivener projects. No subscription, no account, works offline.";
---
```

**H1:** `The free Scrivener alternative for fiction writers`

**Lead paragraph:**
> Scrivener is brilliant — and for most fiction writers, it's overkill. If you don't need the binder, the corkboard, the research folders, and the compile system, you're paying $59 for features you'll never touch. Kindling Writer is the free, open-source alternative built around the one thing most novelists actually need: an outline that stays visible while you draft.

**Section 1 — "What you get for free":**
- Scene-and-beat outlining that reads like Scrivener's corkboard, but linear
- Outline pinned beside your draft — no switching between binder and editor
- Import your existing Scrivener projects (`.scriv`) directly
- Export back to Scrivener, Word, Markdown, or plain text
- Desktop app — macOS, Windows, Linux. Not a web app, not a subscription.
- No account required. Works offline. Your novel stays on your machine.

**Section 2 — "How it compares to Scrivener":**

| Feature | Scrivener | Kindling Writer |
|---------|-----------|-----------------|
| Price | $59 one-time | Free forever |
| Platforms | Mac, Windows, iOS | Mac, Windows, Linux |
| Outlining | Corkboard + binder | Scenes + beats, pinned |
| Drafting | Rich text editor | Distraction-free editor |
| Research folder | ✓ | — (use Obsidian or files) |
| Compile | Powerful, complex | Simple export (Word, MD, txt) |
| Scrivener import | — | ✓ |
| Open-source | — | ✓ |
| Offline | ✓ | ✓ |
| Subscription | — | — |

**Section 3 — "Who this is for":**
- You've tried Scrivener and found it overwhelming
- You want to outline *and* draft in the same tool, without a subscription
- You want your novel saved locally, not in a cloud you don't control
- You're a plotter or plantser — someone who plans before drafting

**Section 4 — "Who Scrivener is still better for":**
(Be honest — this builds trust and filters bad-fit users)
- You run heavy research workflows (reference PDFs, web pages, images)
- You need granular compile/export for specific publishers
- You need iOS to write on iPad
- You've already invested years in Scrivener's ecosystem

**Section 5 — "How to switch from Scrivener to Kindling":**
1. Export your Scrivener project (or use the `.scriv` bundle directly)
2. Open Kindling → Import → Scrivener
3. Your chapters, scenes, and notes import as a navigable outline
4. Keep Scrivener installed — you can export back any time

**CTA block:**
> Download Kindling free for Mac, Windows, or Linux → [/download/](/download/)

**Schema:** `SoftwareApplication` + `FAQPage` (match `/compare/` pattern). FAQ items:
- Is Kindling really free?
- Can Kindling open my existing Scrivener projects?
- Does Kindling work offline?
- Is Kindling as powerful as Scrivener?
- Can I export back to Scrivener?

**Internal links:** Link to `/compare/`, `/download/`, the Scrivener-alternatives blog post, and `/plottr-vs-scrivener/`.

---

## 8. `fiction writing software comparison` — enhance `/compare/`

**Current:** [src/pages/compare/index.astro](src/pages/compare/index.astro) already has 17-feature matrix, 6 tools, pros/cons per tool, FAQ schema.

**Action (light touch):**
- Broaden meta description to include "fiction writing software comparison" as a phrase:
  - **New meta:** `The fiction writing software comparison: Kindling vs Scrivener, Plottr, Dabble, Novelcrafter, and Campfire Write. Feature matrix, pricing, and which tool is right for plotters, pantsers, and worldbuilders.`
- Title broadening (optional): `Fiction Writing Software Comparison: Kindling vs Scrivener, Plottr & More`
- Consider adding `@type: "ItemList"` schema around the tool list, and/or individual `Product` / `SoftwareApplication` nodes per tool compared.
- Add a short intro paragraph that uses the target phrase in the first 150 words.

---

## Implementation order (suggested)

**Phase 1 — quick wins (≤1 hour):**
1. Homepage title/meta tune (#1)
2. Download page title/meta tune (#2)
3. Compare page meta broaden (#8)
4. Reposition insertion on plottr-vs-scrivener (#4)

**Phase 2 — new content (2–4 hours):**
5. Free Scrivener alternative landing page (#7) — uses drafted copy above
6. Plottr alternatives blog post (#3) — uses drafted copy above

**Phase 3 — nice-to-have:**
7. ComparisonChart / ItemList schema on `/compare/` (#8)
8. Google Ads negative-keyword list (#5, #6)

---

## Open questions before implementing

1. **Blog hero image** for the Plottr alternatives post — want me to reuse an existing blog hero or skip the `heroImage` field?
2. **Landing page slug** — `/free-scrivener-alternative/` or `/scrivener-alternative/`? Former matches exact query, latter is broader.
3. **Homepage H2 addition** (#1) — add it, or keep homepage as-is and lean on title/meta only?
