import type Lenis from "lenis";

/** The one Lenis instance (absent under reduced motion: native scroll). */
export const scroller: { lenis: Lenis | null } = { lenis: null };

const expoInOut = (t: number) =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;

export function scrollToId(id: string, opts?: { focus?: string }) {
  const target = id === "top" ? 0 : document.getElementById(id);
  if (target === null) return;
  const done = () => {
    if (!opts?.focus) return;
    const el = document.querySelector<HTMLElement>(opts.focus);
    el?.focus({ preventScroll: true });
  };
  const lenis = scroller.lenis;
  const from = lenis ? lenis.scroll : window.scrollY;
  let to = 0;
  if (typeof target !== "number") {
    // a scene is entered part-way in, where its words are on stage
    const jump = Number(target.dataset.jump ?? 0);
    to = target.getBoundingClientRect().top + window.scrollY + jump * target.offsetHeight;
  }
  if (lenis) {
    // long journeys take longer, but never feel like a wait
    const duration = Math.min(3.2, 1.1 + Math.abs(to - from) / 6000);
    lenis.scrollTo(to, { duration, easing: expoInOut, onComplete: done });
  } else {
    window.scrollTo({ top: to });
    done();
  }
  if (id !== "top") history.replaceState(null, "", `#${id}`);
  else history.replaceState(null, "", location.pathname);
}
