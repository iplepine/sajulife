"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
};

function todayLabel(): string {
  return new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    const j = (url: string) => fetch(url).then((r) => r.json()).catch(() => ({}));
    Promise.all([j("/api/profile"), j("/api/saju/personal")]).then(([profileRes, sajuRes]) => {
      setData({
        profile: profileRes.profile ?? null,
        sajuReportDone: !!sajuRes.saved,
      });
    });
  }, []);

  if (!data) return <div className="page muted">불러오는 중...</div>;

  const hasProfile = !!data.profile;
  const displayName = data.profile?.name?.trim() || "";

  // 초기 상태 앱: 홈은 '사주 보기' 한 방향으로만 민다.
  const saju = !hasProfile
    ? {
        href: "/onboarding?next=/saju",
        cta: "사주 정보 넣기",
        chip: "시작 전",
        title: displayName ? `${displayName}, 오늘 네 사주부터 펼쳐보자` : "오늘, 네 사주부터 펼쳐보자",
        desc: "생년월일시만 넣으면 사주언니가 네 큰 흐름부터 차분히 풀어줄게. 1분이면 돼.",
      }
    : !data.sajuReportDone
      ? {
          href: "/saju",
          cta: "사주 보기",
          chip: "준비 완료",
          title: displayName ? `${displayName}, 사주 풀이 보러 갈까?` : "네 사주 풀이 보러 갈까?",
          desc: "정보는 다 넣어놨어. 사주언니가 지금 흐름이랑 챙길 선택까지 짚어줄게.",
        }
      : {
          href: "/saju",
          cta: "내 사주 다시 보기",
          chip: "풀이 완료",
          title: displayName ? `${displayName}, 다시 보면 또 보여` : "다시 보면 또 보이는 게 있어",
          desc: "오늘 마음 상태 따라 같은 사주도 다르게 읽혀. 언니 풀이 한 번 더 펼쳐봐.",
        };

  return (
    <div className="page home-page">
      <Link href={saju.href} className="home-top-banner" aria-label={`${saju.title} — ${saju.cta}`}>
        <span className="home-top-banner-art" aria-hidden>
          <img src="/brand-icons/persona-duo.png" alt="" draggable={false} />
        </span>
        <span className="home-top-banner-copy">
          <em>{todayLabel()} · 사주언니 x 기질오빠</em>
          <strong>{saju.title}</strong>
          <small>{saju.desc}</small>
          <span>사주 · {saju.chip}</span>
        </span>
        <b>{saju.cta} →</b>
      </Link>

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
