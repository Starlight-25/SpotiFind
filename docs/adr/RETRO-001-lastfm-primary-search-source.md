# RETRO-001 — Last.fm comme source primaire de recherche musicale

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-17          |
| Source     | Rétro-ingénierie    |
| Features   | search              |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | STACK |
| Q1 — Coût de revert > 1j ? | OUI — remplacer Last.fm implique de réécrire `src/app/api/search/route.ts` (méthodes et champs de query spécifiques), `src/lib/music-types.ts` (interfaces calquées sur la forme JSON Last.fm : `trackmatches`, `artistmatches`, `albummatches`, champ `#text` pour les images), et la logique `getImage` dans `SearchResults.tsx` qui exploite la convention de taille Last.fm (`small`, `medium`, `large`, `extralarge`). L'impact est transverse à au moins 4 fichiers sur des structures de données non triviales. |
| Q2 — Non-déductible du code ? | OUI — `package.json` ne contient aucun SDK Last.fm ; le choix de Last.fm plutôt que MusicBrainz, Discogs ou Spotify Search (déjà présent dans le projet pour les pages détail) ne se déduit pas de la configuration. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — les fichiers `src/app/api/search/route.ts`, `src/lib/music-types.ts`, `src/hooks/useSearch.ts` et `src/components/SearchResults.tsx` dépendent tous structurellement du modèle de réponse Last.fm. Toute future page de détail liée aux résultats de recherche en dépendra aussi. |
| Q4 — Casse un invariant si ignoré ? | OUI — un développeur ajoutant une source alternative sans connaître cette décision produirait des types incompatibles avec `SearchResults`, casserait silencieusement l'extraction d'images (convention `#text` / `size`) et obtiendrait potentiellement des résultats vides sans erreur visible (les `?? []` absorberaient le mismatch). |

> Validé contre la politique ADR v2.3.0 (whitelist STACK, aucun anti-pattern AP-1 à AP-7, 4/4 questions OUI).

## Contexte

SpotiFind agrège des données musicales depuis deux APIs tierces : Last.fm pour la recherche et Spotify pour les détails artiste/album. Last.fm a probablement été retenu pour la recherche parce qu'il expose une API publique simple (clé unique, pas de flux OAuth) couvrant les trois catégories Tracks/Artists/Albums en une famille de méthodes cohérente (`track.search`, `artist.search`, `album.search`), avec des données d'audience (`listeners`) utiles pour le tri et l'affichage.

## Décision identifiée

L'API Last.fm (endpoint `https://ws.audioscrobbler.com/2.0/`) est utilisée comme unique source de données pour la recherche globale. Les trois méthodes `track.search`, `artist.search` et `album.search` sont appelées en parallèle pour chaque requête utilisateur. Les types TypeScript (`music-types.ts`) modélisent fidèlement la forme de réponse Last.fm, y compris la convention d'images (`LastfmImage` avec champ `#text` et sizes normalisés).

## Conséquences observées

### Positives
- API simple à intégrer (clé unique, pas de gestion de token OAuth pour la recherche).
- Les trois catégories sont couvertes par une famille d'endpoints homogène.
- Le champ `listeners` (disponible sur tracks et artists) permet d'afficher une métrique de popularité sans appel supplémentaire.

### Négatives / Dette
- L'API Last.fm retourne parfois des résultats sans `mbid` (MusicBrainz ID), ce qui force un fallback sur l'index React comme clé — instabilité potentielle lors des re-renders.
- Le champ `listeners` n'est pas disponible sur `LastfmAlbum`, créant une incohérence d'affichage entre les colonnes.
- La limite de 5 résultats par catégorie est hardcodée côté serveur ; toute pagination future nécessitera une modification du Route Handler.
- L'URL Last.fm (`url`) présente dans les types n'est actuellement pas utilisée dans l'interface — les cartes ne sont pas cliquables.

## Recommandation

Garder. Last.fm est bien adapté au cas d'usage de recherche globale légère. Surveiller la disponibilité de l'API (quota et rate limit non documentés dans le code). Envisager d'exposer le champ `url` Last.fm comme lien fallback si les pages de détail Spotify ne sont pas disponibles pour un résultat donné.
