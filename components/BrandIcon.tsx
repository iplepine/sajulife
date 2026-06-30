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
      <rect x="5" y="5" width="5.4" height="5.4" rx="1.35" />
      <rect x="13.6" y="5" width="5.4" height="5.4" rx="1.35" />
      <rect x="5" y="13.6" width="5.4" height="5.4" rx="1.35" />
      <rect x="13.6" y="13.6" width="5.4" height="5.4" rx="1.35" />
    </>
  ),
  saju: (
    <>
      <circle cx="12" cy="12" r="6.9" />
      <path d="M12 7.3v2.1" />
      <path d="M12 14.6v2.1" />
      <path d="M7.3 12h2.1" />
      <path d="M14.6 12h2.1" />
      <circle cx="12" cy="12" r="1.7" />
    </>
  ),
  tci: (
    <>
      <path d="M12 4.5l6.5 4v7l-6.5 4-6.5-4v-7l6.5-4z" />
      <path d="M12 8.2v7.6" />
      <path d="M8.7 10.1l6.6 3.8" />
      <path d="M15.3 10.1l-6.6 3.8" />
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
