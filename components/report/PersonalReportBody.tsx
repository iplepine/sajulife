"use client";

import LifeCircle from "@/components/LifeCircle";
import BrandIcon from "@/components/BrandIcon";
import type { Pillar, SajuResult } from "@/lib/saju/calculator";
import type { CautionMonth, CautionRelation } from "@/lib/saju/cautionMonths";
import { formatKoreanTimeCorrection } from "@/lib/saju/koreanTime";
import { GAN_KO } from "@/lib/saju/readings";
import { seasonOfBranch, stemMeta } from "@/lib/saju/seasonClock";
import { listSymbolicStarsForBranch } from "@/lib/saju/symbolicStars";
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
  cautionMonths,
}: {
  saju: SajuResult;
  name?: string;
  gender?: string;
  currentAge?: number;
  currentYear?: number;
  occupation?: string;
  identityTitle?: string;
  cautionMonths?: CautionMonth[];
}) {
  const { pillars, dayMaster, wuxingCount } = saju;
  const total = EL_ORDER.reduce((s, k) => s + wuxingCount[k], 0) || 1;
  const correctionNote = formatKoreanTimeCorrection(saju.input.koreanTimeCorrection);
  const circleCurrentYear = currentYear ?? new Date().getFullYear();
  const birthYear = parseBirthYear(saju.input.birthDate) ?? circleCurrentYear;

  return (
    <>
      <DataSummary
        saju={saju}
        name={name}
        gender={gender}
        currentAge={currentAge}
        occupation={occupation}
      />
      {correctionNote && (
        <p className="muted mt2" style={{ fontSize: 12 }}>
          한국 시간 보정: {correctionNote}
        </p>
      )}

      <IdentityHero saju={saju} title={identityTitle} />

      <p className="h-sec mt5">인생 시기 그림</p>
      <LifeCircle saju={saju} birthYear={birthYear} currentYear={circleCurrentYear} />

      <p className="h-sec mt5">사주팔자 기둥</p>
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
      <p className="pillar-note">
        십성은 일간 기준으로 보고, 지지는 첫 장간으로 대표 십성을 잡은 뒤 나머지 장간과 신살·귀인만 덧붙였어.
      </p>

      <p className="h-sec mt5">오행구성</p>
      <div className="dist">
        {EL_ORDER.map((k) => (
          <span key={k} className={EL_CLASS[k]} style={{ width: `${(wuxingCount[k] / total) * 100}%` }} />
        ))}
      </div>
      <div className="legend">
        {EL_ORDER.map((k) => (
          <div key={k}><span className={`el-dot ${EL_CLASS[k]}`} />{k} {wuxingCount[k]}</div>
        ))}
      </div>

      <CautionMonthsCard months={cautionMonths} year={circleCurrentYear} />
    </>
  );
}

/** 관계 → 카드용 짧은 자연어 라벨(한자·명리어 비노출). */
const CAUTION_LABEL: Record<CautionRelation, string> = {
  충: "급한 변화·이동 조심",
  삼형: "부딪침·시비 조심",
  상형: "엇갈림·자존심 마찰",
  자형: "혼자 끌어안다 과부하",
  파: "계획 틀어짐 조심",
  해: "소모·잔병·구설 조심",
};

/**
 * 조심할 달 — 그 해 월운이 원국과 부딪치는 달을 '속도 줄이기 권장도' 별점으로.
 * 결정론 계산값(cautionMonths)만으로 그린다. AI 서술은 ReportView '조심할 달' 섹션이 따로 렌더.
 */
function CautionMonthsCard({ months, year }: { months?: CautionMonth[]; year: number }) {
  if (!months || months.length === 0) return null;
  const notable = months.filter((m) => m.level >= 3).sort((a, b) => b.level - a.level || a.month - b.month);
  if (notable.length === 0) return null;
  const topLabel = (m: CautionMonth): string => {
    if (m.hits.length === 0) return "";
    return CAUTION_LABEL[m.hits[0].relation] ?? "";
  };
  return (
    <>
      <p className="h-sec mt5">{year}년 조심할 달</p>
      <p className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
        별은 흔들림 크기야. 별이 많아도 겁먹지 마 — 「조심」은 천천히, 「전환」은 묵은 거 흘려보내는 달이야.
      </p>
      <div className="caution-list">
        {notable.map((m) => {
          const turn = m.direction === "정리·전환";
          return (
            <div className="caution-row" key={m.month}>
              <span className="caution-month">{m.month}월</span>
              <span className="caution-stars" aria-label={`흔들림 ${m.level} / 5`}>
                {"★".repeat(m.level)}<span className="dim">{"★".repeat(5 - m.level)}</span>
              </span>
              <span className={`caution-tag${turn ? " turn" : ""}`}>{turn ? "전환" : "조심"}</span>
              <span className="caution-label">{topLabel(m)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function parseBirthYear(birthDate: string): number | null {
  const year = Number(birthDate.slice(0, 4));
  return Number.isFinite(year) && year > 0 ? year : null;
}

function DataSummary({
  saju,
  name,
  gender,
  currentAge,
  occupation,
}: {
  saju: SajuResult;
  name?: string;
  gender?: string;
  currentAge?: number;
  occupation?: string;
}) {
  const birthTime = saju.input.birthTimeKnown ? saju.input.birthTime : "시각 모름";
  const calendar = saju.input.calendar === "lunar" ? "음력" : "양력";
  const rows = [
    ["성함 / 나이", `${name || "미입력"} · ${currentAge != null ? `만 ${currentAge}세` : "나이 미입력"}`],
    ["성별 / 직업", `${gender || "미입력"} · ${occupation || "직업 미입력"}`],
    ["생년월일시", `${saju.input.birthDate} ${birthTime} · ${calendar}`],
  ];
  return (
    <section className="data-summary mt4" aria-label="풀이 기준 정보">
      <p className="data-summary-k">풀이 기준 정보</p>
      <dl className="data-summary-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
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
      <span className="gz" style={{ color: `var(${EL_VAR[p.gan.wuxing] ?? "--el-earth"})` }}>{p.gan.ko}</span>
      <span className="hanja">{p.gan.hanja} · {p.gan.wuxing} · {p.gan.yinyang}</span>
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
      <span className="gz" style={{ color: `var(${EL_VAR[p.zhi.wuxing] ?? "--el-earth"})` }}>{p.zhi.ko}</span>
      <span className="hanja">{p.zhi.hanja} · {p.zhi.wuxing} · {p.zhi.yinyang}</span>
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
