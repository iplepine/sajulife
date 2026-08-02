"use client";

import LifeCircle from "@/components/LifeCircle";
import LifePeriodGraph from "@/components/LifePeriodGraph";
import BrandIcon from "@/components/BrandIcon";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Pillar, SajuResult } from "@/lib/saju/calculator";
import { formatKoreanTimeCorrection } from "@/lib/saju/koreanTime";
import { GAN_KO } from "@/lib/saju/readings";
import { seasonOfBranch, stemMeta } from "@/lib/saju/seasonClock";
import { listSymbolicStarsForBranch } from "@/lib/saju/symbolicStars";
import { ELEMENT_META, type Element } from "@/lib/saju/yongsinView";
import {
  TEN_SPIRIT_LABELS,
  tenSpiritFromStem,
  tenSpiritFromZhi,
  tenSpiritsFromHiddenStems,
  type TenSpirit,
} from "@/lib/saju/tenSpirits";

/**
 * 개인 사주의 시각화 블록 — 풀이 기준 정보 · 정체성 한 문장 · 인생 흐름 그림 · 사주팔자 기둥 · 오행구성.
 * 사주 도식은 `saju`로 그리고, 대표 한 문장은 AI 풀이 title이 있으면 그것을 우선 쓴다.
 * AI 풀이 텍스트는 호출부가 ReportView로 따로 렌더한다.
 * 인증 페이지(/saju)와 공개 공유 페이지가 동일 마크업을 공유해 어긋나지 않게 한다.
 */

export const EL_VAR: Record<string, string> = { 목: "--el-wood", 화: "--el-fire", 토: "--el-earth", 금: "--el-metal", 수: "--el-water" };
export const EL_BG: Record<string, string> = { 목: "--el-wood-bg", 화: "--el-fire-bg", 토: "--el-earth-bg", 금: "--el-metal-bg", 수: "--el-water-bg" };
export const EL_CLASS: Record<string, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
export const EL_ORDER: Array<keyof SajuResult["wuxingCount"]> = ["목", "화", "토", "금", "수"];

export default function PersonalReportBody({
  saju,
  name,
  gender,
  currentAge,
  currentYear,
  occupation,
  identityTitle,
}: {
  saju: SajuResult;
  name?: string;
  gender?: string;
  currentAge?: number;
  currentYear?: number;
  occupation?: string;
  identityTitle?: string;
}) {
  const correctionNote = formatKoreanTimeCorrection(saju.input.koreanTimeCorrection);
  const circleCurrentYear = currentYear ?? new Date().getFullYear();
  const birthYear = parseBirthYear(saju.input.birthDate) ?? circleCurrentYear;

  return (
    <section className="personal-report-ledger" aria-label="개인 사주 풀이의 기본 정보">
      <DataSummary
        saju={saju}
        name={name}
        gender={gender}
        currentAge={currentAge}
        occupation={occupation}
        showCharacterReveal
      />
      {correctionNote && (
        <p className="muted mt2" style={{ fontSize: 12 }}>
          한국 시간 보정: {correctionNote}
        </p>
      )}

      <IdentityHero saju={saju} title={identityTitle} />

      <p className="h-sec mt5">인생 시기 그림</p>
      <div className="life-period-compare">
        <section className="life-period-variant" aria-labelledby="life-circle-heading">
          <div className="life-period-variant-head">
            <p id="life-circle-heading">계절 시계</p>
            <span>계절 사이의 위치를 읽어요</span>
          </div>
          <LifeCircle saju={saju} birthYear={birthYear} currentYear={circleCurrentYear} />
        </section>
        <section className="life-period-variant" aria-labelledby="life-graph-heading">
          <div className="life-period-variant-head">
            <p id="life-graph-heading">시간 흐름 그래프</p>
            <span>대운을 시간 순서로 비교해요</span>
          </div>
          <LifePeriodGraph saju={saju} birthYear={birthYear} currentYear={circleCurrentYear} />
        </section>
      </div>

      <p className="h-sec mt5">사주팔자 기둥</p>
      <PillarsGrid saju={saju} />
      <p className="pillar-note">
        십성은 일간 기준으로 보고, 지지는 첫 장간으로 대표 십성을 잡은 뒤 나머지 장간과 신살·귀인만 덧붙였어.
      </p>

      <p className="h-sec mt5">오행구성</p>
      <WuxingDist saju={saju} />
    </section>
  );
}

/**
 * 사주팔자 기둥 표 — ★리포트와 구매 유도 화면이 공유★한다.
 * 두 화면이 각자 그리면 "살 때 본 표"와 "사고 나서 보는 표"가 어긋난다.
 */
export function PillarsGrid({ saju }: { saju: SajuResult }) {
  const { pillars, dayMaster } = saju;
  return (
    <div className="pillars pillars--rich">
      <div className="ph">시</div><div className="ph">날</div><div className="ph">달</div><div className="ph">해</div>
      <StemCell p={pillars.time} dm={dayMaster.hanja} />
      <StemCell p={pillars.day} dm={dayMaster.hanja} acc />
      <StemCell p={pillars.month} dm={dayMaster.hanja} />
      <StemCell p={pillars.year} dm={dayMaster.hanja} />
      <BranchCell p={pillars.time} dm={dayMaster.hanja} dayBranch={pillars.day.zhi.hanja} />
      <BranchCell p={pillars.day} dm={dayMaster.hanja} dayBranch={pillars.day.zhi.hanja} />
      <BranchCell p={pillars.month} dm={dayMaster.hanja} dayBranch={pillars.day.zhi.hanja} />
      <BranchCell p={pillars.year} dm={dayMaster.hanja} dayBranch={pillars.day.zhi.hanja} />
    </div>
  );
}

/**
 * 오행 구슬 — 유리알(오행 색) 안에 그 오행의 한자. 히어로가 일간 한자를 구슬에 얹는 것과 같은 문법.
 * 오행을 그림으로 보여줘야 하는 자리는 전부 이걸로 통일한다(구성·보약·과부하·타고난 바탕).
 */
export function ElementOrb({ el, size, className }: { el: Element; size?: number; className?: string }) {
  const meta = ELEMENT_META[el];
  // 지름을 --orb-size로 넘긴다 — 한자 크기가 지름에 비례해야 어느 크기에서도 같은 비율로 보인다.
  const style = { "--el": `var(${meta.cssVar})`, ...(size ? { "--orb-size": `${size}px` } : null) } as CSSProperties;
  return (
    <span className={`el-orb${className ? ` ${className}` : ""}`} style={style} aria-hidden>
      <img src={meta.orb} alt="" draggable={false} />
      <i>{meta.hanja}</i>
    </span>
  );
}

/**
 * 오행 분포 — ★구슬 크기가 곧 그 기운의 양★.
 * 예전 가로 스택 막대는 0인 기운을 아예 안 그려서 "비었다"가 눈에 안 보였다.
 * 구슬로 두면 빈 자리가 빈 채로 남아 결핍이 그림으로 읽힌다.
 */
export function WuxingDist({ saju }: { saju: SajuResult }) {
  const { wuxingCount } = saju;
  const max = Math.max(1, ...EL_ORDER.map((k) => wuxingCount[k]));
  return (
    <ul className="wx-orbs">
      {EL_ORDER.map((k) => {
        const n = wuxingCount[k];
        return (
          <li key={k} className={n === 0 ? "is-empty" : undefined}>
            <span className="wx-orb-slot">
              {n === 0 ? (
                <span className="el-orb el-orb--empty" aria-hidden><i>{ELEMENT_META[k as Element].hanja}</i></span>
              ) : (
                <ElementOrb el={k as Element} size={30 + Math.round((n / max) * 26)} />
              )}
            </span>
            <b>{n}</b>
          </li>
        );
      })}
    </ul>
  );
}

function parseBirthYear(birthDate: string): number | null {
  const year = Number(birthDate.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

/**
 * 무엇을 근거로 본 풀이인지 — ★리포트와 구매 유도 화면이 공유★.
 * 사기 전 화면에서 "이 정보로 뽑았다"를 먼저 보여주면 결과의 출처가 분명해진다.
 * 한 줄에 한 항목씩 — 두 항목을 슬래시로 묶으면 어느 값이 어느 라벨인지 눈이 한 번 더 짚어야 한다.
 */
export function DataSummary({
  saju,
  name,
  gender,
  currentAge,
  occupation,
  className,
  action,
  showCharacterReveal = false,
}: {
  saju: SajuResult;
  name?: string;
  gender?: string;
  currentAge?: number;
  occupation?: string;
  className?: string;
  /** 첫 줄(이름/성별) 오른쪽에 붙일 조작 버튼. 구매 화면에서 대상자 변경을 여기에 단다. */
  action?: ReactNode;
  /** 개인 리포트 상단에서만 실제 사주 글자를 한 글자씩 보여 준다. */
  showCharacterReveal?: boolean;
}) {
  // 양/음력은 따로 한 줄 잡을 값이 아니라 생일을 읽는 방식이다 → 생일 옆 괄호로.
  const calendar = saju.input.calendar === "lunar" ? "음력" : "양력";
  const rows: Array<[string, string]> = [
    ["이름 / 성별", `${name || "미입력"} · ${gender || "미입력"}`],
    ["생일", `${formatBirthDate(saju.input.birthDate)} (${calendar})`],
    ["생시", saju.input.birthTimeKnown ? formatBirthTime(saju.input.birthTime) : "시각 모름"],
  ];
  // occupationLabel은 미입력일 때 "(미입력)"을 돌려준다 — 빈 줄을 만들지 않게 거른다.
  if (occupation && !occupation.startsWith("(")) rows.push(["직업", occupation]);
  rows.push(["기준일", formatToday()]);
  const characters = showCharacterReveal ? personalCharacterItems(saju) : [];

  return (
    <section className={`data-summary${className ? ` ${className}` : " mt4"}`} aria-label="풀이 기준 정보">
      {showCharacterReveal && <SajuCharacterReveal items={characters} />}
      <p className="data-summary-k">풀이 기준 정보</p>
      <dl className="data-summary-grid">
        {rows.map(([label, value], i) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={i === 0 && action ? "has-action" : undefined}>
              <span>{value}</span>
              {i === 0 && action}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

type CharacterItem = {
  character: string;
  label: string;
  wuxing: string;
  yinyang: string;
};

/** 실제 원국의 여덟 글자만 쓴다. 장식용 한자나 임의의 순서는 넣지 않는다. */
function personalCharacterItems(saju: SajuResult): CharacterItem[] {
  const entries: Array<{ label: string; character: Pillar["gan"] | Pillar["zhi"] }> = [
    { label: "나 · 일간", character: saju.pillars.day.gan },
    { label: "나를 받치는 자리", character: saju.pillars.day.zhi },
    { label: "태어난 달의 글자", character: saju.pillars.month.gan },
    { label: "태어난 달의 자리", character: saju.pillars.month.zhi },
    { label: "태어난 해의 글자", character: saju.pillars.year.gan },
    { label: "태어난 해의 자리", character: saju.pillars.year.zhi },
  ];
  if (saju.pillars.time) {
    entries.push(
      { label: "태어난 시의 글자", character: saju.pillars.time.gan },
      { label: "태어난 시의 자리", character: saju.pillars.time.zhi },
    );
  }
  return entries.map(({ label, character }) => ({
    character: character.hanja,
    label,
    wuxing: character.wuxing,
    yinyang: character.yinyang,
  }));
}

/** 한 글자를 만난 뒤 다음 글자로 넘긴다. reduced motion에서는 첫 글자를 고정한다. */
function SajuCharacterReveal({ items }: { items: CharacterItem[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), 2400);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;
  const item = items[index % items.length];
  return (
    <div className="saju-character-reveal">
      <div className="scr-copy">
        <p>나를 표현하는 글자들</p>
        <span>한 글자씩 천천히 만나보세요</span>
      </div>
      <div className="scr-stage" aria-live="off">
        <span
          className="scr-character"
          key={`${item.character}-${index}`}
          style={{ color: `var(${EL_VAR[item.wuxing] ?? "--text"})` }}
          aria-hidden="true"
        >
          {item.character}
        </span>
        <span className="scr-meta">{item.label} · {item.wuxing} · {item.yinyang}</span>
      </div>
      <div className="scr-progress" aria-label={`나를 표현하는 글자 ${index + 1} / ${items.length}`}>
        {items.map((entry, itemIndex) => <i key={`${entry.character}-${itemIndex}`} className={itemIndex === index ? "on" : ""} />)}
      </div>
      <span className="sr-only">나를 표현하는 글자: {items.map((entry) => entry.character).join(", ")}</span>
    </div>
  );
}

/** "1990-06-14" → "1990년 6월 14일" */
function formatBirthDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d) ? `${y}년 ${m}월 ${d}일` : iso;
}

/** "09:00" → "오전 9시 00분" */
function formatBirthTime(hhmm: string): string {
  const [h, min] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return hhmm;
  const ampm = h < 12 ? "오전" : "오후";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${hour12}시 ${String(min).padStart(2, "0")}분`;
}

/** 나이·운을 어느 시점 기준으로 봤는지 — 오늘. */
function formatToday(): string {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
}

function IdentityHero({ saju, title }: { saju: SajuResult; title?: string }) {
  const stem = stemMeta(saju.dayMaster.hanja);
  const monthSeason = seasonOfBranch(saju.pillars.month.zhi.hanja);
  const line = title?.trim() || `${monthSeason.phrase}에 뿌리내린 ${stem.emoji} ${stem.short} 같은 ${saju.shengXiao.ko}띠`;
  return (
    <div className="hero-identity mt4">
      <BrandIcon name="saju-unni" className="hero-identity-icon" />
      <div className="hero-identity-copy">
        <p className="hero-guide">사주언니가 보는 너는</p>
        <p className="hero-line">{line}</p>
      </div>
    </div>
  );
}

function StemCell({ p, acc, dm }: { p: Pillar | null; acc?: boolean; dm: string }) {
  if (!p) return <div className="cell"><span className="gz muted">—</span><span className="hanja">시각 모름</span></div>;
  // 일주의 천간 = 일간 자기 자신
  const spirit = acc ? null : tenSpiritFromStem(dm, p.gan.hanja);
  const spiritLabel = acc ? "나 · 일간" : formatSpirit(spirit);
  return (
    <div className={`cell${acc ? " acc" : ""}`} style={{ background: `var(${EL_BG[p.gan.wuxing] ?? "--el-earth-bg"})` }}>
      <span className="gz" style={{ color: `var(${EL_VAR[p.gan.wuxing] ?? "--el-earth"})` }}>{p.gan.hanja}</span>
      {/* 눈에 보이는 건 읽는 음 하나. 오행은 칸 색이, 음양은 아래 십성이 이미 말한다(같은 오행이라도
          음양이 같으면 비견·다르면 겁재). 낭독용으로만 원래 값을 남긴다. */}
      <span className="hanja">{p.gan.ko}<span className="a11y-only"> {p.gan.wuxing} {p.gan.yinyang}</span></span>
      <span className="spirit">{spiritLabel}</span>
    </div>
  );
}

function BranchCell({ p, dm, dayBranch }: { p: Pillar | null; dm: string; dayBranch: string }) {
  if (!p) return <div className="cell"><span className="gz muted">—</span><span className="hanja"> </span></div>;
  const spirit = tenSpiritFromZhi(dm, p.zhi.hanja);
  const hidden = tenSpiritsFromHiddenStems(dm, p.zhi.hanja);
  const hiddenDetail = hidden.slice(1);
  const stars = listSymbolicStarsForBranch({
    dayStem: dm,
    dayBranch,
    branch: p.zhi.hanja,
  }).slice(0, 4);
  return (
    <div className="cell" style={{ background: `var(${EL_BG[p.zhi.wuxing] ?? "--el-earth-bg"})` }}>
      <span className="gz" style={{ color: `var(${EL_VAR[p.zhi.wuxing] ?? "--el-earth"})` }}>{p.zhi.hanja}</span>
      <span className="hanja">{p.zhi.ko}<span className="a11y-only"> {p.zhi.wuxing} {p.zhi.yinyang}</span></span>
      <span className="spirit">{formatSpirit(spirit)}</span>
      {hiddenDetail.length > 0 && (
        <span className="hidden-stems">
          장간 {hiddenDetail.map(({ stem, spirit: s }) => `${GAN_KO[stem] ?? stem}${s ? ` ${s}` : ""}`).join(" · ")}
        </span>
      )}
      {stars.length > 0 && (
        <span className="pillar-tags">
          {stars.map((star) => (
            <span key={`${p.zhi.hanja}-${star.name}`} className={star.kind === "귀인" ? "good" : ""}>
              {star.name}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

function formatSpirit(spirit: TenSpirit | null): string {
  if (!spirit) return "";
  return `${spirit} · ${TEN_SPIRIT_LABELS[spirit].short}`;
}
