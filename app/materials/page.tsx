"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SajuProfile } from "@/lib/store/types";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";

type MaterialsState = {
  profile: SajuProfile | null;
  tciAnswersDone: boolean;
  sajuReportDone: boolean;
  tciReportDone: boolean;
  fusionReportDone: boolean;
  familyReportDone: boolean;
  sajuReportGeneratedAt: string | null;
  tciReportGeneratedAt: string | null;
  fusionReportGeneratedAt: string | null;
  familyReportGeneratedAt: string | null;
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

export default function MaterialsPage() {
  const [state, setState] = useState<MaterialsState | null>(null);

  useEffect(() => {
    const j = (url: string) => fetch(url).then((r) => r.json()).catch(() => ({}));
    Promise.all([
      j("/api/profile"),
      j("/api/tci/answers"),
      j("/api/saju/personal"),
      j("/api/tci/report"),
      j("/api/fusion/report"),
      j("/api/family/report"),
    ]).then(([profileRes, tciRes, sajuRes, tciReportRes, fusionRes, familyRes]) => {
      setState({
        profile: profileRes.profile ?? null,
        tciAnswersDone: !!tciRes.tci,
        sajuReportDone: !!sajuRes.saved,
        tciReportDone: !!tciReportRes.saved,
        fusionReportDone: !!fusionRes.saved,
        familyReportDone: !!familyRes.saved,
        sajuReportGeneratedAt: generatedAtFrom(sajuRes),
        tciReportGeneratedAt: generatedAtFrom(tciReportRes),
        fusionReportGeneratedAt: generatedAtFrom(fusionRes),
        familyReportGeneratedAt: generatedAtFrom(familyRes),
      });
    });
  }, []);

  if (!state) return <main className="page"><PageLoading label="풀이 기록을 모으고 있어요" /></main>;

  const sajuStatus = state.profile
    ? state.sajuReportDone ? formatReportStatus(state.sajuReportGeneratedAt) : "생성 가능"
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

  return (
    <div className="page">
      <div className="materials-head">
        <div>
          <p className="h-sec">기록</p>
          <h1 className="h-app">풀이 기록</h1>
          <p className="lead mt2">선택한 사람의 풀이를 다시 보고, 아직 없는 풀이는 여기서 이어서 시작해.</p>
        </div>
        <PersonSwitcher nameOnly className="materials-person" />
      </div>

      <section className="history-section mt5">
        <div className="material-list">
          <MaterialCard
            art="/brand-icons/saju-compass-ink.png"
            title="개인 사주"
            desc="타고난 구조와 삶의 흐름"
            status={sajuStatus}
            tone={state.sajuReportDone ? "ready" : state.profile ? "next" : "idle"}
            href={state.profile ? "/saju" : "/onboarding?next=/saju"}
            cta={state.profile ? (state.sajuReportDone ? "보기" : "만들기") : "입력"}
          />
          <MaterialCard
            art="/brand-icons/temperament-ribbons-ink.png"
            title="나의 기질"
            desc="나의 반응과 성향"
            status={tciStatus}
            tone={state.tciReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
            href={state.tciAnswersDone ? "/tci/report" : "/tci"}
            cta={state.tciAnswersDone ? (state.tciReportDone ? "보기" : "풀이") : "검사"}
          />
          <MaterialCard
            art="/brand-icons/temperament-map-ink.png"
            title="사주 + 기질"
            desc="흐름과 성향을 함께 보는 기록"
            status={fusionStatus}
            tone={state.fusionReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
            href={state.tciAnswersDone ? "/fusion" : "/tci"}
            cta={state.tciAnswersDone ? (state.fusionReportDone ? "보기" : "만들기") : "먼저 검사"}
          />
          <MaterialCard
            art="/brand-icons/family-ink.png"
            title="가족 사주"
            desc="우리 관계의 결 · 대화 포인트"
            status={familyStatus}
            tone={state.familyReportDone ? "ready" : "idle"}
            href="/family"
            cta={state.familyReportDone ? "보기" : "추가"}
          />
        </div>
      </section>
    </div>
  );
}

function MaterialCard({
  art,
  title,
  desc,
  status,
  tone,
  href,
  cta,
}: {
  art: string;
  title: string;
  desc: string;
  status: string;
  tone: "ready" | "next" | "idle";
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="material-card">
      <img className="material-card-icon" src={art} alt="" draggable={false} />
      <span className={`material-status ${tone}`}>{status}</span>
      <span className="material-main">
        <strong>{title}</strong>
        <em>{desc}</em>
        <b>{cta} →</b>
      </span>
    </Link>
  );
}
