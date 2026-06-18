# RETRO-004 — Persistance des favoris via localStorage sans backend

| Champ      | Valeur              |
|------------|---------------------|
| Statut     | Documenté (rétro)   |
| Date       | 2026-06-17          |
| Source     | Rétro-ingénierie    |
| Features   | favourites          |

## Justification (politique ADR v2.3.0)

| Champ | Valeur |
|-------|--------|
| Catégorie | DB-STRATEGY |
| Q1 — Coût de revert > 1j ? | OUI — migrer vers une persistance serveur implique d'introduire une base de données, un système d'auth utilisateur, un ou plusieurs endpoints REST/GraphQL pour les favoris, et de réécrire le mécanisme d'ajout/suppression sur toutes les pages concernées (résultats, artiste, album, favourites). L'impact est transverse à l'ensemble de l'architecture du projet et dépasse largement une journée de refactoring. |
| Q2 — Non-déductible du code ? | OUI — `package.json` ne contient aucun ORM, aucune librairie de persistance (Prisma, Supabase, Firebase, etc.), ni aucun indicateur du choix de `localStorage`. Le choix délibéré de ne pas avoir de backend de persistance ne se lit pas dans les fichiers de configuration. |
| Q3 — Impact transverse (≥ 2 specs) ? | OUI — la décision concerne directement la spec `favourites` (lecture/affichage), et impactera structurellement toute page ajoutant le bouton "mettre en favori" (specs `artist-page`, `album-page`, et potentiellement `search`). Toute feature future de recommandation ou export de playlist en dépend également. |
| Q4 — Casse un invariant si ignoré ? | OUI — un développeur qui ignore cette décision pourrait implémenter un appel `POST /api/favourites` côté serveur, créant une fausse impression de persistance partagée entre appareils, ou introduire une régression silencieuse si aucun endpoint de ce type n'existe et que les erreurs sont absorbées. |

> Validé contre la politique ADR v2.3.0 (catégorie DB-STRATEGY, aucun anti-pattern AP-1 à AP-7, 4/4 questions OUI).

## Contexte

SpotiFind est un projet sans backend séparé et sans base de données. La décision d'utiliser le `localStorage` navigateur comme unique mécanisme de persistance est cohérente avec la volonté de garder le projet simple (pas de gestion d'auth utilisateur, pas d'infrastructure serveur de données). Cette approche est explicitement mentionnée dans le README : "Client-side favorites management using browser LocalStorage (no complex backend required)".

## Décision identifiée

Les favoris utilisateur (tracks sauvegardés) sont persistés exclusivement dans le `localStorage` du navigateur. Il n'existe pas d'endpoint serveur pour les favoris. La page `/favourites` est un Client Component (`"use client"`) qui lit directement le `localStorage` au montage. Aucun compte utilisateur, aucune session, aucune synchronisation inter-appareils n'est prévue.

## Conséquences observées

### Positives
- Aucune infrastructure serveur de persistance requise : déploiement simplifié, pas de BDD à provisionner.
- Pas de gestion d'authentification utilisateur : l'application reste entièrement accessible sans compte.
- Persistance instantanée et sans latence réseau pour les opérations d'ajout/suppression.

### Négatives / Dette
- Les favoris sont propres à l'appareil et au navigateur : aucune synchronisation entre appareils ou navigateurs.
- La suppression des données de navigation (cookies, cache, localStorage) efface tous les favoris sans avertissement.
- En mode privé/incognito ou avec certaines configurations Safari (ITP), le `localStorage` peut être cloisonné ou désactivé.
- La capacité du `localStorage` est limitée (~5 Mo par origine) : stocker des objets `SpotifyTrack` complets en grande quantité peut poser problème.
- Si le format de données stocké dans `localStorage` évolue (refactoring des types), une migration des données existantes devra être gérée côté client.

## Recommandation

Garder pour la portée actuelle du projet (projet académique / démo). Documenter explicitement la clé `localStorage` utilisée et le format de données sérialisé dans la spec technique de la feature `favourites`, afin d'éviter des incohérences entre les pages qui écrivent (ajout) et la page qui lit (affichage). Si le projet devait évoluer vers une application multi-utilisateurs ou multi-appareils, remplacer par une persistance serveur authentifiée (ex. base de données + session token) constituerait la prochaine étape architecturale.
