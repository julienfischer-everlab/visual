# Particle Organs — organ age prototype

The interactive organ age prototype: a WebGL particle field that morphs between
organs, with a card carousel showing each organ's estimated age and its gap
against the member's chronological age.

Linked from [DES-589 — Organ age concept](https://linear.app/everlab/issue/DES-589/organ-age-concept)
as the full prototype.

| | |
| --- | --- |
| Source | https://claude.ai/code/artifact/78766a66-729c-4942-8206-0acbcf4b8551 |
| Title | Particle Organs |
| Captured from version | 2026-08-25T03:16:48Z |
| Captured on | 2026-08-25 |
| Sharing at capture | Private (owner only) |
| Size | 313 KB, single file |

## Controls

A top bar exposes **Version** (layout variants, including a card-nav view, a
card-flip "spatial" view, a grid, and a mobile bento), **Your age**, **Mode**,
and **Colour mode**.

## Relationship to the other snapshot

This is the later of the two Particle Organs artifacts. Compared with
[`../particle-organs-cf1a68fa`](../particle-organs-cf1a68fa/), the raw
rendering knobs (density, particle size, flow/voxels toggles) have been
replaced by product-shaped controls — age, mode, colour mode — and the
background moved from `#240908` to `#220606` so one colour carries the whole
concept.

## Verification

Rendered headlessly at capture time: particle field, organ cards
(brain 30 / −4 yrs, nerves 28 / −6 yrs, lungs 40 / +6 yrs, heart 31 / −3 yrs),
"14 biomarkers tested" readout, and all controls draw correctly.
