"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import BrandIcon from "@/components/BrandIcon";
import ReportView from "@/components/ReportView";
import { formatKoreanTimeCorrection } from "@/lib/saju/koreanTime";
import { seasonOfBranch, stemMeta } from "@/lib/saju/seasonClock";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";

/**
 * 사주 × 기질 풀이 상단 시각화.
 * 풀이 기준 정보 → 정체성 한 문장 → 사주×기질 연결 지도 → AI 해설 순서로 고정한다.
 *
 * 기질 8축 레이더·차원별 점수는 기질 리포트(TciReportBody)에서 이미 제공하므로 융합에서는 빼고,
 * 융합에서만 보이는 "타고난 재료(사주) ↔ 지금 작동하는 기질" 연결만 지도로 또렷이 보여준다.
 */

// 오행 ↔ 기질 축 매핑 — 융합 프롬프트(defaults.ts `tci-saju-fusion`)와 같은 출처.
const WUXING_AXIS: Record<string, string[]> = {
  목: ["NS", "FLEX"],
  화: ["SD", "RD"],
  토: ["HA", "PS"],
  금: ["CO"],
  수: ["ST", "RD"],
};

const AXIS_LABEL: Record<string, string> = {
  NS: "추진성", HA: "안정성", RD: "공감성", PS: "지속성",
  SD: "주도성", CO: "연결성", ST: "통찰성", FLEX: "유연성",
};

// 양분 그래프 오른쪽 축 순서 — 왼쪽 오행(목화토금수)과 결을 맞춰 선 꼬임을 최소화.
const RIGHT_ORDER = ["NS", "FLEX", "SD", "RD", "HA", "PS", "CO", "ST"];

const EL_ORDER = ["목", "화", "토", "금", "수"] as const;
const EL_CLASS: Record<string, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
const EL_META: Record<string, { emoji: string; nature: string }> = {
  목: { emoji: "🌳", nature: "큰 나무" },
  화: { emoji: "🔥", nature: "타는 불" },
  토: { emoji: "⛰️", nature: "너른 흙" },
  금: { emoji: "🪨", nature: "단단한 쇠" },
  수: { emoji: "💧", nature: "흐르는 물" },
};

type Verdict = "밀어줌" | "길러냄" | "잠재" | "빈자리" | "조율";
type AxisVal = { key: string; label: string; percent: number };
type FusionLink = { el: string; axisKey: string; axisLabel: string; count: number; percent: number; verdict: Verdict };

/** 타고난 재료(오행 개수)와 지금 작동(축 점수)이 만나는 결을 판정. */
function verdictOf(count: number, percent: number): Verdict {
  const present = count >= 1, strong = count >= 2;
  const high = percent >= 60, low = percent < 40;
  if (present && high) return "밀어줌";   // 재료가 그 기질을 그대로 받쳐줌
  if (!present && high) return "길러냄";   // 타고난 재료는 비었는데 길러서 채움
  if (strong && low) return "잠재";        // 재료는 두둑한데 아직 덜 씀
  if (!present && low) return "빈자리";     // 둘 다 얇아 채워야 할 자리
  return "조율";
}

const VERDICT_STYLE: Record<Verdict, { stroke: string; width: number; dash?: string; op: number }> = {
  밀어줌: { stroke: "var(--el-wood)", width: 2.6, op: 0.92 },
  길러냄: { stroke: "var(--el-wood)", width: 2, dash: "5 4", op: 0.9 },
  잠재: { stroke: "var(--el-earth)", width: 2, dash: "5 4", op: 0.9 },
  빈자리: { stroke: "var(--el-fire)", width: 1.8, dash: "1.5 4", op: 0.85 },
  조율: { stroke: "var(--border-strong)", width: 1.4, op: 0.5 },
};
const VERDICT_RANK: Record<Verdict, number> = { 조율: 0, 빈자리: 1, 잠재: 2, 길러냄: 3, 밀어줌: 4 };

function materialLabel(count: number): string {
  if (count >= 3) return "재료 가득";
  if (count === 2) return "재료 두둑";
  if (count === 1) return "재료 한 줌";
  return "재료 빈자리";
}

/** 받침 유무로 주격조사 이/가 선택. */
function iGa(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  const hasJong = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return hasJong ? "이" : "가";
}

export default function FusionReportBody({
  scores,
  flexibility,
  saju,
  birthYear,
  currentYear,
  currentAge,
  name,
  gender,
  occupation,
  report,
  fallback,
  actions,
  showConsultCta = false,
}: {
  scores: TciScore[];
  flexibility?: number;
  previousScores?: TciScore[];
  previousFlexibility?: number;
  saju: SajuResult | null;
  birthYear: number;
  currentYear: number;
  currentAge?: number;
  name?: string;
  gender?: string;
  occupation?: string;
  report?: string;
  fallback?: ReactNode;
  actions?: ReactNode;
  showConsultCta?: boolean;
}) {
  const age = currentAge ?? (birthYear ? Math.max(0, currentYear - birthYear) : undefined);

  return (
    <div className="fusion-report mt5">
      {saju && (
        <>
          <DataSummary
            saju={saju}
            name={name}
            gender={gender}
            currentAge={age}
            occupation={occupation}
          />
          <FusionHero saju={saju} scores={scores} />
        </>
      )}

      {saju && scores.length > 0 && (
        <>
          <p className="h-sec mt5">사주 × 기질 연결 지도</p>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
            왼쪽은 사주가 준 <b>타고난 재료</b>, 오른쪽은 지금 실제로 굴러가는 <b>기질</b>이야.
            둘을 잇는 선이 어디서 맞물려 밀어주고, 어디서 겉도는지를 보여줘.
          </p>
          <ConnectionMap saju={saju} scores={scores} flexibility={flexibility} />
        </>
      )}

      {report != null ? <ReportView className="mt5" text={report} currentAge={age} /> : fallback}
      {actions}

      {showConsultCta && (
        <div className="card card-flat mt4">
          <b style={{ fontSize: 14 }}>이 해석 두고 더 얘기해볼래?</b>
          <Link href="/consult" className="btn btn-primary btn-block mt3" style={{ textDecoration: "none" }}>
            상담하러 가기
          </Link>
        </div>
      )}
    </div>
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
  const correctionNote = formatKoreanTimeCorrection(saju.input.koreanTimeCorrection);
  const rows = [
    ["성함 / 나이", `${name || "미입력"} · ${currentAge != null ? `만 ${currentAge}세` : "나이 미입력"}`],
    ["성별 / 직업", `${gender || "미입력"} · ${occupation || "직업 미입력"}`],
    ["생년월일시", `${saju.input.birthDate} ${birthTime} · ${calendar}`],
  ];
  return (
    <section className="data-summary" aria-label="풀이 기준 정보">
      <p className="data-summary-k">풀이 기준 정보</p>
      <dl className="data-summary-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {correctionNote && (
        <p className="muted mt2" style={{ fontSize: 12 }}>
          한국 시간 보정: {correctionNote}
        </p>
      )}
    </section>
  );
}

function FusionHero({ saju, scores }: { saju: SajuResult; scores: TciScore[] }) {
  const stem = stemMeta(saju.dayMaster.hanja);
  const monthSeason = seasonOfBranch(saju.pillars.month.zhi.hanja);
  const top = scores.length ? [...scores].sort((a, b) => b.percent - a.percent)[0] : null;
  return (
    <div className="hero-identity mt4">
      <span className="hero-identity-duo" aria-hidden="true">
        <BrandIcon name="saju-unni" className="hero-identity-icon" />
        <BrandIcon name="gijil-oppa" className="hero-identity-icon" />
      </span>
      <div className="hero-identity-copy">
        <p className="hero-guide">사주언니 × 기질오빠가 같이 본 한 문장</p>
        <p className="hero-line">
          {monthSeason.phrase}에 뿌리내린{" "}
          <span className="hero-stem">{stem.emoji} {stem.short}</span>
          {top ? ` 위로 ${top.label}이 선명하게 올라온 ` : " 위에 기질의 결이 겹친 "}
          <span className="hero-zodiac">{saju.shengXiao.ko}띠</span>
        </p>
        {top && <p className="hero-keys">{top.label} · {top.description}</p>}
      </div>
    </div>
  );
}

/**
 * 사주 재료(왼쪽 5 오행) ↔ 기질 축(오른쪽) 양분 연결 지도.
 * 선의 색·결로 "타고난 재료가 그 기질을 밀어주는지/잠겨있는지/길러서 채웠는지/비었는지"를 보여주고,
 * 가장 또렷한 연결 두세 개는 아래 하이라이트로 자연어 한 줄씩 뽑아준다.
 */
function ConnectionMap({
  saju,
  scores,
  flexibility,
}: {
  saju: SajuResult;
  scores: TciScore[];
  flexibility?: number;
}) {
  const axisMap = new Map<string, AxisVal>();
  for (const s of scores) {
    axisMap.set(s.dimension, { key: s.dimension, label: AXIS_LABEL[s.dimension] ?? s.label, percent: s.percent });
  }
  if (typeof flexibility === "number") {
    axisMap.set("FLEX", { key: "FLEX", label: AXIS_LABEL.FLEX, percent: flexibility });
  }
  const rightKeys = RIGHT_ORDER.filter((k) => axisMap.has(k));
  if (rightKeys.length === 0) return null;

  const links: FusionLink[] = [];
  for (const el of EL_ORDER) {
    const count = saju.wuxingCount[el] ?? 0;
    for (const axisKey of WUXING_AXIS[el] ?? []) {
      const av = axisMap.get(axisKey);
      if (!av || !rightKeys.includes(axisKey)) continue;
      links.push({ el, axisKey, axisLabel: av.label, count, percent: av.percent, verdict: verdictOf(count, av.percent) });
    }
  }

  // ── 레이아웃 ──
  const W = 340, PAD = 16, CAP = 18;
  const L_W = 122, L_H = 44, L_GAP = 12;
  const R_W = 120, R_H = 26, R_GAP = 8;
  const leftBlock = EL_ORDER.length * L_H + (EL_ORDER.length - 1) * L_GAP;
  const rightBlock = rightKeys.length * R_H + (rightKeys.length - 1) * R_GAP;
  const bodyH = Math.max(leftBlock, rightBlock);
  const H = bodyH + CAP + PAD * 2;
  const colTop = CAP + PAD;
  const leftStart = colTop + (bodyH - leftBlock) / 2;
  const rightStart = colTop + (bodyH - rightBlock) / 2;
  const leftCY = (i: number) => leftStart + L_H / 2 + i * (L_H + L_GAP);
  const rightCY = (j: number) => rightStart + R_H / 2 + j * (R_H + R_GAP);
  const leftX = 8, rightX = W - 8 - R_W;
  const leftEdge = leftX + L_W, rightEdge = rightX, midX = (leftEdge + rightEdge) / 2;
  const elIdx = (el: string) => EL_ORDER.indexOf(el as (typeof EL_ORDER)[number]);
  const axisIdx = (key: string) => rightKeys.indexOf(key);

  const drawLinks = [...links].sort((a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict]);
  const highlights = pickHighlights(links);

  return (
    <div className="fusion-cmap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="사주가 준 타고난 재료와 지금 작동하는 기질 축의 연결 지도"
        preserveAspectRatio="xMidYMid meet"
      >
        <text x={leftX + L_W / 2} y={12} textAnchor="middle"
          style={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 800, letterSpacing: ".02em" }}>
          타고난 재료
        </text>
        <text x={rightX + R_W / 2} y={12} textAnchor="middle"
          style={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 800, letterSpacing: ".02em" }}>
          지금 작동하는 기질
        </text>

        {drawLinks.map((l, i) => {
          const st = VERDICT_STYLE[l.verdict];
          const ly = leftCY(elIdx(l.el));
          const ry = rightCY(axisIdx(l.axisKey));
          const d = `M ${leftEdge} ${ly} C ${midX} ${ly}, ${midX} ${ry}, ${rightEdge} ${ry}`;
          return (
            <path key={`${l.el}-${l.axisKey}-${i}`} d={d} fill="none"
              style={{ stroke: st.stroke, strokeWidth: st.width, strokeDasharray: st.dash, opacity: st.op, strokeLinecap: "round" }} />
          );
        })}

        {EL_ORDER.map((el, i) => {
          const cy = leftCY(i);
          const count = saju.wuxingCount[el] ?? 0;
          const cls = EL_CLASS[el];
          const m = EL_META[el];
          const dim = count === 0;
          return (
            <g key={el} style={{ opacity: dim ? 0.5 : 1 }}>
              <rect x={leftX} y={cy - L_H / 2} width={L_W} height={L_H} rx={12}
                style={{ fill: `var(--el-${cls}-bg)`, stroke: `var(--el-${cls})`, strokeWidth: 1.2, strokeDasharray: dim ? "3 3" : undefined }} />
              <text x={leftX + 13} y={cy - 3} style={{ fill: "var(--text)", fontSize: 13, fontWeight: 700 }}>
                {m.emoji} {m.nature}
              </text>
              <text x={leftX + 13} y={cy + 14} style={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 700 }}>
                {materialLabel(count)}
              </text>
            </g>
          );
        })}

        {rightKeys.map((key, j) => {
          const av = axisMap.get(key)!;
          const cy = rightCY(j);
          const barW = ((R_W - 16) * Math.min(100, Math.max(0, av.percent))) / 100;
          return (
            <g key={key}>
              <rect x={rightX} y={cy - R_H / 2} width={R_W} height={R_H} rx={8}
                style={{ fill: "var(--surface)", stroke: "var(--border)", strokeWidth: 1 }} />
              <text x={rightX + 11} y={cy - 1} style={{ fill: "var(--text)", fontSize: 12, fontWeight: 700 }}>
                {av.label}
              </text>
              <text x={rightX + R_W - 10} y={cy - 1} textAnchor="end"
                style={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 800 }}>
                {av.percent}
              </text>
              <rect x={rightX + 9} y={cy + 6} width={R_W - 18} height={3} rx={1.5} style={{ fill: "var(--surface-2)" }} />
              <rect x={rightX + 9} y={cy + 6} width={barW} height={3} rx={1.5} style={{ fill: "var(--text-muted)", opacity: 0.55 }} />
            </g>
          );
        })}
      </svg>

      <div className="fusion-cmap-legend">
        <span><i />밀어줌</span>
        <span><i className="grown" />길러냄</span>
        <span><i className="latent" />잠재</span>
        <span><i className="empty" />빈자리</span>
      </div>

      {highlights.length > 0 && (
        <div className="fusion-cmap-highlights">
          {highlights.map((h, i) => (
            <p key={i} className={`fusion-cmap-hl ${h.tone}`}>{h.text}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/** 연결 지도에서 가장 또렷한 결을 골라 자연어 한 줄 하이라이트로(엔진 → 새는 곳/잠긴 곳 순, 최대 3개). */
function pickHighlights(links: FusionLink[]): { tone: string; text: string }[] {
  const out: { tone: string; text: string }[] = [];
  const nat = (el: string) => EL_META[el].nature;

  const engine = links.filter((l) => l.verdict === "밀어줌").sort((a, b) => b.count * 1000 + b.percent - (a.count * 1000 + a.percent))[0];
  const grown = links.filter((l) => l.verdict === "길러냄").sort((a, b) => b.percent - a.percent)[0];
  const empty = links.filter((l) => l.verdict === "빈자리").sort((a, b) => a.percent - b.percent)[0];
  const latent = links.filter((l) => l.verdict === "잠재").sort((a, b) => b.count * 1000 - b.percent - (a.count * 1000 - a.percent))[0];

  if (engine) {
    out.push({ tone: "engine", text: `✅ 여기가 엔진 — 타고난 ‘${nat(engine.el)}’${iGa(nat(engine.el))} ${engine.axisLabel}을 그대로 밀어줘. 이 장면 오면 믿고 밀어붙여도 돼.` });
  } else if (grown) {
    out.push({ tone: "engine", text: `🌱 길러서 만든 무기 — ‘${nat(grown.el)}’ 재료는 얇은데도 ${grown.axisLabel}을 네가 키워냈어. 타고난 게 아니라 네 노력이야.` });
  }

  if (empty) {
    out.push({ tone: "leak", text: `⚠️ 여기가 새는 곳 — ${empty.axisLabel}도 얇은데 받쳐줄 ‘${nat(empty.el)}’까지 비어서, 의지로 누르지 말고 메모·알림 같은 장치로 메꿔.` });
  } else if (latent) {
    out.push({ tone: "latent", text: `💡 아직 잠긴 곳 — ‘${nat(latent.el)}’ 재료는 두둑한데 ${latent.axisLabel}을 덜 꺼내 써. 의식해서 풀면 바로 무기 돼.` });
  }

  // 엔진과 새는 곳이 둘 다 나왔고, 길러낸 무기가 따로 있으면 세 번째 줄로 덤.
  if (out.length === 2 && grown && engine) {
    out.push({ tone: "latent", text: `🌱 덤 — ‘${nat(grown.el)}’ 재료 없이도 ${grown.axisLabel}을 키워낸 건, 타고남보다 습관이 센 증거야.` });
  }

  return out.slice(0, 3);
}
