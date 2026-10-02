"use client";

import { useEffect, useRef } from "react";
import { story, SCENES } from "@/lib/story";
import { LABELLED, PART, SCREW_LABEL, type PartId } from "./three/layout";
import { scrollToId } from "@/lib/scroll";

/* ---------- top bar: wordmark, Tromsø time, the one action ---------- */

export function TopBar() {
  return (
    <header className="bar">
      <a
        className="wordmark"
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          scrollToId("top");
        }}
      >
        VAHL<span className="sr-only">, back to the top</span>
      </a>
      <p className="bar-mid caps">
        <span className="bar-place">Tromsø</span>
        <time className="num" data-clock suppressHydrationWarning>
          --:--:--
        </time>
      </p>
      <a
        className="bar-cta"
        href="#request"
        onClick={(e) => {
          e.preventDefault();
          scrollToId("request", { focus: "#f-name" });
        }}
      >
        <span className="bar-cta-t">Request an allocation</span>
        <span className="bar-days caps">
          closes in <span className="num" data-days suppressHydrationWarning>--</span> days
        </span>
      </a>
    </header>
  );
}

/* ---------- the minute track: 60 ticks, the story's progress rail ---------- */

const STORY = [...SCENES.map((s) => ({ id: s.id as string, vh: s.vh, name: s.name })), { id: "request", vh: 110, name: "Request" }];
const TOTAL = STORY.reduce((a, s) => a + s.vh, 0);
export const CHAPTERS = (() => {
  let acc = 0;
  return STORY.map((s, i) => {
    const at = acc / TOTAL;
    acc += s.vh;
    return { ...s, at, len: s.vh / TOTAL, no: String(i + 1).padStart(2, "0") };
  });
})();

export function MinuteTrack() {
  return (
    <nav className="track" aria-label="Chapters">
      <div className="track-ticks" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => (
          <span key={i} className={`tk${i % 5 === 0 ? " tk5" : ""}`} data-tick={i} style={{ ["--i" as string]: i }} />
        ))}
      </div>
      <ol className="track-marks">
        {CHAPTERS.map((c) => (
          <li key={c.id} style={{ ["--at" as string]: c.at }}>
            <a
              href={`#${c.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(c.id, c.id === "request" ? { focus: "#f-name" } : undefined);
              }}
            >
              <span className="track-name">{c.name}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="track-now caps" aria-hidden="true" data-chapter-name>
        {CHAPTERS[0].name}
      </p>
    </nav>
  );
}

/* ---------- cursor: a small engraved ring; over the work it becomes the loupe ---------- */

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    story.cursor = ref.current;
    return () => {
      story.cursor = null;
    };
  }, []);
  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <span className="cursor-ring" />
      <span className="cursor-dot" />
    </div>
  );
}

export function LoupeReadout() {
  const ro = useRef<HTMLDivElement>(null);
  const sc = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    story.loupeReadout = ro.current;
    story.loupeScale = sc.current;
    return () => {
      story.loupeReadout = null;
      story.loupeScale = null;
    };
  }, []);
  return (
    <div ref={ro} className="loupe-ro" aria-hidden="true">
      <span className="caps">4×</span>
      <span className="loupe-scale">
        <span ref={sc} className="loupe-bar" />
        <span className="caps">1 mm</span>
      </span>
    </div>
  );
}

/* ---------- specimen tags, placed by the WebGL projector ---------- */

function labelFor(id: string) {
  return id === "screws" ? SCREW_LABEL : PART[id as PartId].label!;
}

export function SpecimenLabels() {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    LABELLED.forEach((id) => {
      const line = el.querySelector<SVGLineElement>(`line[data-id="${id}"]`);
      const dot = el.querySelector<SVGCircleElement>(`circle[data-id="${id}"]`);
      if (line && dot) story.leaders.set(id, { line, dot });
    });
    return () => story.leaders.clear();
  }, []);
  return (
    <div className="tags" aria-hidden="true">
      <svg ref={svg} className="leaders">
        {LABELLED.map((id) => (
          <g key={id}>
            <line data-id={id} x1="0" y1="0" x2="0" y2="0" />
            <circle data-id={id} r="2.4" cx="0" cy="0" />
          </g>
        ))}
      </svg>
      {LABELLED.map((id) => {
        const l = labelFor(id);
        return (
          <div
            key={id}
            className="tag"
            ref={(el) => {
              if (el) story.labels.set(id, el);
              else story.labels.delete(id);
            }}
          >
            <span className="tag-no num">Nº {l.no}</span>
            <span className="tag-name">{l.name}</span>
            <span className="tag-spec">{l.spec}</span>
            <span className="tag-detail">{l.detail}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Mobile: one caption for the part that just came off */
export function MobileCaption() {
  return (
    <p className="m-caption" data-caption aria-hidden="true">
      <span className="tag-no num" data-caption-no />
      <span className="tag-name" data-caption-name />
      <span className="tag-spec" data-caption-spec />
    </p>
  );
}

export { labelFor };
