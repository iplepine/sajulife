import type { ThemeSeason } from "./seasonTheme";

/**
 * 계절별 히어로 아트 리소스 — 홈과 풀이 인트로가 같은 그림을 쓰기 위한 단일 출처.
 *
 * 화면마다 경로를 따로 적으면 계절 아트를 교체할 때 한쪽만 바뀌어 룩앤필이 갈라진다.
 * (wide = 16:9 원본. 모바일은 같은 원본을 좌우 크롭해 쓴다 — DESIGN_SYSTEM 참조)
 */
export type SeasonArt = {
  /** 갈림길 풍경 (배경) */
  wide: string;
  /** 중앙 구슬 (투명 PNG). 한자는 코드 텍스트로 그 위에 올린다. */
  orb: string;
  /** 구슬 둘레의 점선 궤도 SVG. 계절 강조색으로 각각 준비돼 있다. */
  constellation: string;
};

export const SEASON_ART: Record<ThemeSeason, SeasonArt> = {
  spring: {
    wide: "/hero-art/life-path-spring-wide-v1.png",
    orb: "/hero-art/orbs/seasonal-orb-spring-v1.png",
    constellation: "/hero-art/orbs/stem-constellation-spring-v1.svg",
  },
  summer: {
    wide: "/hero-art/life-path-summer-wide-v1.png",
    orb: "/hero-art/orbs/seasonal-orb-summer-v1.png",
    constellation: "/hero-art/orbs/stem-constellation-summer-v1.svg",
  },
  autumn: {
    wide: "/hero-art/life-path-autumn-wide-v1.png",
    orb: "/hero-art/orbs/seasonal-orb-autumn-v1.png",
    constellation: "/hero-art/orbs/stem-constellation-autumn-v1.svg",
  },
  winter: {
    wide: "/hero-art/life-path-winter-wide-v1.png",
    orb: "/hero-art/orbs/seasonal-orb-winter-v1.png",
    constellation: "/hero-art/orbs/stem-constellation-winter-v1.svg",
  },
};

/** 사주 정보가 없을 때 구슬 중앙에 안전하게 띄우는 계절 기본 글자. */
export const SEASON_FALLBACK_STEM: Record<ThemeSeason, string> = {
  spring: "甲",
  summer: "壬",
  autumn: "戊",
  winter: "癸",
};
