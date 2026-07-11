import { attachBrowserHost, attachRenderHost, createRunner, type FrameContext, type LitSquareStageSketch } from "@litsquare/stage";
import config from "../stage.config.json";
import "./styles.css";

const root = document.getElementById("stage");
if (!root) {
  throw new Error("Missing #stage root.");
}

const sketch: LitSquareStageSketch = {
  setup(_ctx, element) {
    element.innerHTML = `
      <section class="stage">
        <p class="kicker">Responsive pack</p>
        <div class="orb"></div>
        <div class="safe">
          <h1>One source, many screens.</h1>
          <div class="panel">Frame-derived layout adapts to square, vertical, HD, cinema, and 8K outputs.</div>
        </div>
      </section>
    `;
  },
  renderFrame(ctx, element) {
    const aspect = ctx.width / Math.max(ctx.height, 1);
    const layout = aspect < 0.85 ? "portrait" : aspect < 1.2 ? "square" : "landscape";
    const progress = ctx.durationFrames <= 1 ? 0 : ctx.frame / (ctx.durationFrames - 1);
    const unit = Math.min(ctx.width, ctx.height) / 100;
    const safeX = Math.round(ctx.width * (layout === "portrait" ? 0.08 : 0.07));
    const safeY = Math.round(ctx.height * 0.08);

    element.style.setProperty("--unit", `${unit}px`);
    element.style.setProperty("--safe-x", `${safeX}px`);
    element.style.setProperty("--safe-y", `${safeY}px`);
    element.style.setProperty("--gap", `${unit * 5}px`);
    element.style.setProperty("--grid-columns", layout === "landscape" ? "1.1fr 0.9fr" : "1fr");
    element.style.setProperty("--title-size", `${Math.min(ctx.width / (layout === "portrait" ? 5.5 : 8.5), ctx.height / 4.5)}px`);
    element.style.setProperty("--reveal", String(easeOutCubic(clamp01(progress * 1.4))));
    element.style.setProperty("--motion-x", `${Math.sin(progress * Math.PI * 2) * unit * 9}px`);
    element.style.setProperty("--motion-y", `${Math.cos(progress * Math.PI * 2) * unit * 5}px`);
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

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
