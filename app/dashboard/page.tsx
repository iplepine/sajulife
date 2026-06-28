"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import GenerateLoading from "@/components/GenerateLoading";
import { trackEvent } from "@/lib/analytics";
import type { ActionItem, ConsultSummary, ReportKind, SavedConsult, SajuProfile } from "@/lib/store/types";

const HOME_QUESTIONS = [
  "요즘 일이 막히는 이유를 사주와 기질 기준으로 알려줘.",
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
  "지금 고민을 기준 정보에 비춰보는 중이야...",
  "네가 반복하는 패턴이랑 선택 지점 정리하는 중이야...",
  "오늘 바로 옮길 수 있는 행동까지 고르는 중이야...",
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
  const displayName = data.profile?.name?.trim() || "";
  const consultLock = !data.meta.hasProfile
    ? { desc: "상담하려면 사주 정보부터 넣어야 해.", href: "/onboarding?next=/dashboard", cta: "사주 정보 입력" }
    : !hasPersonal
      ? { desc: "사주부터 보면 상담에 한 발 가까워져.", href: "/saju", cta: "사주 보기" }
      : !hasTci
        ? { desc: "기질 검사까지 끝내면 사주랑 같이 놓고 상담할 수 있어.", href: "/tci", cta: "기질 검사 시작" }
        : { desc: "사주랑 기질 합친 융합까지 보면 상담 열려.", href: "/fusion", cta: "융합 보기" };
  const topBanner = !hasPersonal && !hasTci
    ? {
        label: "첫 시작",
        title: "사주든 기질이든, 일단 하나부터 열어보자",
        desc: "하나 먼저 보고 나머지까지 끝내면 둘을 같이 놓고 볼 수 있어.",
        href: "#unlock-flow",
        cta: "고르기",
      }
    : !hasCorePair
      ? {
          label: "다음 차례",
          title: hasPersonal ? "기질오빠까지 보면 둘을 같이 놓고 볼 수 있어" : "사주언니까지 보면 둘을 같이 놓고 볼 수 있어",
          desc: "흐름이랑 성향 둘 다 준비되면 겹쳐서 볼 수 있어.",
          href: hasPersonal ? (data.meta.hasProfile ? "/tci" : "/onboarding?next=/tci") : "/onboarding?next=/saju",
          cta: hasPersonal ? "기질 보기" : "사주 보기",
        }
      : !hasFusion
        ? {
            label: "두 기준 준비",
            title: "이제 사주랑 기질 같이 놓고 볼 차례야",
            desc: "두 기준 합쳐서 네 선택 기준이랑 반복 패턴 한 번에 정리해줄게.",
            href: "/fusion",
            cta: "융합 보기",
          }
        : {
            label: "상담 준비",
            title: "기준 다 준비됐어. 이제 고민 물어봐",
            desc: latest ? `${latest.basisLabel} · ${relativeTime(latest.generatedAt)}` : "사주·기질·융합 기준으로 오늘 질문에 답해줄게.",
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
      desc: "네가 맨날 반복하는 그 패턴, 오빠가 딱 짚어줄게.",
      status: hasTci ? "완료" : "시작 가능",
      href: hasTci ? "/tci/report" : data.meta.hasProfile ? "/tci" : "/onboarding?next=/tci",
      cta: hasTci ? "보기" : "검사",
      done: hasTci,
    },
    {
      key: "fusion",
      icon: "fusion",
      title: "사주 + 기질 융합",
      desc: "흐름이랑 성향 둘 다 깔아놓고, 뭘 골라야 할지 정리해줄게.",
      status: hasFusion ? "완료" : hasCorePair ? "준비됨" : "대기",
      href: "/fusion",
      cta: hasFusion ? "보기" : hasCorePair ? "보기" : "먼저 두 가지",
      done: hasFusion,
      locked: !hasCorePair,
    },
    {
      key: "consult",
      icon: "consult",
      title: "상담",
      desc: "다 끝낸 기준으로 네 고민이랑 오늘 할 일까지 정리해줄게.",
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
          <strong>흐름은 언니가 잡고, 패턴은 오빠가 정리해줄게.</strong>
          <small>사주로 지금 큰 흐름 보고, 기질로 네가 반복하는 선택 습관 읽어서 오늘 할 말이랑 행동까지 좁혀줄게.</small>
          <span>{topBanner.label} · {topBanner.title}</span>
        </span>
        <b>{topBanner.cta} →</b>
      </Link>

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-date">{todayLabel()}</p>
          <h1>{displayName ? `${displayName}, ` : ""}오늘은 어디부터 정리해줄까?</h1>
          <p>준비된 사주랑 기질 기준으로 지금 고민 보고, 남은 행동은 기록에 쌓아둘게.</p>
        </div>
      </section>

      <section className="home-unlock" id="unlock-flow" aria-label="풀이 진행">
        <div className="home-unlock-head">
          <h2>나의 풀이</h2>
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
            <p className="home-tool-label">상담</p>
            <h2>{canAsk ? "지금 고민, 한 줄로 던져봐" : "사주랑 기질 다 보면 여기서 바로 물어볼 수 있어"}</h2>
          </div>
          <span>{canAsk ? "상담 준비됨" : "풀이 먼저"}</span>
        </div>

        {canAsk ? (
          <>
            <textarea
              className="home-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="일, 관계, 돈, 가족, 건강처럼 지금 머릿속 차지하는 고민 적어봐."
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
              <button className="btn btn-primary" onClick={ask} disabled={loading}>
                {loading ? "보는 중..." : "물어보기"}
              </button>
            </div>
            {error && <p className="error mt3">{error}</p>}
          </>
        ) : (
          <div className="home-ask-locked">
            <p>{consultLock.desc}</p>
            <Link href={consultLock.href} className="btn btn-primary">{consultLock.cta} →</Link>
          </div>
        )}
      </section>

      {loading && (
        <GenerateLoading
          messages={ASK_MESSAGES}
          note="답변 만들고 있어. 다 되면 상담 기록으로 넘어갈게."
          className="mt3"
        />
      )}

      {activeActions.length > 0 && (
        <section className="home-section">
          <div className="home-section-head">
            <h2>오늘의 액션</h2>
            <Link href="/history">전체</Link>
          </div>
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
        </section>
      )}

      <section className="home-section">
        <div className="home-section-head">
          <h2>내 기준 정보</h2>
          <Link href="/materials">관리</Link>
        </div>
        <div className="home-basis-strip">
          <BasisPill label="사주" ready={!!data.profile} />
          <BasisPill label="풀이" ready={hasBasis} />
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
