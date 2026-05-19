# Research: Open-source Jazz/Clean Guitar Audio Samples for Tone.js

- **Query**: Find open-source guitar audio samples suitable for Tone.js Sampler in a static web app
- **Scope**: External
- **Date**: 2026-05-18

## Current State

The project currently uses **Salamander piano samples** from `https://tonejs.github.io/audio/salamander/` loaded via `Tone.Sampler`. The audio engine is in `src/core/audio-engine.js`. The `guide-tone.js` module includes a `midiToToneName()` function for converting MIDI to Tone.js-compatible note names (e.g., "C4", "Bb3").

The current sample map uses a sparse approach (every ~3 semitones) and Tone.js interpolates the rest:
```js
const PIANO_SAMPLE_MAP = {
  A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
  A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
  // ... every 3 semitones up to C8
};
```

## Option 1: gleitz/midi-js-soundfonts (RECOMMENDED)

### Source
- **Repository**: https://github.com/gleitz/midi-js-soundfonts
- **CDN URL (GitHub Pages)**: `https://gleitz.github.io/midi-js-soundfonts/`
- **License**: MIT (repo wrapper) + underlying soundfont licenses:
  - FluidR3_GM: **Creative Commons Attribution 3.0** (CC BY 3.0 US)
  - MusyngKite: **Creative Commons Attribution Share-Alike 3.0** (CC BY-SA 3.0)
  - FatBoy: **Creative Commons Attribution Share-Alike 3.0** (CC BY-SA 3.0)

### Available Guitar Instruments

| Instrument | GM Program # | Description |
|---|---|---|
| `electric_guitar_jazz` | 26 | Warm jazz guitar tone (hollow-body, neck pickup) |
| `electric_guitar_clean` | 27 | Clean electric guitar |
| `acoustic_guitar_nylon` | 24 | Nylon string classical |
| `acoustic_guitar_steel` | 25 | Steel string acoustic |
| `electric_guitar_muted` | 28 | Muted/palm-muted electric |
| `distortion_guitar` | 29 | Distorted electric |
| `overdriven_guitar` | 30 | Overdriven electric |
| `guitar_harmonics` | 31 | Natural harmonics |

### File Format & Naming

Each instrument folder contains individual MP3 files named: `{NoteName}{Octave}.mp3`

Naming convention:
- Naturals: `C3.mp3`, `D4.mp3`, `A5.mp3`
- Flats: `Bb3.mp3`, `Eb4.mp3`, `Ab5.mp3`, `Db4.mp3`, `Gb3.mp3`
- No sharps (all chromatic notes use flat naming)

Full chromatic coverage: **88 notes** (A0 to C8, covering the entire piano range)

### Size Analysis

| Soundfont | Jazz Guitar Total | Avg/note | Guitar Range (oct 2-6, ~60 notes) |
|---|---|---|---|
| FluidR3_GM | 1.66 MB (88 files) | ~20 KB | ~1.1 MB estimated |
| MusyngKite | 1.32 MB (88 files) | ~16 KB | ~0.9 MB estimated |
| FatBoy | 1.27 MB (88 files) | ~15 KB | ~0.85 MB estimated |

### CDN URL Pattern

```
https://gleitz.github.io/midi-js-soundfonts/{Soundfont}/{instrument}-mp3/{Note}{Octave}.mp3
```

Examples (verified accessible with HTTP 200):
- `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_jazz-mp3/C3.mp3`
- `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_jazz-mp3/E3.mp3`
- `https://gleitz.github.io/midi-js-soundfonts/MusyngKite/electric_guitar_jazz-mp3/C4.mp3`
- `https://gleitz.github.io/midi-js-soundfonts/FatBoy/electric_guitar_jazz-mp3/C4.mp3`

CDN headers confirm: `access-control-allow-origin: *` (CORS enabled for cross-origin use).

### Tone.js Integration

```js
// Sparse sample map (Tone.js Sampler interpolates between samples)
const GUITAR_JAZZ_SAMPLE_MAP = {
  'E2': 'E2.mp3',
  'G2': 'G2.mp3',
  'Bb2': 'Bb2.mp3',
  'Db3': 'Db3.mp3',
  'E3': 'E3.mp3',
  'G3': 'G3.mp3',
  'Bb3': 'Bb3.mp3',
  'Db4': 'Db4.mp3',
  'E4': 'E4.mp3',
  'G4': 'G4.mp3',
  'Bb4': 'Bb4.mp3',
  'Db5': 'Db5.mp3',
  'E5': 'E5.mp3',
};

const guitarSampler = new Tone.Sampler({
  urls: GUITAR_JAZZ_SAMPLE_MAP,
  release: 1.2,
  baseUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_jazz-mp3/',
}).toDestination();
```

**Note on naming**: The file naming uses flats only (`Bb`, `Eb`, `Ab`, `Db`, `Gb`). Tone.js Sampler accepts both `Bb3` and `A#3` as input when triggering notes, so no conversion is needed on the playback side. But the sample map keys must match the file names (use flat names).

### Comparison of Soundfont Quality

- **FluidR3_GM**: Most widely used, good general-purpose quality. Jazz guitar has a warm, round tone suitable for guide tones.
- **MusyngKite**: Higher-fidelity source (1.75 GB uncompressed sf2), but the per-note mp3 renders are similar in size. Potentially slightly richer harmonics.
- **FatBoy**: Smallest files, comparable quality. Good for minimizing load time.

**Recommendation**: FluidR3_GM `electric_guitar_jazz` for best "jazz" tone, or FatBoy for smaller file sizes.

---

## Option 2: Tone.js Official Audio (tonejs.github.io/audio)

### Source
- **Repository**: https://github.com/Tonejs/audio
- **URL**: `https://tonejs.github.io/audio/`

### Findings

The Tone.js official audio repo contains:
- `salamander/` - Piano samples (currently used by this project)
- `casio/` - Casio keyboard samples (limited range: A1 to F2, with some octave 2-4 notes)
- `berklee/` - Berklee sound archive (misc sounds, NOT chromatic instrument samples)
- `drum-samples/` - Drum kits
- `impulse-responses/` - Reverb IRs
- `loop/` - Loop samples

**NO guitar chromatic samples available** in the Tone.js official audio repository.

The `berklee/` folder contains some guitar chord snippets and individual string sounds, but NOT a chromatic set suitable for Sampler use.

---

## Option 3: nbrosowsky/tonern-instruments

### Source
- **Repository**: https://github.com/nbrosowsky/tonern-instruments
- **License**: Not specified in repo metadata

### Findings

The repo structure could not be fully enumerated (API returned empty for `samples` folder with guitar filter). This project appears to be designed for use with Tone.js but documentation is limited. Without confirmed guitar samples or clear licensing, this is **not recommended**.

---

## Option 4: Self-hosting from gleitz CDN

For production reliability (in case GitHub Pages goes down), samples could be downloaded and placed in the project's `public/` directory:

```
public/
  audio/
    guitar-jazz/
      E2.mp3
      G2.mp3
      Bb2.mp3
      ...
```

Estimated size for sparse map (13 samples): ~240-260 KB total
Estimated size for full guitar range (60 notes, E2-E6): ~0.9-1.1 MB

The Vite build would serve these from `/jazz-guitar-trainer/audio/guitar-jazz/`.

**Tradeoff**: Self-hosting adds to repo size but eliminates CDN dependency. Given the project is already on GitHub Pages, serving from the same domain avoids CORS issues and external dependency.

---

## Option 5: Alternative Sources (Lower Priority)

### Salamander Grand Guitar (Karoryfer Samples)
- Salamander has guitar variants but they are distributed as SFZ/WAV multi-samples, not pre-extracted individual mp3s
- Would require manual conversion, not practical for this project

### Archive.org
- Various guitar sample packs exist but licensing is inconsistent
- Individual note extraction would be required
- Not recommended for a maintained project

### MIDI.js Pre-rendered (same as Option 1)
- The gleitz repo IS the canonical pre-rendered MIDI.js soundfont collection
- Other mirrors exist but all derive from the same source

---

## Summary & Recommendation

| Option | Quality | Size | License | CDN Ready | Recommended |
|---|---|---|---|---|---|
| gleitz FluidR3_GM jazz guitar | Good | ~1.66 MB full / ~240 KB sparse | CC BY 3.0 | Yes | **PRIMARY** |
| gleitz FatBoy jazz guitar | Good | ~1.27 MB full / ~195 KB sparse | CC BY-SA 3.0 | Yes | Alternative |
| gleitz MusyngKite jazz guitar | Good+ | ~1.32 MB full / ~200 KB sparse | CC BY-SA 3.0 | Yes | Alternative |
| gleitz FluidR3_GM clean guitar | Good | ~1.51 MB full | CC BY 3.0 | Yes | If jazz too dark |
| Tone.js official | N/A | N/A | N/A | N/A | No guitar available |
| Self-host (from gleitz) | Same | Same | Same | N/A (local) | For reliability |

### Integration Approach

The most direct integration path:
1. Use `electric_guitar_jazz-mp3` from FluidR3_GM via CDN
2. Create a sparse sample map covering the guitar range (E2 to E5/E6)
3. Follow the same pattern as the existing `getPianoSampler()` function
4. Add an instrument selection option (piano vs guitar) to the guide-tone UI

### Key Naming Caveat

The gleitz samples use **flat-only naming** (`Bb`, not `A#`; `Db`, not `C#`). The current `PIANO_SAMPLE_MAP` in `audio-engine.js` uses sharp naming for some keys (`D#1`, `F#1`). For the guitar sampler map, keys should use flat names to match the file names on the CDN.

However, Tone.js Sampler handles enharmonic equivalents internally when playing notes - you can call `triggerAttackRelease('C#4', ...)` even if only `Db4` is in the sample map, as long as that sample is loaded.
