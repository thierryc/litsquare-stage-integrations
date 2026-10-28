# Audio Sync

## Place a cue by its endpoint

When a request says a sound should land, finish, or resolve on a visual event, treat the named time as the cue endpoint:

```text
cueStartSeconds = targetEndSeconds - cueDurationSeconds
cueEndSeconds = targetEndSeconds
frame = seconds * fps
```

Keep the timing fractional until the render boundary. For example, a `0.28s` cue ending at `3.24s` starts at `2.96s`; at 60 fps the endpoint is frame `194.4` and the start is frame `177.6`.

Identify the exact visual event before editing. If a scene has both a local logo lockup and a later loop outro, state which event is being used as the sync point.

## Enable and load audio

- Set `render.audioEnabled` to `true` in every target configuration that should contain audio.
- Load and decode local audio during runtime setup or `prepareExport`, never lazily inside `renderFrame`.
- For an `XMLHttpRequest` to a `file:` URL, status `0` can be a successful local load. Accept it only for the `file:` scheme and only when the request completed with a non-empty response. Continue to require a successful HTTP status for `http:` and `https:` URLs.
- Surface asset URL, scheme, status, and response size in a load failure so an agent can distinguish configuration, path, and transport problems.

## Verify the current render

- Check the current job ID and terminal status. Historical events or diagnostics from another job do not describe the retry.
- A successful audio render should progress through audio rendering, muxing, writing the muxed file, and completion.
- Verify the final artifact has both video and audio tracks, plus the requested duration, sample rate, channel count, dimensions, and fps.
