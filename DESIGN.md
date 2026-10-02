---
name: VAHL
description: The Kaliber 01's own surface under a watchmaker's loupe, frosted German silver darkening toward mørketid.
colors:
  frost: "rgb(216 213 206)"
  frost-hi: "rgb(232 229 222)"
  frost-ink: "rgb(227 224 217)"
  lacquer: "rgb(23 24 27)"
  ink-2: "rgb(74 75 80)"
  ink-2-night: "rgb(160 163 170)"
  night: "rgb(13 17 24)"
  night-2: "rgb(18 23 32)"
  blued: "rgb(30 59 140)"
  blued-hi: "rgb(70 108 214)"
  ruby: "rgb(179 20 47)"
  ruby-lit: "rgb(232 60 86)"
  gold-chaton: "#e2c27e"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "min(12.2vw, 23vh)"
    fontWeight: 290
    lineHeight: 0.86
    letterSpacing: "-0.035em"
    fontVariation: "\"wdth\" 112"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "min(7.2vw, 14vh)"
    fontWeight: 290
    lineHeight: 0.86
    letterSpacing: "-0.035em"
    fontVariation: "\"wdth\" 112"
  numeral:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "min(15vw, 30vh)"
    fontWeight: 200
    lineHeight: 0.8
    letterSpacing: "-0.045em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  readout:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 250
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(19px, 1.62vw, 26px)"
    fontWeight: 380
    lineHeight: 1.32
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(16px, 1.16vw, 19px)"
    fontWeight: 400
    lineHeight: 1.5
  specimen:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 560
    lineHeight: 1.25
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 560
    lineHeight: 1.35
    letterSpacing: "0.16em"
    fontVariation: "\"wdth\" 125"
    fontFeature: "\"tnum\" 1"
rounded:
  none: "0px"
  jewel: "50%"
spacing:
  gutter: "clamp(20px, 5.4vw, 104px)"
  rail: "52px"
  field-col: "32px"
  field-row: "34px"
  section: "56px"
components:
  button-send:
    backgroundColor: "{colors.frost-ink}"
    textColor: "{colors.night}"
    rounded: "{rounded.none}"
    padding: "19px 26px 19px 28px"
  button-send-hover:
    backgroundColor: "{colors.blued-hi}"
    textColor: "#ffffff"
  link-cta:
    textColor: "{colors.lacquer}"
    rounded: "{rounded.none}"
    padding: "4px 0"
  link-cta-hover:
    textColor: "{colors.blued}"
  input-line:
    backgroundColor: "transparent"
    textColor: "{colors.frost-ink}"
    rounded: "{rounded.none}"
    padding: "8px 0 10px"
  specimen-tag:
    textColor: "{colors.lacquer}"
    typography: "{typography.specimen}"
    width: "300px"
  minute-tick-now:
    backgroundColor: "{colors.ruby}"
    width: "18px"
    height: "2px"
---

# Design System: VAHL

## Overview

**Creative North Star: "Under the Loupe"**

The page is the movement's own metal, seen at bench distance. The ground is frosted German silver with blasting grain and a bench light falling from upper left; words are cut into it and filled with lacquer, so every large line carries a one-pixel lip of light on its lower edge that shifts with the cursor. One real-time movement (WebGL, procedural, no photography) owns the stage, and everything typographic is arranged around it as engraving, specimen labelling, or instrument readout.

Colour behaves like material, not decoration. The ground is a live value: it starts as frost, is overrun once by a field of heat-blued steel that spreads from the remontoir like a temper run on a hot plate, recedes, then darkens continuously to polar night before the request. Ruby means "live" and nothing else. Gold exists only where a watch has gold. The motion grammar is horological: the camera and the ground move continuously, while anything that represents time (the seconds hand, the minute track, counters, the send button's tick) moves in discrete one-second steps.

Density is low and exact. Copy sits in narrow measures at the gutter; numbers are tabular; dimensions are in millimetres. There are no cards, no panels, no rounded containers, no icon set.

**Key Characteristics:**
- Frosted silver ground with grain and an upper-left bench light; one live ground value driven by scroll.
- Archivo on its width axis: light and slightly expanded for display, expanded caps for engraving.
- Heat-blued steel is the single saturated field and fills whole viewports when it appears.
- Ruby marks live state only; gold only on chatons and balance screws.
- Square corners on every rectangle; circles only for things that are round in a watch.
- Continuous camera, stepped time.

## Colors

A near-neutral metal palette with one saturated steel blue and one jewel red, each with a strictly bounded job.

### Primary
- **Heat-Blued Steel** (blued): the oxide colour of a screw tempered at about 290 °C. Fills the entire viewport during the remontoir chapter, colours the seconds hand and screws in 3D, is the text-selection fill, the focus ring on light grounds, and the CTA hover on light grounds.
- **Lapped Blue Highlight** (blued-hi): the lamp's reflection in blued steel. Used for the single travelling polish band across the blue field and as the send button's hover fill.

### Secondary
- **Jewel Ruby** (ruby): live state on light grounds. The current minute on the track, the remontoir release dot, the power-path line in 3D.
- **Lit Ruby** (ruby-lit): the same jewel against dark grounds, raised for legibility. The current minute at night, the input caret, the field error mark and the invalid input rule.

### Tertiary
- **Chaton Gold** (gold-chaton): a 3D material only. Jewel settings and the four balance regulating screws. Never in the DOM.

### Neutral
- **Frosted German Silver** (frost): the day ground and the theme colour. Grain at soft-light over it, bench light radial from upper left.
- **Frost Highlight** (frost-hi): CTA hover text when the interface is dark.
- **Frost Ink** (frost-ink): text on blue and on night; the send button's fill.
- **Lacquer** (lacquer): the fill in every engraved letter on light grounds; primary text by day.
- **Secondary Ink** (ink-2 / ink-2-night): supporting copy, hints, units, labels. Interpolates with the ground.
- **Polar Night** (night): the mørketid ground the page darkens into before the request.
- **Footer Night** (night-2): the footer plate, one step lifted from the night ground.

### Named Rules
**The Live Ground Rule.** Ground, ink, secondary ink and interface ink are interpolated every frame (frost to night; lacquer to frost ink). New surfaces read `--ground`, `--ink`, `--ink-2` and `--ui-ink`, never a fixed neutral, so they darken with the story.

**The One Blue Field Rule.** Heat-blued steel is either a fine line in the metal (hands, screws, hairspring) or the whole viewport. It is never a tinted card, a band, or a button at rest. The settled field is a flat plate, a little darker away from the lamp, crossed by one travelling polish band; the only radial structure is the temper front (straw, bronze, purple, blue) while it spreads.

**The Ruby Means Live Rule.** Ruby appears only where something is happening now: the current minute, a release, the power path, the caret, an error. Use ruby on light grounds and lit ruby on dark ones.

**The Gold Where Gold Is Rule.** Gold belongs to chatons and balance screws in the 3D movement. It never appears as a UI colour, a rule, or a highlight. The train wheels are German silver.

## Typography

**Display Font:** Archivo (via next/font, width axis loaded), with system-ui fallback
**Body Font:** Archivo
**Label Font:** Archivo at 125% width, uppercase

**Character:** One family, used the way a watchmaker letters a bridge: very light and slightly wide for the large cut lines, plain for reading, and wide spaced capitals for anything engraved or measured.

### Hierarchy
- **Display** (290, min(12.2vw, 23vh), 0.86): the opening line and the mørketid horizon (which runs heavier at 250 and larger, up to min(20.5vw, 40vh)). Line breaks are set by hand in copy, each line rising from its own groove.
- **Headline** (290, scene titles min(7.2vw, 14vh) up to min(10.6vw, 20vh); request title min(6.2vw, 12vh)): chapter titles, engraved.
- **Numeral** (200, min(15vw, 30vh), 0.8, tabular): the parts counter. Engraved like display.
- **Readout** (250, 44–46px, tabular): instrument values such as the release count and the solar elevation.
- **Title** (380, clamp(19px, 1.62vw, 26px), 1.32): the disassembly captions, max 26ch.
- **Body** (400, clamp(16px, 1.16vw, 19px), 1.5): all reading copy, max 46ch by default and narrower per scene (31–44ch); `text-wrap: pretty`.
- **Specimen** (560, 15px): part names in specimen tags; spec line beneath at 13px.
- **Label** (560, 11px, 0.16em, uppercase, 125% width): engravings, field labels, the clock, units, readout captions. Tag details run 10.5px at 118% width.

### Named Rules
**The Engraved Rule.** Display, headline and the large numeral are lacquer-filled cuts: ink colour plus a zero-blur one-pixel lip (`--lip`) offset by the cursor-driven `--elx/--ely`. The lip is light on frost and dark on blue or night. It is a property of the material, not a drop shadow.

**The Tabular Rule.** Every number that counts, measures or tells time is tabular and lining. Dimensions are written in mm with real values.

## Layout

One fixed full-viewport stage holds the scene, in strict layer order: ground, bench lamp, temper (blue field), back words, WebGL, front words. Scroll spacers in the document flow give each chapter its length (130–420 svh), so the page scrolls while the stage stays put. Words placed on the back layer pass behind the watch; words on the front layer (the mørketid horizon) lie over it.

Copy anchors to the left gutter, offset by 40% of the rail width; the watch occupies and bleeds off the right two-thirds. Scene copy sits either high (13–21vh from top) or low (3–9vh from bottom), never centred. The request is a single column starting at 47% of the width, max 660px, with the watch beside it; fields pair two to a row on a subgrid so label, input line and error align across columns.

Spacing is the gutter (clamp(20px, 5.4vw, 104px)) and the rail (52px) for the edges, then 32px between field columns, 34px between field rows, 56px before the form or the confirmation.

**Mobile (max-width 760px)** is its own composition: gutter 20px, rail 0, the minute track turns horizontal along the bottom safe area, the watch holds the upper half and opens at loupe scale bleeding right with the headline passing behind it, words sit under it, one specimen caption stacked on the parts counter replaces the tag column, there is no loupe, and past the request's top the watch rides up with the page.

**Reduced motion** keeps the same story still: each chapter rests on curated frames (halves for most, five frames for the disassembly), words appear by opacity only, nothing travels, and the top bar never tucks.

## Elevation & Depth

Depth is physical, not layered UI. The 3D movement is lit by an environment and bench lamps, with a dedicated dark environment so black-polished steel reads as a mirror and flashes. In the DOM there are no floating surfaces and no ambient shadows; depth comes from the stage's layer order (words behind or in front of the watch), the grain and bench light on the ground, and at mørketid a warm radial lamp that follows the watch.

### Shadow Vocabulary
- **Engraving lip** (`text-shadow: var(--elx) var(--ely) 0 var(--lip)`): the light catch in a cut letter. Display, headline, numeral, wordmark, the caseback engraving.
- **Pressed edge** (`box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.22)`): the lower edge of the send button, a machined key.
- **Jewel seat** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.35)`): under the ruby dot.

### Named Rules
**The Flat Plate Rule.** Nothing in the interface floats. If a surface needs separation, it gets a 1px rule in ink at reduced alpha, not a shadow or a fill.

## Shapes

Every rectangle has square corners (0px): buttons, inputs, scrollbars, tags. Separation is a hairline: 1px rules in ink or interface ink at 0.14 to 0.4 alpha, used as the top edge of a specimen tag, the rule above the caseback engraving, the underline of an input, the rows of the spec list. Circles appear only where the thing is round in a watch or an optic: the ruby dot (7px), the cursor ring (28px) and its loupe, leader-line terminals, the sun's dot on its horizon. Scale bars are drawn as a bracketed line, like a microscope reticle.

## Components

### Buttons
Machined and plain.
- **Shape:** square corners (0px).
- **Send (primary):** frost-ink plate with night text, 16px at 560 and 112% width, padded 19px 26px 19px 28px, with a drawn tick (an 18px line with a 9px stop) after the label. Full width with label and tick at opposite ends on mobile.
- **Hover / Active / Busy:** hover fills with lapped blue highlight and white text (0.28s ease-out); active drops 1px; busy steps the tick once per second while the label reads "Sealing".
- **Link button:** text on a 1px underline at half alpha; the underline goes to full ink on hover.

### Inputs / Fields
- **Style:** no box. A transparent field over a single 1px bottom rule in ink at 0.4 alpha, 18px text, square, padded 8px 0 10px.
- **Label:** engraved caps above, hint in 13px secondary ink beneath it; "optional" is stated once, inline after the label, in secondary ink.
- **Hover / Focus:** rule to 0.7 alpha on hover; on focus the rule goes full ink and doubles to 2px; the caret is lit ruby.
- **Error:** the rule turns lit ruby; a lit ruby dot and a plain sentence sit on the third subgrid row.

### Navigation
- **Top bar:** wordmark left (16px, 620, 125% width, 0.46em tracking, engraved), Tromsø and the live clock centred in caps, the CTA right. Colour follows interface ink. The bar tucks away while reading down the request and returns on scroll-up or keyboard focus.
- **CTA link:** 15px at 540, a 1px drawn underline that thickens to 2px on hover while the text turns blued (light) or frost highlight (dark); "closes in N days" in caps beneath. Fixed chrome (wordmark, clock, CTA, minute track, mobile caption) is inked piece by piece: the director lights each one as the blued field's front passes it, and the dimmed steps (clock 0.82, days 0.7) rise to 0.92 and 0.88 when lit. The polish band fades out above 220px, so the bar always sits on plain plate. Every resting state holds 4.5:1 or better.
- **Minute track:** sixty 1px ticks down the left edge as the progress rail, every fifth longer; ticks behind the reader darken; the current tick is an 18px ruby bar. It steps, it never slides. Chapter names appear in caps on hover or focus; the current chapter is written vertically at its foot.

### Specimen Tag
A museum label for each part, placed by the WebGL layer: a 300px two-column grid under a 1px top rule; "Nº" number in caps at left, part name (specimen), spec line, then caps detail with finish and count. A 1px leader with a ring terminal connects it to the part. On short viewports a compact mode drops the detail line.

### Loupe and Readout
On fine pointers the cursor is a 28px ring with a 3px dot that scales on links and becomes a 4× magnifying lens over the movement. The readout beside it states "4×" and a bracketed 1 mm scale bar.

### Instrument Readouts
The remontoir meter (a 1px bar that fills as the spring winds, ruby dot on release, a release count in readout type) and the Tromsø sun (coordinates in caps, elevation in readout type, a dot on a 1px horizon). Labels in caps, values tabular.

## Do's and Don'ts

### Do:
- **Do** read `--ground`, `--ink`, `--ink-2` and `--ui-ink` for any new surface so it darkens with the story.
- **Do** engrave large type: ink plus the one-pixel cursor-driven lip, never a blurred shadow.
- **Do** move anything that represents time in whole one-second steps; let only the camera and the ground glide.
- **Do** label parts as specimens: number, name, real dimension in mm, finish.
- **Do** separate with 1px rules at reduced alpha and keep every rectangle square.
- **Do** give mobile and reduced motion their own compositions, not a scaled or frozen desktop.

### Don't:
- **Don't** use heat-blued steel as a tinted panel, badge or resting button fill; it is a line in the metal or the whole viewport.
- **Don't** use ruby for emphasis, branding or decoration; it marks only what is live.
- **Don't** put gold in the interface or on parts that are not chatons or balance screws.
- **Don't** add cards, rounded containers, floating shadows or an icon set; draw marks as 1px lines.
- **Don't** centre the hero or the copy; anchor words to the gutter and let the watch bleed off the right.
