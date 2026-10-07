"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FamilyStore, SajuProfile } from "@/lib/store/types";
import { selectedFamilyReportMembers } from "@/lib/saju/familyReportSelection";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import { withGenerateIntent } from "@/lib/generation/intent";
import { TCI_FOR_FUSION_HREF } from "@/lib/package/journey";
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
  /** 등록된 가족 수와 이번 풀이에 고른 가족 수 — ★저장본이 없다고 곧 "가족 없음"은 아니다★. */
  familyMemberCount: number;
  familySelectedCount: number;
  /** 등록된 궁합 상대 수. */
  compatPartnerCount: number;
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
    const [profileRes, sajuRes, yongsinRes, tciReportRes, fusionRes, familyRes, compatRes, familyStoreRes, compatStoreRes] = await Promise.all([
      fetchJson<{ profile?: SajuProfile }>("/api/profile"),
      fetchJson<SavedRes>("/api/saju/personal"),
      fetchJson<SavedRes>("/api/saju/yongsin"),
      fetchJson<SavedRes & { readiness?: { hasTci?: boolean } }>("/api/tci/report"),
      fetchJson<SavedRes>("/api/fusion/report"),
      fetchJson<SavedRes>("/api/family/report"),
      fetchJson<SavedRes>("/api/compat/report"),
      fetchJson<{ family?: FamilyStore }>("/api/family"),
      fetchJson<{ compat?: { partners?: unknown[] } }>("/api/compat"),
    ]);
    const all = [profileRes, sajuRes, yongsinRes, tciReportRes, fusionRes, familyRes, compatRes, familyStoreRes, compatStoreRes];
    const failed = all.find((r) => !r.ok);
    if (failed && !failed.ok) {
      setFailure(failed);
      return;
    }
    if (!profileRes.ok || !sajuRes.ok || !yongsinRes.ok || !tciReportRes.ok
        || !fusionRes.ok || !familyRes.ok || !compatRes.ok || !familyStoreRes.ok || !compatStoreRes.ok) return;
    const familyStore = familyStoreRes.data.family ?? { members: [] };
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
      familyMemberCount: familyStore.members.length,
      familySelectedCount: selectedFamilyReportMembers(familyStore).length,
      compatPartnerCount: (compatStoreRes.data.compat?.partners ?? []).length,
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

  /**
   * 상태 칩 문구는 ★한 가지 말투로만★ — 예전엔 같은 "지금 만들 수 있음"이 카드마다 "생성 가능"·
   * "풀이 가능"으로 갈렸고, 가족·궁합은 가족·상대가 이미 있어도 "선택 기능 · 추가"로 떴다.
   */
  const READY_TO_MAKE = "만들 수 있음";
  const NEED_PROFILE = "정보 입력 필요";
  const sajuStatus = state.profile
    ? state.sajuReportDone ? formatReportStatus(state.sajuReportGeneratedAt) : READY_TO_MAKE
    : NEED_PROFILE;
  const yongsinStatus = state.profile
    ? state.yongsinReportDone ? formatReportStatus(state.yongsinReportGeneratedAt) : READY_TO_MAKE
    : NEED_PROFILE;
  const tciStatus = state.tciAnswersDone
    ? state.tciReportDone ? formatReportStatus(state.tciReportGeneratedAt) : READY_TO_MAKE
    : "설문 필요";
  const fusionStatus = !state.tciAnswersDone
    ? "기질 설문 후 가능"
    : state.fusionReportDone ? formatReportStatus(state.fusionReportGeneratedAt) : READY_TO_MAKE;
  // 가족: 저장본 → 날짜 / 고른 가족 있음 → 만들 수 있음 / 등록만 됨 → 선택 필요 / 아무도 없음 → 추가 필요
  const familyStage: "done" | "ready" | "select" | "add" = state.familyReportDone
    ? "done"
    : state.familySelectedCount > 0 ? "ready" : state.familyMemberCount > 0 ? "select" : "add";
  const familyStatus = {
    done: formatReportStatus(state.familyReportGeneratedAt),
    ready: READY_TO_MAKE,
    select: "가족 선택 필요",
    add: "가족 추가 필요",
  }[familyStage];
  const compatStage: "done" | "ready" | "add" = state.compatReportDone
    ? "done"
    : state.compatPartnerCount > 0 ? "ready" : "add";
  const compatStatus = {
    done: formatReportStatus(state.compatReportGeneratedAt),
    ready: READY_TO_MAKE,
    add: "상대 추가 필요",
  }[compatStage];

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
            href={
              state.profile
                ? (state.sajuReportDone ? "/saju" : withGenerateIntent("/saju"))
                : "/onboarding?next=/saju"
            }
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
            desc="사주에 요즘의 나를 겹친 올해 운세"
            status={fusionStatus}
            tone={state.fusionReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
            href={
              state.tciAnswersDone
                ? (state.fusionReportDone ? "/fusion" : withGenerateIntent("/fusion"))
                : TCI_FOR_FUSION_HREF
            }
            cta={state.tciAnswersDone ? (state.fusionReportDone ? "보기" : "만들기") : "먼저 설문"}
          />
          <MaterialCard
            icon="reading-family"
            title="가족 사주"
            desc="우리 관계의 결 · 대화 포인트"
            status={familyStatus}
            tone={familyStage === "done" ? "ready" : familyStage === "add" ? "idle" : "next"}
            href={familyStage === "add" ? "/family#family-form" : "/family"}
            cta={{ done: "보기", ready: "만들기", select: "고르기", add: "추가" }[familyStage]}
          />
          <MaterialCard
            icon="reading-compat"
            title="궁합"
            desc="둘이 맞물리는 지점 · 어긋나는 지점"
            status={compatStatus}
            tone={compatStage === "done" ? "ready" : compatStage === "add" ? "idle" : "next"}
            href="/compat"
            cta={{ done: "보기", ready: "만들기", add: "추가" }[compatStage]}
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
