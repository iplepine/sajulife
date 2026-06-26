"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import type { SajuProfile } from "@/lib/store/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [tciDone, setTciDone] = useState(false);
  const [sajuDone, setSajuDone] = useState(false);
  const [fusionDone, setFusionDone] = useState(false);
  const [familyDone, setFamilyDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const j = (url: string) => fetch(url).then((r) => r.json()).catch(() => ({}));
    Promise.all([
      j("/api/profile"),
      j("/api/tci/answers"),
      j("/api/saju/personal"),
      j("/api/fusion/report"),
      j("/api/family/report"),
    ]).then(([p, t, s, fu, fa]) => {
      setProfile(p.profile ?? null);
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

  const primaryAction = getPrimaryAction({ sajuDone, tciDone, fusionDone, familyDone });
  const reports: DashboardReportItem[] = [
    {
      icon: "saju-unni",
      title: "사주언니와 팔자토크",
      desc: "생년월일로 보는 나의 흐름과 지금 필요한 선택",
      done: sajuDone,
      href: "/saju",
      cta: sajuDone ? "보기" : "시작",
    },
    {
      icon: "gijil-oppa",
      title: "기질오빠와 성향토크",
      desc: "평소 패턴으로 보는 성향과 강점",
      done: tciDone,
      href: tciDone ? "/tci/report" : "/tci",
      cta: tciDone ? "보기" : "검사",
    },
    {
      icon: "fusion",
      title: "사주+기질",
      desc: tciDone ? "흐름과 성향을 함께 읽는 종합 풀이" : "기질오빠와 성향토크를 끝내면 열려요",
      done: fusionDone,
      href: tciDone ? "/fusion" : "/tci",
      cta: fusionDone ? "보기" : tciDone ? "생성" : "먼저 검사",
    },
    {
      icon: "family",
      title: "가족 사주",
      desc: "가족 관계의 결, 대화 포인트, 조율 방식",
      done: familyDone,
      href: "/family",
      cta: familyDone ? "보기" : "추가",
    },
  ];

  return (
    <div className="page dashboard-home">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div className="dashboard-hero-copy">
          <p className="dashboard-kicker">사주언니 × 기질오빠</p>
          <h1 id="dashboard-title" className="dashboard-title">
            지금 필요한 풀이부터<br />바로 이어가요.
          </h1>
          <p className="dashboard-lead">
            사주언니는 흐름을 보고, 기질오빠는 성향을 짚어요.
          </p>
          <Link href={primaryAction.href} className="btn btn-primary dashboard-hero-cta" style={{ textDecoration: "none" }}>
            {primaryAction.label}
          </Link>
        </div>
        <div className="dashboard-hero-visual" aria-hidden="true">
          <img src="/brand-icons/persona-duo.png" alt="" draggable={false} />
        </div>
      </section>

      <section aria-labelledby="reports-title">
        <div className="dashboard-section-head">
          <h2 id="reports-title">나의 리포트</h2>
          <span>{reports.filter((item) => item.done).length}/4 완료</span>
        </div>
        <div className="dashboard-report-list">
          {reports.map((item) => (
            <ReportCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="dashboard-support" aria-label="이어가기">
        <SupportLink
          icon="consult"
          title="AI 상담"
          desc="리포트를 보고 남은 고민을 바로 물어보기"
          href="/consult"
        />
        <SupportLink
          icon="coaching"
          title="코칭 플랜"
          desc="오늘 실행할 작은 행동으로 옮기기"
          href="/coaching"
        />
      </section>
    </div>
  );
}

type DashboardStatus = {
  sajuDone: boolean;
  tciDone: boolean;
  fusionDone: boolean;
  familyDone: boolean;
};

type DashboardReportItem = {
  icon: BrandIconName;
  title: string;
  desc: string;
  done: boolean;
  href: string;
  cta: string;
};

function getPrimaryAction({ sajuDone, tciDone, fusionDone, familyDone }: DashboardStatus) {
  if (!sajuDone) return { href: "/saju", label: "사주언니와 팔자토크 시작" };
  if (!tciDone) return { href: "/tci", label: "기질오빠와 성향토크 시작" };
  if (!fusionDone) return { href: "/fusion", label: "사주+기질 보기" };
  if (!familyDone) return { href: "/family", label: "가족 사주 보기" };
  return { href: "/consult", label: "AI 상담으로 이어가기" };
}

function ReportCard({
  icon, title, desc, done, href, cta,
}: {
  icon: BrandIconName; title: string; desc: string; done: boolean; href: string; cta: string;
}) {
  return (
    <Link href={href} className="dashboard-report-card">
      <BrandIcon name={icon} className="dashboard-report-icon" />
      <div className="dashboard-report-copy">
        <div className="dashboard-report-title">
          <b>{title}</b>
          <span className={`badge ${done ? "done" : "todo"}`}>{done ? "완료" : "대기"}</span>
        </div>
        <p>{desc}</p>
      </div>
      <span className="dashboard-report-cta">
        {cta}
        <span aria-hidden="true"> →</span>
      </span>
    </Link>
  );
}

function SupportLink({
  icon, title, desc, href,
}: {
  icon: BrandIconName; title: string; desc: string; href: string;
}) {
  return (
    <Link href={href} className="dashboard-support-card">
      <BrandIcon name={icon} />
      <span>
        <b>{title}</b>
        <em>{desc}</em>
      </span>
    </Link>
  );
}
