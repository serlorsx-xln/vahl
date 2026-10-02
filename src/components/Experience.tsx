"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { SCENES, story } from "@/lib/story";
import { startDirector } from "@/lib/director";
import { scroller, scrollToId } from "@/lib/scroll";
import { BackScenes, FrontScenes, SrCopy } from "./Scenes";
import { Cursor, LoupeReadout, MinuteTrack, MobileCaption, SpecimenLabels, TopBar } from "./Chrome";
import { Footer, RequestSection } from "./Request";

const Stage = dynamic(() => import("./three/Stage"), { ssr: false });

/** where a chapter link lands inside its scene: where the words are on stage */
const JUMP: Record<string, number> = { tick: 0, turn: 0.55, apart: 0.5, once: 0.42, again: 0.3, night: 0.45 };

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Experience() {
  const [gl, setGl] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = matchMedia("(max-width: 760px)");
    const mqFine = matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => {
      story.reduced = mqReduce.matches;
      story.mobile = mqMobile.matches;
      story.pointer.fine = mqFine.matches;
      html.classList.toggle("reduced", story.reduced);
      html.classList.toggle("is-mobile", story.mobile);
      html.classList.toggle("fine", story.pointer.fine);
    };
    apply();
    const mqs = [mqReduce, mqMobile, mqFine];
    mqs.forEach((mq) => mq.addEventListener("change", apply));

    // WebGL can only be probed in the browser; the canvas mounts after hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (webglAvailable()) setGl(true);
    else html.classList.add("gl-failed");

    gsap.registerPlugin(ScrollTrigger);
    html.classList.add("js");

    // Lenis gives the long, settling glide; under reduced motion the page scrolls natively
    let lenis: Lenis | null = null;
    if (!story.reduced) {
      lenis = new Lenis({ lerp: 0.072, wheelMultiplier: 0.85, touchMultiplier: 1.4, smoothWheel: true });
      scroller.lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
    }
    const raf = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const stop = startDirector();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const p = story.pointer;
      p.x = e.clientX;
      p.y = e.clientY;
      p.nx = (e.clientX / window.innerWidth) * 2 - 1;
      p.ny = (e.clientY / window.innerHeight) * 2 - 1;
      p.inside = true;
    };
    const onLeave = () => (story.pointer.inside = false);
    const onOver = (e: PointerEvent) => {
      const c = story.cursor;
      if (!c) return;
      const t = e.target as Element | null;
      const text = t?.closest("input, textarea, select");
      const link = !text && t?.closest("a, button, label, [role=button]");
      c.classList.toggle("is-text", !!text);
      c.classList.toggle("is-link", !!link);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    // arrive at a chapter link
    const hash = location.hash.slice(1);
    let hashTimer = 0;
    if (hash && document.getElementById(hash)) {
      hashTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
        scrollToId(hash);
      }, 120);
    }

    return () => {
      window.clearTimeout(hashTimer);
      mqs.forEach((mq) => mq.removeEventListener("change", apply));
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      stop();
      gsap.ticker.remove(raf);
      lenis?.destroy();
      scroller.lenis = null;
    };
  }, []);

  return (
    <>
      <a className="skip" href="#request">
        Skip to the allocation request
      </a>
      <TopBar />
      <MinuteTrack />

      <div className="stage" aria-hidden="true">
        <div className="ground" />
        <div className="lamp" />
        <div className="temper" />
        <div className="layer back">
          <BackScenes />
        </div>
        <div className="gl-wrap">{gl ? <Stage /> : null}</div>
        <div className="layer front">
          <FrontScenes />
          <SpecimenLabels />
          <MobileCaption />
          <LoupeReadout />
        </div>
      </div>

      <main id="top">
        {SCENES.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="spacer"
            data-jump={JUMP[s.id]}
            style={{ ["--len" as string]: s.vh }}
            aria-label={s.name}
          >
            <SrCopy id={s.id} />
          </section>
        ))}
        <RequestSection />
      </main>
      <Footer />
      <Cursor />
    </>
  );
}
