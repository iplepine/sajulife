"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type ConsultMeta = { sources: ReportKind[]; hasProfile: boolean };
type ConsultResponse = { record: SavedConsult };
type HomeData = {
  profile: SajuProfile | null;
  meta: ConsultMeta;
  history: ConsultSummary[];
  actions: ActionItem[];
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
    if (data.meta.sources.length === 0) {
      setError("상담에 쓸 기준 리포트를 먼저 하나 만들어주세요.");
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
  const hasBasis = data.meta.sources.length > 0;
  const canAsk = data.meta.hasProfile && hasBasis;
  const displayName = data.profile?.name?.trim() || "오늘";

  return (
    <div className="page home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-date">{todayLabel()}</p>
          <h1>{displayName}님, 오늘은 어디를 정리할까요?</h1>
          <p>준비된 사주와 기질 기준으로 지금 고민을 보고, 남은 행동은 기록에 쌓아둘게요.</p>
        </div>
        <img className="home-hero-duo" src="/brand-icons/persona-duo.png" alt="" draggable={false} />
      </section>

      <section className="home-overview" aria-label="오늘 요약">
        <HomeOverviewCard
          label="기준 정보"
          title={hasBasis ? sourceLabel(data.meta.sources) : "리포트 준비 필요"}
          desc={hasBasis ? "답변에 바로 쓸 수 있어요" : "내 자료에서 하나만 만들어도 상담이 열려요"}
          href="/materials"
        />
        <HomeOverviewCard
          label="이어가기"
          title={latest ? latest.question : "첫 상담 시작"}
          desc={latest ? relativeTime(latest.generatedAt) : "아직 상담 기록이 없어요"}
          href={latest ? `/consult?id=${latest.id}` : "/dashboard"}
        />
        <HomeOverviewCard
          label="오늘 액션"
          title={activeActions.length > 0 ? `${activeActions.length}개 남음` : "비어 있음"}
          desc={activeActions[0]?.title ?? "상담이나 리포트에서 행동을 저장해보세요"}
          href="/history"
        />
      </section>

      <section className="home-ask">
        <div className="home-ask-head">
          <div>
            <p className="home-tool-label">새 질문</p>
            <h2>지금 고민을 한 줄로 시작해보세요</h2>
          </div>
          <span>{sourceLabel(data.meta.sources)}</span>
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
        {data.meta.hasProfile && !hasBasis && (
          <div className="home-inline-note">
            <span>상담에 쓸 기준 리포트가 아직 없어요.</span>
            <Link href="/materials">내 자료 보기</Link>
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
          <BasisPill label="상담 근거" ready={data.meta.sources.length >= 2} soft />
        </div>
      </section>
    </div>
  );
}

function HomeOverviewCard({
  label,
  title,
  desc,
  href,
}: {
  label: string;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href} className="home-overview-card">
      <span>{label}</span>
      <strong>{title}</strong>
      <em>{desc}</em>
    </Link>
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
