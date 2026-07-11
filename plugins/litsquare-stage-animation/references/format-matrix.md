# Format Matrix

Design against normalized coordinates and render into explicit output formats.

| Use case | Ratio | Resolution | Notes |
| --- | ---: | ---: | --- |
| Instagram square | 1:1 | 1080x1080 | Center-weighted safe area. |
| Instagram portrait feed | 4:5 | 1080x1350 | Keep title and product above lower UI region. |
| Reels, Shorts, TikTok | 9:16 | 1080x1920 | Use larger type and vertical staging. |
| YouTube / broadcast HD | 16:9 | 1920x1080 | Use broadcast-safe title margins. |
| UHD 4K | 16:9 | 3840x2160 | Increase asset resolution and review aliasing. |
| DCI 4K | 256:135 | 4096x2160 | Useful for cinema previews and theatrical plates. |
| UHD 8K | 16:9 | 7680x4320 | Render final only after 1080p/4K approval. |
| Custom LED wall | variable | custom | Match exact pixel map; avoid automatic cropping. |

## Default Render Pack

- 1080x1080
- 1080x1350
- 1080x1920
- 1920x1080
- 3840x2160
- 4096x2160
- 7680x4320

Use `preview` for the working format and update `render` for the final output. If the same creative must ship in multiple formats, keep one source project and generate a per-format config or render request rather than duplicating animation logic.
