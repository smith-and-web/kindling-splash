---
title: Translating kindling
description: "Help improve kindling's interface in Simplified Chinese, Spanish, Brazilian Portuguese, Russian, German or French, or add a new language to the app."
---

kindling's interface is translated into seven languages, and native speakers are warmly welcome to make each one better. Most of the current translations have not yet been read end to end by a native speaker, so even small corrections help: an awkward phrase, a term writers in your language would never use, or a label that gets cut off.

| Language           | Code    | Catalog                                                                                                  |
| ------------------ | ------- | -------------------------------------------------------------------------------------------------------- |
| English (source)   | `en`    | [`locales/en`](https://github.com/smith-and-web/kindling/tree/main/src/lib/i18n/locales/en)       |
| <span lang="zh-CN">简体中文</span>           | `zh-CN` | [`locales/zh-CN`](https://github.com/smith-and-web/kindling/tree/main/src/lib/i18n/locales/zh-CN) |
| <span lang="es">Español</span>            | `es`    | [`locales/es`](https://github.com/smith-and-web/kindling/tree/main/src/lib/i18n/locales/es)       |
| <span lang="pt-BR">Português (Brasil)</span> | `pt-BR` | [`locales/pt-BR`](https://github.com/smith-and-web/kindling/tree/main/src/lib/i18n/locales/pt-BR) |
| <span lang="ru">Русский</span>            | `ru`    | [`locales/ru`](https://github.com/smith-and-web/kindling/tree/main/src/lib/i18n/locales/ru)       |
| <span lang="de">Deutsch</span>            | `de`    | [`locales/de`](https://github.com/smith-and-web/kindling/tree/main/src/lib/i18n/locales/de)       |
| <span lang="fr">Français</span>           | `fr`    | [`locales/fr`](https://github.com/smith-and-web/kindling/tree/main/src/lib/i18n/locales/fr)       |

To see the app in a language, choose it in **Settings → Appearance & Guidance → Language**. See [Language](/docs/settings/#language) for how kindling picks one by default.

## Report a wording problem

You don't need to touch any code. Send a screenshot and the wording you would suggest through any of these:

- **Help → Send Feedback…** in the app
- an [issue on GitHub](https://github.com/smith-and-web/kindling/issues/new?template=bug_report.yml)
- a post in [GitHub Discussions](https://github.com/smith-and-web/kindling/discussions)

## Improve a translation

Each catalog is a folder of plain TypeScript files of `key: "text"` pairs, grouped by part of the app: `sidebar.ts`, `settings.ts`, `export.ts` and so on. Edit the text on the right and open a pull request.

- **Keep every `{placeholder}` intact.** `{count}`, `{title}` and the like are filled in by the app. Move them wherever your language needs them, but don't translate or remove them. A test fails on a missing placeholder.
- **Counts have one entry per plural form.** English has `.one` and `.other` (`1 scene`, `3 scenes`). Your language has the forms it uses for whole numbers: Russian has `.one`, `.few` and `.many`; Chinese has only `.other`. Translate each form you find.
- **Use the glossary.** The [interface glossary](https://github.com/smith-and-web/kindling/blob/main/docs/i18n-glossary.md) records how each language renders core terms like *beat*, *scene* and *reference*, so the same idea reads the same way everywhere. If you think a term is wrong, change the glossary in the same pull request as the catalogs, so the whole app stays consistent. Some terms are still open, such as the Spanish *beat*.

## Add a new language

**Wanted: Traditional Chinese (`zh-TW`).** Systems set to Traditional Chinese currently read the Simplified Chinese interface. If you can translate into Traditional Chinese, we'd love to hear from you.

Adding a language needs a catalog, its plural forms, a registry entry, the native menu labels and the glossary column. The steps are in [Internationalization](https://github.com/smith-and-web/kindling/blob/main/docs/ARCHITECTURE.md#internationalization-srclibi18n) in the architecture notes. Start by adding a column to the glossary, then copy the English catalog. Components don't change.

If you'd like to take on a language but would rather not set up a development build, open a [discussion](https://github.com/smith-and-web/kindling/discussions) first and we'll work out the rest together.
