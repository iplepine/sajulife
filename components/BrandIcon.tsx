"use client";

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
  return (
    <span className={`brand-icon brand-icon--${name}${className ? ` ${className}` : ""}`} aria-hidden="true">
      <img src={`/brand-icons/${name}.png`} alt="" draggable={false} />
    </span>
  );
}
