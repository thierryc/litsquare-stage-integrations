# Variable Font Title

## Purpose

Use this template for kinetic typography, title cards, movie-theater intros, music visuals, and brand launch posts.

## Best Use Cases

- A typographic intro driven by weight, width, or optical-size axes.
- A brand title card with smooth premium motion.
- A high-frame-rate text loop for display or social use.

## Preview And Render

```bash
pnpm install
pnpm dev
pnpm build
```

Render a still:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind frame --output /tmp/variable-font-title-frame.png --frame 120 --overwrite
```

Render video:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind video --output /tmp/variable-font-title.mp4 --start-frame 0 --end-frame 239 --overwrite
```

## Main Edit Points

- Add a licensed local variable font under `assets/fonts/`.
- Update `src/styles.css` with the font face and fallback stack.
- Drive font axes, transforms, opacity, and layout from `renderFrame`.

## Data And Assets

The template runs with system fallback fonts, but final work should include licensed local fonts for reproducible output.

## Output

Default render output is 3840x2160 H.264 MP4 at 60 fps with 8-sample motion blur.

## What This Example Teaches

- Variable font axis animation from `FrameContext`.
- Typography-safe timing.
- High-frame-rate render setup.

## Customization Prompts

- Replace the title with a brand launch headline.
- Animate weight and width axes separately.
- Add a subtitle that tracks the main title motion.
