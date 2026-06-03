"use client";

import { useEffect, useState } from "react";
import LifeCircle from "@/components/LifeCircle";
import type { Pillar, SajuResult } from "@/lib/saju/calculator";
import { seasonOfBranch, stemMeta } from "@/lib/saju/seasonClock";
import {
  fiveCategoryDistribution,
  TEN_SPIRIT_LABELS,
  tenSpiritFromStem,
  tenSpiritFromZhi,
  type FiveCategory,
} from "@/lib/saju/tenSpirits";

type ReportResponse = { report: string; debug: { prompt: string; model: string; provider: string } };
type SavedShape = { report: string; generatedAt: string; provider: string; model: string };
type ChartResponse = { saju: SajuResult | null; name?: string; currentYear?: number };

const EL_VAR: Record<string, string> = { 목: "--el-wood", 화: "--el-fire", 토: "--el-earth", 금: "--el-metal", 수: "--el-water" };
const EL_BG: Record<string, string> = { 목: "--el-wood-bg", 화: "--el-fire-bg", 토: "--el-earth-bg", 금: "--el-metal-bg", 수: "--el-water-bg" };
const EL_CLASS: Record<string, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
const EL_ORDER: Array<keyof SajuResult["wuxingCount"]> = ["목", "화", "토", "금", "수"];

const CATEGORY_ORDER: FiveCategory[] = ["인성", "비겁", "식상", "재성", "관성"];
const CATEGORY_FLOW: Record<FiveCategory, string> = {
  인성: "도움·배움",
  비겁: "동료·경쟁",
  식상: "표현·창작",
  재성: "일·돈",
  관성: "책임·권위",
};
const CATEGORY_KEYWORD: Record<FiveCategory, string> = {
  인성: "도움",
  비겁: "동료",
  식상: "표현",
  재성: "일·돈",
  관성: "책임",
};
/** 카테고리가 풍부할 때(2개 이상) 풀이 */
const CATEGORY_STRONG: Record<FiveCategory, string> = {
  인성: "부모·스승·후원자 같은 받쳐주는 사람 인연이 풍부해요. 받는 결이 강한 인생.",
  비겁: "친구·동료·라이벌과 어울리는 흐름이 풍부해요. 함께하는 결이 강한 인생.",
  식상: "아이디어를 표현하고 무언가를 만들어내는 흐름이 풍부해요. 창작·자녀·여유의 결이 강해요.",
  재성: "일을 만들고 돈을 다루는 흐름이 풍부해요. 결과를 만들어가는 결이 강한 인생.",
  관성: "책임을 짊어지고 권위·구조를 세우는 흐름이 풍부해요. 공직·중책의 결이 강한 인생.",
};
/** 카테고리가 없을 때(0개) 풀이 — 약함보다 다른 결 강조 */
const CATEGORY_WEAK: Record<FiveCategory, string> = {
  인성: "도움·배움 흐름이 약해요. 누가 받쳐주기보다 스스로 헤쳐 가는 결이에요.",
  비겁: "동료·경쟁 흐름이 약해요. 혼자만의 공간을 선호하는 결.",
  식상: "표현·창작 흐름이 약해요. 안으로 담아두고 묵묵히 가는 결.",
  재성: "일·돈 만드는 흐름이 약해요. 결과보다 과정·관계가 더 중요한 결.",
  관성: "책임·권위 흐름이 약해요. 자유롭고 얽매이지 않는 결.",
};

export default function PersonalSajuPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedGem, setCopiedGem] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chartRes, reportRes] = await Promise.all([
          fetch("/api/saju/chart").then((r) => r.json()),
          fetch("/api/saju/personal").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        if (reportRes.saved) setSaved(reportRes.saved);
        setInitializing(false);
      } catch {
        setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/saju/personal", { method: "POST" });
      const text = await res.text();
      let d: ReportResponse | { error?: string } = {};
      try { d = text ? JSON.parse(text) : {}; }
      catch { d = { error: `서버 응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 200)}` }; }
      if (!res.ok) { setError(("error" in d && d.error) || `리포트 생성 실패 (HTTP ${res.status})`); return; }
      setData(d as ReportResponse);
      setSaved(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  const view = data
    ? { report: data.report, generatedAt: null as string | null, debug: data.debug }
    : saved
    ? { report: saved.report, generatedAt: saved.generatedAt, debug: null }
    : null;

  async function copyReport() {
    if (!chart?.saju) return;
    const text = buildReportText(chart.saju, view?.report ?? null, view?.generatedAt ?? null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("클립보드 복사에 실패했어요");
    }
  }

  async function copyGemPrompt() {
    try {
      const res = await fetch("/api/saju/preview-prompt");
      const data = await res.json();
      if (!res.ok || !data.prompt) {
        setError(data.error || "프롬프트 미리보기 실패");
        return;
      }
      await navigator.clipboard.writeText(data.prompt);
      setCopiedGem(true);
      setTimeout(() => setCopiedGem(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "클립보드 복사 실패");
    }
  }

  if (initializing) return <div className="page muted">불러오는 중...</div>;

  const saju = chart?.saju ?? null;
  if (!saju) {
    return (
      <div className="page-narrow">
        <h1 className="h-app">사주 정보를 먼저 입력하세요</h1>
        <a href="/onboarding" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>사주 정보 입력으로</a>
      </div>
    );
  }

  const { pillars, dayMaster, wuxingCount } = saju;
  const total = EL_ORDER.reduce((s, k) => s + wuxingCount[k], 0) || 1;
  const birthYear = Number(saju.input.birthDate.split("-")[0]) || 0;

  return (
    <div className="page">
      <h2 className="h-app">개인 사주 풀이</h2>
      <div className="ai-tag mt2">
        <span className="dot" />
        {saju.input.birthDate} · {saju.input.birthTimeKnown ? saju.input.birthTime : "시각 모름"} · {saju.input.calendar === "lunar" ? "음력" : "양력"}
      </div>

      <IdentityHero saju={saju} />

      <p className="h-sec mt5">사주 네 기둥</p>
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

      <p className="h-sec mt5">오행 분포</p>
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

      <p className="h-sec mt5">당신의 결</p>
      <SpiritDistCard pillars={pillars} />

      <p className="h-sec mt5">생애 사주 — 인생의 원</p>
      <div className="card">
        <LifeCircle
          saju={saju}
          birthYear={birthYear}
          currentYear={chart?.currentYear ?? new Date().getFullYear()}
        />
      </div>

      {error && <p className="error mt4">{error}</p>}

      <div className="row gap2 mt4" style={{ alignItems: "center" }}>
        <button className="btn btn-ghost btn-sm" onClick={copyGemPrompt}>
          {copiedGem ? "복사됨!" : "Gem 프롬프트 복사"}
        </button>
        <span className="muted" style={{ fontSize: 12 }}>
          AI 호출 없이 현재 코드의 프롬프트를 미리 받기 — <a href="https://gemini.google.com" target="_blank" rel="noreferrer">Gemini</a>에 그대로 붙여넣어 테스트
        </span>
      </div>

      <p className="h-sec mt6">AI 풀이</p>
      {view ? (
        <>
          {view.generatedAt && (
            <p className="muted" style={{ marginBottom: 8 }}>저장된 리포트 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}
          <div className="report">{view.report}</div>
          <div className="row gap2 mt4">
            <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>{loading ? "생성 중…" : "다시 생성"}</button>
            <button className="btn btn-ghost btn-sm" onClick={copyReport}>{copied ? "복사됨!" : "텍스트 복사"}</button>
            {view.debug && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDebug((v) => !v)}>{showDebug ? "디버그 숨기기" : "디버그 보기"}</button>
            )}
          </div>
          {showDebug && view.debug && (
            <div className="card mt3">
              <div className="muted">model: {view.debug.provider} / {view.debug.model}</div>
              <h4>렌더된 프롬프트</h4>
              <pre className="debug-pre">{view.debug.prompt}</pre>
            </div>
          )}
        </>
      ) : (
        <button className="btn btn-primary btn-block" onClick={generate} disabled={loading}>
          {loading ? "생성 중…" : "AI 풀이 생성하기"}
        </button>
      )}
    </div>
  );
}

function buildReportText(saju: SajuResult, report: string | null, generatedAt: string | null): string {
  const { input, pillars, dayMaster, shengXiao, wuxingCount } = saju;
  const pillarLine = (label: string, p: Pillar | null) =>
    p
      ? `  ${label}: ${p.gan.ko}${p.zhi.ko} (${p.gan.hanja}${p.zhi.hanja}) — ${p.gan.wuxing}/${p.zhi.wuxing}`
      : `  ${label}: (시각 모름)`;

  const lines: string[] = [];
  lines.push("【사주 풀이】");
  lines.push(
    `${input.birthDate} · ${input.birthTimeKnown ? input.birthTime : "시각 모름"} · ${input.calendar === "lunar" ? "음력" : "양력"}`,
  );
  lines.push("");
  lines.push(`일간: ${dayMaster.ko}(${dayMaster.hanja})`);
  lines.push(`띠: ${shengXiao.ko}띠`);
  lines.push("");
  lines.push("[사주 네 기둥]");
  lines.push(pillarLine("연주", pillars.year));
  lines.push(pillarLine("월주", pillars.month));
  lines.push(pillarLine("일주", pillars.day));
  lines.push(pillarLine("시주", pillars.time));
  lines.push("");
  lines.push("[오행 분포]");
  EL_ORDER.forEach((k) => lines.push(`  ${k}: ${wuxingCount[k]}`));
  if (report) {
    lines.push("");
    lines.push("[AI 풀이]");
    lines.push(report);
    if (generatedAt) {
      lines.push("");
      lines.push(`(생성: ${new Date(generatedAt).toLocaleString("ko-KR")})`);
    }
  }
  return lines.join("\n");
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

function SpiritDistCard({ pillars }: { pillars: SajuResult["pillars"] }) {
  const dist = fiveCategoryDistribution(pillars);
  const strong = CATEGORY_ORDER.filter((c) => dist[c] >= 2).sort((a, b) => dist[b] - dist[a]);
  const weak = CATEGORY_ORDER.filter((c) => dist[c] === 0);
  const middle = CATEGORY_ORDER.filter((c) => dist[c] === 1);

  const summary = (() => {
    const strongKw = strong.map((c) => CATEGORY_KEYWORD[c]);
    const weakKw = weak.map((c) => CATEGORY_KEYWORD[c]);
    if (strongKw.length === 0 && weakKw.length === 0) return "5 카테고리가 골고루 섞인 균형 결이에요.";
    if (strongKw.length > 0 && weakKw.length > 0)
      return `${strongKw.join("·")}이 풍부하고, ${weakKw.join("·")}의 결은 약한 편이에요.`;
    if (strongKw.length > 0) return `${strongKw.join("·")}의 결이 풍부해요.`;
    return `${weakKw.join("·")}의 결이 약하게 자리잡았어요.`;
  })();

  return (
    <div className="card spirit-card">
      <p className="muted spirit-summary">{summary}</p>

      {strong.length > 0 && (
        <div className="spirit-group">
          <div className="sg-head sg-strong">✦ 풍부한 결</div>
          {strong.map((cat) => (
            <div key={cat} className="sg-item">
              <div className="sg-name">
                <b>{CATEGORY_FLOW[cat]}</b>
                <span className="sg-count">{dist[cat]}개</span>
              </div>
              <p className="sg-desc">{CATEGORY_STRONG[cat]}</p>
            </div>
          ))}
        </div>
      )}

      {middle.length > 0 && (
        <div className="spirit-group">
          <div className="sg-head sg-middle">· 약하게 있는 결</div>
          <p className="sg-mid-list">
            {middle.map((cat) => `${CATEGORY_FLOW[cat]}(1)`).join(" · ")}
          </p>
        </div>
      )}

      {weak.length > 0 && (
        <div className="spirit-group">
          <div className="sg-head sg-weak">○ 비어 있는 결</div>
          {weak.map((cat) => (
            <div key={cat} className="sg-item">
              <div className="sg-name">
                <b>{CATEGORY_FLOW[cat]}</b>
                <span className="sg-count sg-zero">0개</span>
              </div>
              <p className="sg-desc">{CATEGORY_WEAK[cat]}</p>
            </div>
          ))}
        </div>
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
