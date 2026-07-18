import type { ReactNode } from "react";

export type BottomTabIconName = "home" | "reports" | "consult" | "family" | "account";

export default function BottomTabIcon({ name }: { name: BottomTabIconName }) {
  return (
    <span className={`bottom-tab-icon bottom-tab-icon--${name}`} aria-hidden="true">
      <svg viewBox="0 0 28 28" focusable="false">
        {ICONS[name]}
      </svg>
    </span>
  );
}

const ICONS: Record<BottomTabIconName, ReactNode> = {
  home: (
    <>
      <path d="M4.5 13.1 14 5.7l9.5 7.4" />
      <path d="M7.2 11.8v10h13.6v-10" />
      <path d="M11.3 21.8v-5.7h5.4v5.7" />
      <path d="M7 24.1c3.8-1 10.1-1 14 0" className="bottom-tab-icon__brush" />
    </>
  ),
  reports: (
    <>
      <circle cx="14" cy="14" r="8.6" />
      <circle cx="14" cy="14" r="2.3" />
      <circle cx="14" cy="7.6" r=".8" className="bottom-tab-icon__dot" />
      <circle cx="20.1" cy="15.8" r=".8" className="bottom-tab-icon__dot" />
      <circle cx="17.4" cy="20.1" r=".8" className="bottom-tab-icon__dot" />
      <circle cx="9.3" cy="19.6" r=".8" className="bottom-tab-icon__dot" />
      <circle cx="7.8" cy="12.1" r=".8" className="bottom-tab-icon__dot" />
      <path d="M14 3.4v2M24.6 14h-2M14 24.6v-2M3.4 14h2" className="bottom-tab-icon__tick" />
    </>
  ),
  consult: (
    <>
      <path d="M5.2 6.3h17.6v12.2H12.4l-5.1 3.7v-3.7H5.2z" />
      <path d="M9 11.2c2.4-2.3 4.7 2.4 7-1.1" className="bottom-tab-icon__brush" />
      <path d="M9 15.2h8.8" />
    </>
  ),
  family: (
    <>
      <circle cx="14" cy="8.2" r="2.7" />
      <circle cx="7.6" cy="11.1" r="2.1" />
      <circle cx="20.4" cy="11.1" r="2.1" />
      <path d="M9.1 21.9v-3.3a4.9 4.9 0 0 1 9.8 0v3.3" />
      <path d="M3.8 21.6v-2.1a3.7 3.7 0 0 1 4.1-3.6M24.2 21.6v-2.1a3.7 3.7 0 0 0-4.1-3.6" />
      <path d="M5.2 24.1c4.1-1.1 13.5-1.1 17.6 0" className="bottom-tab-icon__brush" />
    </>
  ),
  account: (
    <>
      <circle cx="14" cy="14" r="9.4" />
      <circle cx="14" cy="10.5" r="2.6" />
      <path d="M8.8 20a5.5 5.5 0 0 1 10.4 0" />
      <path d="M5.3 6.7 7 5M21 5l1.7 1.7" className="bottom-tab-icon__tick" />
    </>
  ),
};
