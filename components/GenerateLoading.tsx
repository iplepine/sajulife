"use client";

import { useEffect, useState } from "react";

/**
 * AI 생성 대기 화면 — 리포트가 들어설 자리에 그대로 끼워 넣는 카드.
 *
 * AI 호출은 수십 초가 걸리는데, 상단 3px 바와 버튼 텍스트만으로는
 * "멈춘 건지 일하는 중인지" 알기 어렵다. 그래서 본문 자리에 또렷한
 * 진행 카드를 띄워:
 *  - 흐르는 먹빛 바(움직임)로 "지금 일하는 중"임을 보여주고,
 *  - 단계별 안내 문구를 약 5초마다 바꿔 진행감을 주고,
 *  - 경과 시간을 세어 멈추지 않았음을 안심시킨다.
 *
 * 실제 진행률은 알 수 없으므로(스트리밍 아님, 완료 시 한 번에 응답)
 * 막대는 의도적으로 무한 루프하는 indeterminate 형태다.
 */

const DEFAULT_MESSAGES = [
  "사주 네 기둥을 펼쳐 읽는 중이야…",
  "타고난 결과 오행의 균형을 보는 중이야…",
  "10년 단위 인생 흐름을 맞춰보는 중이야…",
  "너한테 맞는 말로 풀어쓰는 중이야…",
];

const DEFAULT_NOTE = "AI가 직접 풀이를 써 내려가는 중이라 시간이 좀 걸려요. 창을 닫지 말고 기다려 주세요.";

const ROTATE_MS = 5200;

export default function GenerateLoading({
  messages = DEFAULT_MESSAGES,
  note = DEFAULT_NOTE,
  className = "",
}: {
  messages?: string[];
  note?: string;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (messages.length <= 1) return;
    const rot = setInterval(() => setIdx((i) => (i + 1) % messages.length), ROTATE_MS);
    return () => clearInterval(rot);
  }, [messages.length]);

  return (
    <div className={`genload card${className ? ` ${className}` : ""}`} role="status" aria-live="polite">
      <div className="genload-head">
        <span className="genload-dot" aria-hidden />
        {/* key로 문구가 바뀔 때마다 페이드 인 */}
        <span key={idx} className="genload-msg">{messages[idx % messages.length]}</span>
      </div>
      <div className="genload-track" aria-hidden>
        <span />
      </div>
      <div className="genload-foot">
        <span className="genload-note">{note}</span>
        <span className="genload-time">{elapsed}초 경과</span>
      </div>
    </div>
  );
}
