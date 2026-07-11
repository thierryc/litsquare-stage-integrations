import paper from "paper";
import { attachBrowserHost, attachRenderHost, createRunner, type LitSquareStageSketch } from "@litsquare/stage";
import config from "../stage.config.json";
import "./styles.css";

const root = document.getElementById("stage");
if (!root) {
  throw new Error("Missing #stage root.");
}

const source = [
  [0, -220],
  [170, -70],
  [120, 170],
  [-120, 170],
  [-170, -70]
];

const target = [
  [0, -240],
  [80, -80],
  [240, 0],
  [80, 80],
  [0, 240],
  [-80, 80],
  [-240, 0],
  [-80, -80]
];

const normalizedSource = normalizePoints(source, target.length);
const normalizedTarget = normalizePoints(target, target.length);

const sketch: LitSquareStageSketch = {
  setup(_ctx, element) {
    element.innerHTML = `
      <section class="stage">
        <svg viewBox="-320 -320 640 640" role="img" aria-label="Morphing vector shape">
          <polygon id="shape"></polygon>
        </svg>
        <p class="label">Paper.js point morph</p>
      </section>
    `;
  },
  renderFrame(ctx, element) {
    const progress = ctx.durationFrames <= 1 ? 0 : ctx.frame / (ctx.durationFrames - 1);
    const cycle = 0.5 - Math.cos(progress * Math.PI * 2) * 0.5;
    const points = normalizedSource.map((point, index) => {
      const targetPoint = normalizedTarget[index];
      const paperPoint = new paper.Point(
        lerp(point[0], targetPoint[0], cycle),
        lerp(point[1], targetPoint[1], cycle)
      );
      return `${paperPoint.x.toFixed(2)},${paperPoint.y.toFixed(2)}`;
    });
    element.querySelector("#shape")?.setAttribute("points", points.join(" "));
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

function normalizePoints(points: number[][], count: number) {
  return Array.from({ length: count }, (_, index) => points[index % points.length]);
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}
