# Responsive Fluid HTML

Use these rules for proportional LitSquare Stage pages and multi-format video packs.

## Stage

The HTML page is the rendered frame. It should not scroll, reflow from browser chrome, or depend on arbitrary viewport defaults.

```css
html,
body,
#stage {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  overflow: hidden;
}
```

Inside `renderFrame`, derive stage variables:

```ts
const aspect = ctx.width / Math.max(ctx.height, 1);
const unit = Math.min(ctx.width, ctx.height) / 100;
const safeX = Math.round(ctx.width * 0.07);
const safeY = Math.round(ctx.height * 0.08);

element.style.setProperty("--stage-width", `${ctx.width}px`);
element.style.setProperty("--stage-height", `${ctx.height}px`);
element.style.setProperty("--stage-aspect", String(aspect));
element.style.setProperty("--unit", `${unit}px`);
element.style.setProperty("--safe-x", `${safeX}px`);
element.style.setProperty("--safe-y", `${safeY}px`);
```

## Layout Strategies

- Reflow: typography, charts, UI-like compositions, data labels.
- Crop: product or image scenes with a protected subject.
- Letterbox/pillarbox: exact cinematic framing.
- Alternate layout: radically different ratios such as 16:9 and 9:16.

## Rules

- Avoid hard-coded 1920x1080 coordinates unless the deliverable is truly single-format.
- Use safe areas for titles, captions, logos, lower thirds, and platform overlays.
- Compute fluid type from `ctx.width`, `ctx.height`, or `--unit`; do not rely only on viewport units.
- Use `line-height`, `max-width`, and safe-area bounds so long words do not clip.
- Test first, middle, densest, and final frames for every format.
