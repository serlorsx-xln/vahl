/**
 * Kaliber 01 layout, in millimetres, movement coordinates:
 * +z is the bridge side (the caseback); the dial is on -z.
 * The crown sits at -x, which is 3 o'clock seen from the dial.
 *
 * Fictional calibre. The geometry is drawn to be plausible, not to tick.
 */

export type PartId =
  | "plate"
  | "barrel"
  | "ratchet"
  | "crownWheel"
  | "barrelBridge"
  | "center"
  | "third"
  | "fourth"
  | "remWheel"
  | "remSpring"
  | "remStar"
  | "remDetent"
  | "remBridge"
  | "escape"
  | "pallet"
  | "palletBridge"
  | "balance"
  | "cock"
  | "trainBridge";

export type Vec3 = [number, number, number];

export type PartDef = {
  id: PartId;
  /** home position of the part's origin */
  home: Vec3;
  /** exploded position */
  ex: Vec3;
  exRot: number;
  exTilt: [number, number];
  /** disassembly window inside "apart" */
  out: [number, number];
  /** reassembly window inside "again" */
  back: [number, number];
  /** components counted when it comes off */
  count: number;
  label?: { no: string; name: string; spec: string; detail: string };
  remontoir?: boolean;
};

export const PLATE_R = 16.3;
export const PLATE_T = 1.4;
export const BRIDGE_Z = 4.2;
export const BRIDGE_T = 1.2;
export const BRIDGE_TOP = BRIDGE_Z + BRIDGE_T;

export const P = {
  barrel: [-6.6, 5.4] as [number, number],
  center: [0, 0] as [number, number],
  third: [5.6, 4.6] as [number, number],
  fourth: [9.8, -0.4] as [number, number],
  rem: [8.4, -6.0] as [number, number],
  escape: [4.0, -9.4] as [number, number],
  pallet: [0.9, -9.6] as [number, number],
  balance: [-4.8, -9.6] as [number, number],
  crownWheel: [-11.8, 2.8] as [number, number],
};

const LEAN_X = 0.05;
const LEAN_Y = 0.018;

function explode(x: number, y: number, z: number, spread: number): Vec3 {
  return [x * spread + z * LEAN_X, y * spread + z * LEAN_Y, z];
}

type Raw = Omit<PartDef, "ex"> & { exZ: number; spread: number };

const raw: Raw[] = [
  {
    id: "plate",
    home: [0, 0, 0],
    exZ: -1.5,
    spread: 1,
    exRot: 0,
    exTilt: [0, 0],
    out: [0.84, 0.92],
    back: [0, 0.04],
    count: 74,
    label: {
      no: "01",
      name: "Main plate",
      spec: "Perlage by hand",
      detail: "German silver · Ø 32.6 mm · keyless works beneath",
    },
  },
  {
    id: "barrel",
    home: [...P.barrel, 1.6],
    exZ: 8,
    spread: 1.16,
    exRot: 0.5,
    exTilt: [0.08, -0.05],
    out: [0.72, 0.84],
    back: [0.04, 0.16],
    count: 5,
    label: { no: "02", name: "Barrel", spec: "72 hours of power", detail: "Gilt brass · Ø 11.6 mm" },
  },
  {
    id: "center",
    home: [...P.center, 2.3],
    exZ: 11.5,
    spread: 1,
    exRot: -0.6,
    exTilt: [-0.05, 0.06],
    out: [0.69, 0.79],
    back: [0.07, 0.18],
    count: 4,
  },
  {
    id: "third",
    home: [...P.third, 2.7],
    exZ: 14.5,
    spread: 1.2,
    exRot: 0.7,
    exTilt: [0.06, 0.04],
    out: [0.66, 0.76],
    back: [0.09, 0.2],
    count: 3,
  },
  {
    id: "fourth",
    home: [...P.fourth, 3.1],
    exZ: 17,
    spread: 1.2,
    exRot: -0.5,
    exTilt: [-0.04, -0.07],
    out: [0.63, 0.73],
    back: [0.11, 0.22],
    count: 3,
  },
  {
    id: "remWheel",
    home: [...P.rem, 2.5],
    exZ: 19.5,
    spread: 1.2,
    exRot: 0.4,
    exTilt: [0.07, 0.03],
    out: [0.6, 0.7],
    back: [0.13, 0.24],
    count: 4,
    remontoir: true,
  },
  {
    id: "escape",
    home: [...P.escape, 2.7],
    exZ: 22,
    spread: 1.22,
    exRot: -0.8,
    exTilt: [-0.05, 0.05],
    out: [0.58, 0.68],
    back: [0.15, 0.26],
    count: 3,
    label: { no: "09", name: "Escape wheel", spec: "20 club teeth", detail: "Steel · Ø 4.4 mm" },
  },
  {
    id: "pallet",
    home: [...P.pallet, 3.0],
    exZ: 24.5,
    spread: 1.25,
    exRot: 0.3,
    exTilt: [0.04, -0.06],
    out: [0.55, 0.65],
    back: [0.17, 0.28],
    count: 5,
    label: {
      no: "10",
      name: "Pallet fork",
      spec: "Black-polished steel, ruby pallets",
      detail: "Stones 0.18 mm",
    },
  },
  {
    id: "barrelBridge",
    home: [-7.2, 6.6, BRIDGE_Z],
    exZ: 29,
    spread: 1.12,
    exRot: 0.08,
    exTilt: [0.05, -0.04],
    out: [0.4, 0.52],
    back: [0.22, 0.34],
    count: 6,
    label: {
      no: "04",
      name: "Barrel bridge",
      spec: "Frosted German silver",
      detail: "1.20 mm · bevelled by hand",
    },
  },
  {
    id: "trainBridge",
    home: [6.0, 3.4, BRIDGE_Z],
    exZ: 31.5,
    spread: 1.12,
    exRot: -0.06,
    exTilt: [-0.04, 0.05],
    out: [0.43, 0.55],
    back: [0.24, 0.36],
    count: 13,
    label: {
      no: "13",
      name: "Train bridge",
      spec: "Jewels in gold chatons",
      detail: "Frosted German silver · 1.20 mm",
    },
  },
  {
    id: "remBridge",
    home: [10.4, -5.6, BRIDGE_Z],
    exZ: 34,
    spread: 1.14,
    exRot: 0.1,
    exTilt: [0.04, 0.04],
    out: [0.46, 0.57],
    back: [0.26, 0.37],
    count: 8,
  },
  {
    id: "palletBridge",
    home: [2.8, -10.6, BRIDGE_Z],
    exZ: 35.5,
    spread: 1.16,
    exRot: -0.12,
    exTilt: [-0.05, -0.03],
    out: [0.48, 0.59],
    back: [0.27, 0.38],
    count: 5,
  },
  {
    id: "balance",
    home: [...P.balance, 3.1],
    exZ: 39.5,
    spread: 1.26,
    exRot: 0,
    exTilt: [0.1, 0.04],
    out: [0.32, 0.44],
    back: [0.34, 0.44],
    count: 13,
    label: {
      no: "11",
      name: "Balance",
      spec: "Free-sprung · 4 gold screws · 3 Hz",
      detail: "Glucydur · Ø 8.8 mm",
    },
  },
  {
    id: "cock",
    home: [-7.8, -9.6, BRIDGE_Z + 0.3],
    exZ: 43.5,
    spread: 1.22,
    exRot: 0.1,
    exTilt: [0.06, -0.05],
    out: [0.28, 0.4],
    back: [0.37, 0.47],
    count: 9,
    label: {
      no: "12",
      name: "Balance cock",
      spec: "Bevelled and polished by hand",
      detail: "Anglage 0.15 mm · 11 hours of work",
    },
  },
  {
    id: "remSpring",
    home: [...P.rem, BRIDGE_TOP + 0.04],
    exZ: 46.5,
    spread: 1.24,
    exRot: 0.6,
    exTilt: [0.05, 0.05],
    out: [0.22, 0.33],
    back: [0.4, 0.5],
    count: 3,
    remontoir: true,
  },
  {
    id: "remDetent",
    home: [11.9, -3.9, BRIDGE_TOP + 0.36],
    exZ: 48,
    spread: 1.2,
    exRot: -0.3,
    exTilt: [0.03, -0.04],
    out: [0.21, 0.32],
    back: [0.41, 0.5],
    count: 4,
    remontoir: true,
  },
  {
    id: "remStar",
    home: [...P.rem, BRIDGE_TOP + 0.3],
    exZ: 49.5,
    spread: 1.24,
    exRot: 0.2,
    exTilt: [0.06, 0.02],
    out: [0.2, 0.31],
    back: [0.42, 0.51],
    count: 7,
    remontoir: true,
    label: {
      no: "08",
      name: "Remontoir",
      spec: "Constant force · lets go once a second",
      detail: "Black-polished steel · 18 parts",
    },
  },
  {
    id: "crownWheel",
    home: [...P.crownWheel, BRIDGE_TOP + 0.05],
    exZ: 52,
    spread: 1.26,
    exRot: 0.9,
    exTilt: [0.05, 0.07],
    out: [0.14, 0.25],
    back: [0.44, 0.54],
    count: 3,
  },
  {
    id: "ratchet",
    home: [...P.barrel, BRIDGE_TOP + 0.05],
    exZ: 54,
    spread: 1.2,
    exRot: -0.7,
    exTilt: [-0.06, 0.05],
    out: [0.12, 0.24],
    back: [0.45, 0.55],
    count: 4,
    label: { no: "03", name: "Ratchet wheel", spec: "Soleil-brushed steel", detail: "Ø 8.0 mm" },
  },
];

export const PARTS: PartDef[] = raw.map(({ exZ, spread, ...rest }) => ({
  ...rest,
  ex: explode(rest.home[0], rest.home[1], exZ, spread),
}));

export const PART = Object.fromEntries(PARTS.map((p) => [p.id, p])) as Record<PartId, PartDef>;

/** Order energy travels in: barrel to balance */
export const POWER_PATH: PartId[] = [
  "barrel",
  "center",
  "third",
  "fourth",
  "remWheel",
  "escape",
  "pallet",
  "balance",
];

/** Blued screws: home on the bridges, exploded onto a ring above the stack */
export const SCREWS: { home: Vec3; ex: Vec3; out: [number, number]; back: [number, number] }[] = (() => {
  const homes: [number, number, number][] = [
    [-13.6, 3.6, BRIDGE_TOP],
    [-8.4, 11.4, BRIDGE_TOP],
    [-1.4, 10.8, BRIDGE_TOP],
    [4.2, 10.8, BRIDGE_TOP],
    [13.6, 3.4, BRIDGE_TOP],
    [7.6, 1.6, BRIDGE_TOP],
    [12.8, -7.6, BRIDGE_TOP],
    [12.6, -3.6, BRIDGE_TOP],
    [3.6, -13.0, BRIDGE_TOP],
    [-11.6, -8.2, BRIDGE_TOP + 0.3],
    [-9.2, -11.2, BRIDGE_TOP + 0.3],
    [-6.6, 5.4, BRIDGE_TOP + 0.5],
    [-11.8, 2.8, BRIDGE_TOP + 0.4],
    [15.2, -5.6, PLATE_T],
    [-14.9, -6.4, PLATE_T],
    [10.6, 11.6, PLATE_T],
  ];
  const sorted = homes
    .map((h, i) => ({ h, i, a: Math.atan2(h[1], h[0]) }))
    .sort((a, b) => a.a - b.a);
  const n = homes.length;
  const ringR = 23;
  const ringZ = 60;
  const result = new Array(n);
  sorted.forEach(({ h, i }, k) => {
    const a = (k / n) * Math.PI * 2 + sorted[0].a;
    const ex: Vec3 = [
      Math.cos(a) * ringR + ringZ * LEAN_X,
      Math.sin(a) * ringR * 0.92 + ringZ * LEAN_Y,
      ringZ + Math.sin(a * 2) * 1.2,
    ];
    const order = i / n;
    result[i] = {
      home: h,
      ex,
      out: [0.02 + order * 0.08, 0.1 + order * 0.08] as [number, number],
      back: [0.5 + order * 0.08, 0.58 + order * 0.06] as [number, number],
    };
  });
  return result;
})();

export const SCREW_COUNT = 38;
export const SCREW_LABEL = {
  no: "15",
  name: "Screws ×38",
  spec: "Heat-blued by hand at 290 °C",
  detail: "Steel · head Ø 1.10 mm",
};

/** Jewels set in each bridge, plate coordinates */
export const JEWELS: Partial<Record<PartId, [number, number, number][]>> = {
  trainBridge: [
    [0, 0, 1.0],
    [5.6, 4.6, 0.9],
    [9.8, -0.4, 0.9],
  ],
  palletBridge: [
    [4.0, -9.4, 0.8],
    [0.9, -9.6, 0.8],
  ],
  cock: [[-4.8, -9.6, 1.25]],
  remBridge: [[11.4, -7.4, 0.7]],
};

export const TOTAL_PARTS = 214;

/** Parts that carry a specimen tag, plus the screws as one group */
export const LABELLED: string[] = [...PARTS.filter((p) => p.label).map((p) => p.id as string), "screws"];

/** Bridge outlines: hull of the bearings each one covers (plate coordinates) */
export const BRIDGES: Partial<Record<PartId, [number, number, number][]>> = {
  barrelBridge: [
    [-6.6, 5.4, 6.2],
    [-13.6, 3.6, 1.8],
    [-8.4, 11.4, 1.5],
    [-1.4, 10.8, 1.4],
  ],
  trainBridge: [
    [0, 0, 2.2],
    [5.6, 4.6, 1.9],
    [9.8, -0.4, 1.9],
    [4.2, 10.8, 1.5],
    [13.6, 3.4, 1.5],
  ],
  remBridge: [
    [8.4, -6.0, 2.6],
    [12.8, -7.6, 1.2],
    [12.6, -3.6, 1.1],
  ],
  palletBridge: [
    [4.0, -9.4, 1.3],
    [0.9, -9.6, 1.2],
    [3.6, -13.0, 1.1],
  ],
  cock: [
    [-4.8, -9.6, 2.5],
    [-11.6, -8.2, 1.9],
    [-9.2, -11.2, 1.2],
  ],
};
