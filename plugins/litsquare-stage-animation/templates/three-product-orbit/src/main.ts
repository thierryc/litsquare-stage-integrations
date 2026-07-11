import * as THREE from "three";
import { attachBrowserHost, attachRenderHost, createRunner, type FrameContext, type LitSquareStageSketch } from "@litsquare/stage";
import config from "../stage.config.json";
import "./styles.css";

const root = document.getElementById("stage");
if (!root) {
  throw new Error("Missing #stage root.");
}

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let product: THREE.Mesh | null = null;

const sketch: LitSquareStageSketch = {
  setup(ctx, element) {
    element.innerHTML = `<section class="stage"><canvas id="three-canvas"></canvas><p class="label">Product orbit</p></section>`;
    const canvas = element.querySelector<HTMLCanvasElement>("#three-canvas");
    if (!canvas) {
      throw new Error("Missing #three-canvas.");
    }
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#06070a");
    camera = new THREE.PerspectiveCamera(35, ctx.width / ctx.height, 0.1, 100);
    const key = new THREE.DirectionalLight("#ffffff", 4);
    key.position.set(3, 4, 5);
    scene.add(key, new THREE.AmbientLight("#8ab4ff", 0.7));
    product = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.8, 1.8, 8, 8, 8),
      new THREE.MeshStandardMaterial({ color: "#facc15", roughness: 0.38, metalness: 0.42 })
    );
    scene.add(product);
  },
  renderFrame(ctx) {
    if (!renderer || !scene || !camera || !product) {
      return;
    }
    renderThreeFrame(ctx);
  },
  teardown() {
    renderer?.dispose();
    renderer = null;
    scene = null;
    camera = null;
    product = null;
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

function renderThreeFrame(ctx: FrameContext) {
  const progress = ctx.durationFrames <= 1 ? 0 : ctx.frame / (ctx.durationFrames - 1);
  renderer!.setSize(ctx.width, ctx.height, false);
  renderer!.setPixelRatio(1);
  camera!.aspect = ctx.width / Math.max(ctx.height, 1);
  camera!.position.set(Math.sin(progress * Math.PI * 2) * 4, 1.4, Math.cos(progress * Math.PI * 2) * 4);
  camera!.lookAt(0, 0, 0);
  camera!.updateProjectionMatrix();
  product!.rotation.y = progress * Math.PI * 2;
  product!.rotation.x = Math.sin(progress * Math.PI * 2) * 0.18;
  renderer!.render(scene!, camera!);
}
