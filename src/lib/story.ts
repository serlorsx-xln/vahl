/**
 * The story is one fixed stage driven by scroll. Scroll spacers in the
 * document flow give each scene its length; ScrollTrigger writes each
 * scene's local progress here, and the WebGL loop and the DOM director
 * read it every frame without going through React.
 */

export type SceneId =
  | "tick"
  | "turn"
  | "apart"
  | "once"
  | "again"
  | "night"
  | "request";

export const SCENES: { id: Exclude<SceneId, "request">; vh: number; name: string }[] = [
  { id: "tick", vh: 130, name: "The step" },
  { id: "turn", vh: 170, name: "Kaliber 01" },
  { id: "apart", vh: 420, name: "214 parts" },
  { id: "once", vh: 320, name: "Remontoir" },
  { id: "again", vh: 240, name: "Twice" },
  { id: "night", vh: 260, name: "Mørketid" },
];

export const ALL_SCENES: { id: SceneId; name: string }[] = [
  ...SCENES.map(({ id, name }) => ({ id, name })),
  { id: "request", name: "Request" },
];

type Progress = Record<SceneId, number>;

export const story = {
  progress: {
    tick: 0,
    turn: 0,
    apart: 0,
    once: 0,
    again: 0,
    night: 0,
    request: 0,
  } as Progress,
  /** 0..1 across the whole document */
  global: 0,
  /** smoothed scroll velocity, px per frame */
  velocity: 0,
  pointer: {
    x: -9999,
    y: -9999,
    /** -1..1, centered */
    nx: 0,
    ny: 0,
    inside: false,
    fine: true,
  },
  reduced: false,
  mobile: false,
  /** Screen-space anchor of the remontoir, written by WebGL for the temper run */
  temperOrigin: { x: 0.66, y: 0.45 },
  /** Screen-space center + radius of the watch, written by WebGL for the lamp */
  lamp: { x: 0.62, y: 0.46, r: 0.5 },
  /** Specimen label elements, keyed by part id, positioned by WebGL */
  labels: new Map<string, HTMLElement>(),
  leaders: new Map<string, { line: SVGLineElement; dot: SVGCircleElement }>(),
  loupeReadout: null as HTMLElement | null,
  loupeScale: null as HTMLElement | null,
  cursor: null as HTMLElement | null,
  canvasReady: false,
  /** current ground colour (sRGB 0..1), written by the director */
  ground: [0.847, 0.835, 0.808] as [number, number, number],
  /** live movement state, written by WebGL, read by the DOM */
  movement: {
    /** 0 = assembled & running, 1 = fully apart */
    apart: 0,
    /** remontoir release counter (real seconds while it runs) */
    releases: 0,
    /** per-part explode amount, 0..1 */
    explode: {} as Record<string, number>,
    /** screws currently off the movement */
    screwsOut: 0,
    /** most recent part to come off (for the mobile caption) */
    latest: "",
  },
};

/** Quantise progress into discrete steps for the reduced-motion version:
 * the still story advances like the seconds hand, in clean steps. */
/**
 * Reduced motion: each scene rests on a few composed frames instead of
 * moving with the scroll. [from, frame]: the frame holds once progress
 * passes `from`. Frames sit where a step of the story has finished.
 */
const HALVES: [number, number][] = [
  [0, 0],
  [0.25, 0.5],
  [0.75, 1],
];
const REST: Record<SceneId, [number, number][]> = {
  tick: HALVES,
  turn: HALVES,
  apart: [
    [0, 0],
    [0.1, 0.25],
    [0.38, 0.5],
    [0.68, 0.84],
    [0.92, 1],
  ],
  once: HALVES,
  again: [
    [0, 0],
    [0.02, 0.4],
    [0.6, 1],
  ],
  night: HALVES,
  // the watch is already in its place beside the form when the form arrives
  request: [
    [0, 0],
    [0.2, 1],
  ],
};

export function sceneProgress(id: SceneId) {
  const p = story.progress[id];
  if (!story.reduced) return p;
  let f = 0;
  for (const [from, frame] of REST[id]) if (p >= from) f = frame;
  return f;
}
