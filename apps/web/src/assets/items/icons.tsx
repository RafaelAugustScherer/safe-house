import React, { type SVGProps } from "react";

// All icons share these defaults: 64x64 viewBox, currentColor strokes/fills,
// no hard-coded hues — the parent card's color theme drives the tint.
const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 64 64",
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

type IconProps = SVGProps<SVGSVGElement>;

export const FallbackIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="14" y="14" width="36" height="36" rx="4" />
    <path d="M22 32h20M32 22v20" />
  </svg>
);

// ---------- Items ----------

export const MedicineIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="10" y="22" width="44" height="20" rx="4" />
    <path d="M22 22v20M42 22v20" />
    <path d="M28 32h8M32 28v8" stroke="currentColor" />
  </svg>
);

export const BagIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M18 22h28l-3 30H21z" />
    <path d="M24 22v-4a8 8 0 0 1 16 0v4" />
    <path d="M26 36h12" />
  </svg>
);

export const CrowbarIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 52l28-28" />
    <path d="M40 24l8-8 6 6-8 8z" />
    <path d="M14 50l-4 4" />
  </svg>
);

export const MapIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M10 18l14-4 16 4 14-4v32l-14 4-16-4-14 4z" />
    <path d="M24 14v32M40 18v32" />
    <path d="M30 30l4 4M34 30l-4 4" />
  </svg>
);

export const WalkieTalkieIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="20" y="18" width="20" height="36" rx="3" />
    <path d="M28 8v10M28 14h6" />
    <rect x="24" y="22" width="12" height="8" />
    <circle cx="30" cy="42" r="1.5" fill="currentColor" />
    <circle cx="30" cy="48" r="1.5" fill="currentColor" />
  </svg>
);

// ---------- Fire guns ----------

export const PistolIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M10 24h32v10h-6l-2 4H22l-4-4h-8z" />
    <path d="M22 34v14h10l4-6" />
    <path d="M14 24v-4h8v4" />
  </svg>
);

export const RifleIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 30h44v6H32l-2 4H22l-2-4h-4z" />
    <path d="M48 32h12" />
    <path d="M22 40v8h8" />
    <path d="M34 30v-4h6v4" />
  </svg>
);

export const MachineGunIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 28h40v8H6z" />
    <path d="M46 30h14" />
    <path d="M14 36v8h10" />
    <path d="M18 28v-4h10v4" />
    <path d="M30 36l-4 14h6l4-14" />
    <circle cx="28" cy="44" r="1.2" fill="currentColor" />
    <circle cx="30" cy="48" r="1.2" fill="currentColor" />
  </svg>
);

export const ShotgunIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 28h40v6H32l-2 4H22l-2-4h-4z" />
    <path d="M44 28h16v6H44z" />
    <path d="M22 38v6h8" />
    <path d="M30 28v-3h8v3" />
  </svg>
);

// ---------- Cold weapons ----------

export const ChainsawIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 28h6v8h-6z" />
    <path d="M18 30h36v4H18z" />
    <path d="M54 28v8" />
    <path d="M22 30v-2M28 30v-2M34 30v-2M40 30v-2M46 30v-2" />
    <path d="M22 36v2M28 36v2M34 36v2M40 36v2M46 36v2" />
    <path d="M6 30v4l-2 2v-8z" />
  </svg>
);

export const KnifeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 50l32-32 6 6-32 32z" />
    <path d="M40 18l4-4" />
    <path d="M14 56l-6-6" />
    <path d="M44 14l4-4" />
  </svg>
);

export const ShovelIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M32 8v32" />
    <path d="M28 8h8" />
    <path d="M20 40h24l-4 12-2 4H26l-2-4z" />
    <path d="M28 56v4M36 56v4" />
  </svg>
);

export const BatIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M10 54l30-30a8 12 -45 0 1 12 -10l-2 2a8 12 -45 0 1 -10 12l-30 30z" />
    <path d="M10 54l-4 4M14 50l4 4" />
  </svg>
);

export const AxeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 56l28-28" />
    <path d="M30 14l16 4 4 12-12 4-12-4z" />
    <path d="M40 18l-6 14" />
  </svg>
);

export const MacheteIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M8 48 Q32 24 50 14 L54 18 Q44 36 12 52 z" />
    <path d="M12 52l-4 4" />
    <path d="M50 14l4-2" />
  </svg>
);

// ---------- Vehicles ----------

export const MotorcycleIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="14" cy="46" r="8" />
    <circle cx="50" cy="46" r="8" />
    <path d="M14 46l10-18h14l8 18" />
    <path d="M24 28l-4-6h8" />
    <path d="M38 28l8-4" />
  </svg>
);

export const BikeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="14" cy="48" r="8" />
    <circle cx="50" cy="48" r="8" />
    <path d="M14 48l10-20h12" />
    <path d="M50 48l-10-20H24" />
    <path d="M30 28l4 20" />
    <path d="M22 24h6" />
  </svg>
);

export const BuggyIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="16" cy="48" r="6" />
    <circle cx="48" cy="48" r="6" />
    <path d="M6 48h4M22 48h20M54 48h4" />
    <path d="M10 48l4-12h36l4 12" />
    <path d="M14 36l6-10h24l6 10" />
    <path d="M22 26v-6M42 26v-6" />
  </svg>
);

export const TractorIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="46" cy="46" r="12" />
    <circle cx="16" cy="50" r="6" />
    <path d="M22 38h12v-12h-8z" />
    <path d="M34 26h6l4 8" />
    <path d="M14 22v6M10 22h8" />
  </svg>
);

export const PickupIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="18" cy="48" r="6" />
    <circle cx="46" cy="48" r="6" />
    <path d="M6 48h6M24 48h16M52 48h6" />
    <path d="M10 48v-12h16l4-8h12v20" />
    <path d="M14 36h12" />
  </svg>
);
