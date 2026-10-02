/**
 * All words on the page. Display lines are broken by hand: the line breaks
 * are part of the composition, not left to the browser.
 * Everything here is fiction (see PRODUCT.md).
 */

export const COPY = {
  tick: {
    title: ["This one", "steps."],
    body: "Most mechanical seconds hands sweep, six small beats to the second. The Mørketid’s holds still for a whole second, then moves once.",
    hint: "Scroll, and it comes apart",
  },
  turn: {
    title: ["Turn it", "over."],
    body: "Under the caseback, the Kaliber 01: 214 parts, every one made and finished in our workshop in Tromsø, except the jewels and the mainspring.",
    /** engraved on the train bridge, as movements are */
    engraving: ["Kaliber 01", "21 600 A/h", "72 h", "31 rubis"],
  },
  apart: {
    captions: [
      {
        at: [0.02, 0.27] as [number, number],
        text: "Screws first. Thirty-eight of them, blued by hand over a flame.",
      },
      {
        at: [0.27, 0.52] as [number, number],
        text: "The balance comes out, and the watch stops, the way a real one does.",
      },
      {
        at: [0.52, 0.86] as [number, number],
        text: "Then the bridges, the escapement, the going train.",
      },
      {
        at: [0.86, 1.01] as [number, number],
        text: "The red line is the power: barrel to balance, through five wheels and one small spring.",
      },
    ],
  },
  once: {
    title: ["Once a second,", "it lets go."],
    body: "Between the train and the escapement sits a spring about the width of a fingernail. The train rewinds it, a little, every second. Then it lets go, and the seconds hand moves.",
    body2: "Full mainspring or nearly empty, the escapement gets the same push. That is the point of it.",
    wound: "Winding",
    released: "Released",
    counter: "times since you opened this page",
  },
  again: {
    title: ["Then it goes", "back together."],
    body: "Every Kaliber 01 is assembled twice: once to fit and test it, then taken down, finished by hand, and assembled for good. The second assembly takes eleven days.",
  },
  night: {
    title: ["Mørketid."],
    body: "From 27 November the sun stays below the horizon over Tromsø until the middle of January. The watch is named for it. We read every request then, by hand.",
    sun: "The sun at Tromsø, now",
    coords: "69°39′N 18°57′E",
  },
  request: {
    title: ["Request an", "allocation."],
    lead: (year: number) =>
      `Twenty-four watches for ${year}. Requests close when mørketid begins, at midnight on 27 November in Tromsø, and we write to every applicant in January.`,
    fields: {
      name: { label: "Name", hint: "As it should appear on the letter", error: "We need a name to write to." },
      email: { label: "Email", hint: "", error: "An address we can write to in January, like name@domain.com." },
      country: { label: "Country of residence", hint: "", error: "Tell us where the watch would be delivered." },
      note: { label: "A note to Marit", hint: "What you wear now, what you hope for." },
    },
    submit: "Send request",
    sending: "Sealing",
    honest: "This is a design study. Nothing you type leaves this page.",
    closes: "Requests close in",
    done: {
      title: "Received.",
      body: (name: string, year: number) =>
        `Thank you, ${name}. We read every request by hand during mørketid and will write to you in January ${year}.`,
      sign: "Marit Vahl, Tromsø",
      again: "Edit the request",
    },
  },
  footer: {
    specs: [
      ["Calibre", "Kaliber 01, hand-wound"],
      ["Frequency", "21,600 vph · 3 Hz"],
      ["Remontoir", "Constant force, releases once a second"],
      ["Seconds", "Dead-beat, central"],
      ["Power reserve", "72 hours"],
      ["Components", "214"],
      ["Jewels", "31, in gold chatons"],
      ["Balance", "Free-sprung, 4 gold screws"],
      ["Movement", "Ø 32.6 mm · 5.4 mm"],
      ["Case", "39 mm · 9.8 mm · steel or 18k white gold"],
    ] as [string, string][],
    workshop: "VAHL is three watchmakers in Tromsø, Norway. Founded by Marit Vahl in 2014.",
    fiction:
      "VAHL, the Mørketid and the Kaliber 01 are fiction, made for a design study. There is no watch for sale and no request is sent. The movement is drawn in real time and to be plausible, not engineered.",
  },
} as const;
