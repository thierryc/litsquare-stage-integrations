import { attachBrowserHost, attachRenderHost, createRunner, type LitSquareStageSketch } from "@litsquare/stage";
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
        <h1 class="title">LITSQUARE STAGE</h1>
        <p class="caption">Variable font axes driven from frame context.</p>
      </section>
    `;
  },
  async prepareExport() {
    await document.fonts.ready;
  },
  renderFrame(ctx, element) {
    const progress = ctx.durationFrames <= 1 ? 0 : ctx.frame / (ctx.durationFrames - 1);
    const pulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2);
    element.style.setProperty("--wght", String(Math.round(180 + pulse * 720)));
    element.style.setProperty("--wdth", String(Math.round(70 + (1 - pulse) * 45)));
    element.style.setProperty("--opsz", String(Math.round(12 + pulse * 60)));
    element.style.setProperty("--scale", String(0.92 + easeInOutCubic(progress) * 0.16));
    element.style.setProperty("--lift", `${Math.sin(progress * Math.PI * 2) * -18}px`);
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

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
