"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import GenerateLoading from "@/components/GenerateLoading";
import { trackEvent } from "@/lib/analytics";
import type { ActionItem, ConsultSummary, ReportKind, SavedConsult, SajuProfile } from "@/lib/store/types";

const HOME_QUESTIONS = [
  "요즘 일이 막히는 이유를 사주와 기질 기준으로 보고 싶어요.",
  "관계에서 반복되는 패턴과 오늘 조심할 점을 알려줘.",
  "올해 선택 기준을 커리어와 돈 흐름 중심으로 정리해줘.",
  "가족과 부딪히는 이유를 내 성향 기준으로 설명해줘.",
];

const SOURCE_SHORT: Record<ReportKind, string> = {
  fusion: "융합",
  personal: "사주",
  tci: "기질",
  family: "가족",
};

const ASK_MESSAGES = [
  "지금 고민을 기준 정보에 비춰보는 중이에요...",
  "반복되는 패턴과 선택 지점을 정리하는 중이에요...",
  "오늘 바로 옮길 수 있는 행동까지 고르는 중이에요...",
];

const COMPANY_LINKS = ["이용약관", "개인정보 처리방침", "환불 정책", "고객센터"];

const COMPANY_INFO = [
  "데브호하우스 | 대표: 박정호 | 사업자등록번호: 000-00-00000",
  "통신판매업신고번호: 2026-서울중랑-0000",
  "서울특별시 중랑구 신내로 155 | 문의: hello@sajulife.kr",
];

type ConsultMeta = { sources: ReportKind[]; hasProfile: boolean };
type ConsultResponse = { record: SavedConsult };
type HomeData = {
  profile: SajuProfile | null;
  meta: ConsultMeta;
  history: ConsultSummary[];
  actions: ActionItem[];
};
type UnlockStep = {
  key: string;
  icon: BrandIconName;
  title: string;
  desc: string;
  status: string;
  href: string;
  cta: string;
  done: boolean;
  locked?: boolean;
};

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

function sourceLabel(sources: ReportKind[]): string {
  if (sources.length === 0) return "기준 정보 없음";
  return `${sources.map((k) => SOURCE_SHORT[k]).join(" + ")} 기준`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const j = (url: string) => fetch(url).then((r) => r.json()).catch(() => ({}));
    Promise.all([
      j("/api/profile"),
      j("/api/consult"),
      j("/api/coaching"),
    ]).then(([profileRes, consultRes, coachingRes]) => {
      setData({
        profile: profileRes.profile ?? null,
        meta: {
          sources: consultRes.sources ?? [],
          hasProfile: !!consultRes.hasProfile,
        },
        history: consultRes.history ?? [],
        actions: coachingRes.items ?? [],
      });
    });
  }, []);

  const activeActions = useMemo(() => {
    const order: Record<string, number> = { "오늘": 0, "이번 주": 1, "이번 달": 2, "": 3 };
    return (data?.actions ?? [])
      .filter((item) => !item.done)
      .sort((a, b) => (order[a.timeframe] ?? 9) - (order[b.timeframe] ?? 9))
      .slice(0, 3);
  }, [data?.actions]);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q) { setError("고민을 한 줄이라도 적어주세요."); return; }
    if (!data?.meta.hasProfile) { setError("먼저 사주 정보를 입력하세요."); return; }
    const hasPersonalReport = data.meta.sources.includes("personal");
    const hasTciReport = data.meta.sources.includes("tci");
    const hasFusionReport = data.meta.sources.includes("fusion");
    if (!hasPersonalReport || !hasTciReport) {
      setError("상담은 사주와 기질을 둘 다 끝낸 뒤 진행할 수 있어요.");
      return;
    }
    if (!hasFusionReport) {
      setError("융합 사주까지 보면 상담을 진행할 수 있어요.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const text = await res.text();
      let body: ConsultResponse | { error?: string } = {};
      try { body = text ? JSON.parse(text) : {}; }
      catch { body = { error: `서버 응답 파싱 실패 (HTTP ${res.status})` }; }
      if (!res.ok) {
        setError(("error" in body && body.error) || `상담 실패 (HTTP ${res.status})`);
        return;
      }
      const record = (body as ConsultResponse).record;
      trackEvent("consult_asked");
      router.push(`/consult?id=${record.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [data?.meta.hasProfile, data?.meta.sources, question, router]);

  async function toggleAction(item: ActionItem) {
    const next = !item.done;
    setData((prev) => prev
      ? { ...prev, actions: prev.actions.map((x) => (x.id === item.id ? { ...x, done: next } : x)) }
      : prev);
    try {
      const res = await fetch(`/api/coaching/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setData((prev) => prev
        ? { ...prev, actions: prev.actions.map((x) => (x.id === item.id ? item : x)) }
        : prev);
    }
  }

  if (!data) return <div className="page muted">불러오는 중...</div>;

  const latest = data.history[0];
  const sources = data.meta.sources;
  const hasPersonal = sources.includes("personal");
  const hasTci = sources.includes("tci");
  const hasFusion = sources.includes("fusion");
  const hasCorePair = hasPersonal && hasTci;
  const hasBasis = sources.length > 0;
  const canAsk = data.meta.hasProfile && hasCorePair && hasFusion;
  const unlockProgress = [hasPersonal, hasTci, hasFusion, canAsk].filter(Boolean).length;
  const displayName = data.profile?.name?.trim() || "오늘";
  const topBanner = !hasPersonal && !hasTci
    ? {
        label: "첫 시작",
        title: "사주나 기질, 둘 중 하나부터 열어보세요",
        desc: "하나를 먼저 보고, 나머지 하나까지 끝내면 둘을 같이 볼 수 있어요.",
        href: "#unlock-flow",
        cta: "고르기",
      }
    : !hasCorePair
      ? {
          label: "다음 차례",
          title: hasPersonal ? "기질오빠까지 보면 둘을 같이 놓고 볼 수 있어요" : "사주언니까지 보면 둘을 같이 놓고 볼 수 있어요",
          desc: "흐름과 성향이 둘 다 준비되면 둘을 겹쳐서 볼 수 있어요.",
          href: hasPersonal ? (data.meta.hasProfile ? "/tci" : "/onboarding?next=/tci") : "/onboarding?next=/saju",
          cta: hasPersonal ? "기질 보기" : "사주 보기",
        }
      : !hasFusion
        ? {
            label: "두 기준 준비",
            title: "이제 사주와 기질을 같이 놓고 볼 차례예요",
            desc: "두 기준을 합쳐 지금 선택 기준과 반복 패턴을 한 번에 정리해요.",
            href: "/fusion",
            cta: "융합 보기",
          }
        : {
            label: "상담 준비",
            title: "모든 기준이 준비됐어요. 이제 고민을 물어보세요",
            desc: latest ? `${latest.basisLabel} · ${relativeTime(latest.generatedAt)}` : "사주, 기질, 융합 기준으로 오늘 질문에 답할게요.",
            href: "#home-ask",
            cta: latest ? "새 질문" : "상담 시작",
          };
  const unlockSteps: UnlockStep[] = [
    {
      key: "personal",
      icon: "saju-unni",
      title: "사주언니와 팔자토크",
      desc: "야야 이리와봐, 너 팔자 한번 제대로 풀어줄게~",
      status: hasPersonal ? "완료" : "시작 가능",
      href: data.meta.hasProfile ? "/saju" : "/onboarding?next=/saju",
      cta: hasPersonal ? "보기" : "시작",
      done: hasPersonal,
    },
    {
      key: "tci",
      icon: "gijil-oppa",
      title: "기질오빠와 성향토크",
      desc: "평소 패턴으로 보는 성향과 강점",
      status: hasTci ? "완료" : "시작 가능",
      href: hasTci ? "/tci/report" : data.meta.hasProfile ? "/tci" : "/onboarding?next=/tci",
      cta: hasTci ? "보기" : "검사",
      done: hasTci,
    },
    {
      key: "fusion",
      icon: "fusion",
      title: "사주 + 기질 융합",
      desc: "흐름과 성향을 같이 놓고 보는 선택 전략",
      status: hasFusion ? "완료" : hasCorePair ? "준비됨" : "대기",
      href: "/fusion",
      cta: hasFusion ? "보기" : hasCorePair ? "보기" : "먼저 두 가지",
      done: hasFusion,
      locked: !hasCorePair,
    },
    {
      key: "consult",
      icon: "consult",
      title: "AI 상담",
      desc: "완료한 기준으로 지금 고민과 오늘 행동 정리",
      status: canAsk ? "준비됨" : "대기",
      href: "#home-ask",
      cta: canAsk ? "질문하기" : "융합 먼저",
      done: canAsk,
      locked: !canAsk,
    },
  ];

  return (
    <div className="page home-page">
      <Link href={topBanner.href} className="home-top-banner" aria-label={`${topBanner.label}: ${topBanner.title}`}>
        <span className="home-top-banner-art" aria-hidden>
          <img src="/brand-icons/persona-duo.png" alt="" draggable={false} />
        </span>
        <span className="home-top-banner-copy">
          <em>사주언니 x 기질오빠</em>
          <strong>흐름은 언니가 잡고, 패턴은 오빠가 정리해요.</strong>
          <small>사주로 지금의 큰 흐름을 보고, 기질로 반복되는 선택 습관을 읽어서 오늘 할 말과 행동까지 좁혀줄게요.</small>
          <span>{topBanner.label} · {topBanner.title}</span>
        </span>
        <b>{topBanner.cta} →</b>
      </Link>

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-date">{todayLabel()}</p>
          <h1>{displayName}님, 오늘은 어디를 정리할까요?</h1>
          <p>준비된 사주와 기질 기준으로 지금 고민을 보고, 남은 행동은 기록에 쌓아둘게요.</p>
        </div>
      </section>

      <section className="home-unlock" id="unlock-flow" aria-label="리포트 진행">
        <div className="home-unlock-head">
          <h2>나의 리포트</h2>
          <div className="home-unlock-state">
            <div className="home-unlock-progress" aria-label={`진행 ${unlockProgress}/4`}>
              {[0, 1, 2, 3].map((item) => (
                <i key={item} className={item < unlockProgress ? "on" : ""} aria-hidden />
              ))}
            </div>
            <span>{unlockProgress}/4 완료</span>
          </div>
        </div>
        <div className="home-unlock-grid">
          {unlockSteps.map((step, index) => (
            <UnlockCard key={step.key} step={step} index={index + 1} />
          ))}
        </div>
      </section>

      <section className="home-ask" id="home-ask">
        <div className="home-ask-head">
          <div>
            <p className="home-tool-label">새 질문</p>
            <h2>지금 고민을 한 줄로 시작해보세요</h2>
          </div>
          <span>{canAsk ? "상담 준비됨" : "리포트 먼저"}</span>
        </div>
        <textarea
          className="home-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="일, 관계, 돈, 가족, 건강처럼 지금 머릿속을 차지하는 고민을 적어보세요."
          rows={3}
          maxLength={1000}
        />
        <div className="home-prompt-row" aria-label="추천 질문">
          {HOME_QUESTIONS.map((q) => (
            <button type="button" key={q} onClick={() => setQuestion(q)}>
              {q}
            </button>
          ))}
        </div>
        <div className="home-ask-foot">
          <span>{question.length}/1000</span>
          <button className="btn btn-primary" onClick={ask} disabled={loading || !canAsk}>
            {loading ? "보는 중..." : "지금 보기"}
          </button>
        </div>

        {!data.meta.hasProfile && (
          <div className="home-inline-note">
            <span>사주 정보가 먼저 필요해요.</span>
            <Link href="/onboarding?next=/dashboard">입력하기</Link>
          </div>
        )}
        {data.meta.hasProfile && !hasCorePair && (
          <div className="home-inline-note">
            <span>상담은 사주와 기질을 둘 다 끝낸 뒤 진행할 수 있어요.</span>
            <Link href="#unlock-flow">리포트 보기</Link>
          </div>
        )}
        {data.meta.hasProfile && hasCorePair && !hasFusion && (
          <div className="home-inline-note">
            <span>융합 사주까지 보면 상담을 진행할 수 있어요.</span>
            <Link href="/fusion">융합 보기</Link>
          </div>
        )}
        {error && <p className="error mt3">{error}</p>}
      </section>

      {loading && (
        <GenerateLoading
          messages={ASK_MESSAGES}
          note="답변을 만들고 있어요. 완료되면 상담 기록으로 이동합니다."
          className="mt3"
        />
      )}

      <section className="home-section">
        <div className="home-section-head">
          <h2>이어가기</h2>
          <Link href="/history">기록</Link>
        </div>
        {latest ? (
          <Link href={`/consult?id=${latest.id}`} className="home-link-card">
            <span className="home-card-kicker">{latest.basisLabel} · {relativeTime(latest.generatedAt)}</span>
            <strong>{latest.question}</strong>
          </Link>
        ) : (
          <div className="home-empty-card">
            <strong>아직 상담 기록이 없어요</strong>
            <span>첫 질문을 남기면 여기서 바로 이어볼 수 있어요.</span>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>오늘의 액션</h2>
          <Link href="/history">전체</Link>
        </div>
        {activeActions.length > 0 ? (
          <ul className="home-action-list">
            {activeActions.map((item) => (
              <li key={item.id}>
                <label>
                  <input type="checkbox" checked={item.done} onChange={() => void toggleAction(item)} />
                  <span>
                    <strong>{item.title}</strong>
                    <em>{[item.timeframe, item.sourceLabel].filter(Boolean).join(" · ")}</em>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div className="home-empty-card">
            <strong>오늘 꺼낼 액션이 없어요</strong>
            <span>상담 답변이나 리포트에서 행동을 저장하면 여기에 올라와요.</span>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>내 기준 정보</h2>
          <Link href="/materials">관리</Link>
        </div>
        <div className="home-basis-strip">
          <BasisPill label="사주" ready={!!data.profile} />
          <BasisPill label="리포트" ready={hasBasis} />
          <BasisPill label="상담" ready={canAsk} soft />
        </div>
      </section>

      <footer className="home-company-footer" aria-label="회사 정보">
        <div className="home-company-top">
          <strong>SAJULIFE</strong>
          <span>사주언니 x 기질오빠</span>
        </div>
        <p>본 서비스는 자기 이해와 선택 정리를 위한 참고 자료이며, 의료·법률·금융 상담을 대체하지 않습니다.</p>
        <div className="home-company-links" aria-label="정책 안내">
          {COMPANY_LINKS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <address>
          {COMPANY_INFO.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </address>
        <small>© 2026 SAJULIFE. All rights reserved.</small>
      </footer>
    </div>
  );
}

function BasisPill({ label, ready, soft }: { label: string; ready: boolean; soft?: boolean }) {
  return (
    <span className={`home-basis-pill${ready ? " ready" : ""}${soft ? " soft" : ""}`}>
      <i aria-hidden />
      {label}
    </span>
  );
}

function UnlockCard({ step, index }: { step: UnlockStep; index: number }) {
  const content = (
    <>
      <span className="home-unlock-step">{String(index).padStart(2, "0")}</span>
      <BrandIcon name={step.icon} className="home-unlock-icon" />
      <span className="home-unlock-main">
        <span className={`home-unlock-status${step.done ? " done" : ""}${step.locked ? " locked" : ""}`}>
          {step.status}
        </span>
        <strong>{step.title}</strong>
        <em>{step.desc}</em>
        <b>{step.cta}{step.locked ? "" : " →"}</b>
      </span>
    </>
  );

  if (step.locked) {
    return (
      <div className="home-unlock-card locked" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={step.href} className={`home-unlock-card${step.done ? " done" : ""}`}>
      {content}
    </Link>
  );
}
