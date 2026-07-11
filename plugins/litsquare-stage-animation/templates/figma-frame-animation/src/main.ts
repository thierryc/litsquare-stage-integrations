import { attachBrowserHost, attachRenderHost, createRunner, type LitSquareStageSketch } from "@litsquare/stage";
import config from "../stage.config.json";
import "./styles.css";

const root = document.getElementById("stage");
if (!root) {
  throw new Error("Missing #stage root.");
}

const design = {
  width: 1920,
  height: 1080,
  background: "#f4f7fb",
  layers: [
    { id: "card", kind: "card", x: 980, y: 180, w: 620, h: 660 },
    { id: "headline", kind: "headline", x: 160, y: 300, w: 760, h: 260, text: "From frame to film." }
  ]
};

const sketch: LitSquareStageSketch = {
  setup(_ctx, element) {
    element.innerHTML = `<section class="frame"></section>`;
    const frame = element.querySelector<HTMLElement>(".frame");
    if (!frame) {
      return;
    }
    frame.style.setProperty("--background", design.background);
    frame.innerHTML = design.layers.map((layer) => {
      const className = layer.kind === "card" ? "layer card" : "layer";
      const content = layer.kind === "headline" ? `<h1 class="headline">${layer.text}</h1>` : "";
      return `<div class="${className}" data-layer-id="${layer.id}">${content}</div>`;
    }).join("");
  },
  async prepareExport() {
    await document.fonts.ready;
  },
  renderFrame(ctx, element) {
    const scaleX = ctx.width / design.width;
    const scaleY = ctx.height / design.height;
    const progress = ctx.durationFrames <= 1 ? 0 : ctx.frame / (ctx.durationFrames - 1);
    for (const [index, layer] of design.layers.entries()) {
      const node = element.querySelector<HTMLElement>(`[data-layer-id="${layer.id}"]`);
      if (!node) {
        continue;
      }
      node.style.setProperty("--x", String(layer.x * scaleX));
      node.style.setProperty("--y", String(layer.y * scaleY));
      node.style.setProperty("--w", String(layer.w * scaleX));
      node.style.setProperty("--h", String(layer.h * scaleY));
      node.style.setProperty("--reveal", String(smoothstep(index * 0.12, index * 0.12 + 0.45, progress)));
    }
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

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - edge0) / Math.max(edge1 - edge0, 0.0001)));
  return x * x * (3 - 2 * x);
}
