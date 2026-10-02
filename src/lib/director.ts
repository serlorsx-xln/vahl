import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ALL_SCENES, sceneProgress, story, type SceneId } from "./story";
import { clamp, damp, lerp, smoothstep, easeInOutCubic, win } from "./math";
import { countdown, pad, solarElevation, tromsoClock } from "./time";
import { PART, PARTS, SCREW_LABEL, SCREWS, type PartId } from "@/components/three/layout";
import { CHAPTERS } from "@/components/Chrome";
import { scroller } from "./scroll";

/**
 * The DOM half of the stage, run once per frame on the GSAP ticker.
 * Scroll positions come from ScrollTrigger; everything is written straight
 * to the DOM and to CSS custom properties, never through React.
 */

type Win = { el: HTMLElement; scene: SceneId; a: number; b: number; untilReq: number; on: boolean };

const FROST = [216, 213, 206];
const NIGHT = [13, 17, 24];
const LACQUER = [23, 24, 27];
const FROST_INK = [227, 224, 217];
const INK2_DAY = [74, 75, 80];
const INK2_NIGHT = [160, 163, 170];

const mix3 = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const rgb = (c: number[]) => `${c[0]} ${c[1]} ${c[2]}`;

export function startDirector() {
  const root = document.documentElement;
  const triggers = new Map<SceneId, ScrollTrigger>();
  for (const { id } of ALL_SCENES) {
    const el = document.getElementById(id);
    if (!el) continue;
    triggers.set(
      id,
      ScrollTrigger.create(
        id === "request"
          ? { trigger: el, start: "top bottom", end: "top top" }
          : id === "night"
            ? // mørketid completes as the request starts to rise into view
              { trigger: el, start: "top top", end: "bottom bottom" }
            : { trigger: el, start: "top top", end: "bottom top" },
      ),
    );
  }

  const q = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T & Element>(sel)) as T[];

  const wins: Win[] = q<HTMLElement>("[data-in]").map((el) => {
    const [a, b] = (el.dataset.in ?? "0,1").split(",").map(Number);
    const scene = (el.closest<HTMLElement>("[data-scene]")?.dataset.scene ?? "tick") as SceneId;
    return { el, scene, a, b, untilReq: Number(el.dataset.untilRequest ?? 9), on: el.classList.contains("on") };
  });

  const partCounters = q<HTMLElement>('[data-counter="parts"]');
  const releaseCounters = q<HTMLElement>('[data-counter="releases"]');
  const meter = document.querySelector<HTMLElement>("[data-meter]");
  const meterLabel = document.querySelector<HTMLElement>("[data-meter-label]");
  const releaseDot = document.querySelector<HTMLElement>("[data-release]");
  const clocks = q<HTMLElement>("[data-clock]");
  const bar = document.querySelector<HTMLElement>(".bar");
  let tucked = false;
  let ride = -1;
  const days = q<HTMLElement>("[data-days]");
  const cd = {
    d: q<HTMLElement>('[data-cd="d"]'),
    h: q<HTMLElement>('[data-cd="h"]'),
    m: q<HTMLElement>('[data-cd="m"]'),
    s: q<HTMLElement>('[data-cd="s"]'),
  };
  const sunV = document.querySelector<HTMLElement>("[data-sun]");
  const sunDot = document.querySelector<SVGCircleElement>("[data-sun-dot]");
  const ticks = q<HTMLElement>("[data-tick]");
  const chapterName = document.querySelector<HTMLElement>("[data-chapter-name]");
  const caption = document.querySelector<HTMLElement>("[data-caption]");
  const capNo = document.querySelector<HTMLElement>("[data-caption-no]");
  const capName = document.querySelector<HTMLElement>("[data-caption-name]");
  const capSpec = document.querySelector<HTMLElement>("[data-caption-spec]");
  const cursor = story.cursor;

  // fixed chrome inks itself by where it sits: the blued field reaches each
  // piece as its front passes, so no word is ever left the wrong colour on it
  const inked = q<HTMLElement>(".wordmark, .bar-mid, .bar-cta, .track, .m-caption").map((el) => ({ el, x: 0, y: 0, k: -1, lit: false }));
  const measureInked = () => {
    for (const c of inked) {
      const r = c.el.getBoundingClientRect();
      c.x = r.left + r.width / 2;
      c.y = r.top + r.height / 2;
    }
  };
  measureInked();
  window.addEventListener("resize", measureInked);

  const last = {
    parts: -1,
    releases: -1,
    sec: -1,
    sunAt: 0,
    tick: -1,
    chapter: "",
    caption: "",
    vars: new Map<string, string>(),
    cx: -1,
    cy: -1,
    elx: 0,
    ely: 0,
    scroll: 0,
    rel: -1,
  };

  const setVar = (k: string, v: string) => {
    if (last.vars.get(k) === v) return;
    last.vars.set(k, v);
    root.style.setProperty(k, v);
  };

  const kick = (el: HTMLElement) => {
    if (story.reduced) return;
    el.animate([{ transform: "translateY(-0.045em)" }, { transform: "translateY(0.008em)" }, { transform: "none" }], {
      duration: 180,
      easing: "cubic-bezier(.2,.9,.3,1)",
    });
  };

  const looseParts = () => {
    const ex = story.movement.explode;
    let n = 0;
    for (const p of PARTS) if ((ex[p.id] ?? 0) >= 0.5) n += p.count;
    n += Math.round((38 * story.movement.screwsOut) / SCREWS.length);
    return n;
  };

  const frame = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 1 / 20);
    const W = window.innerWidth;
    const H = window.innerHeight;

    // ---- scroll → scene progress
    const scroll = scroller.lenis ? scroller.lenis.animatedScroll : window.scrollY;
    for (const [id, st] of triggers) {
      story.progress[id] = st.end > st.start ? clamp((scroll - st.start) / (st.end - st.start)) : 0;
    }
    const max = Math.max(1, document.documentElement.scrollHeight - H);
    story.global = clamp(scroll / max);
    const v = scroller.lenis ? scroller.lenis.velocity : scroll - last.scroll;
    story.velocity = lerp(story.velocity, v, damp(10, dt));
    last.scroll = scroll;

    const P = story.progress;
    const pO = sceneProgress("once");
    const pN = sceneProgress("night");
    const pR = P.request;

    // ---- show / hide staged words: only the scene on stage speaks
    let current: SceneId = "tick";
    for (const { id } of ALL_SCENES) if (id !== "request" && P[id] > 0) current = id;
    for (const w of wins) {
      const p = P[w.scene];
      const on = w.scene === current && p >= w.a && p <= w.b && pR < w.untilReq;
      if (on !== w.on) {
        w.on = on;
        w.el.classList.toggle("on", on);
      }
    }

    // ---- past the request's top the page reads like a page: on a phone the
    // watch rides up with the words, and the bar steps aside while reading down
    const past = Math.max(0, scroll - (triggers.get("request")?.end ?? Infinity));
    const r = story.mobile ? Math.round(past) : 0;
    if (r !== ride) {
      ride = r;
      setVar("--ride", `${r}px`);
    }
    if (past < 24) tucked = false;
    else if (v > 0.6) tucked = true;
    else if (v < -0.6) tucked = false;
    if (bar && bar.classList.contains("is-tucked") !== tucked) bar.classList.toggle("is-tucked", tucked);

    // ---- ground: frost → (blued drench) → frost → mørketid
    const nightT = easeInOutCubic(smoothstep(0.06, 0.5, pN));
    const ground = mix3(FROST, NIGHT, nightT);
    story.ground = [ground[0] / 255, ground[1] / 255, ground[2] / 255];
    setVar("--ground", rgb(ground));
    setVar("--ink", rgb(mix3(LACQUER, FROST_INK, nightT)));
    setVar("--ink-2", rgb(mix3(INK2_DAY, INK2_NIGHT, nightT)));

    // the temper run: blue spreads from the remontoir like colour running along heated steel
    const tx = story.temperOrigin.x * W;
    const ty = story.temperOrigin.y * H;
    // run far enough that the coloured front has left the screen entirely
    const far = Math.hypot(Math.max(tx, W - tx), Math.max(ty, H - ty)) + Math.min(W, H) * 0.3;
    const spread = story.reduced
      ? pO > 0 && pO < 1
        ? 1
        : 0
      : easeInOutCubic(win(pO, 0.05, 0.25, (t) => t)) * (1 - easeInOutCubic(win(pO, 0.83, 0.98, (t) => t)));
    const tr = spread * far;
    setVar("--sheen", `${(28 + 40 * smoothstep(0.1, 0.92, pO)).toFixed(1)}%`);
    setVar("--tx", `${tx.toFixed(1)}px`);
    setVar("--ty", `${ty.toFixed(1)}px`);
    setVar("--tr", `${tr.toFixed(1)}px`);
    const blueCover = smoothstep(0.55, 0.92, spread);
    const uiDark = Math.max(nightT, blueCover);
    setVar("--ui-ink", rgb(mix3(LACQUER, FROST_INK, uiDark)));
    setVar("--ui-dark", uiDark.toFixed(3));
    root.classList.toggle("is-dark", uiDark > 0.5);
    // the front's straw and bronze read as light ground, its purple as dark
    const front = tr - 1.5 * (Math.min(W, H) / 100);
    for (const c of inked) {
      const k = Math.max(nightT, tr > 0 ? smoothstep(-32, 32, front - Math.hypot(c.x - tx, c.y - ty)) : 0);
      const kq = Math.round(k * 100);
      if (kq === c.k) continue;
      c.k = kq;
      c.el.style.setProperty("--ui-ink", rgb(mix3(LACQUER, FROST_INK, k)));
      if (k > 0.5 !== c.lit) {
        c.lit = k > 0.5;
        c.el.classList.toggle("is-lit", c.lit);
      }
    }

    // the bench lamp at mørketid
    setVar("--lx", `${(story.lamp.x * 100).toFixed(2)}%`);
    setVar("--ly", `${(story.lamp.y * 100).toFixed(2)}%`);
    setVar("--lr", `${Math.max(180, story.lamp.r * H * 1.9).toFixed(0)}px`);
    setVar("--lamp", (nightT * (1 - smoothstep(0.6, 1, pR) * 0.5)).toFixed(3));

    // ---- counters
    const parts = looseParts();
    if (parts !== last.parts) {
      const txt = pad(parts, 3);
      partCounters.forEach((el) => {
        el.textContent = txt;
        if (last.parts >= 0) kick(el);
      });
      last.parts = parts;
    }
    const rel = story.movement.releases;
    if (rel !== last.releases) {
      const txt = rel.toLocaleString("en-GB");
      releaseCounters.forEach((el) => (el.textContent = txt));
      last.releases = rel;
      last.rel = performance.now();
      if (releaseDot && !story.reduced)
        releaseDot.animate([{ opacity: 1, transform: "scale(1.35)" }, { opacity: 0.35, transform: "scale(1)" }], {
          duration: 620,
          easing: "cubic-bezier(.16,1,.3,1)",
        });
    }
    if (meter && pO > 0 && pO < 1) {
      // the remontoir spring winds through the second and gives it all back at once
      const phase = (Date.now() % 1000) / 1000;
      meter.style.transform = `scaleX(${phase.toFixed(3)})`;
      const justLet = performance.now() - last.rel < 180;
      if (meterLabel) {
        const want = justLet ? "Released" : "Winding";
        if (meterLabel.textContent !== want) meterLabel.textContent = want;
      }
    }

    // ---- clocks (once per real second)
    const now = Date.now();
    const sec = Math.floor(now / 1000);
    if (sec !== last.sec) {
      last.sec = sec;
      const c = tromsoClock(now);
      const t = `${pad(c.h)}:${pad(c.m)}:${pad(c.s)}`;
      clocks.forEach((el) => (el.textContent = t));
      const left = countdown(now);
      days.forEach((el) => (el.textContent = String(left.d)));
      cd.d.forEach((el) => (el.textContent = String(left.d)));
      cd.h.forEach((el) => (el.textContent = pad(left.h)));
      cd.m.forEach((el) => (el.textContent = pad(left.m)));
      cd.s.forEach((el) => (el.textContent = pad(left.s)));
      if (now - last.sunAt > 30_000) {
        last.sunAt = now;
        const el = solarElevation(now);
        if (sunV) sunV.textContent = `${el < 0 ? "−" : "+"}${Math.abs(el).toFixed(1)}°`;
        if (sunDot) sunDot.setAttribute("cy", String(clamp(20 - el * 0.55, 4, 36).toFixed(1)));
      }
    }

    // ---- the minute track steps, it never slides
    let acc = 0;
    let storyT = 0;
    let chapter = CHAPTERS[0];
    for (const ch of CHAPTERS) {
      const p = P[ch.id as SceneId] ?? 0;
      if (p > 0) chapter = ch;
      acc += ch.len * p;
    }
    storyT = acc;
    const tick = Math.min(59, Math.floor(storyT * 60 + 0.0001));
    if (tick !== last.tick) {
      ticks.forEach((el, i) => {
        el.classList.toggle("past", i < tick);
        el.classList.toggle("now", i === tick);
      });
      last.tick = tick;
    }
    if (chapter.id !== last.chapter) {
      last.chapter = chapter.id;
      if (chapterName) chapterName.textContent = chapter.name;
    }

    // ---- mobile: one caption for the part that just came off
    if (caption) {
      const pA = sceneProgress("apart");
      const latest = story.movement.latest;
      const show = story.mobile && pA > 0.02 && pA < 0.97 && pO < 0.02 && latest !== "";
      caption.classList.toggle("on", show);
      if (show && latest !== last.caption) {
        const l = latest === "screws" ? SCREW_LABEL : PART[latest as PartId]?.label;
        if (l) {
          last.caption = latest;
          if (capNo) capNo.textContent = `Nº ${l.no}`;
          if (capName) capName.textContent = l.name;
          if (capSpec) capSpec.textContent = l.spec;
        }
      }
    }

    // ---- cursor ring, lerped; light on the engraving follows it
    const ptr = story.pointer;
    if (cursor && ptr.fine) {
      if (last.cx < 0) {
        last.cx = ptr.x;
        last.cy = ptr.y;
      }
      const k = story.reduced ? 1 : damp(22, dt);
      last.cx = lerp(last.cx, ptr.x, k);
      last.cy = lerp(last.cy, ptr.y, k);
      cursor.style.transform = `translate3d(${last.cx.toFixed(1)}px, ${last.cy.toFixed(1)}px, 0)`;
      cursor.classList.toggle("in", ptr.inside);
    }
    const lk = damp(3, dt);
    last.elx = lerp(last.elx, -ptr.nx, lk);
    last.ely = lerp(last.ely, -ptr.ny, lk);
    setVar("--elx", `${(last.elx * 0.7).toFixed(2)}px`);
    setVar("--ely", `${(1 + last.ely * 0.5).toFixed(2)}px`);
  };

  gsap.ticker.add(frame);
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh).then(measureInked).catch(() => {});
  window.addEventListener("load", refresh);

  return () => {
    gsap.ticker.remove(frame);
    window.removeEventListener("load", refresh);
    window.removeEventListener("resize", measureInked);
    triggers.forEach((t) => t.kill());
  };
}
