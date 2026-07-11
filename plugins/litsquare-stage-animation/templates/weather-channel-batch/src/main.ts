import { attachBrowserHost, attachRenderHost, createRunner, type LitSquareStageSketch } from "@litsquare/stage";
import config from "../stage.config.json";
import weather from "../data/weather-snapshot.json";
import "./styles.css";

const root = document.getElementById("stage");
if (!root) {
  throw new Error("Missing #stage root.");
}

const sketch: LitSquareStageSketch = {
  setup(_ctx, element) {
    element.innerHTML = `
      <section class="weather">
        <h1 class="headline">${weather.region}<br />Forecast</h1>
        <div class="cards">
          ${weather.cities.map((city) => `
            <article class="card">
              <h2 class="city">${city.name}</h2>
              <p class="temp">${city.tempF}°F</p>
              <p class="condition">${city.condition} · Wind ${city.windMph} mph</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  },
  renderFrame(ctx, element) {
    const progress = ctx.durationFrames <= 1 ? 0 : ctx.frame / (ctx.durationFrames - 1);
    element.style.setProperty("--sun-x", `${20 + Math.sin(progress * Math.PI * 2) * 8}%`);
    for (const [index, card] of Array.from(element.querySelectorAll<HTMLElement>(".card")).entries()) {
      const reveal = smoothstep(index * 0.1, index * 0.1 + 0.35, progress);
      card.style.opacity = String(reveal);
      card.style.transform = `translateY(${(1 - reveal) * 32}px)`;
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
