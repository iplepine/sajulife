"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SajuProfile } from "@/lib/store/types";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import { withGenerateIntent } from "@/lib/generation/intent";
import { failureMessage, fetchJson, loginHrefFor, type FetchFailure } from "@/lib/net/fetchState";

type MaterialsState = {
  profile: SajuProfile | null;
  tciAnswersDone: boolean;
  sajuReportDone: boolean;
  yongsinReportDone: boolean;
  tciReportDone: boolean;
  fusionReportDone: boolean;
  familyReportDone: boolean;
  compatReportDone: boolean;
  sajuReportGeneratedAt: string | null;
  yongsinReportGeneratedAt: string | null;
  tciReportGeneratedAt: string | null;
  fusionReportGeneratedAt: string | null;
  familyReportGeneratedAt: string | null;
  compatReportGeneratedAt: string | null;
};

function generatedAtFrom(res: { saved?: { generatedAt?: unknown } | null }): string | null {
  return typeof res.saved?.generatedAt === "string" ? res.saved.generatedAt : null;
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatReportStatus(iso: string | null): string {
  if (!iso) return "저장됨";

  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "저장됨";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isSameDate(date, now)) return `오늘 ${time}`;
  if (isSameDate(date, yesterday)) return `어제 ${time}`;

  const datePart = date.getFullYear() === now.getFullYear()
    ? `${date.getMonth() + 1}.${date.getDate()}`
    : `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  return `${datePart} ${time}`;
}

type SavedRes = { saved?: { generatedAt?: unknown } | null };

export default function MaterialsPage() {
  const [state, setState] = useState<MaterialsState | null>(null);
  const [failure, setFailure] = useState<FetchFailure | null>(null);

  /**
   * ★조회 실패를 "아직 안 만들었어요"로 그리지 않는다.★
   * 예전엔 `.catch(() => ({}))`로 실패를 빈 객체에 합쳐, 서버가 죽어도 전 카드가
   * "생성 가능"으로 보였다 — 있는 풀이를 다시 만들라고 시키는 화면이 된다.
   */
  const load = useCallback(async () => {
    const [profileRes, sajuRes, yongsinRes, tciReportRes, fusionRes, familyRes, compatRes] = await Promise.all([
      fetchJson<{ profile?: SajuProfile }>("/api/profile"),
      fetchJson<SavedRes>("/api/saju/personal"),
      fetchJson<SavedRes>("/api/saju/yongsin"),
      fetchJson<SavedRes & { readiness?: { hasTci?: boolean } }>("/api/tci/report"),
      fetchJson<SavedRes>("/api/fusion/report"),
      fetchJson<SavedRes>("/api/family/report"),
      fetchJson<SavedRes>("/api/compat/report"),
    ]);
    const all = [profileRes, sajuRes, yongsinRes, tciReportRes, fusionRes, familyRes, compatRes];
    const failed = all.find((r) => !r.ok);
    if (failed && !failed.ok) {
      setFailure(failed);
      return;
    }
    if (!profileRes.ok || !sajuRes.ok || !yongsinRes.ok || !tciReportRes.ok
        || !fusionRes.ok || !familyRes.ok || !compatRes.ok) return;
    setFailure(null);
    setState({
      profile: profileRes.data.profile ?? null,
      // 설문 완료는 저장본 존재가 아니라 ★전 문항 응답★ 기준(lib/tci/completion.ts).
      tciAnswersDone: !!tciReportRes.data.readiness?.hasTci,
      sajuReportDone: !!sajuRes.data.saved,
      yongsinReportDone: !!yongsinRes.data.saved,
      tciReportDone: !!tciReportRes.data.saved,
      fusionReportDone: !!fusionRes.data.saved,
      familyReportDone: !!familyRes.data.saved,
      compatReportDone: !!compatRes.data.saved,
      sajuReportGeneratedAt: generatedAtFrom(sajuRes.data),
      yongsinReportGeneratedAt: generatedAtFrom(yongsinRes.data),
      tciReportGeneratedAt: generatedAtFrom(tciReportRes.data),
      fusionReportGeneratedAt: generatedAtFrom(fusionRes.data),
      familyReportGeneratedAt: generatedAtFrom(familyRes.data),
      compatReportGeneratedAt: generatedAtFrom(compatRes.data),
    });
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (failure && !state) {
    return (
      <main className="page">
        <div className="load-failure mt5">
          <strong>풀이 기록을 불러오지 못했어요</strong>
          <span>{failureMessage(failure)}</span>
          {failure.kind === "auth" ? (
            <Link href={loginHrefFor("/materials")} className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
              다시 로그인하기
            </Link>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()}>다시 시도</button>
          )}
        </div>
      </main>
    );
  }

  if (!state) return <main className="page"><PageLoading label="풀이 기록을 모으고 있어요" /></main>;

  const sajuStatus = state.profile
    ? state.sajuReportDone ? formatReportStatus(state.sajuReportGeneratedAt) : "생성 가능"
    : "입력 필요";
  const yongsinStatus = state.profile
    ? state.yongsinReportDone ? formatReportStatus(state.yongsinReportGeneratedAt) : "생성 가능"
    : "입력 필요";
  const tciStatus = state.tciAnswersDone
    ? state.tciReportDone ? formatReportStatus(state.tciReportGeneratedAt) : "풀이 가능"
    : "검사 필요";
  const fusionStatus = !state.tciAnswersDone
    ? "기질검사 후 가능"
    : state.fusionReportDone ? formatReportStatus(state.fusionReportGeneratedAt) : "생성 가능";
  const familyStatus = state.familyReportDone
    ? formatReportStatus(state.familyReportGeneratedAt)
    : "선택 기능";
  const compatStatus = state.compatReportDone
    ? formatReportStatus(state.compatReportGeneratedAt)
    : "선택 기능";

  return (
    <div className="page">
      <div className="materials-head">
        <div className="report-person-head">
          <h1 className="h-app">풀이 기록</h1>
          <PersonSwitcher nameOnly />
        </div>
        <p className="lead mt2">선택한 사람의 풀이를 다시 보고, 아직 없는 풀이는 여기서 이어서 시작해.</p>
        {/* 여긴 ★풀이★만 모인다. 담아둔 액션과 지난 상담은 /history — 이름을 섞지 않는다. */}
        <p className="materials-history-hint">
          담아둔 액션이랑 지난 상담을 찾고 있으면{" "}
          <Link href="/history" className="link-tiny">액션·상담 기록으로 →</Link>
        </p>
      </div>

      <section className="history-section mt5">
        <div className="material-list">
          <MaterialCard
            icon="reading-saju"
            title="개인 사주"
            desc="타고난 구조와 삶의 흐름"
            status={sajuStatus}
            tone={state.sajuReportDone ? "ready" : state.profile ? "next" : "idle"}
            href={state.profile ? "/saju" : "/onboarding?next=/saju"}
            cta={state.profile ? (state.sajuReportDone ? "보기" : "만들기") : "입력"}
          />
          <MaterialCard
            icon="reading-yongsin"
            title="내 용신"
            desc="내게 필요한 기운"
            status={yongsinStatus}
            tone={state.yongsinReportDone ? "ready" : state.profile ? "next" : "idle"}
            href={state.profile ? "/saju/yongsin" : "/onboarding?next=/saju/yongsin"}
            cta={state.profile ? (state.yongsinReportDone ? "보기" : "만들기") : "입력"}
          />
          <MaterialCard
            icon="reading-tci"
            title="나의 기질"
            desc="나의 반응과 성향"
            status={tciStatus}
            tone={state.tciReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
            href={
              state.tciAnswersDone
                ? (state.tciReportDone ? "/tci/report" : withGenerateIntent("/tci/report"))
                : "/tci"
            }
            cta={state.tciAnswersDone ? (state.tciReportDone ? "보기" : "만들기") : "설문"}
          />
          <MaterialCard
            icon="reading-fusion"
            title="사주 + 기질"
            desc="흐름과 성향을 함께 보는 기록"
            status={fusionStatus}
            tone={state.fusionReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
            href={
              state.tciAnswersDone
                ? (state.fusionReportDone ? "/fusion" : withGenerateIntent("/fusion"))
                : "/tci"
            }
            cta={state.tciAnswersDone ? (state.fusionReportDone ? "보기" : "만들기") : "먼저 설문"}
          />
          <MaterialCard
            icon="reading-family"
            title="가족 사주"
            desc="우리 관계의 결 · 대화 포인트"
            status={familyStatus}
            tone={state.familyReportDone ? "ready" : "idle"}
            href="/family"
            cta={state.familyReportDone ? "보기" : "추가"}
          />
          <MaterialCard
            icon="reading-compat"
            title="궁합"
            desc="둘이 맞물리는 지점 · 어긋나는 지점"
            status={compatStatus}
            tone={state.compatReportDone ? "ready" : "idle"}
            href="/compat"
            cta={state.compatReportDone ? "보기" : "추가"}
          />
        </div>
      </section>
    </div>
  );
}

/**
 * 풀이 카드 한 장.
 *
 * ★아이콘은 공통 BrandIcon 한 체계로만★ — 예전엔 카드마다 다른 경로의 그림(먹 일러스트·드래곤
 * 렌더·리본)을 직접 물려서 여섯 장이 서로 다른 그림 문법으로 보였다. 게다가 가족과 궁합이
 * ★같은 파일★을 써서 그림만으로는 구분이 안 됐다.
 * 홈 퀵액션과 같은 이름을 쓰므로 같은 기능은 홈과 여기서 같은 아이콘이 된다.
 */
function MaterialCard({
  icon,
  title,
  desc,
  status,
  tone,
  href,
  cta,
}: {
  icon: BrandIconName;
  title: string;
  desc: string;
  status: string;
  tone: "ready" | "next" | "idle";
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="material-card">
      {/* 장식 아이콘 — BrandIcon이 aria-hidden을 붙인다. 카드 제목·링크 이름이 접근성 정보를 갖는다. */}
      <BrandIcon name={icon} className="material-card-icon" />
      <span className={`material-status ${tone}`}>{status}</span>
      <span className="material-main">
        <strong>{title}</strong>
        <em>{desc}</em>
        <b>{cta} →</b>
      </span>
    </Link>
  );
}
