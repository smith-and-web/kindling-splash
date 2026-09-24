# Source authority and releases

## Source of truth

For this local package, `design-system/tokens.css` is the sole token authority. Edit values or add tokens there, run `npm run tokens:generate`, and commit the CSS and JSON together. `tokens.json` is generated, never hand-edited. Preserve the existing `light` / `dark` schema and token keys.

`components.css` owns shared selectors and styling. `DESIGN.md` owns current Press rules beyond CSS. `docs/DESIGN_GUIDE.md` preserves extended rationale. Root `tokens.css` and `colors_and_type.css`, the native manifest, component inventory, previews and app kit bundle are generated with `npm run open-design:build`; edit their source inputs, never the mirrors. The standalone `index.html` demonstrates that foundation; reference-specific styles in `reference/` are not new public tokens. `docs/BASELINE_DESIGN_GUIDE.md` is historical evidence only. It is not a competing authority.

`assets/source/kindling-source.svg` owns the original mark geometry. The Fraunces file and the original wordmark axes own wordmark outlining. Generated `svg/`, `png/`, `favicon/`, `app-icons/`, and `social/` files must not be redrawn by hand. The package's optional build scripts now read raw palette colors from canonical CSS through `assets/token_values.py`. Literal source colors still identify the paths in the original SVG; those are geometry-selection keys, not a second output palette.

The owner designated this Press repository as the definitive system on 2026-09-14. The sibling `brand-assets` is retired input, not an upstream source. Open Design receives generated copies from Press. Shared changes made there must return to Press before the next synchronization. Consumer repositories still require their own import migration; retiring the source does not change their installed files automatically.

## Token generation

From the package root:

```sh
npm run tokens:generate
npm run tokens:check
```

The existing Node-only generator resolves `var(--token)` aliases, overlays `[data-theme="dark"]` on the root declarations, detects unknown references and cycles, and writes stable JSON. Its paths resolve from the script location, not the invoking working directory. It supports the repository's existing CSS structure, not arbitrary CSS parsing: keep canonical declarations in the root and dark blocks; do not add conditional token definitions, nested rules, or unsupported alias syntax without updating the generator first.

`tokens:check` is a non-writing drift check for maintainers and CI. `system:check` also checks the Open Design token entries, preview versions, manifest targets and original artwork. Completed consolidation checks are recorded in `CONSOLIDATION_VALIDATION.md`.

## Version policy

0.1.0 is the first local package version. Use SemVer deliberately even during 0.x:

- Patch: documentation, packaging fixes, or corrections that preserve token and component contracts.
- Minor: additive opt-in tokens, components, or asset variants.
- Breaking release: renamed/removed tokens, changed JSON schema, selectors, default global styles, typography roles, or materially changed existing visuals. Document consumer action and make the breaking change explicit; do not disguise it as a patch.

Consumers should pin exact versions and commit lockfiles. Deprecate a token through an alias before removal where practical; keep migration notes. Local reference version labeling must track `package.json`.

## Release procedure (manual; no automatic publication)

1. Review the intended source changes, dirty baseline provenance, rights notices, and required consumer migrations.
2. Update `package.json` and `CHANGELOG.md`. Regenerate JSON. Update the reference's version label.
3. Run the documented drift check in the maintainer environment. Review any intentional asset or token changes and their consumer effects before distribution.
4. Run `npm pack` from the package root to create the local archive. The explicit `files` list omits local caches and workspace scaffolding. There are no install or prepack scripts.
5. Record the archive SHA-256 and associate it with the reviewed source commit and version in the maintainer's release record. Keep the archive immutable.
6. Install that exact archive in each consumer and use the consumer's ordinary release process. Keep the previous archive and lockfile for rollback.
7. Only after a separately authorized decision about registry ownership, rights and visibility should maintainers change `private: true` or configure a registry release. This delivery does not publish, tag, commit, push, or make that decision.

Rollback means restoring the prior exact archive/dependency and consumer lockfile, then rebuilding the consumer. Never rewrite an already distributed archive under the same version.

## Asset maintenance (optional)

Consumers use the supplied generated files and need no Python or Cairo. Maintainers can regenerate with an isolated environment from the package root:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r assets/requirements.txt
.venv/bin/python assets/build_assets.py
.venv/bin/python assets/build_rasters.py
```

Install the native Cairo library through the host platform's normal tooling if needed. `iconutil` is optional and macOS-specific: without it, the raster script writes other outputs, prints that `.icns` was not rebuilt, and retains the existing `.icns`. A changed icon requires macOS regeneration before distributing an updated `.icns`.

The original requirements file claimed pinned dependencies in its documentation but contained no version pins and did not explicitly list Pillow. This package lists all three imports without inventing tested pins. Before reproducible regeneration, maintainers must select and record reviewed tool versions and the native Cairo version. Existing shipped assets were copied, not regenerated in this delivery. Original wordmark geometry and font binary are unchanged.

The token generator also refreshes `reference/tokens.js`, the browser-readable mirror used by the offline token explorer. It is generated from the same CSS in the same command; the drift command covers both mirrors. Do not hand-edit it.

## Website layer governance — 0.2.0

`design-system/website.css` and `website.js` own the opt-in `pw-*` style and data-hook API. Their addition is a minor release; future incompatible selector or behavior changes need explicit migration. These files are not implicitly added to the original aggregate entry. `reference/website-snippets.json` owns catalog examples and their usage/source descriptions. Run `npm run reference:website` after changing those examples to generate their live and copyable HTML together. The canonical runnable entry remains root `index.html`; the marked Website region is generated while foundations and Application content remain authored source.
