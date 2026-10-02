"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { COPY } from "@/lib/copy";
import { requestDeadline } from "@/lib/time";

type Field = "name" | "email" | "country" | "note";
type Errors = Partial<Record<Field, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(data: Record<Field, string>): Errors {
  const f = COPY.request.fields;
  const e: Errors = {};
  if (!data.name.trim()) e.name = f.name.error;
  if (!EMAIL.test(data.email.trim())) e.email = f.email.error;
  if (!data.country.trim()) e.country = f.country.error;
  return e;
}

export function RequestSection() {
  const t = COPY.request;
  const uid = useId();
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [name, setName] = useState("");
  const status = useRef<HTMLHeadingElement>(null);

  const read = (): Record<Field, string> => {
    const fd = new FormData(form.current!);
    return {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      country: String(fd.get("country") ?? ""),
      note: String(fd.get("note") ?? ""),
    };
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = read();
    const errs = validate(data);
    setErrors(errs);
    const first = (Object.keys(errs) as Field[])[0];
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setState("sending");
    setName(data.name.trim().split(/\s+/)[0]);
    // nothing is sent: a short, deliberate pause, then the letter
    window.setTimeout(() => {
      setState("done");
      requestAnimationFrame(() => status.current?.focus());
    }, 900);
  };

  // re-validate a field once it has been flagged, so the error clears as it's fixed
  const onBlur = (field: Field) => () => {
    if (!errors[field]) return;
    const errs = validate(read());
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };
  // clear a flagged field the moment it's right, while typing: if it waited for
  // blur, the error line would collapse under a tap on the send button
  const onInput = (field: Field) => () => {
    if (!errors[field] || validate(read())[field]) return;
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const fieldProps = (field: Field) => {
    const err = errors[field];
    const hint = (t.fields[field] as { hint?: string }).hint;
    const describedBy = [hint ? `${uid}-${field}-hint` : "", err ? `${uid}-${field}-err` : ""].filter(Boolean).join(" ");
    return {
      id: field === "name" ? "f-name" : `${uid}-${field}`,
      name: field,
      "aria-invalid": err ? true : undefined,
      "aria-describedby": describedBy || undefined,
      onBlur: onBlur(field),
      onInput: onInput(field),
    };
  };

  const label = (field: Field, optional = false) => {
    const f = t.fields[field] as { label: string; hint?: string };
    return (
      <div className="f-head">
        <label className="caps f-label" htmlFor={field === "name" ? "f-name" : `${uid}-${field}`}>
          {f.label}
          {optional ? <span className="f-opt"> · optional</span> : null}
        </label>
        {f.hint ? (
          <span className="f-hint" id={`${uid}-${field}-hint`}>
            {f.hint}
          </span>
        ) : null}
      </div>
    );
  };

  const error = (field: Field) =>
    errors[field] ? (
      <span className="f-err" id={`${uid}-${field}-err`}>
        <span className="ruby-dot" aria-hidden="true" />
        {errors[field]}
      </span>
    ) : null;

  const { editionYear } = requestDeadline();

  return (
    <section id="request" className="request" data-jump="0" aria-labelledby="request-title">
      <div className="req-inner">
        <h2 id="request-title" className="display d-request engr">
          {t.title.map((l, i) => (
            <span key={i} className="req-line">
              {l}
            </span>
          ))}
        </h2>
        <p className="body req-lead" suppressHydrationWarning>
          {t.lead(editionYear)}
        </p>

        <p className="req-close caps" aria-live="off">
          {t.closes}{" "}
          <span className="num cd" suppressHydrationWarning>
            <span data-cd="d">--</span>
            <span className="cd-u">d</span> <span data-cd="h">--</span>
            <span className="cd-u">h</span> <span data-cd="m">--</span>
            <span className="cd-u">m</span> <span data-cd="s">--</span>
            <span className="cd-u">s</span>
          </span>
        </p>

        {state === "done" ? (
          <div className="req-done" role="status">
            <h3 ref={status} tabIndex={-1} className="display d-done">
              {t.done.title}
            </h3>
            <p className="body">{t.done.body(name, editionYear)}</p>
            <p className="caps req-sign">{t.done.sign}</p>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setState("idle");
                requestAnimationFrame(() => document.getElementById("f-name")?.focus());
              }}
            >
              {t.done.again}
            </button>
          </div>
        ) : (
          <form ref={form} className="req-form" noValidate onSubmit={onSubmit}>
            <div className={`f${errors.name ? " f-bad" : ""}`}>
              {label("name")}
              <input type="text" autoComplete="name" required {...fieldProps("name")} />
              {error("name")}
            </div>
            <div className={`f${errors.email ? " f-bad" : ""}`}>
              {label("email")}
              <input type="email" autoComplete="email" inputMode="email" spellCheck={false} required {...fieldProps("email")} />
              {error("email")}
            </div>
            <div className={`f${errors.country ? " f-bad" : ""}`}>
              {label("country")}
              <input type="text" autoComplete="country-name" required {...fieldProps("country")} />
              {error("country")}
            </div>
            <div className="f f-wide">
              {label("note", true)}
              <textarea rows={3} maxLength={600} {...fieldProps("note")} />
            </div>
            <div className="f-actions">
              <button type="submit" className="send" disabled={state === "sending"} aria-busy={state === "sending"}>
                <span className="send-t">{state === "sending" ? t.sending : t.submit}</span>
                <span className="send-tick" aria-hidden="true" />
              </button>
              <p className="f-honest">{t.honest}</p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export function Footer() {
  const f = COPY.footer;
  return (
    <footer className="foot">
      <div className="foot-inner">
        <p className="foot-mark" aria-hidden="true">
          VAHL
        </p>
        <dl className="foot-specs">
          {f.specs.map(([k, v]) => (
            <div key={k}>
              <dt className="caps">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="foot-notes">
          <p className="body">{f.workshop}</p>
          <p className="foot-fiction">{f.fiction}</p>
        </div>
      </div>
    </footer>
  );
}
