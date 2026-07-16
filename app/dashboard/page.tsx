"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import DailyFlowCard from "@/components/DailyFlowCard";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { DailyFlow } from "@/lib/saju/dailyFlow";
import type { SajuProfile } from "@/lib/store/types";

const COMPANY_LINKS = ["이용약관", "개인정보 처리방침", "환불 정책", "고객센터"];

const COMPANY_INFO = [
  "데브호하우스 | 대표: 박정호 | 사업자등록번호: 000-00-00000",
  "통신판매업신고번호: 2026-서울중랑-0000",
  "서울특별시 중랑구 신내로 155 | 문의: hello@sajulife.kr",
];

type HomeData = {
  profile: SajuProfile | null;
  sajuReportDone: boolean;
  tciAnswersDone: boolean;
  dailyFlows: DailyFlow[];
  dailyToday: string | null;
};

const EMPTY_HOME_DATA: HomeData = {
  profile: null,
  sajuReportDone: false,
  tciAnswersDone: false,
  dailyFlows: [],
  dailyToday: null,
};

type Feature = { icon: BrandIconName; name: string; desc: string; href: string };

function todayLabel(): string {
  return new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<HomeData>(EMPTY_HOME_DATA);

  useEffect(() => {
    let cancelled = false;

    // 홈은 여러 보조 API 중 하나가 느려도 첫 화면을 막지 않는다.
    async function readJson<T>(url: string): Promise<T | null> {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;
        return (await response.json()) as T;
      } catch {
        return null;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    async function load() {
      const profileRes = await readJson<{ profile?: SajuProfile }>("/api/profile");
      const profile = profileRes?.profile ?? null;
      if (!profile) {
        if (!cancelled) setData(EMPTY_HOME_DATA);
        return;
      }

      const [sajuRes, tciRes, dailyRes] = await Promise.all([
        readJson<{ saved?: unknown }>("/api/saju/personal"),
        readJson<{ tci?: unknown }>("/api/tci/answers"),
        readJson<{ flow?: DailyFlow; flows?: DailyFlow[]; today?: string }>("/api/saju/daily?range=week"),
      ]);
      if (cancelled) return;

      const dailyFlows = dailyRes?.flows?.length
        ? dailyRes.flows
        : dailyRes?.flow
          ? [dailyRes.flow]
          : [];

      setData({
        profile,
        sajuReportDone: !!sajuRes?.saved,
        tciAnswersDone: !!tciRes?.tci,
        dailyFlows,
        dailyToday: dailyRes?.today ?? dailyRes?.flow?.date ?? null,
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasProfile = !!data.profile;
  const displayName = data.profile?.name?.trim() || "";

  const yongsinEntry = hasProfile ? "/saju/yongsin" : "/onboarding?next=/saju/yongsin";

  // 보조 배너: 홈의 첫 행동은 용신으로 올리고, 기존 사주 풀이는 리포트 흐름으로 보낸다.
  const saju = !hasProfile
    ? {
        href: "/onboarding?next=/saju",
        cta: "사주 정보 넣기",
        title: "용신을 보려면 사주 정보가 먼저 필요해",
        desc: "생년월일시를 넣으면 오늘 들어오는 기운과 네게 필요한 기운을 바로 계산해줄게.",
      }
    : !data.sajuReportDone
      ? {
          href: "/saju",
          cta: "사주 보러 가기",
          title: "기본 사주도 같이 펼쳐보자",
          desc: "용신은 큰 흐름 위에서 더 잘 보여. 사주언니가 원국부터 차분히 잡아줄게.",
        }
      : {
          href: "/saju",
          cta: "내 사주 다시 보기",
          title: "사주 원국 다시 보기",
          desc: "오늘 기운이 왜 이렇게 들어오는지, 기본 흐름에서 다시 확인할 수 있어.",
        };

  const features: Feature[] = [
    {
      icon: "saju",
      name: "타이밍 캘린더",
      desc: "올해 언제 밀어붙이고 언제 템포 줄일지 달별로",
      href: hasProfile ? "/saju/timing" : "/onboarding?next=/saju/timing",
    },
    {
      icon: "home-saju",
      name: "사주언니와 팔자토크",
      desc: "생년월일시로 보는 기본 흐름과 지금 필요한 선택 기준",
      href: hasProfile ? "/saju" : "/onboarding?next=/saju",
    },
    {
      icon: "home-tci",
      name: "기질오빠와 성향토크",
      desc: "평소 패턴으로 보는 성향과 강점",
      href: data.tciAnswersDone ? "/tci/report" : "/tci",
    },
    {
      icon: "home-fusion",
      name: "사주 + 기질",
      desc: "흐름과 성향을 같이 놓고 보는 선택 전략",
      href: data.tciAnswersDone ? "/fusion" : "/tci",
    },
    {
      icon: "home-family",
      name: "가족 사주",
      desc: "관계의 결, 대화 포인트, 조율 방식",
      href: "/family",
    },
  ];

  return (
    <div className="page home-page">
      <header className="home-dashboard-bar" aria-label="홈 상단">
        <span className="home-dashboard-brand">사주언니 x 기질오빠</span>
        <span className="home-dashboard-actions">
          <PersonSwitcher className="home-dashboard-person" />
          <Link href="/notifications" className="home-dashboard-history" aria-label="알림 보기">
            <BrandIcon name="notification" />
          </Link>
        </span>
      </header>
      {data.dailyFlows.length ? (
        <DailyFlowCard flows={data.dailyFlows} today={data.dailyToday ?? undefined} name={displayName} />
      ) : (
        <Link href={yongsinEntry} className="home-yongsin-start" aria-label="오늘의 용신 시작하기">
          <span className="home-yongsin-start-copy">
            <strong>내 용신을<br />찾아볼까?</strong>
            <small>생년월일시를 넣으면 오늘 들어온 기운과 내 보약 기운을 바로 연결해 볼 수 있어.</small>
          </span>
          <span className="home-yongsin-start-art" aria-hidden>
            <img src="/yongsin-dragon-assets/sliced/dragons/dragon-five-elements.png" alt="" draggable={false} />
          </span>
          <span className="home-yongsin-start-cta">용신 시작하기 <b aria-hidden>→</b></span>
        </Link>
      )}

      <Link href={saju.href} className="home-support-banner" aria-label={`${saju.title} — ${saju.cta}`}>
        <span className="home-support-banner-art" aria-hidden>
          <img src="/brand-icons/persona-duo.png" alt="" draggable={false} />
        </span>
        <span className="home-support-banner-copy">
          <em>{todayLabel()} · 사주언니 x 기질오빠</em>
          <strong>{saju.title}</strong>
          <small>{saju.desc}</small>
          <span className="home-support-banner-cue">{saju.cta} →</span>
        </span>
      </Link>

      <section className="home-feature" aria-label="제공 기능">
        <h2 className="home-feature-title">다음에 이어서 볼 것</h2>
        <div className="home-feature-list">
          {features.map((f) => (
            <Link key={f.name} href={f.href} className="home-feature-row">
              <BrandIcon name={f.icon} className="home-feature-icon" />
              <span className="home-feature-main">
                <strong>{f.name}</strong>
                <em>{f.desc}</em>
              </span>
              <span className="home-feature-arrow" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-company-footer" aria-label="회사 정보">
        <div className="home-company-top">
          <strong>SAJULIFE</strong>
          <span>사주언니 x 기질오빠</span>
        </div>
        <p>본 서비스는 자기 이해와 선택 정리를 위한 참고 자료이며, 의료·법률·금융 상담을 대체하지 않습니다.</p>
        <div className="home-company-links" aria-label="정책 안내">
          {COMPANY_LINKS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <address>
          {COMPANY_INFO.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </address>
        <small>© 2026 SAJULIFE. All rights reserved.</small>
      </footer>
    </div>
  );
}
