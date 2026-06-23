"use client";

import type { Pillar, SajuResult } from "@/lib/saju/calculator";
import { formatKoreanTimeCorrection } from "@/lib/saju/koreanTime";
import { seasonOfBranch, stemMeta } from "@/lib/saju/seasonClock";
import {
  fiveCategoryDistribution,
  TEN_SPIRIT_LABELS,
  tenSpiritFromStem,
  tenSpiritFromZhi,
  type FiveCategory,
} from "@/lib/saju/tenSpirits";

/**
 * 개인 사주의 시각화 블록 — DATA SUMMARY · 정체성 한 문장 · 사주팔자 기둥 · 오행구성.
 * `saju`만으로 그려지는 부분(AI 풀이 텍스트는 호출부가 ReportView로 따로 렌더).
 * 인증 페이지(/saju)와 공개 공유 페이지가 동일 마크업을 공유해 어긋나지 않게 한다.
 */

export const EL_VAR: Record<string, string> = { 목: "--el-wood", 화: "--el-fire", 토: "--el-earth", 금: "--el-metal", 수: "--el-water" };
export const EL_BG: Record<string, string> = { 목: "--el-wood-bg", 화: "--el-fire-bg", 토: "--el-earth-bg", 금: "--el-metal-bg", 수: "--el-water-bg" };
export const EL_CLASS: Record<string, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
export const EL_ORDER: Array<keyof SajuResult["wuxingCount"]> = ["목", "화", "토", "금", "수"];

const CATEGORY_KEYWORD: Record<FiveCategory, string> = {
  인성: "도움",
  비겁: "동료",
  식상: "표현",
  재성: "일·돈",
  관성: "책임",
};

export default function PersonalReportBody({
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
  const { pillars, dayMaster, wuxingCount } = saju;
  const total = EL_ORDER.reduce((s, k) => s + wuxingCount[k], 0) || 1;
  const correctionNote = formatKoreanTimeCorrection(saju.input.koreanTimeCorrection);

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

      <IdentityHero saju={saju} />

      <p className="h-sec mt5">사주팔자 기둥</p>
      <div className="pillars">
        <div className="ph">시</div><div className="ph">날</div><div className="ph">달</div><div className="ph">해</div>
        <StemCell p={pillars.time} dm={dayMaster.hanja} />
        <StemCell p={pillars.day} dm={dayMaster.hanja} acc />
        <StemCell p={pillars.month} dm={dayMaster.hanja} />
        <StemCell p={pillars.year} dm={dayMaster.hanja} />
        <BranchCell p={pillars.time} dm={dayMaster.hanja} />
        <BranchCell p={pillars.day} dm={dayMaster.hanja} />
        <BranchCell p={pillars.month} dm={dayMaster.hanja} />
        <BranchCell p={pillars.year} dm={dayMaster.hanja} />
      </div>

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
    </>
  );
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
    ["성함", name || "미입력"],
    ["성별", gender || "미입력"],
    ["생년월일시", `${saju.input.birthDate} ${birthTime} · ${calendar}`],
    ["나이", currentAge != null ? `만 ${currentAge}세` : "미입력"],
    ["직업", occupation || "미입력"],
  ];
  return (
    <section className="data-summary mt4" aria-label="DATA SUMMARY">
      <p className="data-summary-k">DATA SUMMARY</p>
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

function IdentityHero({ saju }: { saju: SajuResult }) {
  const stem = stemMeta(saju.dayMaster.hanja);
  const monthSeason = seasonOfBranch(saju.pillars.month.zhi.hanja);
  const dist = fiveCategoryDistribution(saju.pillars);
  const strong = (Object.keys(dist) as FiveCategory[])
    .filter((c) => dist[c] >= 2)
    .sort((a, b) => dist[b] - dist[a])
    .slice(0, 3)
    .map((c) => CATEGORY_KEYWORD[c]);
  return (
    <div className="hero-identity mt4">
      <p className="hero-line">
        {monthSeason.phrase}에 뿌리내린{" "}
        <span className="hero-stem">{stem.emoji} {stem.short}</span>{" "}
        같은{" "}
        <span className="hero-zodiac">{saju.shengXiao.ko}띠</span>
      </p>
      {strong.length > 0 && (
        <p className="hero-keys">{strong.join(" · ")}</p>
      )}
    </div>
  );
}

function StemCell({ p, acc, dm }: { p: Pillar | null; acc?: boolean; dm: string }) {
  if (!p) return <div className="cell"><span className="gz muted">—</span><span className="hanja">시각 모름</span></div>;
  // 일주의 천간 = 일간 자기 자신
  const spirit = acc ? null : tenSpiritFromStem(dm, p.gan.hanja);
  const spiritLabel = acc ? "나(일간)" : (spirit ? TEN_SPIRIT_LABELS[spirit].short : "");
  return (
    <div className={`cell${acc ? " acc" : ""}`} style={{ background: `var(${EL_BG[p.gan.wuxing] ?? "--el-earth-bg"})` }}>
      <span className="gz" style={{ color: `var(${EL_VAR[p.gan.wuxing] ?? "--el-earth"})` }}>{p.gan.ko}</span>
      <span className="hanja">{p.gan.hanja} {p.gan.wuxing}</span>
      <span className="spirit">{spiritLabel}</span>
    </div>
  );
}

function BranchCell({ p, dm }: { p: Pillar | null; dm: string }) {
  if (!p) return <div className="cell"><span className="gz muted">—</span><span className="hanja"> </span></div>;
  const spirit = tenSpiritFromZhi(dm, p.zhi.hanja);
  const spiritLabel = spirit ? TEN_SPIRIT_LABELS[spirit].short : "";
  return (
    <div className="cell" style={{ background: `var(${EL_BG[p.zhi.wuxing] ?? "--el-earth-bg"})` }}>
      <span className="gz" style={{ color: `var(${EL_VAR[p.zhi.wuxing] ?? "--el-earth"})` }}>{p.zhi.ko}</span>
      <span className="hanja">{p.zhi.hanja} {p.zhi.wuxing}</span>
      <span className="spirit">{spiritLabel}</span>
    </div>
  );
}
