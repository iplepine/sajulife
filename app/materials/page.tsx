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
};

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
      });
    });
  }, []);

  if (!state) return <div className="page muted">불러오는 중...</div>;

  return (
    <div className="page">
      <div className="materials-head">
        <div>
          <p className="h-sec">내 자료</p>
          <h1 className="h-app">분석 기준 관리</h1>
          <p className="lead mt2">사주, 기질, 가족 정보를 필요할 때 꺼내보는 곳이에요.</p>
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
          status={state.profile ? (state.sajuReportDone ? "준비됨" : "생성 가능") : "입력 필요"}
          tone={state.sajuReportDone ? "ready" : state.profile ? "next" : "idle"}
          href={state.profile ? "/saju" : "/onboarding?next=/saju"}
          cta={state.profile ? (state.sajuReportDone ? "보기" : "만들기") : "입력"}
        />
        <MaterialCard
          icon="gijil-oppa"
          title="기질오빠와 성향토크"
          desc="평소 패턴으로 보는 성향과 강점"
          status={state.tciAnswersDone ? (state.tciReportDone ? "준비됨" : "리포트 가능") : "검사 필요"}
          tone={state.tciReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
          href={state.tciAnswersDone ? "/tci/report" : "/tci"}
          cta={state.tciAnswersDone ? (state.tciReportDone ? "보기" : "리포트") : "검사"}
        />
        <MaterialCard
          icon="fusion"
          title="사주 + 기질"
          desc="흐름과 성향을 같이 놓고 보는 선택 전략"
          status={!state.tciAnswersDone ? "기질검사 후 가능" : state.fusionReportDone ? "준비됨" : "생성 가능"}
          tone={state.fusionReportDone ? "ready" : state.tciAnswersDone ? "next" : "idle"}
          href={state.tciAnswersDone ? "/fusion" : "/tci"}
          cta={state.tciAnswersDone ? (state.fusionReportDone ? "보기" : "만들기") : "먼저 검사"}
        />
        <MaterialCard
          icon="family"
          title="가족 사주"
          desc="관계의 결, 대화 포인트, 조율 방식"
          status={state.familyReportDone ? "준비됨" : "선택 기능"}
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
