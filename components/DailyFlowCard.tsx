"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { DailyFlow } from "@/lib/saju/dailyFlow";

/**
 * 오늘의 용신 — 홈 최상단 데일리 훅 카드.
 * 결정론 계산값(dailyFlow)만으로 그린다. AI 서술 없음. 매일 열어볼 이유를 만드는 게 목적이라
 * "오늘 어떤 기운이 들어오는지"를 첫 화면의 주인공으로 세운다.
 */

const ENERGY_CLASS: Record<DailyFlow["energy"], string> = {
  보약: "up",
  평이: "flat",
  과부하: "down",
};

const CTA_COPY: Record<DailyFlow["energy"], string> = {
  보약: "내 용신 보기",
  평이: "내 용신 보기",
  과부하: "용신으로 조절하기",
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function differenceInDays(date: string, today: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const current = Date.UTC(year, month - 1, day);
  const base = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((current - base) / 86_400_000);
}

function dateLabel(date: string, today: string): { relative: string; calendar: string } {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const relative: Record<number, string> = {
    [-2]: "이틀 전",
    [-1]: "어제",
    0: "오늘",
    1: "내일",
    2: "모레",
    3: "글피",
  };

  return {
    relative: relative[differenceInDays(date, today)] ?? `${month}월 ${day}일`,
    calendar: `${month}.${day} · ${weekday}`,
  };
}

const STEM_TO_DRAGON: Record<
  string,
  { key: "wood" | "fire" | "earth" | "metal" | "water"; label: string; dragon: string }
> = {
  "큰 나무": {
    key: "wood",
    label: "목룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-wood.png",
  },
  화초: {
    key: "wood",
    label: "목룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-wood.png",
  },
  태양: {
    key: "fire",
    label: "화룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-fire.png",
  },
  등불: {
    key: "fire",
    label: "화룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-fire.png",
  },
  "큰 산": {
    key: "earth",
    label: "토룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-earth.png",
  },
  들판: {
    key: "earth",
    label: "토룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-earth.png",
  },
  무쇠: {
    key: "metal",
    label: "금룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-metal.png",
  },
  보석: {
    key: "metal",
    label: "금룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-metal.png",
  },
  "큰 강": {
    key: "water",
    label: "수룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-water.png",
  },
  이슬: {
    key: "water",
    label: "수룡의 기운",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-water.png",
  },
};

export default function DailyFlowCard({
  flows,
  today,
  name,
}: {
  flows: DailyFlow[];
  today?: string;
  name?: string;
}) {
  const baseDate = today ?? flows.find((flow) => flow.date)?.date ?? "";
  const initialFlow = flows.find((flow) => flow.date === baseDate) ?? flows[0];
  const [selectedDate, setSelectedDate] = useState(initialFlow?.date ?? "");
  const dateButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const swipeStartX = useRef<number | null>(null);

  useEffect(() => {
    setSelectedDate(initialFlow?.date ?? "");
  }, [initialFlow?.date]);

  const selectedIndex = Math.max(0, flows.findIndex((item) => item.date === selectedDate));
  const flow = flows[selectedIndex] ?? initialFlow;

  useEffect(() => {
    dateButtonRefs.current[flow?.date]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [flow?.date]);

  if (!flow) return null;

  const who = name?.trim();
  const tone = ENERGY_CLASS[flow.energy];
  const ctaCopy = CTA_COPY[flow.energy];
  const personalYongsin = flow.yongsin.length ? flow.yongsin.join(" · ") : "균형";
  const dragon =
    STEM_TO_DRAGON[flow.dayStem.short] ?? {
      key: "water" as const,
      label: "용신의 기운",
      dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-water.png",
    };
  const elementLetter = /^[목화토금수]/u.test(dragon.label) ? dragon.label.slice(0, 1) : null;
  const relationshipHint = flow.caution ?? "내 리듬을 먼저 지키고 대화는 한 박자 천천히";
  const activeDate = dateLabel(flow.date, baseDate);

  function selectByIndex(index: number) {
    const next = flows[index];
    if (next) setSelectedDate(next.date);
  }

  function onSwipeStart(event: React.TouchEvent<HTMLElement>) {
    swipeStartX.current = event.touches[0]?.clientX ?? null;
  }

  function onSwipeEnd(event: React.TouchEvent<HTMLElement>) {
    const startX = swipeStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    swipeStartX.current = null;
    if (startX === null || endX === undefined || Math.abs(startX - endX) < 44) return;
    selectByIndex(selectedIndex + (startX > endX ? 1 : -1));
  }

  return (
    <section
      className={`daily-flow daily-flow--${tone} daily-flow--${dragon.key}`}
      aria-label="주간 용신"
    >
      <div className="daily-flow-date-rail" role="tablist" aria-label="날짜별 용신">
        {flows.map((item) => {
          const label = dateLabel(item.date, baseDate);
          const selected = item.date === flow.date;
          return (
            <button
              key={item.date}
              ref={(element) => {
                dateButtonRefs.current[item.date] = element;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`daily-flow-date-option${selected ? " is-active" : ""}`}
              onClick={() => setSelectedDate(item.date)}
            >
              <strong>{label.relative}</strong>
              <small>{label.calendar}</small>
            </button>
          );
        })}
      </div>

      <div
        key={flow.date}
        className="daily-flow-hero"
        onTouchStart={onSwipeStart}
        onTouchEnd={onSwipeEnd}
      >
        <div className="daily-flow-copy">
          <h1 className="daily-flow-title">
            {elementLetter ? <span className="daily-flow-title-element">{elementLetter}</span> : null}
            {elementLetter ? dragon.label.slice(1) : dragon.label}
          </h1>
          <p className="daily-flow-subtitle">{activeDate.relative} 나에게 힘이 되는 기운</p>

          <div className="daily-flow-personal" aria-label={`내 보약 기운 ${personalYongsin}`}>
            <span className="daily-flow-yongsin">
              <small>내 보약</small>
              <strong>{personalYongsin}</strong>
            </span>
            <span className={`daily-flow-badge daily-flow-badge--${tone}`}>{flow.energyLabel}</span>
          </div>
        </div>

        <div className="daily-flow-art" aria-hidden>
          <img className="daily-flow-dragon" src={dragon.dragon} alt="" draggable={false} />
        </div>
      </div>

      <Link href="/saju/yongsin" className="daily-flow-cta">
        <span>{ctaCopy}</span>
        <img src="/yongsin-dragon-assets/sliced/ui/arrow-brush-right.png" alt="" />
      </Link>

      <div className="daily-flow-shortcuts" aria-label="오늘의 빠른 보기">
        <Link href="/saju/yongsin" className="daily-flow-shortcut">
          <img src="/yongsin-dragon-assets/sliced/icons/icon-work.png" alt="" />
          <span>
            <strong>일에서<br />쓰는 법</strong>
            <em>{flow.good}</em>
          </span>
          <b aria-hidden>›</b>
        </Link>
        <Link href="/family" className="daily-flow-shortcut">
          <img src="/yongsin-dragon-assets/sliced/icons/icon-relationship.png" alt="" />
          <span>
            <strong>관계에서<br />조심할 점</strong>
            <em>{relationshipHint}</em>
          </span>
          <b aria-hidden>›</b>
        </Link>
        <Link href="/saju/timing" className="daily-flow-shortcut">
          <img src="/yongsin-dragon-assets/sliced/icons/icon-timing.png" alt="" />
          <span>
            <strong>이번 달<br />흐름</strong>
            <em>{who ? `${who}의 타이밍` : "달별로 밀고 줄일 때"}</em>
          </span>
          <b aria-hidden>›</b>
        </Link>
      </div>
    </section>
  );
}
