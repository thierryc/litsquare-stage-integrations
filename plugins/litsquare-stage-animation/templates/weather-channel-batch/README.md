# Weather Channel Batch

## Purpose

Use this template for API/data-driven weather, sports, finance, real-estate, retail, or localized ad variants.

## Best Use Cases

- A regional weather loop from a local JSON snapshot.
- A sports matchup or scoreboard pack.
- A localized ad where each city, product, or audience gets its own render.

## Preview And Render

```bash
pnpm install
pnpm dev
pnpm build
```

Render a still:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind frame --output /tmp/weather-channel-batch-frame.png --frame 120 --overwrite
```

Render video:

```bash
node ../../scripts/render-stage-project.mjs --project "$PWD" --kind video --output /tmp/weather-channel-batch.mp4 --start-frame 0 --end-frame 239 --overwrite
```

## Main Edit Points

- Change `data/weather-snapshot.json`.
- Update cards, labels, icons, and maps in `src/main.ts`.
- Keep variant output naming stable.

## Data And Assets

Production workflows should fetch data before rendering, validate it, store the snapshot, then render from that snapshot. Do not call live APIs inside `renderFrame`.

## Output

Default output is a 1920x1080 H.264 MP4 at 30 fps with 4-sample motion blur.

Artifact names should follow:

```text
{template}-{variant}-{format}-{timestamp}
```

## What This Example Teaches

- Data snapshot discipline.
- Repeatable variant rendering.
- Operational naming for generated video packs.

## Customization Prompts

- Change the data snapshot to three city forecasts.
- Rework the template for sports scores.
- Generate one localized retail card per store region.
