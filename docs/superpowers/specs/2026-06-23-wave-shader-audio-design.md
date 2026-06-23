# Design — Wave Shader Audio Réactif

> Date : 2026-06-23
> Branche : `feat/wave-shader-audio`
> Approche retenue : WebGL + GLSL shaders

---

## Résumé

Deux canvases WebGL positionnés fixes sur les bords gauche et droit de la page affichent chacun 6 waves sinusoïdales colorées. En l'absence de musique, les waves oscillent doucement (idle). Quand l'audio système est actif, chaque wave réagit à une bande de fréquences différente.

---

## Section 1 — Architecture

### Problème existant

`AudioPulseButton` gère l'analyser Web Audio en interne et pilote les `.audio-bar` par manipulation DOM directe. Les composants `WaveShader` ont besoin des mêmes données audio → un contexte partagé est nécessaire.

### Nouveau flux

```
AudioAnalyserProvider  (layout.tsx)
  ├── AudioPulseButton   → start() / stop() via context
  ├── WaveShader (left)  → lit frequencyData du context
  └── WaveShader (right) → lit frequencyData du context
```

### Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/contexts/AudioAnalyserContext.tsx` | Provider : `analyserNode`, `isActive`, `start()`, `stop()`, `frequencyData` |
| `src/hooks/useAudioAnalyser.ts` | Hook consommateur du context |
| `src/components/WaveShader.tsx` | Canvas WebGL, prop `side: "left" \| "right"` |

### Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `src/components/AudioPulseButton.tsx` | Refactorisé pour déléguer gestion audio au context |
| `src/app/layout.tsx` | Ajout `<AudioAnalyserProvider>` + deux `<WaveShader>` |

---

## Section 2 — Design visuel

### Positionnement

```
|◀ ~100px ▶|◀────── contenu max-w-5xl ──────▶|◀ ~100px ▶|
  WaveShader                                    WaveShader
   (left)                                        (right)
```

- Position : `fixed`, collés aux bords, pleine hauteur viewport (`100vh`)
- Largeur : `100px`
- Masqués sur écrans `< lg` (< 1024px) via `hidden lg:block`

### Palette — 6 waves par canvas

| Wave | Bande fréquentielle | Couleur |
|------|---------------------|---------|
| 1 | Sub-bass | `#8B5CF6` violet |
| 2 | Bass | `#6366F1` indigo |
| 3 | Low-mid | `#3B82F6` bleu |
| 4 | Mid | `#06B6D4` cyan |
| 5 | High-mid | `#10B981` emerald |
| 6 | High | `#1DB954` spotify green |

### États d'animation

- **Idle** : amplitude ~15% de la largeur, fréquence lente, phase offset différente par wave → effet vagues décalées
- **Actif** : amplitude = énergie normalisée de la bande (0.0 → 1.0), max ~80% de la largeur
- **Séparation** : zone de transparence de chaque côté de chaque wave, pas de mélange de couleurs

---

## Section 3 — Shader GLSL & flux audio

### Vertex shader

```glsl
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

Dessine un quad plein canvas (2 triangles).

### Fragment shader — logique

Pour chaque pixel `(x, y)` :
1. Calcule la position X théorique de chaque wave :
   `x_wave_i = center_i + amplitude_i * sin(y * spatial_freq + u_time * speed_i + phase_i)`
2. Si `abs(x - x_wave_i) < thickness` → colorie avec `color_i`, alpha avec falloff gaussien
3. Superpose les 6 contributions

### Uniforms

```glsl
uniform vec2  u_resolution;   // taille du canvas en pixels
uniform float u_time;          // secondes écoulées (oscillation idle)
uniform float u_bands[6];      // énergie normalisée 0.0–1.0 par bande fréquentielle
uniform float u_active;        // 0.0 = idle, 1.0 = audio actif
```

### Mapping fréquentiel (fftSize 256 → 128 bins → ~172 Hz/bin)

| Wave | Bande | Bins FFT |
|------|-------|----------|
| 1 | Sub-bass (0–200 Hz) | 0–1 |
| 2 | Bass (200–500 Hz) | 2–4 |
| 3 | Low-mid (500 Hz–2 kHz) | 5–15 |
| 4 | Mid (2–5 kHz) | 16–30 |
| 5 | High-mid (5–10 kHz) | 31–60 |
| 6 | High (10–20 kHz) | 61–110 |

### Flux données audio

```
getDisplayMedia({ audio: true, video: true })
  → AudioContext → AnalyserNode (fftSize 256)
  → getByteFrequencyData() @ 60 fps (rAF dans WaveShader)
  → moyenne par bande → u_bands[6]
  → gl.uniform1fv() → fragment shader → rendu canvas
```

Le canvas WebGL tourne son propre `requestAnimationFrame`, indépendant du reste.

---

## Contraintes & limites

- `getDisplayMedia` requiert une interaction utilisateur (bouton) → déjà géré par `AudioPulseButton`
- Canvas WebGL masqué sur mobile/tablette (< 1024px) pour ne pas couvrir le contenu
- Pas de dépendance npm ajoutée — WebGL natif navigateur uniquement
