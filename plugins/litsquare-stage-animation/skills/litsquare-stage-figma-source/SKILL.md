---
name: litsquare-stage-figma-source
description: Convert Figma frames, screenshots, design-system inputs, or exported design assets into local renderable LitSquare Stage HTML, CSS, SVG, and JavaScript. Use before motion authoring when the design source is Figma or a visual frame.
---

# LitSquare Stage Figma Source

Use when Figma or an exported design is the source of the video.

## Workflow

1. Inspect the Figma frame, screenshot, or exported assets.
2. Extract frame size, hierarchy, text, styles, colors, assets, and SVG paths.
3. Convert the design into local HTML/CSS/JS; do not render live from Figma at export time.
4. Map layers to semantic DOM/SVG nodes with stable IDs.
5. Initialize or update the LitSquare Stage project through `litsquare-stage-init-project`.
6. Define motion beats, then hand off to `litsquare-stage-author-motion`.
7. Compare a still render against the source frame before animating heavily.

## Integration

If Figma plugin or MCP tools are available, use them to read design context and screenshots. If not, work from user-provided exports.

## Output

Report source frame dimensions, local project path, converted assets, fidelity risks, and the next authoring or render step.
