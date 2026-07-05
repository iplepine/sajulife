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
  headline,
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
  /** AI가 뽑은 최상단 한마디. 없으면 히어로가 사주·점수로 조합한 문장으로 폴백. */
  headline?: string;
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
          <FusionHero saju={saju} scores={scores} headline={headline} />
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

      {saju && (
        <>
          <p className="h-sec mt5">다섯 기운이 도는 길</p>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
            네 안의 다섯 기운은 서로를 북돋우며 돌아 — 하나가 다음을 키우거든.
            두둑한 자리에서 힘이 나오고, <b>빈자리에선 고리가 한 번 끊겨</b>. 어디가 세고 어디가 끊기는지 봐.
            칸마다 타고난 <b>사주 갯수</b>랑, 그 기운에 묶인 <b>기질 세기(%)</b>도 막대로 같이 봐.
          </p>
          <ElementCycle saju={saju} scores={scores} flexibility={flexibility} />
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

function FusionHero({ saju, scores, headline }: { saju: SajuResult; scores: TciScore[]; headline?: string }) {
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
        {headline?.trim() ? (
          <p className="hero-line">{headline.trim()}</p>
        ) : (
          <p className="hero-line">
            {monthSeason.phrase}에 뿌리내린{" "}
            <span className="hero-stem">{stem.emoji} {stem.short}</span>
            {top ? ` 위로 ${top.label}이 선명하게 올라온 ` : " 위에 기질의 결이 겹친 "}
            <span className="hero-zodiac">{saju.shengXiao.ko}띠</span>
          </p>
        )}
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
              <text x={leftX + L_W - 12} y={cy - 3} textAnchor="end" style={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 800 }}>
                {count}개
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
              {/* 지도엔 원숫자(퍼센트)와 세기 막대를 함께 보여준다 — 숫자를 빼는 건 본문 글에서만(목적이 다름). */}
              <text x={rightX + R_W - 10} y={cy - 1} textAnchor="end"
                style={{ fill: "var(--text)", fontSize: 11, fontWeight: 800 }}>
                {av.percent}%
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

// ── 오행 상생 순환도(다섯 기운이 도는 길) ─────────────────────────────
// 손그림 형태 그대로: 다섯 기운을 오각형으로 두고, 하나가 다음을 북돋우는 흐름을 곡선 화살표로 잇는다.
// 화살표 색·굵기 = 넘겨주는 기운(giver)의 실제 재료량. 재료가 빈 자리는 점선으로 흐릿 = 고리가 끊긴 곳.
// 한자·생극 용어 없이 emoji + 자연어 메타포만 쓴다(융합 리포트 규칙). EL_ORDER 순서가 곧 상생 순서(하나→다음).
const CYC_C = 195; // 중심
const CYC_R = 123; // 노드 중심 링 반지름
const CYC_NW = 132;
const CYC_NH = 62; // 카드 크기 — 오행 갯수 + 묶인 기질 축 퍼센티지 막대까지 담는다
const CYC_HW = CYC_NW / 2;
const CYC_HH = CYC_NH / 2;
const cyc = (n: number) => Math.round(n * 100) / 100;

/** i번째 기운 카드 중심 — 맨 위=첫 기운, 시계방향으로 돈다. */
function cycNode(i: number): { x: number; y: number } {
  const a = ((-90 + 72 * i) * Math.PI) / 180;
  return { x: CYC_C + CYC_R * Math.cos(a), y: CYC_C + CYC_R * Math.sin(a) };
}

/** 카드 중심에서 (ux,uy) 방향으로 사각형 경계 + pad까지 나간 점(화살표 시작/끝을 카드 가장자리에 맞춤). */
function cardEdge(cx: number, cy: number, ux: number, uy: number, pad: number): { x: number; y: number } {
  const tx = Math.abs(ux) < 1e-6 ? Infinity : CYC_HW / Math.abs(ux);
  const ty = Math.abs(uy) < 1e-6 ? Infinity : CYC_HH / Math.abs(uy);
  const t = Math.min(tx, ty) + pad;
  return { x: cx + ux * t, y: cy + uy * t };
}

/**
 * 다섯 기운이 서로 북돋우며 도는 고리. 타고난 재료(오행 개수)가 두둑한 자리에서 흐름이 세고,
 * 빈 자리에선 고리가 한 번 끊긴다 — 어디가 엔진이고 어디가 끊기는지를 한눈에 보여준다.
 */
function ElementCycle({
  saju,
  scores,
  flexibility,
}: {
  saju: SajuResult;
  scores: TciScore[];
  flexibility?: number;
}) {
  const highlights = cycleHighlights(saju);
  // 오행 갯수(사주)와 함께, 각 기운에 묶인 기질 축 퍼센티지를 카드 안 막대로 시각화한다.
  const axisPct = new Map<string, number>();
  for (const s of scores) axisPct.set(s.dimension, s.percent);
  if (typeof flexibility === "number") axisPct.set("FLEX", flexibility);
  return (
    <div className="fusion-cmap">
      <svg
        viewBox="0 0 390 390"
        role="img"
        aria-label="다섯 기운이 서로 북돋우며 도는 순환도"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {EL_ORDER.map((el) => (
            <marker
              key={el}
              id={`ec-arrow-${EL_CLASS[el]}`}
              viewBox="0 0 10 10"
              refX="7.5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M1 1 L8.5 5 L1 9 Z" style={{ fill: `var(--el-${EL_CLASS[el]})` }} />
            </marker>
          ))}
        </defs>

        {/* 상생 화살표 — 넘겨주는 기운 색으로, 재료량만큼 진하게. 먼저 깔아 카드가 위로 오게 한다. */}
        {EL_ORDER.map((el, i) => {
          const count = saju.wuxingCount[el] ?? 0;
          const cls = EL_CLASS[el];
          const a = cycNode(i);
          const b = cycNode((i + 1) % EL_ORDER.length);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const L = Math.hypot(dx, dy) || 1;
          const ux = dx / L;
          const uy = dy / L;
          const s = cardEdge(a.x, a.y, ux, uy, 4);
          const e = cardEdge(b.x, b.y, -ux, -uy, 7);
          const mx = (s.x + e.x) / 2;
          const my = (s.y + e.y) / 2;
          const ox = mx - CYC_C;
          const oy = my - CYC_C;
          const oL = Math.hypot(ox, oy) || 1;
          const bow = 14; // 바깥으로 볼록하게 — '돌아가는' 느낌
          const qx = mx + (ox / oL) * bow;
          const qy = my + (oy / oL) * bow;
          const d = `M ${cyc(s.x)} ${cyc(s.y)} Q ${cyc(qx)} ${cyc(qy)} ${cyc(e.x)} ${cyc(e.y)}`;
          const empty = count === 0;
          const strong = count >= 2;
          return (
            <path
              key={`ec-arr-${el}`}
              d={d}
              fill="none"
              markerEnd={empty ? undefined : `url(#ec-arrow-${cls})`}
              style={{
                stroke: `var(--el-${cls})`,
                strokeWidth: empty ? 1.4 : strong ? 2.6 : 1.9,
                strokeDasharray: empty ? "2 5" : undefined,
                opacity: empty ? 0.4 : strong ? 0.95 : 0.72,
                strokeLinecap: "round",
              }}
            />
          );
        })}

        {/* 가운데 — '도는 흐름'이라는 뜻만 흐릿하게 */}
        <circle
          cx={CYC_C}
          cy={CYC_C}
          r={42}
          fill="none"
          style={{ stroke: "var(--border-strong)", strokeWidth: 1, strokeDasharray: "3 5", opacity: 0.5 }}
        />
        <text x={CYC_C} y={CYC_C - 4} textAnchor="middle" style={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 800 }}>
          다섯 기운이
        </text>
        <text x={CYC_C} y={CYC_C + 13} textAnchor="middle" style={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 800 }}>
          서로 북돋우며 돌아
        </text>

        {/* 다섯 기운 카드 — 타고난 오행 갯수(사주) + 묶인 기질 축 퍼센티지 막대 */}
        {EL_ORDER.map((el, i) => {
          const n = cycNode(i);
          const count = saju.wuxingCount[el] ?? 0;
          const cls = EL_CLASS[el];
          const m = EL_META[el];
          const axisKeys = WUXING_AXIS[el] ?? [];
          const empty = count === 0;
          const strong = count >= 2;
          const cardL = n.x - CYC_HW;
          const cardT = n.y - CYC_HH;
          const pad = 10;
          const labelW = 30; // 축 이름 자리
          const pctW = 30; // 오른쪽 퍼센트 자리
          const barX = cardL + pad + labelW;
          const barW = CYC_NW - pad * 2 - labelW - pctW;
          const rowH = 15;
          const axesH = axisKeys.length * rowH;
          const rowsStart = cardT + 26 + (CYC_NH - 26 - axesH) / 2; // 제목 아래 축 영역 세로 가운데
          return (
            <g key={`ec-node-${el}`} style={{ opacity: empty ? 0.55 : 1 }}>
              <rect
                x={cyc(cardL)}
                y={cyc(cardT)}
                width={CYC_NW}
                height={CYC_NH}
                rx={12}
                style={{
                  fill: `var(--el-${cls}-bg)`,
                  stroke: `var(--el-${cls})`,
                  strokeWidth: strong ? 2.4 : 1.3,
                  strokeDasharray: empty ? "3 3" : undefined,
                }}
              />
              {/* 제목 — 기운 이름(왼쪽) + 타고난 오행 갯수(오른쪽) */}
              <text x={cyc(cardL + pad)} y={cyc(cardT + 17)} style={{ fill: "var(--text)", fontSize: 12.5, fontWeight: 700 }}>
                {m.emoji} {m.nature}
              </text>
              <text x={cyc(cardL + CYC_NW - pad)} y={cyc(cardT + 17)} textAnchor="end" style={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 800 }}>
                {count}개
              </text>
              {/* 묶인 기질 축 — 이름 + 세기 막대 + 퍼센트 */}
              {axisKeys.map((k, r) => {
                const pct = axisPct.get(k);
                const rowY = rowsStart + r * rowH;
                return (
                  <g key={`ec-ax-${el}-${k}`}>
                    <text x={cyc(cardL + pad)} y={cyc(rowY + 3)} style={{ fill: "var(--text-muted)", fontSize: 9.5, fontWeight: 700 }}>
                      {AXIS_LABEL[k] ?? k}
                    </text>
                    {typeof pct === "number" && (
                      <>
                        <rect x={cyc(barX)} y={cyc(rowY - 3)} width={barW} height={4} rx={2} style={{ fill: "var(--surface-2)" }} />
                        <rect x={cyc(barX)} y={cyc(rowY - 3)} width={cyc((barW * Math.min(100, Math.max(0, pct))) / 100)} height={4} rx={2} style={{ fill: "var(--text-muted)", opacity: 0.6 }} />
                        <text x={cyc(cardL + CYC_NW - pad)} y={cyc(rowY + 3)} textAnchor="end" style={{ fill: "var(--text)", fontSize: 9.5, fontWeight: 800 }}>
                          {pct}%
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="fusion-cmap-legend">
        <span>
          <i />
          서로 북돋우며 도는 방향
        </span>
        <span>
          <i className="empty" />
          빈자리 — 여기서 고리가 끊겨
        </span>
      </div>

      {highlights.length > 0 && (
        <div className="fusion-cmap-highlights">
          {highlights.map((h, i) => (
            <p key={i} className={`fusion-cmap-hl ${h.tone}`}>
              {h.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** 순환도 아래 자연어 하이라이트 — 엔진(제일 두둑한 자리) → 끊긴 고리(빈자리) 순, 최대 2줄. */
function cycleHighlights(saju: SajuResult): { tone: string; text: string }[] {
  const out: { tone: string; text: string }[] = [];
  const nat = (el: string) => EL_META[el].nature;
  const nextNat = (el: string) => {
    const i = EL_ORDER.indexOf(el as (typeof EL_ORDER)[number]);
    return EL_META[EL_ORDER[(i + 1) % EL_ORDER.length]].nature;
  };
  const counts = EL_ORDER.map((el) => ({ el, c: saju.wuxingCount[el] ?? 0 }));
  const maxC = Math.max(...counts.map((x) => x.c));
  const strongest = maxC >= 2 ? counts.find((x) => x.c === maxC) : undefined;
  const empties = counts.filter((x) => x.c === 0);

  if (strongest) {
    out.push({
      tone: "engine",
      text: `✅ 여기가 네 사이클 심장 — 타고난 ‘${nat(strongest.el)}’${iGa(nat(strongest.el))} 제일 두둑해(${strongest.c}개). 여기서 난 힘이 ‘${nextNat(strongest.el)}’로 흘러가니까, 뭔가 막힐 땐 이 자리부터 지펴.`,
    });
  }

  if (empties.length === 1) {
    const e = empties[0];
    const axes = (WUXING_AXIS[e.el] ?? []).map((k) => AXIS_LABEL[k] ?? k).join("·");
    out.push({
      tone: "leak",
      text: `⚠️ 딱 한 군데, ‘${nat(e.el)}’ 자리가 통째로 비었어 — 고리가 여기서 한 번 끊겨. ${axes} 쪽은 타고난 재료가 없단 뜻이라, 의지로 밀지 말고 습관·장치로 메꿔.`,
    });
  } else if (empties.length >= 2) {
    const list = empties.map((e) => `‘${nat(e.el)}’`).join(", ");
    out.push({
      tone: "leak",
      text: `⚠️ ${list} 자리가 비어서 고리가 여러 번 끊겨. 다 채우려 들지 말고, 요즘 제일 자주 걸리는 하나부터 장치로 받쳐.`,
    });
  } else if (empties.length === 0) {
    out.push({
      tone: "latent",
      text: `🔄 다섯 기운이 하나도 안 비고 다 돌아 — 어느 장면에서도 완전히 막히진 않아. 대신 제일 얇은 자리가 네 페이스 조절 포인트야.`,
    });
  }

  return out.slice(0, 2);
}
