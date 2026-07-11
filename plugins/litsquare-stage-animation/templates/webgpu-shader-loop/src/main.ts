import { attachBrowserHost, attachRenderHost, createRunner, type FrameContext, type LitSquareStageSketch } from "@litsquare/stage";
import config from "../stage.config.json";
import "./styles.css";

const root = document.getElementById("stage");
if (!root) {
  throw new Error("Missing #stage root.");
}

let canvas: HTMLCanvasElement | null = null;
let shaderRenderer: ShaderRenderer | null = null;

const sketch: LitSquareStageSketch = {
  setup(_ctx, element) {
    element.innerHTML = `<canvas id="shader-canvas"></canvas><p class="label">Shader loop</p>`;
    canvas = element.querySelector<HTMLCanvasElement>("#shader-canvas");
    if (!canvas) {
      throw new Error("Missing #shader-canvas.");
    }
  },
  async prepareExport(ctx) {
    await ensureRenderer();
    await shaderRenderer?.render(ctx);
  },
  async renderFrame(ctx) {
    await ensureRenderer();
    await shaderRenderer?.render(ctx);
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

async function ensureRenderer() {
  if (shaderRenderer || !canvas) {
    return;
  }
  try {
    shaderRenderer = await WebGPUShaderRenderer.create(canvas);
  } catch {
    shaderRenderer = new CanvasFallbackShaderRenderer(canvas);
  }
  const label = document.querySelector(".label");
  if (label) {
    label.textContent = shaderRenderer.statusLabel;
  }
}

interface ShaderRenderer {
  readonly statusLabel: string;
  render(ctx: FrameContext): Promise<void> | void;
}

class CanvasFallbackShaderRenderer implements ShaderRenderer {
  readonly statusLabel = "Canvas fallback loop";
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D fallback is unavailable.");
    }
    this.context = context;
  }

  render(ctx: FrameContext) {
    if (this.canvas.width !== ctx.width || this.canvas.height !== ctx.height) {
      this.canvas.width = ctx.width;
      this.canvas.height = ctx.height;
    }
    const progress = ctx.durationFrames <= 1 ? 0 : ctx.frame / (ctx.durationFrames - 1);
    const gradient = this.context.createLinearGradient(0, 0, ctx.width, ctx.height);
    gradient.addColorStop(0, `hsl(${Math.round(progress * 360)}, 78%, 52%)`);
    gradient.addColorStop(1, `hsl(${Math.round(220 + progress * 160)}, 82%, 28%)`);
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, ctx.width, ctx.height);
    for (let index = 0; index < 18; index += 1) {
      const t = progress * Math.PI * 2 + index * 0.52;
      const x = ctx.width * (0.5 + Math.sin(t * 1.7) * 0.34);
      const y = ctx.height * (0.5 + Math.cos(t * 1.1) * 0.34);
      this.context.fillStyle = `rgba(255,255,255,${0.05 + index * 0.004})`;
      this.context.beginPath();
      this.context.arc(x, y, Math.min(ctx.width, ctx.height) * (0.04 + index * 0.004), 0, Math.PI * 2);
      this.context.fill();
    }
  }
}

class WebGPUShaderRenderer implements ShaderRenderer {
  readonly statusLabel = "WebGPU WGSL loop";
  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gpu: any,
    private readonly device: any,
    private readonly context: any,
    private readonly format: string,
    private readonly pipeline: any,
    private readonly uniformBuffer: any,
    private readonly bindGroup: any
  ) {}

  static async create(canvas: HTMLCanvasElement) {
    const gpu = (navigator as any).gpu;
    if (!gpu) {
      throw new Error("WebGPU is unavailable.");
    }
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      throw new Error("WebGPU adapter is unavailable.");
    }
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new Error("WebGPU canvas context is unavailable.");
    }
    const format = gpu.getPreferredCanvasFormat();
    const shader = device.createShaderModule({ code: wgslSource });
    const uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      }]
    });
    const pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: { module: shader, entryPoint: "vs_main" },
      fragment: { module: shader, entryPoint: "fs_main", targets: [{ format }] },
      primitive: { topology: "triangle-list" }
    });
    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
    });
    return new WebGPUShaderRenderer(canvas, gpu, device, context, format, pipeline, uniformBuffer, bindGroup);
  }

  render(ctx: FrameContext) {
    if (this.canvas.width !== ctx.width || this.canvas.height !== ctx.height) {
      this.canvas.width = ctx.width;
      this.canvas.height = ctx.height;
      this.context.configure({ device: this.device, format: this.format, alphaMode: "opaque" });
    }
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      new Float32Array([ctx.frame, ctx.width, ctx.height, ctx.durationFrames])
    );
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0.02, g: 0.03, b: 0.08, a: 1 },
        loadOp: "clear",
        storeOp: "store"
      }]
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(3);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }
}

const wgslSource = `
struct Uniforms {
  frame: f32,
  width: f32,
  height: f32,
  durationFrames: f32
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  var output: VertexOut;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  output.uv = positions[vertexIndex] * 0.5 + vec2<f32>(0.5, 0.5);
  return output;
}

@fragment
fn fs_main(input: VertexOut) -> @location(0) vec4<f32> {
  let progress = uniforms.frame / max(uniforms.durationFrames - 1.0, 1.0);
  let aspect = uniforms.width / max(uniforms.height, 1.0);
  let centered = (input.uv - vec2<f32>(0.5, 0.5)) * vec2<f32>(aspect, 1.0);
  let wave = sin((centered.x * 12.0) + (progress * 6.28318));
  let ring = smoothstep(0.38, 0.18, abs(length(centered) - (0.18 + progress * 0.32)));
  let base = mix(vec3<f32>(0.02, 0.12, 0.38), vec3<f32>(0.04, 0.68, 0.74), input.uv.y);
  let accent = vec3<f32>(1.0, 0.72 + wave * 0.18, 0.16);
  return vec4<f32>(mix(base, accent, ring), 1.0);
}
`;
