"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
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
      <section className="brand-hero">
        <div className="brand-hero-copy">
          <p className="brand-kicker">사주언니 × 기질오빠</p>
          <div className="hero-talk">
            <p className="hero-talk-line unni">
              <b>사주언니</b>
              야… 너 이거 그냥 넘기면 안 돼. 이리 와봐, 오늘 네 팔자 제대로 풀어줄게.
            </p>
            <p className="hero-talk-line oppa">
              <b>기질오빠</b>
              괜찮아. 사주가 좀 매워도, 풀어갈 방법은 같이 찾으면 돼.
            </p>
          </div>
          <p className="brand-hero-lead">
            사주는 매콤하게 짚고, 성향은 차분하게 풀어서 지금 필요한 행동 팁까지 정리해줄게.
          </p>
          {dm && (
            <span className="chip brand-hero-chip">
              <span className={`el-dot ${WUXING_CLASS[dm.wuxing] ?? "wood"}`} />
              일간 {dm.ko}
            </span>
          )}
        </div>
        <div className="brand-hero-people" aria-hidden="true">
          <img className="brand-persona-duo" src="/brand-icons/persona-duo.png" alt="" draggable={false} />
        </div>
      </section>

      <p className="h-sec mt5">사주와 성향으로 찾는 나만의 인생 가이드</p>
      <div className="card-grid">
        <ReportCard
          icon="saju-unni" title="사주언니의 팔자토크" done={sajuDone}
          desc="타고난 오행과 운의 흐름을 바탕으로, 올해 네가 마주할 흐름과 조심할 포인트를 매콤하게 짚어줄게."
          href="/saju" cta={sajuDone ? "리포트 보기" : "리포트 생성"}
        />
        <ReportCard
          icon="gijil-oppa" title="기질오빠의 성향토크" done={tciDone}
          desc="평소의 생각과 행동 패턴을 바탕으로, 네 진짜 성향과 강점, 현실적인 대안을 차분하게 정리해줄게."
          href={tciDone ? "/tci/report" : "/tci"}
          cta={tciDone ? "리포트 보기" : "검사 시작"}
        />
        <ReportCard
          icon="fusion" title="[종합] 운명 × 성향 크로스토크" done={fusionDone} accent
          desc={tciDone ? "사주로 흐름을 보고, 성향으로 해법을 찾아 지금 너에게 가장 맞는 행동 방향을 제안해." : "먼저 기질오빠 성향토크부터 끝내고 와."}
          href={tciDone ? "/fusion" : "/tci"} cta={fusionDone ? "리포트 보기" : "융합 리포트 생성"}
        />
        <ReportCard
          icon="family" title="우리 가족 관계 조율토크" done={familyDone}
          desc="가족마다 다른 기운과 성향을 함께 살펴보고, 오해를 줄이는 대화 방식과 관계 조율 팁을 제안해."
          href="/family" cta={familyDone ? "리포트 보기" : "가족 추가하기"}
        />
      </div>

      <Link href="/consult" className="card card-flat mt4" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
        <div className="row gap3"><BrandIcon name="consult" /><b style={{ fontSize: 14 }}>풀리지 않는 답답한 구석이 있어? 1:1로 물어봐</b></div>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
          직설적인 진단이 필요할 때도, 이성적인 해결책이 필요할 때도 언제든 대화를 시작해.
        </p>
      </Link>

      <Link href="/coaching" className="card card-flat mt3" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
        <div className="row gap3"><BrandIcon name="coaching" /><b style={{ fontSize: 14 }}>오늘부터 바로 해보는 나만의 액션 플랜</b></div>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
          분석만 보고 끝나면 아쉽잖아. 오늘 네 일상을 조금 바꿔줄 실천 아이템들을 모아뒀어.
        </p>
      </Link>
    </div>
  );
}

function ReportCard({
  icon, title, desc, done, href, cta, accent,
}: {
  icon: BrandIconName; title: string; desc: string; done: boolean; href: string; cta: string; accent?: boolean;
}) {
  return (
    <div className="card report-card" style={accent && !done ? { boxShadow: "inset 0 0 0 1.5px var(--el-earth), var(--shadow)" } : undefined}>
      <div className="row between">
        <div className="row gap3"><BrandIcon name={icon} className="report-card-icon" /><b style={{ fontSize: 15 }}>{title}</b></div>
        <span className={`badge ${done ? "done" : "todo"}`}>{done ? "완료" : "미완료"}</span>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: "8px 0 12px" }}>{desc}</p>
      <Link href={href} className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>{cta}</Link>
    </div>
  );
}
