# Spec Technique — Wave Shader Audio

| Champ         | Valeur                     |
|---------------|----------------------------|
| Module        | wave-shader                |
| Version       | 0.2.0                      |
| Date          | 2026-06-23                 |
| Source        | Implémentation feat/wave-shader-audio |

## Architecture du module

Le module est construit en trois couches :

1. **Couche contexte** — `AudioAnalyserContext.tsx` est un React Context Provider qui centralise la gestion du stream audio système (Web Audio API). Il expose `analyserRef`, `isActive`, `start()`, `stop()` à tous ses consommateurs. Un seul stream/analyser est ouvert pour toute l'application.

2. **Couche rendu visuel** — `WaveShader.tsx` est un canvas WebGL positionné en `fixed` sur les bords gauche et droit de l'écran. Il consomme `AudioAnalyserContext` directement, lit les données FFT via `analyserRef.current`, et les envoie au fragment shader via des uniforms.

3. **Couche contrôle** — `AudioPulseButton.tsx` est un bouton flottant qui appelle `start()` / `stop()` depuis le contexte. Il gère également l'animation DOM des éléments `.audio-bar` (basses fréquences → couleur spotify green) en parallèle des WaveShaders.

L'intégration dans le layout (`src/app/layout.tsx`) est globale : `AudioAnalyserProvider` wrappant tout l'arbre, avec deux `<WaveShader>` et `<AudioPulseButton>` hors du `container-app`.

## Fichiers impactés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `src/contexts/AudioAnalyserContext.tsx` | Context Provider — gestion stream audio système (Web Audio API), `AnalyserNode` partagé | ~78 |
| `src/hooks/useAudioAnalyser.ts` | Re-export de `useAudioAnalyserContext` depuis le context | ~1 |
| `src/components/WaveShader.tsx` | Canvas WebGL — 6 ondes sinusoïdales colorées réactives à l'audio via shaders GLSL | ~198 |
| `src/components/AudioPulseButton.tsx` | Bouton flottant toggle — délègue stream à `AudioAnalyserContext`, anime `.audio-bar` DOM | ~76 |
| `src/app/layout.tsx` | RootLayout — ajout de `AudioAnalyserProvider` et deux `<WaveShader side="left|right" />` | ~48 |

## Schéma BDD

Non applicable. Ce module n'utilise aucune base de données.

## API / Endpoints

Non applicable. Ce module est entièrement côté client (Web Audio API + WebGL).

## Contexte (AudioAnalyserContext)

### Interface exposée

```typescript
interface AudioAnalyserContextValue {
  analyserRef: MutableRefObject<AnalyserNode | null>;
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => void;
}
```

### Acquisition du stream

`start()` appelle `navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })` pour capturer l'audio système. Les pistes vidéo sont stoppées immédiatement après acquisition. Si aucune piste audio n'est détectée, le stream est libéré et un `alert()` invite l'utilisateur à activer "Partager l'audio du système" dans la boîte de partage.

### Configuration de l'analyser

```
fftSize: 256          → 128 bins fréquentiels
smoothingTimeConstant: 0.75
```

## Shaders GLSL (WaveShader)

### Uniforms du fragment shader

| Uniform | Type | Description |
|---------|------|-------------|
| `u_resolution` | `vec2` | Dimensions du canvas en pixels |
| `u_time` | `float` | Temps écoulé en secondes (depuis montage du composant) |
| `u_bands[6]` | `float[6]` | Niveaux normalisés [0–1] par bande fréquentielle |
| `u_active` | `float` | 0.0 = idle, 1.0 = actif (audio capturé) |
| `u_flip` | `float` | 0.0 = gauche (normal), 1.0 = droite (axe x miroir) |

### Palette des 6 ondes

| Index | Couleur | Hex | Bande fréquentielle |
|-------|---------|-----|---------------------|
| 0 | Violet | `#8B5CF6` | Sub-bass (0–200 Hz, bins 0–1) |
| 1 | Indigo | `#6366F1` | Bass (200–500 Hz, bins 2–4) |
| 2 | Blue | `#3B82F6` | Low-mid (500 Hz–2 kHz, bins 5–15) |
| 3 | Cyan | `#06B6D4` | Mid (2–5 kHz, bins 16–30) |
| 4 | Emerald | `#10B981` | High-mid (5–10 kHz, bins 31–60) |
| 5 | Spotify Green | `#1DB954` | High (10–20 kHz, bins 61–110) |

### Algorithme de calcul des bandes

Avec `fftSize=256` → 128 bins ; résolution ~172 Hz/bin à 44100 Hz sample rate.

Pour chaque bande `i`, la valeur normalisée est :
```
bands[i] = min( mean(fftData[startBin..endBin]) / 200, 1 )
```
Les valeurs FFT sont en `Uint8` (0–255) ; la division par 200 calibre l'amplitude visuelle.

### Paramètres idle — mode "vague de mer"

En mode idle (`u_active = 0`), chaque onde utilise des paramètres propres pour simuler un mouvement de houle organique :

| Paramètre | Formule | Description |
|-----------|---------|-------------|
| `idleAmp` | `0.01 + fi * 0.07` | Amplitude croissante par onde — ondes plus larges vers le haut |
| `idleSfreq` | `1.0 + fi * 0.35` | Fréquence spatiale basse — longues vagues lentes |
| `idleSpeed` | `0.22 + fi * 0.06` | Vitesse de défilement lente — tempo de houle |
| `idlePhase` | `fi * 1.1` | Décalage de phase entre ondes — mouvement non synchronisé |

### Formule de rendu par onde

```glsl
float baseWave = amp * sin(y * sfreq * 6.2832 + u_time * speed + phase);
// Harmonique secondaire au ratio d'or — apériodique, ne se répète jamais exactement
float harmonic = amp * 0.45 * sin(y * sfreq * 1.618 * 6.2832 - u_time * speed * 0.75 + phase * 0.8);
// Respiration d'amplitude — chaque onde pulse à son propre rythme
float breathe  = 1.0 + 0.3 * sin(u_time * 0.4 + fi * 1.3);
float waveX    = center + mix(baseWave * breathe + harmonic, baseWave, u_active);
float dist     = abs(x - waveX);

// Ligne centrale nette
float thick = 0.016;
float core  = smoothstep(thick, 0.001, dist);
// Halo extérieur prononcé
float glow  = smoothstep(0.18, 0.001, dist) * 0.45;
float alpha = clamp(core * 0.95 + glow * (1.0 - core * 0.95), 0.0, 1.0);
```

En mode actif (`u_active = 1`), les paramètres idle sont remplacés par `amp = 0.06 + u_bands[i] * 0.38`, `sfreq = 4.0`, `speed = 0.8`, et l'harmonique/respiration sont éteints (`mix(..., u_active)`).

## Positionnement CSS

Les deux canvas sont `fixed top-0 h-screen wave-canvas`, visibles uniquement à partir de `lg` (`hidden lg:block`), `pointer-events-none`, `z-10`.

La classe `.wave-canvas` est définie dans `globals.css` sous `@layer components` :

```css
.wave-canvas {
  width: max(60px, calc((100vw - 1200px) / 2));
}
```

Cette formule adapte la largeur au gutter disponible autour du `container-app` (max-width 1200px), avec un minimum de 60px. En dessous de 1260px de viewport, les canvas restent à 60px. La largeur effective est résolue au runtime via `canvas.offsetWidth` dans le composant WebGL.

## Tests prévus

Aucun test unitaire n'a été implémenté pour ce module (composants Canvas/WebGL difficiles à tester en environnement Jest/jsdom). Tests manuels recommandés :
- Vérifier que `start()` ouvre bien la boîte de partage OS
- Vérifier que l'absence d'audio système déclenche l'alert
- Vérifier que les ondes réagissent visuellement à la musique
- Vérifier que `stop()` libère le stream et revient en mode idle
