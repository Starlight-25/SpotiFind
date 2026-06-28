# CLAUDE.md — SpotiFind

> Version : 0.1.0 — 2026-06-17
> Framework Zelian : `framework_version: v2.5.8`
> Marker projet : voir `.zelian/project.json` (source de vérité depuis v2.1.0)

## Stack

- **Framework :** Next.js 14.2.35 (App Router)
- **BDD :** Aucune — favoris en localStorage côté client
- **ORM :** Aucun
- **Auth :** Supabase (email/password) pour les favoris — Spotify retiré
- **Déploiement :** Non défini

## Commandes

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # ESLint
```

## Rules actives

- @.claude/rules/00-global.md
- @.claude/rules/01-database.md
- @.claude/rules/02-stack.md
- @.claude/rules/03-retro.md
- @.claude/rules/04-testing.md
- @.claude/rules/05-git-workflow.md
- @.claude/rules/06-adr-policy.md

## Modules

| Module | Spec fonctionnelle | Spec technique | ADRs |
|--------|---|---|---|
| search | [docs/specs/search/spec-fonctionnel.md](docs/specs/search/spec-fonctionnel.md) | [docs/specs/search/spec-technique.md](docs/specs/search/spec-technique.md) | RETRO-001, RETRO-002 |
| proxy-lastfm | [docs/specs/proxy-lastfm/spec-fonctionnel.md](docs/specs/proxy-lastfm/spec-fonctionnel.md) | [docs/specs/proxy-lastfm/spec-technique.md](docs/specs/proxy-lastfm/spec-technique.md) | RETRO-001, RETRO-002 |
| ~~proxy-spotify~~ | ~~[OBSOLÈTE]~~ | ~~[OBSOLÈTE]~~ | ~~RETRO-002~~ |
| ~~spotify-token~~ | ~~[OBSOLÈTE]~~ | ~~[OBSOLÈTE]~~ | — |
| artist-page | [docs/specs/artist-page/spec-fonctionnel.md](docs/specs/artist-page/spec-fonctionnel.md) | [docs/specs/artist-page/spec-technique.md](docs/specs/artist-page/spec-technique.md) | RETRO-001 |
| album-page | [docs/specs/album-page/spec-fonctionnel.md](docs/specs/album-page/spec-fonctionnel.md) | [docs/specs/album-page/spec-technique.md](docs/specs/album-page/spec-technique.md) | RETRO-001 |
| favourites | [docs/specs/favourites/spec-fonctionnel.md](docs/specs/favourites/spec-fonctionnel.md) | [docs/specs/favourites/spec-technique.md](docs/specs/favourites/spec-technique.md) | RETRO-004 |

**Audit :** voir [docs/retro/audit-initial.md](docs/retro/audit-initial.md) — mis à jour 2026-06-28, stubs implémentés, Spotify retiré.
