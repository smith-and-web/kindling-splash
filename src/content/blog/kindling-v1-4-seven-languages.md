---
title: "kindling v1.4: Now in Seven Languages"
description: "kindling now speaks English, Simplified Chinese, Spanish, Brazilian Portuguese, Russian, German and French, and switches languages without a restart."
publishedDate: "2026-11-09"
author: "kindling"
tags: ["announcement"]
draft: false
---

kindling v1.4 speaks your language. The whole interface, from the menus and dialogs to the guidance tips, dates, numbers and word counts, is now available in seven languages:

- English
- <span lang="zh-CN">简体中文</span>: Simplified Chinese
- <span lang="es">Español</span>: Spanish
- <span lang="pt-BR">Português (Brasil)</span>: Brazilian Portuguese
- <span lang="ru">Русский</span>: Russian
- <span lang="de">Deutsch</span>: German
- <span lang="fr">Français</span>: French

Everything else about kindling stays the same. It is free, open source, works offline and needs no account, in every one of them.

## It opens in your language

kindling follows your operating system's language. If your computer is set to German, kindling opens in German. Every variety of Spanish, French and German reads its language's interface, and Portuguese from anywhere reads the Brazilian translation. Traditional Chinese systems read Simplified Chinese until a Traditional catalog exists. Any other language reads English.

## Switch whenever you like

Perhaps you write in one language and think about software in another. Open **Settings → Appearance & Guidance** and choose a **Language**. The whole app switches straight away, native menus included, with no restart and no lost place in your draft. Choose **System default** to follow your operating system again.

The setting changes kindling, not your writing. Your manuscript, outline and references stay exactly as you wrote them, and an EPUB's language is still set in its export's **Book details**.

[See the Language setting](/docs/settings/#language).

## Grammar, not just words

Translating an interface takes more than swapping labels. English has two forms for a count: 1 scene, 3 scenes. Russian has three (<span lang="ru">1 сцена, 3 сцены, 5 сцен</span>), and Chinese has one (<span lang="zh-CN">3 个场景</span>). kindling now chooses the right form for every count of words, scenes and beats, in each language.

Numbers and dates follow local conventions too. A word count of 12,500 in English reads 12.500 in German and 12 500 in French. Sentences that used to be assembled from fragments were rewritten whole, so they read naturally once translated. In Chinese, headings and prose are set in a serif face, keeping the bookish feel of the English interface.

## Help us get it right

We want each translation to read as if it were written for writers in that language. Most of them have not yet been read end to end by a native speaker. That is where you come in.

If a phrase reads awkwardly, a term is one writers in your language would never use, or a label gets cut off, please tell us. A screenshot and the wording you would suggest are all we need. Send it through **Help → Send Feedback…** in the app, open an issue on [GitHub](https://github.com/smith-and-web/kindling/issues), or post in [Discussions](https://github.com/smith-and-web/kindling/discussions).

Some choices are still open. Should a *beat* be a *tiempo* in Spanish? French uses *temps fort*; German keeps *Beat*, as German screenwriters do. If you have an opinion, we would like to hear it.

The translations are plain text files, so you can also edit them directly. The [translation guide](/docs/contributing/translating/) shows where they live, how the interface glossary keeps terms consistent, and how to add a new language.

## Also in v1.4

- **Linux:** the AppImage no longer opens a blank window on systems with newer Mesa graphics drivers (Mesa 25 and up). This may also fix the long-standing blank window in [issue #252](https://github.com/smith-and-web/kindling/issues/252), which we could not confirm on the affected hardware. If you saw it, please try 1.4 and tell us on that issue. An affected app could not show you the update prompt, so [download 1.4](/download/) directly.
- **Linux:** the AppImage also launches when it is run from a sandbox or another tool that mounts it directly.
- **Export:** the live preview keeps up with your settings, so it no longer shows an earlier font or line spacing after you change them.
- **Editor:** saving no longer makes the beat toolbar or the scene panel jump.
- **Editorial review:** Manuscript actions grey out while a review action is still working, instead of appearing to do nothing.
- **Security:** the SQLite engine that stores your projects is updated to fix a security flaw in the previous version, and the libraries that check certificates for update checks and feedback are updated too. Your existing projects open as before.

If you already have kindling, it will offer the update the next time it checks. Otherwise, [download kindling](/download/) for macOS, Windows or Linux.
