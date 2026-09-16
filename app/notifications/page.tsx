"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import PageLoading from "@/components/PageLoading";

type NotificationKind = "personal" | "yongsin" | "tci" | "fusion" | "family" | "compat";

type CompletedReportNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  generatedAt: string;
};

const NOTIFICATION_ICONS: Record<NotificationKind, BrandIconName> = {
  personal: "home-saju",
  yongsin: "saju",
  tci: "home-tci",
  fusion: "home-fusion",
  family: "home-family",
  compat: "reading-compat",
};

function relativeTime(iso: string): string {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000));
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<CompletedReportNotification[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) throw new Error("notification load failed");
        const data = (await response.json()) as { notifications?: CompletedReportNotification[] };
        if (active) setNotifications(data.notifications ?? []);
      } catch {
        if (active) {
          setError(true);
          setNotifications([]);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (!notifications) return <main className="page"><PageLoading label="알림을 확인하고 있어요" /></main>;

  return (
    <div className="page notifications-page">
      <header className="notifications-head">
        <p className="h-sec">알림</p>
        {/* 빈 상태에서 "풀이가 준비됐어"라고 하면 없는 걸 있다고 말하게 된다 — 제목은 목록 유무를 따른다. */}
        <h1 className="h-app">{notifications.length > 0 ? "풀이가 준비됐어" : "다 만들어진 풀이 알림"}</h1>
        <p>만들어 둔 풀이가 다 되면 여기서 다시 확인할 수 있어.</p>
      </header>

      {error && <p className="error">알림을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.</p>}

      {notifications.length > 0 ? (
        <ul className="notification-list" aria-label="완료된 풀이 알림">
          {notifications.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="notification-row">
                <BrandIcon name={NOTIFICATION_ICONS[item.kind]} className="notification-icon" />
                <span className="notification-main">
                  <strong>{item.title}</strong>
                  <em>{item.description}</em>
                </span>
                <time dateTime={item.generatedAt}>{relativeTime(item.generatedAt)}</time>
              </Link>
            </li>
          ))}
        </ul>
      ) : error ? null : (
        // 조회가 실패했으면 "아직 없어요"를 같이 보여주지 않는다(위에 실패 안내가 서 있다).
        <section className="notification-empty" aria-label="알림 없음">
          <BrandIcon name="notification" />
          <strong>완료된 풀이가 아직 없어요</strong>
          <p>풀이를 만들면 다 되는 대로 여기서 알려줄게.</p>
          <Link href="/materials" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>풀이 보러 가기</Link>
        </section>
      )}
    </div>
  );
}
