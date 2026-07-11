# Skill Activation Evals

Use these prompts to check that the new LitSquare Stage skill set routes by workflow phase instead of renderer niche.

| Prompt | Expected first skill | Expected follow-up |
|---|---|---|
| Create a responsive LitSquare Stage product video. | `litsquare-stage-video-director` then `litsquare-stage-init-project` | `litsquare-stage-author-motion`, `litsquare-stage-responsive-pack`, `litsquare-stage-render-video`, `litsquare-stage-quality-review` |
| Initialize a LitSquare Stage project for a fluid HTML typography animation. | `litsquare-stage-init-project` | `litsquare-stage-author-motion` with CSS/DOM guidance from `runner-surfaces.md` |
| Make a WebGPU shader loop with Canvas fallback. | `litsquare-stage-init-project` | `litsquare-stage-author-motion` with WebGPU guidance from `runner-surfaces.md` |
| Render this project to MP4 with motion blur. | `litsquare-stage-render-video` | App preflight, motion blur reference, artifact QA |
| Turn this Figma frame into a LitSquare Stage video. | `litsquare-stage-figma-source` | `litsquare-stage-init-project`, `litsquare-stage-author-motion`, `litsquare-stage-render-video` |
| Generate batch weather videos from JSON data. | `litsquare-stage-data-video` | Snapshot data, variant configs, `litsquare-stage-render-video` |

Passing behavior:

- New projects route through `litsquare-stage-init-project` before authoring or rendering.
- Render requests route through `litsquare-stage-render-video`.
- Renderer technology such as SVG, Canvas, Three.js, or WebGPU does not activate a separate renderer-specific skill.
- The render path never falls back to Playwright, Chromium, browser automation, or a remote service.
