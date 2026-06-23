# Versioning — Wave Shader Audio

| Version | Date | Composants modifiés | Description | Auteur |
|---------|------|---------------------|-------------|--------|
| 0.1.0 | 2026-06-23 | spec-technique.md | Création initiale — contexte audio système, canvas WebGL 6 ondes, AudioPulseButton refactorisé | update-writer |
| 0.2.0 | 2026-06-23 | WaveShader.tsx, globals.css | Idle "vague de mer" : amplitudes variables par onde (`0.01 + fi*0.07`), fréquence spatiale basse, harmonique au ratio d'or (×1.618), respiration d'amplitude (`1.0 + 0.3*sin`), canvas adaptatif via `.wave-canvas` CSS | update-writer |
