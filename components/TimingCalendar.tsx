"use client";

import { useState } from "react";
import type { TimingCalendar, TimingMonth, TimingTone } from "@/lib/saju/timingCalendar";
import { SEASON_EMOJI } from "@/lib/saju/seasonClock";

/**
 * 개인 타이밍 캘린더 — 그 해 12개월을 '지금→미래'로 세운 레일.
 * 결정론 계산값(timingCalendar)만으로 그린다. 색은 신호로만: 기회=목(초록)/정리=수(파랑)/
 * 주의=화(빨강)/평이=담백. 지난 달은 접어 흐리게. 설명 문구는 반말 톤.
 */

const TONE_META: Record<TimingTone, { label: string; cls: string }> = {
  기회: { label: "기회", cls: "op" },
  정리: { label: "정리", cls: "clear" },
  주의: { label: "주의", cls: "warn" },
  평이: { label: "평이", cls: "flat" },
};

function MonthRow({ m }: { m: TimingMonth }) {
  const t = TONE_META[m.tone];
  return (
    <div
      className={`tc-row tc-row--${t.cls}${m.isCurrent ? " tc-row--now" : ""}${m.isPast ? " tc-row--past" : ""}`}
    >
      <div className="tc-when">
        <span className="tc-month">{m.monthLabel}</span>
        {m.isCurrent && <span className="tc-now-tag">이번 달</span>}
        <span className="tc-season" aria-hidden>
          {SEASON_EMOJI[m.season]} {m.season}
        </span>
      </div>
      <div className="tc-body">
        <div className="tc-head">
          <span className={`tc-tone tc-tone--${t.cls}`}>{t.label}</span>
          <strong className="tc-headline">{m.headline}</strong>
        </div>
        <p className="tc-detail">{m.detail}</p>
      </div>
    </div>
  );
}

export default function TimingCalendarView({ calendar }: { calendar: TimingCalendar }) {
  const [showPast, setShowPast] = useState(false);
  const upcoming = calendar.ordered.filter((m) => !m.isPast);
  const past = calendar.ordered.filter((m) => m.isPast);

  return (
    <div className="tc">
      <div className="tc-summary">
        <div className="tc-summary-flags">
          {calendar.nextOpportunity && (
            <span className="tc-flag tc-flag--op">
              🌱 좋은 타이밍 <b>{calendar.nextOpportunity.monthLabel}</b>
            </span>
          )}
          {calendar.nextCaution && (
            <span className="tc-flag tc-flag--warn">
              🛑 조심할 달 <b>{calendar.nextCaution.monthLabel}</b>
            </span>
          )}
        </div>
        <p className="tc-summary-note">{calendar.summary}</p>
      </div>

      <div className="tc-list">
        {upcoming.map((m) => (
          <MonthRow key={m.month} m={m} />
        ))}
      </div>

      {past.length > 0 && (
        <div className="tc-past">
          <button className="tc-past-toggle" onClick={() => setShowPast((v) => !v)}>
            {showPast ? "지난 달 접기" : `지난 달 ${past.length}개 보기`} {showPast ? "▲" : "▼"}
          </button>
          {showPast && (
            <div className="tc-list tc-list--past">
              {past.map((m) => (
                <MonthRow key={m.month} m={m} />
              ))}
            </div>
          )}
        </div>
      )}

      <p className="tc-fine muted">
        흔들림 크기(주의)와 방향(기회·정리)을 원국·대운·세운·월운으로 겹쳐 계산한 거야. 특정 달을
        길흉으로 단정하는 게 아니라, 미리 알고 페이스 조절하라고 짚어주는 거고.
      </p>
    </div>
  );
}
