# Spec Fonctionnelle — Favoris [DRAFT — à valider par le dev]

| Champ      | Valeur              |
|------------|---------------------|
| Module     | favourites          |
| Version    | 0.1.0               |
| Date       | 2026-06-17          |
| Auteur     | retro-documenter    |
| Statut     | DRAFT / STUB        |
| Source     | Rétro-ingénierie    |

> **[DRAFT — à valider par le dev]** Cette spec a été générée par rétro-ingénierie
> à partir du code existant et de la documentation projet. La page
> `src/app/favourites/page.tsx` est un squelette vide : aucun comportement n'est
> implémenté. Les règles ci-dessous sont déduites du README, de la découverte
> (`discovery.md`) et des types existants. Elles doivent être validées par le
> développeur avant toute implémentation.

---

## ADRs

| ADR | Titre | Statut |
|-----|-------|--------|
| [RETRO-003](../../adr/RETRO-003-favourites-localstorage.md) | Persistance des favoris via localStorage sans backend | Documenté (rétro) |

---

## Contexte et objectif

La page `/favourites` est une route statique Next.js destinée à afficher la liste des tracks sauvegardées par l'utilisateur sur son appareil. Il n'y a pas de compte utilisateur ni de persistance serveur : les favoris sont stockés exclusivement dans le `localStorage` du navigateur. La page est accessible depuis la navigation globale de l'application.

## Règles métier (déduites du README et de la découverte)

1. Un track peut être marqué comme favori par l'utilisateur depuis l'interface (pages de résultats ou page album — mécanisme d'ajout non encore implémenté).
2. Les favoris sont persistés dans le `localStorage` du navigateur. Ils sont propres à l'appareil et au navigateur de l'utilisateur : aucune synchronisation entre appareils n'est prévue.
3. La page `/favourites` liste l'ensemble des tracks sauvegardés par l'utilisateur.
4. En l'absence de favoris sauvegardés, un état vide est affiché (message du type "Aucun favori pour le moment").
5. L'utilisateur peut supprimer un favori depuis la liste. La mise à jour est immédiate sans rechargement de page.
6. La page ne nécessite aucun appel à une API externe : toutes les données sont lues depuis le `localStorage`.
7. La page est une page statique côté Next.js (aucune dépendance à des données serveur au moment du rendu initial). Elle doit être un Client Component (`"use client"`) pour accéder au `localStorage`.

## Cas d'usage (déduits)

### CU-001 — Consultation de la liste des favoris

**Acteur :** Visiteur ayant préalablement sauvegardé des tracks

**Préconditions :**
- Au moins un track a été sauvegardé en `localStorage`.

**Flux principal :**
1. L'utilisateur navigue vers `/favourites`.
2. La page lit les favoris depuis le `localStorage`.
3. La liste des tracks sauvegardés est affichée (nom, artiste, image de couverture).

**Flux alternatifs :**
- Si le `localStorage` est vide ou ne contient aucun favori : affichage d'un état vide avec un message invitant l'utilisateur à effectuer une recherche.
- Si le `localStorage` est désactivé par le navigateur (mode privé restrictif, Safari ITP) : comportement non défini dans le code actuel — à spécifier.

### CU-002 — Suppression d'un favori

**Flux :**
1. L'utilisateur clique sur une action de suppression (icône ou bouton) sur un track de la liste.
2. L'entrée est retirée du `localStorage`.
3. La liste se met à jour immédiatement sans rechargement.

### CU-003 — Navigation vers la page d'un track depuis les favoris

**Flux :** L'utilisateur clique sur un track favori. Il est redirigé vers la page de détail correspondante (destination à préciser — aucune route `/track/[id]` n'existe actuellement).

## Dépendances

- **`localStorage` navigateur** — seul mécanisme de persistance. Aucune dépendance backend.
- **React hooks natifs** — `useState`, `useEffect` pour lire et mettre à jour le `localStorage` de manière réactive.
- **Types Spotify (`spotify-types.ts`)** — probablement `SpotifyTrack` comme structure de données d'un favori (à confirmer).

## Zones d'incertitude

> Les points suivants n'ont pas pu être déterminés par le code seul :

- Quelle est la clé `localStorage` utilisée pour stocker les favoris ? (ex. `spotifind_favourites`, `favourites`, etc.) Non définie dans le code actuel.
- Quel est le format de données persisté pour chaque favori ? Un objet `SpotifyTrack` complet, un sous-ensemble (id + name + artist), ou un ID seul avec re-fetch à l'affichage ?
- Le mécanisme d'ajout aux favoris (depuis quelle page, quel composant, quel élément d'interface) n'est pas encore implémenté — il devra être coordonné avec l'implémentation de `/favourites`.
- L'URL de la page est `/favourites` dans le code mais le README fait référence à `/favorites` (sans `u`) — quelle est la convention retenue ?
- La liste est-elle ordonnée ? Si oui, par date d'ajout, par nom, ou par artiste ?
- Un nombre maximum de favoris est-il envisagé (les `localStorage` sont limités à ~5 Mo par origine) ?
- Que se passe-t-il si un favori sauvegardé référence un track qui n'est plus disponible sur Spotify (retrait de catalogue) ?
