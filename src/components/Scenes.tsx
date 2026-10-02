import { COPY } from "@/lib/copy";

/**
 * The staged text. Two layers sandwich the canvas: display lines sit behind
 * the watch (it passes in front of them), everything that must stay legible
 * sits in front, and so does the one word the watch sinks behind at night. Elements carry `data-in="a,b"`: the window of their scene's
 * progress in which they are shown. The director toggles `.on`.
 */

function Lines({ lines, className = "" }: { lines: readonly string[]; className?: string }) {
  return (
    <span className={`lines ${className}`}>
      {lines.map((l, i) => (
        <span key={i} className="ln">
          <span style={{ ["--i" as string]: i }}>{l}</span>
        </span>
      ))}
    </span>
  );
}

export function BackScenes() {
  return (
    <>
      <div className="scene" data-scene="tick">
        <p className="display d-tick engr on" data-in="-1,0.78">
          <Lines lines={COPY.tick.title} />
        </p>
      </div>

      <div className="scene" data-scene="turn">
        <p className="display d-turn engr" data-in="0.16,0.9">
          <Lines lines={COPY.turn.title} />
        </p>
      </div>

      <div className="scene on-blue" data-scene="once">
        <p className="display d-once engr" data-in="0.14,0.84">
          <Lines lines={COPY.once.title} />
        </p>
      </div>

      <div className="scene" data-scene="again">
        <p className="display d-again engr" data-in="0.12,0.62">
          <Lines lines={COPY.again.title} />
        </p>
      </div>

    </>
  );
}

export function FrontScenes() {
  const t = COPY;
  return (
    <>
      {/* 01 — the step */}
      <div className="scene" data-scene="tick">
        <div className="copy c-tick on" data-in="-1,0.6">
          <p className="body">{t.tick.body}</p>
          <p className="caps hint">
            <span className="hint-tick" aria-hidden="true" />
            {t.tick.hint}
          </p>
        </div>
      </div>

      {/* 02 — turn it over */}
      <div className="scene" data-scene="turn">
        <div className="copy c-turn" data-in="0.42,0.95">
          <p className="body">{t.turn.body}</p>
          <p className="engraving caps">
            {t.turn.engraving.map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </p>
        </div>
      </div>

      {/* 03 — taken down */}
      <div className="scene" data-scene="apart">
        <div className="captions">
          {t.apart.captions.map((c, i) => (
            <p key={i} className="body caption" data-in={`${c.at[0]},${c.at[1]}`}>
              {c.text}
            </p>
          ))}
        </div>
        <div className="count c-apart" data-in="0.02,0.97">
          <span className="count-n num" data-counter="parts">
            000
          </span>
          <span className="count-of">
            <span className="num">/214</span>
            <span className="caps">parts</span>
          </span>
        </div>
      </div>

      {/* 04 — the remontoir */}
      <div className="scene on-blue" data-scene="once">
        <div className="copy c-once" data-in="0.22,0.84">
          <p className="body">{t.once.body}</p>
          <p className="body body-2" data-in="0.46,0.84">
            {t.once.body2}
          </p>
        </div>
        <div className="meter" data-in="0.22,0.84">
          <div className="meter-row">
            <span className="caps meter-l" data-meter-label>
              {t.once.wound}
            </span>
            <span className="meter-bar">
              <span className="meter-fill" data-meter />
            </span>
            <span className="ruby-dot" data-release />
          </div>
          <p className="meter-count">
            <span className="num" data-counter="releases">
              0
            </span>
            <span className="caps">{t.once.counter}</span>
          </p>
        </div>
      </div>

      {/* 05 — twice */}
      <div className="scene" data-scene="again">
        <div className="copy c-again" data-in="0.18,0.62">
          <p className="body">{t.again.body}</p>
        </div>
      </div>

      {/* 06 — mørketid: the word is the horizon, and the watch has sunk behind it */}
      <div className="scene" data-scene="night">
        <p className="display d-night engr" data-in="0.1,1.01" data-until-request="0.2">
          <Lines lines={t.night.title} />
        </p>
        <div className="copy c-night" data-in="0.24,1.01" data-until-request="0.2">
          <p className="body">{t.night.body}</p>
        </div>
        <div className="sun" data-in="0.3,1.01" data-until-request="0.2">
          <p className="caps">
            {t.night.sun}
            <span className="sun-coords num">{t.night.coords}</span>
          </p>
          <p className="sun-v num" data-sun>
            −0.0°
          </p>
          <svg className="sun-dia" viewBox="0 0 160 40" aria-hidden="true">
            <line x1="0" y1="20" x2="160" y2="20" className="sun-horizon" />
            <circle r="3.2" cx="80" cy="26" data-sun-dot className="sun-dot" />
          </svg>
        </div>
      </div>
    </>
  );
}

/** The same story, linear, for screen readers and no-script */
export function SrCopy({ id }: { id: string }) {
  const t = COPY;
  switch (id) {
    case "tick":
      return (
        <div className="sr-copy">
          <h1>VAHL Mørketid, Kaliber 01. {t.tick.title.join(" ")}</h1>
          <p>{t.tick.body}</p>
        </div>
      );
    case "turn":
      return (
        <div className="sr-copy">
          <h2>{t.turn.title.join(" ")}</h2>
          <p>{t.turn.body}</p>
          <p>Hand-wound, 21,600 vibrations per hour, 72 hours of power reserve, 31 jewels.</p>
        </div>
      );
    case "apart":
      return (
        <div className="sr-copy">
          <h2>Taken down: 214 parts</h2>
          {t.apart.captions.map((c, i) => (
            <p key={i}>{c.text}</p>
          ))}
        </div>
      );
    case "once":
      return (
        <div className="sr-copy">
          <h2>{t.once.title.join(" ")}</h2>
          <p>{t.once.body}</p>
          <p>{t.once.body2}</p>
        </div>
      );
    case "again":
      return (
        <div className="sr-copy">
          <h2>{t.again.title.join(" ")}</h2>
          <p>{t.again.body}</p>
        </div>
      );
    case "night":
      return (
        <div className="sr-copy">
          <h2>{t.night.title.join(" ")}</h2>
          <p>{t.night.body}</p>
        </div>
      );
    default:
      return null;
  }
}
