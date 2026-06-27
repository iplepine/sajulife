"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import type { SajuProfile } from "@/lib/store/types";

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

  if (!state) return <div className="page muted">불러오는 중...</div>;

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
          <p className="h-sec">풀이</p>
          <h1 className="h-app">사주부터 가족까지</h1>
          <p className="lead mt2">언니오빠가 풀어준 풀이를 한곳에 모았어요. 필요할 때 꺼내보세요.</p>
        </div>
        <Link href="/onboarding?next=/materials" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          정보 수정
        </Link>
      </div>

      <div className="material-list mt5">
        <MaterialCard
          icon="saju-unni"
          title="사주언니와 팔자토크"
          desc="생년월일시로 보는 기본 흐름과 지금 필요한 선택 기준"
          status={sajuStatus}
          tone={state.sajuReportDone ? "ready" : state.profile ? "next" : "idle"}
          href={state.profile ? "/saju" : "/onboarding?next=/saju"}
          cta={state.profile ? (state.sajuReportDone ? "보기" : "만들기") : "입력"}
        />
        <MaterialCard
          icon="gijil-oppa"
          title="기질오빠와 성향토크"
          desc="평소 패턴으로 보는 성향과 강점"
          status={tciStatus}
          tone={state.tciReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
          href={state.tciAnswersDone ? "/tci/report" : "/tci"}
          cta={state.tciAnswersDone ? (state.tciReportDone ? "보기" : "풀이") : "검사"}
        />
        <MaterialCard
          icon="fusion"
          title="사주 + 기질"
          desc="흐름과 성향을 같이 놓고 보는 선택 전략"
          status={fusionStatus}
          tone={state.fusionReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
          href={state.tciAnswersDone ? "/fusion" : "/tci"}
          cta={state.tciAnswersDone ? (state.fusionReportDone ? "보기" : "만들기") : "먼저 검사"}
        />
        <MaterialCard
          icon="family"
          title="가족 사주"
          desc="관계의 결, 대화 포인트, 조율 방식"
          status={familyStatus}
          tone={state.familyReportDone ? "ready" : "idle"}
          href="/family"
          cta={state.familyReportDone ? "보기" : "추가"}
        />
      </div>
    </div>
  );
}

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
