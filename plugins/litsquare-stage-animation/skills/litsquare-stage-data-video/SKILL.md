---
name: litsquare-stage-data-video
description: Generate LitSquare Stage videos from structured data and batch variants. Use for API, CSV, JSON, weather, finance, sports, real-estate, event, retail, localized, or other data-driven video workflows.
---

# LitSquare Stage Data Video

Use for data-driven and batch-rendered videos.

## Workflow

1. Define the data contract and required fields.
2. Snapshot API, CSV, or JSON input before rendering.
3. Validate units, dates, missing values, and variant count.
4. Store snapshot data beside the project under `data/` or beside artifacts.
5. Initialize or verify the project with `litsquare-stage-init-project`.
6. Generate deterministic variant configs.
7. Render each variant through `litsquare-stage-render-video`.
8. Write an output manifest with inputs, render settings, artifacts, and timestamps.

## Naming

Use stable artifact names:

```text
{template}-{variant}-{format}-{timestamp}
```

## Rules

- Never fetch live API data inside `renderFrame`.
- Render-critical data must come from local snapshots.
- Batch output must include a manifest that can be audited after rendering.

## Output

Report data source, snapshot path, variant count, render settings, artifact paths, and manifest path.
