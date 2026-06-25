"use client";

import type { ReactNode } from "react";

export type BrandIconName =
  | "dashboard"
  | "saju"
  | "saju-unni"
  | "tci"
  | "gijil-oppa"
  | "fusion"
  | "family"
  | "consult"
  | "coaching"
  | "account";

export default function BrandIcon({
  name,
  className = "",
}: {
  name: BrandIconName;
  className?: string;
}) {
  const vector = ICONS[name];
  return (
    <span className={`brand-icon brand-icon--${name}${className ? ` ${className}` : ""}`} aria-hidden="true">
      {vector ? (
        <svg viewBox="0 0 24 24" role="img" focusable="false">
          {vector}
        </svg>
      ) : (
        <img src={`/brand-icons/${name}.png`} alt="" draggable={false} />
      )}
    </span>
  );
}

const ICONS: Partial<Record<BrandIconName, ReactNode>> = {
  dashboard: (
    <>
      <rect x="4.5" y="5" width="6" height="6" rx="1.4" />
      <rect x="13.5" y="5" width="6" height="6" rx="1.4" />
      <rect x="4.5" y="14" width="6" height="5" rx="1.4" />
      <path d="M14 16.5h5.5" />
      <path d="M14 19h3.6" />
    </>
  ),
  saju: (
    <>
      <circle cx="12" cy="12" r="7.2" />
      <path d="M12 6.8v2.1" />
      <path d="M12 15.1v2.1" />
      <path d="M6.8 12h2.1" />
      <path d="M15.1 12h2.1" />
      <path d="M12 9.2l1.15 1.9 2.15.52-1.45 1.68.18 2.2L12 14.65 9.97 15.5l.18-2.2-1.45-1.68 2.15-.52L12 9.2z" />
    </>
  ),
  tci: (
    <>
      <path d="M12 4.5l6.5 4v7l-6.5 4-6.5-4v-7l6.5-4z" />
      <path d="M12 8.2l3.3 2v3.6l-3.3 2-3.3-2v-3.6l3.3-2z" />
      <path d="M12 4.5v15" />
      <path d="M5.5 8.5l13 7" />
      <path d="M18.5 8.5l-13 7" />
    </>
  ),
  fusion: (
    <>
      <circle cx="9.2" cy="12" r="5.2" />
      <circle cx="14.8" cy="12" r="5.2" />
      <path d="M12 7.6c1.45 1 2.35 2.55 2.35 4.4S13.45 15.4 12 16.4c-1.45-1-2.35-2.55-2.35-4.4S10.55 8.6 12 7.6z" />
    </>
  ),
  family: (
    <>
      <circle cx="12" cy="6.5" r="2.4" />
      <circle cx="7" cy="16.6" r="2.4" />
      <circle cx="17" cy="16.6" r="2.4" />
      <path d="M11 8.7l-3 5.6" />
      <path d="M13 8.7l3 5.6" />
      <path d="M9.4 16.6h5.2" />
    </>
  ),
  consult: (
    <>
      <path d="M5.2 6.2h13.6a2 2 0 0 1 2 2v6.4a2 2 0 0 1-2 2H10l-4.4 3v-3.1h-.4a2 2 0 0 1-2-2V8.2a2 2 0 0 1 2-2z" />
      <path d="M8 10.4h8" />
      <path d="M8 13.2h5.5" />
    </>
  ),
  coaching: (
    <>
      <rect x="6" y="4.8" width="12" height="15" rx="2" />
      <path d="M9.2 4.8a2.8 2.8 0 0 1 5.6 0" />
      <path d="M9 11.4l1.6 1.6 3.9-4" />
      <path d="M9 16.4h6" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.8 19a6.3 6.3 0 0 1 12.4 0" />
      <path d="M18.2 6.1l1.5-1.5" />
      <path d="M19.7 4.6l1 1" />
    </>
  ),
};
