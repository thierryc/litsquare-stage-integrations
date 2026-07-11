import { attachBrowserHost, attachRenderHost, createRunner, type FrameContext, type LitSquareStageSketch } from "@litsquare/stage";
import config from "../stage.config.json";
import "./styles.css";

const root = document.getElementById("stage");
if (!root) {
  throw new Error("Missing #stage root.");
}

const slides = [
  { title: "Frame First", caption: "Every visible value is derived from LitSquare Stage frame context." },
  { title: "Design Once", caption: "Replace these slides with product, venue, editorial, or event content." },
  { title: "Render Clean", caption: "Capture stills before long videos and inspect artifact dimensions." }
];

const sketch: LitSquareStageSketch = {
  setup(_ctx, element) {
    element.innerHTML = `
      <section class="slide">
        <div class="slide__index"></div>
        <h1 class="slide__title"></h1>
        <p class="slide__caption"></p>
      </section>
    `;
  },
  renderFrame(ctx, element) {
    const slide = currentSlide(ctx);
    element.style.setProperty("--local-progress", String(slide.localProgress));
    element.style.setProperty("--fade", String(fadeInOut(slide.localProgress)));
    element.style.setProperty("--accent-x", String(slide.index / Math.max(slides.length - 1, 1)));
    setText(element, ".slide__index", `${String(slide.index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`);
    setText(element, ".slide__title", slides[slide.index].title);
    setText(element, ".slide__caption", slides[slide.index].caption);
  }
};

const runner = createRunner({
  root,
  sketch,
  initialContext: {
    fps: config.preview.fps,
    width: config.preview.width,
    height: config.preview.height,
    durationFrames: config.preview.durationFrames
  }
});

attachBrowserHost(runner, {
  fps: config.preview.fps,
  width: config.preview.width,
  height: config.preview.height,
  durationFrames: config.preview.durationFrames,
  autoplay: true,
  loop: config.preview.loop
});

attachRenderHost(runner);

function currentSlide(ctx: FrameContext) {
  const frame = Math.max(0, Math.min(ctx.frame, ctx.durationFrames - 1));
  const framesPerSlide = ctx.durationFrames / slides.length;
  const index = Math.min(slides.length - 1, Math.floor(frame / framesPerSlide));
  const localProgress = clamp01((frame - index * framesPerSlide) / framesPerSlide);
  return { index, localProgress };
}

function fadeInOut(progress: number) {
  return Math.min(smoothstep(0, 0.18, progress), 1 - smoothstep(0.82, 1, progress));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp01((value - edge0) / Math.max(edge1 - edge0, 0.0001));
  return x * x * (3 - 2 * x);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function setText(root: Element, selector: string, text: string) {
  const node = root.querySelector(selector);
  if (node) {
    node.textContent = text;
  }
}
