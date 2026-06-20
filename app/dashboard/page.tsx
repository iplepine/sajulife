"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SajuProfile } from "@/lib/store/types";

type Chart = { dayMaster: { ko: string; wuxing: string } } | null;

const WUXING_CLASS: Record<string, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };

export default function DashboardPage() {
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [chart, setChart] = useState<Chart>(null);
  const [tciDone, setTciDone] = useState(false);
  const [sajuDone, setSajuDone] = useState(false);
  const [fusionDone, setFusionDone] = useState(false);
  const [familyDone, setFamilyDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const j = (url: string) => fetch(url).then((r) => r.json()).catch(() => ({}));
    Promise.all([
      j("/api/profile"),
      j("/api/saju/chart"),
      j("/api/tci/answers"),
      j("/api/saju/personal"),
      j("/api/fusion/report"),
      j("/api/family/report"),
    ]).then(([p, c, t, s, fu, fa]) => {
      setProfile(p.profile ?? null);
      setChart(c.saju ? { dayMaster: c.saju.dayMaster } : null);
      setTciDone(!!t.tci);
      setSajuDone(!!s.saved);
      setFusionDone(!!fu.saved);
      setFamilyDone(!!fa.saved);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="page muted">불러오는 중...</div>;

  if (!profile) {
    return (
      <div className="page-narrow">
        <h1 className="h-app">먼저 사주 정보를 입력하세요</h1>
        <p className="lead mt2">AI 리포트의 기본 정보가 됩니다.</p>
        <Link href="/onboarding" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>
          사주 정보 입력으로
        </Link>
      </div>
    );
  }

  const dm = chart?.dayMaster;

  return (
    <div className="page">
      <div className="row between">
        <div>
          <div className="muted" style={{ fontSize: 13 }}>안녕하세요,</div>
          <h2 className="h-app">{profile.name || "게스트"}님</h2>
        </div>
        {dm && (
          <span className="chip">
            <span className={`el-dot ${WUXING_CLASS[dm.wuxing] ?? "wood"}`} />
            일간 {dm.ko}
          </span>
        )}
      </div>

      <p className="h-sec mt5">나의 리포트</p>
      <div className="card-grid">
        <ReportCard
          el="water" title="기질 검사 (TCI)" done={tciDone}
          desc="35문항으로 보는 나의 7가지 성격 차원"
          href={tciDone ? "/tci/report" : "/tci"}
          cta={tciDone ? "리포트 보기" : "검사 시작"}
        />
        <ReportCard
          el="wood" title="개인 사주 풀이" done={sajuDone}
          desc="생애 사주와 오행으로 보는 타고난 기운"
          href="/saju" cta={sajuDone ? "리포트 보기" : "리포트 생성"}
        />
        <ReportCard
          el="earth" title="사주 + 기질 융합" done={fusionDone} accent
          desc={tciDone ? "두 결과를 엮은 가장 깊은 해석." : "기질 검사를 먼저 완료하세요."}
          href={tciDone ? "/fusion" : "/tci"} cta={fusionDone ? "리포트 보기" : "융합 리포트 생성"}
        />
        <ReportCard
          el="fire" title="가족 사주" done={familyDone}
          desc="가족을 더하고 관계의 결을 풀이해요"
          href="/family" cta={familyDone ? "리포트 보기" : "가족 추가하기"}
        />
      </div>

      <Link href="/consult" className="card card-flat mt4" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
        <div className="row gap3"><span className="el-dot water" /><b style={{ fontSize: 14 }}>AI 상담</b></div>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
          지금의 고민을 사주·기질에 비추어 함께 이야기해요.
        </p>
      </Link>

      <Link href="/coaching" className="card card-flat mt3" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
        <div className="row gap3"><span className="el-dot wood" /><b style={{ fontSize: 14 }}>코칭 액션 플랜</b></div>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
          리포트에서 받은 코칭을 액션 아이템으로 모아 하나씩 실천해요.
        </p>
      </Link>
    </div>
  );
}

function ReportCard({
  el, title, desc, done, href, cta, accent,
}: {
  el: string; title: string; desc: string; done: boolean; href: string; cta: string; accent?: boolean;
}) {
  return (
    <div className="card" style={accent && !done ? { boxShadow: "inset 0 0 0 1.5px var(--el-earth), var(--shadow)" } : undefined}>
      <div className="row between">
        <div className="row gap3"><span className={`el-dot ${el}`} /><b style={{ fontSize: 15 }}>{title}</b></div>
        <span className={`badge ${done ? "done" : "todo"}`}>{done ? "완료" : "미완료"}</span>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: "8px 0 12px" }}>{desc}</p>
      <Link href={href} className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>{cta}</Link>
    </div>
  );
}
