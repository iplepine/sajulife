"use client";

import Link from "next/link";
import type { DailyFlow } from "@/lib/saju/dailyFlow";

/**
 * 오늘의 흐름 — 홈 최상단 데일리 훅 카드.
 * 결정론 계산값(dailyFlow)만으로 그린다. AI 서술 없음. 매일 열어볼 이유를 만드는 게 목적이라
 * 짧고 강하게, 끝은 타이밍 캘린더로 이어준다. 설명 문구는 반말 톤, 링크 칩만 담백하게.
 */

const ENERGY_CLASS: Record<DailyFlow["energy"], string> = {
  보약: "up",
  평이: "flat",
  과부하: "down",
};

function todayLabel(): string {
  return new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function DailyFlowCard({ flow, name }: { flow: DailyFlow; name?: string }) {
  const who = name?.trim();
  const tone = ENERGY_CLASS[flow.energy];
  return (
    <section className={`daily-flow daily-flow--${tone}`} aria-label="오늘의 흐름">
      <div className="daily-flow-top">
        <span className="daily-flow-date">{todayLabel()}</span>
        <span className="daily-flow-stem" aria-hidden>
          {flow.dayStem.emoji} {flow.dayStem.short} 기운
        </span>
      </div>

      <div className="daily-flow-energy">
        <span className={`daily-flow-badge daily-flow-badge--${tone}`}>{flow.energyLabel}</span>
        <span className="daily-flow-gauge" aria-label={`오늘 기운 ${flow.score} / 5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <i key={i} className={i <= flow.score ? "on" : ""} aria-hidden />
          ))}
        </span>
      </div>

      <p className="daily-flow-headline">
        {who ? `${who}, ` : ""}
        {flow.headline}
      </p>

      <div className="daily-flow-lines">
        <p className="daily-flow-good">
          <span className="daily-flow-chip good" aria-hidden>
            {flow.themeEmoji} 오늘 잘 맞아
          </span>
          {flow.good}
        </p>
        {flow.caution && (
          <p className="daily-flow-caution">
            <span className="daily-flow-chip warn" aria-hidden>
              ⚠ 오늘 조심
            </span>
            {flow.caution}
          </p>
        )}
      </div>

      <Link href="/saju/timing" className="daily-flow-more">
        이번 달·다음 달 타이밍 보기 →
      </Link>
    </section>
  );
}
