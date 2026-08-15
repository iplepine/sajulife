"use client";

import type { ReactNode } from "react";

export type BrandIconName =
  | "dashboard"
  | "saju"
  | "home-saju"
  | "saju-unni"
  | "tci"
  | "home-tci"
  | "gijil-oppa"
  | "fusion"
  | "home-fusion"
  | "family"
  | "home-family"
  | "consult"
  | "coaching"
  | "account"
  | "notification"
  | "ticket"
  // 풀이 종류 아이콘 — 홈 퀵액션용. 배경 박스 없이 선만으로, '원의 변주'라는 한 문법을 공유한다.
  | "reading-saju"
  | "reading-tci"
  | "reading-fusion"
  | "reading-yongsin"
  | "reading-family"
  | "reading-compat";

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
  notification: (
    <>
      <path d="M6.7 10.2a5.3 5.3 0 0 1 10.6 0c0 5.1 2.1 5.5 2.1 6.8H4.6c0-1.3 2.1-1.7 2.1-6.8z" />
      <path d="M9.6 19.1a2.7 2.7 0 0 0 4.8 0" />
    </>
  ),
  // 티켓 — 🎫 이모지 대신. 가운데 절취선 있는 표. 이모지는 계절 파스텔 위에서 혼자 튄다.
  ticket: (
    <>
      <path d="M4 8.6h16v2.2a1.2 1.2 0 0 0 0 2.4v2.2H4v-2.2a1.2 1.2 0 0 0 0-2.4z" />
      <path d="M12 9.6v1.3" />
      <path d="M12 13.1v1.3" />
    </>
  ),

  /* ── 풀이 종류 아이콘 ────────────────────────────────────────
     한 문법: ★그 풀이 화면에서 실제로 보게 될 도형의 축소판★.
     기억할 그림과 눌러서 만나는 그림이 같아야 아이콘이 라벨의 장식이 아니라 예고가 된다.
     (주의: 원+눈금+중앙점은 하단 탭 '기록'이 이미 쓰고 있다 — 겹치지 않게.) */

  // 개인 사주 — 태극. 생애사주(circle of life)의 대표 기호.
  // 눈 두 개가 없으면 26px에서 '원 안의 사선'으로 읽힌다. 점이 있어야 태극이 된다.
  "reading-saju": (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a4 4 0 0 1 0 8 4 4 0 0 0 0 8" />
      <circle cx="12" cy="8" r=".95" />
      <circle cx="12" cy="16" r=".95" />
    </>
  ),
  // 기질 — TciRadar의 울퉁불퉁한 레이더 프로필. 사람마다 모양이 다르다는 게 요점.
  // 스포크(축선)는 26px에서 뭉개져 구겨진 종이처럼 보인다 → 윤곽과 중심만 남긴다.
  "reading-tci": (
    <>
      <path d="M12 4 18.6 8.3 16.8 16.7 8.2 18.6 4.4 11z" />
      <circle cx="12" cy="12" r="1.7" />
    </>
  ),
  // 사주 × 기질 — 두 원이 겹쳐 만드는 교집합
  "reading-fusion": (
    <>
      <circle cx="9.3" cy="12" r="5.6" />
      <circle cx="14.7" cy="12" r="5.6" />
    </>
  ),
  // 내 용신 — 내 원에서 열쇠가 되는 한 조각
  "reading-yongsin": (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 12V5" />
      <path d="M12 12l6.1 3.5" />
      <circle cx="14.6" cy="9.6" r="1" />
    </>
  ),
  // 가족 — 원들의 관계망. FamilyRelationGraph와 같은 언어.
  "reading-family": (
    <>
      <circle cx="12" cy="6.5" r="2.7" />
      <circle cx="6.3" cy="16.6" r="2.7" />
      <circle cx="17.7" cy="16.6" r="2.7" />
      <path d="M10.4 8.8 7.8 14.1" />
      <path d="M13.6 8.8 16.2 14.1" />
      <path d="M9 16.6h6" />
    </>
  ),
  // 궁합 — 마주 선 두 원과 그 사이에서 생기는 것.
  // 융합(겹치는 두 원)과 헷갈리지 않게 ★겹치지 않고★, 가족(작은 원 셋)과 헷갈리지 않게
  // 원을 더 크게 둘만 둔다. 가운데 점이 "둘 사이에 생기는 결" — 이게 없으면 아령으로 읽힌다.
  "reading-compat": (
    <>
      <circle cx="6.6" cy="12" r="3.8" />
      <circle cx="17.4" cy="12" r="3.8" />
      <path d="M10.4 12h3.2" />
      <circle cx="12" cy="12" r="1.15" />
    </>
  ),
};
