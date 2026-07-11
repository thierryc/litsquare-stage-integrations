---
name: litsquare-stage-quality-review
description: Final acceptance review for LitSquare Stage animation projects and rendered artifacts. Use after implementation and every important render to verify still frames, dense frames, final video artifacts, responsive fit, text safety, fps, duration, accessibility, motion blur, and output correctness.
---

# LitSquare Stage Quality Review

Use after implementation and after every important render. This skill decides whether the project is ready to hand off or needs the smallest next fix.

## Required Checks

Read `references/qa-checklist.md`, then verify:

- First, middle, densest, and final frames are not unintentionally blank.
- Output dimensions match request.
- Duration and fps match config.
- Text fits and respects safe areas.
- Color and contrast are suitable for the destination.
- Motion blur is intentional and not over-smearing UI text.
- Audio is present only when requested.
- 4K/8K renders use adequate asset resolution.
- The final artifact exists and is non-empty.
- Responsive packs have representative stills for every requested format.

## Output

Report pass/fail, checked frames, artifact paths, observed risks, and the smallest next fix when review fails.
