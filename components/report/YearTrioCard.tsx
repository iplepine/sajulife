"use client";

import { useMemo } from "react";
import { yearTrio } from "@/lib/fusion/yearFortune";
import type { SajuResult } from "@/lib/saju/calculator";
import { buildYongsinView } from "@/lib/saju/yongsinView";

const TONE_LABEL = { good: "순풍", bad: "역풍", mixed: "섞임", calm: "잔잔" } as const;

/**
 * 사주+기질 올해 운세의 '작년 → 올해 → 내년' — 그 해 들어오는 기운(세운)을 네 사주 기준으로 계산한 세 칸.
 * 2026-10-25 전문가 견본(전년도·금년도·내년도 세운) 반영. 코드 계산값이라 생성 비용이 없다.
 * 사주+기질 화면은 한자를 쓰지 않으므로 간지는 한글("을사년")로만 적는다.
 */
export default function YearTrioCard({
  saju,
  currentAge,
  currentYear,
  oldJudgment = false,
}: {
  saju: SajuResult;
  currentAge?: number;
  currentYear: number;
  /** 아래 풀이 글이 판정 기준을 손보기 전에 쓰였나(lib/saju/judgmentVersion.ts) — 이 칸은 늘 지금 기준이다. */
  oldJudgment?: boolean;
}) {
  const items = useMemo(
    () => yearTrio(saju, buildYongsinView(saju, currentAge, currentYear), currentYear),
    [saju, currentAge, currentYear],
  );

  return (
    <section className="year-trio" aria-labelledby="year-trio-title">
      <p id="year-trio-title" className="h-sec mt5">작년 → 올해 → 내년</p>
      <p className="muted year-trio-lead">
        해마다 들어오는 기운을 네 사주 기준으로 계산한 거야. 작년에 어땠는지 떠올려 보면 올해랑 내년이 더 잘 읽혀.
      </p>
      {oldJudgment && (
        <p className="yv-judgment-note" role="note">
          기운 판정 기준을 더 꼼꼼하게 손봤어. 이 칸은 새 기준이라, 그 전에 쓴 아래 풀이 글과 조금 다를 수 있어 — 올해 운세를 다시 만들면 새 기준으로 풀어줄게.
        </p>
      )}
      <ol className="year-trio-list">
        {items.map((item) => (
          <li key={item.year} className={`year-trio-item is-${item.tone}${item.key === "올해" ? " is-now" : ""}`}>
            <p className="year-trio-k">
              <strong>{item.key}</strong>
              <span>{item.year} · {item.ganzhi}년</span>
              <em>{TONE_LABEL[item.tone]}</em>
            </p>
            <p className="year-trio-line"><b>{item.head}</b> — {item.line}</p>
            {item.clash && <p className="year-trio-clash">{item.clash}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
