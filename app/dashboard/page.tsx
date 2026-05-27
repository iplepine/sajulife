"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SajuProfile } from "@/lib/store/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [tciDone, setTciDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/tci/answers").then((r) => r.json()),
    ]).then(([p, t]) => {
      setProfile(p.profile);
      setTciDone(!!t.tci);
      setLoading(false);
    });
  }, []);

  if (loading) return <main className="container">불러오는 중...</main>;

  if (!profile) {
    return (
      <main className="container">
        <h1>먼저 사주 정보를 입력하세요</h1>
        <Link href="/onboarding" className="btn--primary" style={{ display: "inline-block", marginTop: 12 }}>
          사주 정보 입력으로
        </Link>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Dashboard</h1>
      <div className="card">
        <div className="muted">현재 프로필</div>
        <div>
          {profile.name} / {profile.gender === "male" ? "남성" : "여성"} /{" "}
          {profile.birthDate} {profile.birthTime || "(시각 모름)"} ({profile.calendar === "lunar" ? "음력" : "양력"})
        </div>
        <Link href="/onboarding" className="muted">수정</Link>
      </div>

      <div className="stack" style={{ marginTop: 24 }}>
        <ActionCard
          title="기질 검사"
          desc={tciDone ? "설문 완료. 리포트를 다시 생성할 수 있습니다." : "TCI 스타일 35문항 설문 진행"}
          primary={{ label: tciDone ? "기질 리포트 보기" : "기질 검사 시작", href: tciDone ? "/tci/report" : "/tci" }}
          secondary={{ label: "프롬프트 디버그", href: "/tci/debug" }}
        />
        <ActionCard
          title="개인 사주 보기"
          desc="입력한 사주 정보로 AI 리포트 생성"
          primary={{ label: "개인 사주 리포트", href: "/saju" }}
          secondary={{ label: "프롬프트 디버그", href: "/saju/debug" }}
        />
        <ActionCard
          title="가족 사주 보기"
          desc="가족 구성원 추가 후 관계 풀이 리포트 생성"
          primary={{ label: "가족 사주 리포트", href: "/family" }}
          secondary={{ label: "프롬프트 디버그", href: "/family/debug" }}
        />
        <ActionCard
          title="기질 + 사주 통합 리포트"
          desc={tciDone ? "TCI 점수와 사주를 한 장으로 엮어 공명/긴장을 짚어줍니다." : "기질 검사를 먼저 완료하세요."}
          primary={{ label: tciDone ? "통합 리포트 보기" : "기질 검사부터", href: tciDone ? "/fusion" : "/tci" }}
          secondary={{ label: "프롬프트 디버그", href: "/fusion/debug" }}
        />
      </div>
    </main>
  );
}

function ActionCard({
  title, desc, primary, secondary,
}: {
  title: string; desc: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
      <div className="muted" style={{ marginTop: 4 }}>{desc}</div>
      <div className="row" style={{ marginTop: 12 }}>
        <Link href={primary.href} className="btn--primary" style={{ padding: "8px 12px", borderRadius: 6, textDecoration: "none" }}>
          {primary.label}
        </Link>
        <Link href={secondary.href} className="muted">{secondary.label}</Link>
      </div>
    </div>
  );
}
