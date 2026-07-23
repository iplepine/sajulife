"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchTicketBalance } from "@/lib/tickets/client";

/**
 * 어디서든 "지금 티켓이 몇 장 남았는지" 바로 보이게 하는 배지.
 * 사이드바(데스크톱) · 모바일 상단바 · 홈 대시보드 상단(모바일)에 공통으로 얹는다.
 */
export default function TicketBadge({ className }: { className?: string }) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchTicketBalance()
      .then((b) => { if (alive) setBalance(b); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (balance === null) return null;

  return (
    <Link href="/tickets" className={["ticket-badge", className].filter(Boolean).join(" ")} aria-label={`보유 티켓 ${balance}장, 티켓 구매하기`}>
      <span className="ticket-badge-icon" aria-hidden>🎫</span>
      <span className="ticket-badge-count">{balance}</span>
    </Link>
  );
}
