# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) · Versioning : [SemVer](https://semver.org/lang/fr/).

---

## [Unreleased]

### Added

- **explore — animations d'entrée et scroll** : `src/app/explore/page.tsx` — `header-enter` sur le lien retour, `reveal-ltr` sur le conteneur `GenreChips` ; `AlbumMosaic` : chaque carte reçoit la classe `scroll-fade-in` avec `transitionDelay` échelonné (55ms × index, max 440ms) ; `<ScrollAnimator deps={[albums]} />` ajouté dans la page pour re-déclencher les animations au changement de genre ou au refresh

### Fixed

- **ui — ScrollAnimator fallback viewport** : `src/components/ScrollAnimator.tsx` — ajout d'un second `requestAnimationFrame` après la création de l'`IntersectionObserver` pour activer immédiatement les éléments `.scroll-fade-in` déjà dans le viewport si le callback IO tarde à se déclencher (corrige les albums invisibles sur la home et la page explore)

- **home — chargement en deux étapes** : `src/components/HomeContent.tsx` + `src/components/HomeCharts.tsx` — `useHomeCharts` remonté dans `HomeContent` ; les `GenreRow` ne se mountent (et ne fetchent) qu'après `chartsLoading === false`, supprimant l'affichage décalé albums-avant-artistes ; `HomeCharts` reçoit `data/loading/error` en props et affiche un skeleton structuré (artistes + 2 grilles albums) pendant le chargement pour éviter le layout shift

- **search — réduction des appels d'enrichissement artistes** : `src/app/api/search/route.ts` — `artist.search` limité à 5 résultats (au lieu de 10) réduisant les appels `enrichArtistThumb` TheAudioDB de moitié ; `track.search` conserve 20 résultats avec enrichissement complet

- **config — cache webpack mémoire en dev** : `next.config.mjs` — ajout `webpack: config.cache = { type: "memory" }` en développement pour corriger la race condition Windows ENOENT lors du rename des fichiers `.pack.gz_` après suppression du dossier `.next`

### Added

- **auth — page signup** : `src/app/signup/page.tsx` — Client Component, formulaire création de compte email + mot de passe (confirmation de mot de passe avec validation côté client, minLength=6) ; appelle `supabase.auth.signUp` via `createClient()` ; redirige vers `/` après inscription réussie ; lien vers `/login`

- **auth — page login + import favoris** : `src/app/login/page.tsx` (Server Component wrapper `<Suspense>`) + `src/app/login/LoginForm.tsx` (Client Component) — formulaire connexion email/password via `supabase.auth.signInWithPassword` ; détection des favoris localStorage post-connexion et affichage de `ImportFavouritesModal` si présents ; `handleImportDecision` effectue un upsert Supabase `favourites` (`onConflict: user_id,kind,name,artist`) si l'utilisateur accepte, puis nettoie localStorage ; paramètre `?redirect=<pathname>` supporté

- **favourites — modal import localStorage → Supabase** : nouveau Client Component `ImportFavouritesModal` (`src/components/ImportFavouritesModal.tsx`) — modal post-connexion affichant le nombre de favoris localStorage détectés ; props `count: number` et `onDecision: (importThem: boolean) => void` ; délègue la décision au parent sans piloter la logique d'import

- **auth — middleware Supabase (partiel)** : `src/middleware.ts` — protège la route `/favourites` en redirigeant les utilisateurs non authentifiés vers `/login?redirect=/favourites` ; utilise `@supabase/ssr` `createServerClient` pour lire la session côté serveur via cookies ; matcher limité à `/favourites/:path*`

- **auth — client Supabase browser** : `src/lib/supabase.ts` — factory `createClient()` via `createBrowserClient` (`@supabase/ssr`) pour les composants Client (login, signup, opérations futures sur la table `favourites`)

- **search — autocomplétion** : `SearchBar.tsx` enrichi d'un dropdown d'autocomplétion — fetch debounced 200ms vers `/api/search` ; affichage de 3 artistes (lien page artiste), 2 titres (remplit la recherche), 2 albums (lien page album) ; navigation clavier ↑↓ / Enter / Escape ; fermeture au clic extérieur ; thumbnails + badge de type (Artiste / Titre / Album) ; utilise `encodeAlbumSlug` pour les liens albums

- **ui — toggle dark/light mode** : nouveau Client Component `ThemeToggle` (`src/components/ThemeToggle.tsx`) — bouton flottant positionné en bas à gauche, bascule la classe `.dark` sur `<html>` ; persistance dans `localStorage` (clé `spotifind_theme`) ; respect du `prefers-color-scheme` au premier chargement ; importé et rendu dans `src/app/layout.tsx` ; variables CSS dark ajoutées dans `src/app/globals.css` (`.dark { --background, --foreground, --muted, --border, --surface }`)

- **home — albums rock en parallèle** : deuxième appel `tag.getTopAlbums` (tag=rock, limit=10) lancé en parallèle du fetch pop existant dans `src/app/api/home/route.ts` ; nouvelle fonction utilitaire `parseAlbums` mutualisée ; réponse JSON enrichie avec le champ `albumsRock: HomeAlbum[]` ; type `HomeCharts` mis à jour dans `src/hooks/useHomeCharts.ts` ; nouvelle section "Trending Albums — Rock" rendue dans `HomeCharts.tsx` avec animation `scroll-fade-in` sur chaque carte

- **wave-shader — visualisation audio système WebGL** : nouveau module `wave-shader` — `AudioAnalyserContext` (React Context Provider centralisant la capture audio via `getDisplayMedia`, `AnalyserNode` partagé `fftSize=256`) ; hook `useAudioAnalyser` (re-export) ; `WaveShader` (canvas WebGL `fixed` bords gauche/droite, 6 ondes sinusoïdales GLSL colorées violet→indigo→blue→cyan→emerald→spotify-green réactives à 6 bandes fréquentielles FFT, mode idle animé en l'absence d'audio, symétrie miroir via uniform `u_flip`, visible `lg+`) ; `AudioPulseButton` refactorisé pour déléguer stream/analyser à `AudioAnalyserContext` (suppression de la gestion locale du stream) ; `layout.tsx` enrichi avec `AudioAnalyserProvider` et deux `<WaveShader side="left|right" />`

- **wave-shader — amélioration idle "vague de mer"** : refonte du mode idle du fragment shader GLSL — amplitudes variables par onde (`idleAmp = 0.01 + fi * 0.07`) pour une différenciation visuelle accrue ; fréquence spatiale basse (`1.0 + fi * 0.35`) et vitesse lente (`0.22 + fi * 0.06`) pour un mouvement de houle organique ; phases décalées par onde (`fi * 1.1`) ; harmonique secondaire au ratio d'or (×1.618) pour un mouvement apériodique ; respiration d'amplitude (`1.0 + 0.3 * sin(u_time * 0.4 + fi * 1.3)`) ; canvas adaptatif via classe CSS `.wave-canvas { width: max(60px, calc((100vw - 1200px) / 2)) }` au lieu d'une largeur fixe `w-[100px]`

### Changed

- **search — augmentation des limites Last.fm** : `track.search` et `album.search` passent de 5 à 20 résultats par requête (`limit=20` dans `lastfmSearch`) ; `artist.search` conserve `limit=5`

### Added

- **search — scroll snap + barre de progression sur `ArtistScroller`** : `scroll-snap-type: x mandatory` posé sur le conteneur du carousel artistes ; `scroll-snap-align: start` posé sur chaque `ArtistCard` via la classe Tailwind arbitraire `[scroll-snap-align:start]` dans `SearchResults` ; nouvel état `progress` (`useState<number>`, 0–1) mis à jour dans le handler `onScroll` via `scrollLeft / (scrollWidth - clientWidth)` ; barre de progression (`div bg-foreground`, largeur inline `progress * 100%`) rendue uniquement quand le contenu est en overflow réel (`fadeLeft || fadeRight`)

- **album-page — animation d'entrée tracklist** : keyframes `trackFadeIn` (opacity 0→1 + translateY 10px→0, 0.35 s ease) et classe `.track-enter` dans `globals.css` ; chaque `TrackRow` est rendu dans un wrapper `<div class="track-enter">` portant `--track-delay` (40 ms/piste, plafond 600 ms) posé inline dans `TrackList` ; séparateurs entre lignes migrés de `border-b border-border last:border-0` sur `TrackRow` vers `divide-y divide-border` sur le conteneur `TrackList`

- **favourites — couche logique (localStorage)** : type `FavouriteItem` + `FavouriteKind` dans `music-types.ts` ; utilitaire `buildFavouriteId(kind, name, artist?)` dans `favourite-utils.ts` (format ID stable `"<kind>:<artist>:<name>"`) ; hook `useFavourites()` dans `hooks/useFavourites.ts` (clé localStorage `spotifind_favourites`, API : `favourites`, `isFavourite`, `toggle`, `remove`, `ready`) ; `HeartButton` Client Component (bouton cœur SVG 15×15 toggleable, évite flash hydratation via flag `ready`) ; intégration `HeartButton` dans `ArtistTopTracks` (à droite de la colonne auditeurs) ; props `albumArtist`, `albumImageUrl`, `albumHref` ajoutées à `TrackList` pour passer le contexte album à chaque `TrackRow`

- **artist-page — top tracks + albums** : `fetchArtistTopTracks()` (Last.fm `artist.getTopTracks`, limit=10) et `fetchArtistAlbums()` (Spotify search artist → albums triés par `release_date` desc) dans `artist-service.ts` ; composant `ArtistTopTracks` (liste numérotée avec playcount formaté) ; composant `ArtistAlbums` (grille cliquable via `<Link>` vers `/album/[encodeAlbumSlug]`, cover Spotify + année) ; page `/artist/[id]` mise à jour avec fetch parallèle (`Promise.all`) des trois sources et rendu des deux nouvelles sections

- **scroll animation — composant `ScrollAnimator`** : nouveau Client Component réutilisable (`src/components/ScrollAnimator.tsx`) — monte un `IntersectionObserver` sur tous les éléments `.scroll-fade-in` avec direction awareness (CSS custom property `--slide-from` posée dynamiquement) et timing via `requestAnimationFrame` ; classe `scroll-fade-in` ajoutée sur chaque row de `ArtistTopTracks` et sur chaque card de `ArtistAlbums` ; `<ScrollAnimator />` injecté dans la page `/artist/[id]` (Server Component) et dans `/favourites` (remplace l'`IntersectionObserver` inline, `deps={[favourites, ready]}`) ; règles CSS `.scroll-fade-in` / `.scroll-fade-in.visible` ajoutées dans `globals.css`

### Changed

- **artist-page — refonte `artist-service.ts`** : `fetchArtistTopTracks` (Last.fm) et `fetchArtistAlbums` (Spotify search) remplacés par `fetchArtistSpotifyData(name)` qui effectue les deux fetches Spotify en parallèle (`top-tracks?market=FR` + `albums?include_groups=album,single&limit=50`) après résolution de l'ID artiste via `artist:name` search ; les erreurs sont désormais loguées via `console.error` au lieu d'être avalées silencieusement
- **artist-page — `ArtistTopTrack` type** : suppression de `playcount`, ajout de `imageUrl: string | null` et `albumName: string | null` (source Spotify au lieu de Last.fm)
- **artist-page — composant `ArtistTopTracks`** : affichage de la pochette album (40×40), du nom de l'album ; chaque track est désormais un `<Link>` vers `/album/[encodeAlbumSlug(artistName, track.albumName)]` ; prop `artistName` ajoutée
- **artist-page — enrichissement fallback Last.fm** : `fetchLastfmTopTracks` appelle désormais `track.getInfo` en parallèle (10 appels) pour enrichir chaque titre avec la vraie pochette d'album et le nom d'album (au lieu de retourner des images vides) ; ajout de `fetchLastfmTopAlbums` via `artist.getTopAlbums` comme fallback albums quand Spotify retourne 0 résultats ; ajout de `pickLastfmImage` pour filtrer le placeholder Last.fm (`2a96cbd8b46e442fc41c2b86b821562f`) ; `fetchArtistSpotifyData` déclenche le fallback Last.fm albums si Spotify retourne un tableau vide
- **artist-page — enrichissement dates albums via TheAudioDB** : suppression de `parseLastfmDate` et `fetchLastfmAlbumInfo` (approche `album.getInfo` Last.fm abandonnée — `releasedate` non fiable) ; ajout de `fetchAudioDbYears(artist)` qui appelle `https://www.theaudiodb.com/api/v1/json/2/discography.php?s={artist}` (clé publique `"2"` hardcodée — seule clé supportant l'endpoint `discography.php`) et retourne une `Map<string, string>` (nom album lowercase → `"YYYY-01-01"`) ; refonte de `fetchLastfmTopAlbums(name)` : deux appels parallèles Last.fm `artist.getTopAlbums` + TheAudioDB `discography.php`, cross-référence des noms pour assigner les années, tri du plus récent au plus ancien (albums sans date en fin de liste) ; correction des 3 points de retour anticipé dans `fetchArtistSpotifyData` (searchRes.ok false, artistId undefined, catch) : tous appellent désormais `fetchLastfmTopAlbums` en parallèle avec `fetchLastfmTopTracks` au lieu de retourner `albums: []`
- **artist-page — composant `ArtistAlbums`** : `releaseYear(date)` gère désormais les dates vides (retourne `""` au lieu de crasher sur `date.slice(0,4)` pour une chaîne vide)
- **album-page — couche lib** : types `LastfmTrackDetail` et `AlbumDetail` dans `music-types.ts` ; utilitaires de slug URL `encodeAlbumSlug` / `decodeAlbumSlug` dans `album-utils.ts` (séparateur `|||`, URL-safe) ; service Last.fm `fetchAlbumByName` et `fetchAlbumForTrack` dans `album-service.ts` (normalisation tracklist mono-piste) ; tests unitaires `album-utils.test.ts` (4 cas)
- **album-page — couche UI** : page dynamique `/album/[id]` (Server Component), composants `AlbumHero` (pochette 200×200 + métadonnées), `TrackList` (tracklist complète), `TrackRow` (rang, titre, durée formatée M:SS) ; navigation depuis `SearchResults` : `TrackCard` et `AlbumCard` désormais cliquables via `<Link>` vers `/album/[slug]` (avec `?isTrack=1` pour les pistes)

### Changed

- **artist-page — enrichissement colonne auditeurs** : ajout du champ `listeners: string | null` dans l'interface `ArtistTopTrack` (`music-types.ts`) ; `fetchLastfmTopTracks` mappe désormais `t.listeners` depuis la réponse `artist.getTopTracks` Last.fm (Spotify conserve `listeners: null`) ; composant `ArtistTopTracks` affiche une colonne "X auditeurs" (format `fr-FR` via `toLocaleString`) visible à partir de `md` ; page `/artist/[id]` élargie de `max-w-2xl` à `max-w-5xl` ; grille `ArtistAlbums` passée de `grid-cols-2 sm:grid-cols-3` à `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5` ; test `artist-service.test.ts` mis à jour (`listeners: null` dans l'objet attendu)

- **auth — flow mot de passe oublié / réinitialisation** : route handler PKCE `src/app/auth/callback/route.ts` — échange le `code` Supabase côté serveur via `exchangeCodeForSession` et redirige vers `?next=` (utilisé comme `redirectTo` pour le reset de mot de passe) ; page `src/app/forgot-password/page.tsx` — formulaire email vers `supabase.auth.resetPasswordForEmail` avec `redirectTo` pointant vers `/auth/callback?next=/reset-password`, affiche un message de confirmation après envoi ; page `src/app/reset-password/page.tsx` + `ResetPasswordForm.tsx` — vérifie la session via `getUser()` avant d'afficher le formulaire, appelle `supabase.auth.updateUser({ password })` à la soumission, redirige vers `/` après succès ; lien "Mot de passe oublié ?" ajouté dans `LoginForm.tsx` pointant vers `/forgot-password`

### Fixed

- **favourites — HeartButton redirection non authentifié** : si `isAuthenticated === false` (exposé par `FavouritesContext` réécrit), le click court-circuite le `toggle` et appelle `router.push("/login")` — évite une modification silencieuse des favoris pour un utilisateur non connecté

- **favourites — lien cœur header HomeContent** : `src/components/HomeContent.tsx` — le `<Link>` du header pointe désormais vers `/login?redirect=/favourites` si `isAuthenticated === false` (lu depuis `useFavourites()`), et vers `/favourites` si authentifié ; complète la protection middleware (serveur) par une redirection client-side dès le clic

- **explore — lignes genre sur la homepage** : 6 lignes de genre (`GenreRow`) intégrées dans `HomeContent.tsx` sous `HomeCharts` (visible uniquement sans requête active) ; liste de genres fixe `["Hip-Hop", "Electronic", "Jazz", "Classical", "R&B", "Metal"]` ; import `GenreRow` résolu après merge `feat/style-animations` ← `origin/main`

- **explore — page /explore** : `src/app/explore/page.tsx` — grille d'albums par genre ; composants `AlbumMosaic`, `MosaicCard`, `GenreChips` ; route API `GET /api/explore?tag=<genre>&limit=<n>` (Last.fm `tag.getTopAlbums`) ; fonctionnalité "rafraîchir" ; bouton boussole dans le header

- **scroll animation — fix RAF fallback `ScrollAnimator`** : second `requestAnimationFrame` imbriqué ajouté dans `src/components/ScrollAnimator.tsx` — si l'`IntersectionObserver` tarde à se déclencher, le RAF vérifie `getBoundingClientRect()` et ajoute directement `.visible` aux éléments `.scroll-fade-in` déjà dans le viewport ; corrige une régression où les éléments restaient `opacity:0` indéfiniment dans certains navigateurs/contextes

### Changed

- **explore — animations d'entrée `AlbumMosaic`** : chaque `MosaicCard` dans `src/components/AlbumMosaic.tsx` est désormais wrappée dans un `<div class="scroll-fade-in">` avec `transitionDelay` échelonné (55ms × index, max 440ms) — effet d'entrée en cascade au chargement de la grille

- **explore — polish page `/explore`** : `src/app/explore/page.tsx` enrichi avec `<ScrollAnimator deps={[albums]} />` (re-trigger à chaque changement de genre), classe `header-enter` sur le lien retour, wrapper `<div class="reveal-ltr">` autour de `GenreChips`

### Removed

### BDD
