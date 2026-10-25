"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Manseryeok from "@/components/Manseryeok";
import PageLoading from "@/components/PageLoading";
import { BODY_LINE, ElChips, eokbuPlain } from "@/components/YongsinBoard";
import type { SajuResult } from "@/lib/saju/calculator";
import type { Manseryeok as ManseryeokData } from "@/lib/saju/manseryeok";
import { buildYongsinView, ELEMENT_META, type Element } from "@/lib/saju/yongsinView";

/**
 * 사주 풀이 위의 '명리로 보기' — 2026-10-25 전문가 견본(엑셀 '개선점 정리') 반영, 대표 승인.
 *
 * 견본은 리포트 맨 위에 사주명식·대운 표를, 가운데에 조후·격국·억부 분석을 뒀다. 우리 풀이는 일상어가 기본이라
 * (한자 라벨은 일반인 눈에 안 보이게 — DESIGN_PRINCIPLES) ★접어서 맨 위에★ 두고, 명리를 아는 사람이 펼쳐 본다.
 * - 사주명식·대운 표: 만세력 원본과 같은 칸 언어(원국·대운만). 펼칠 때 한 번만 불러온다.
 * - 명리로 본 세 가지: 조후(건강·환경)·격국(적성·그릇)·억부(수행능력). 용신 화면과 같은 계산·같은 문구.
 * 전부 코드 계산값이다(AI 0) — 판정은 lib/saju/johu.ts·gyeokguk.ts·yongsin.ts.
 */
export default function MyeongriFold({
  saju,
  currentAge,
  currentYear,
  oldJudgment = false,
  className = "",
}: {
  saju: SajuResult;
  currentAge?: number;
  currentYear: number;
  /** 아래 풀이 글이 판정 기준을 손보기 전에 쓰였나(lib/saju/judgmentVersion.ts) — 이 칸은 늘 지금 기준이다. */
  oldJudgment?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState<ManseryeokData | null>(null);
  const [tableFailed, setTableFailed] = useState(false);
  const view = useMemo(() => buildYongsinView(saju, currentAge, currentYear), [saju, currentAge, currentYear]);

  useEffect(() => {
    if (!open || table || tableFailed) return;
    let alive = true;
    fetch("/api/saju/manseryeok")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { manseryeok: ManseryeokData | null }) => {
        if (!alive) return;
        if (d.manseryeok) setTable(d.manseryeok);
        else setTableFailed(true);
      })
      .catch(() => { if (alive) setTableFailed(true); });
    return () => { alive = false; };
  }, [open, table, tableFailed]);

  const { johu, gyeokguk, eokbu, body, primaryYong, helperYong } = view;
  const bl = BODY_LINE[body];
  const answer: Element[] = primaryYong.length ? primaryYong : helperYong;
  const label = (els: Element[]) => els.map((e) => `${ELEMENT_META[e].label} 기운`).join("·");

  return (
    <details
      className={`saju-myeongri ${className}`.trim()}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <span>명리로 보기</span>
        <small>사주명식·대운 표 · 조후·격국·억부</small>
      </summary>

      <div className="saju-myeongri-body">
        {oldJudgment && (
          <p className="yv-judgment-note" role="note">
            기운 판정 기준을 더 꼼꼼하게 손봤어. 이 칸은 새 기준이라, 그 전에 쓴 아래 풀이 글과 조금 다를 수 있어 — 풀이를 다시 만들면 새 기준으로 풀어줄게.
          </p>
        )}

        <section className="saju-myeongri-sec" aria-labelledby="myeongri-table-title">
          <h3 id="myeongri-table-title" className="saju-myeongri-k">사주명식 · 대운</h3>
          {table ? (
            <Manseryeok data={table} compact />
          ) : tableFailed ? (
            <p className="muted saju-myeongri-fail">표를 불러오지 못했어요. 잠시 후 다시 펼쳐 주세요.</p>
          ) : (
            open && <PageLoading compact label="사주명식을 펼치고 있어요" />
          )}
          <Link href="/saju/manseryeok" className="link-tiny saju-myeongri-more">세운·월운까지 있는 만세력 원본 보기 →</Link>
        </section>

        <section className="saju-myeongri-sec" aria-labelledby="myeongri-three-title">
          <h3 id="myeongri-three-title" className="saju-myeongri-k">명리로 본 세 가지</h3>
          <div className="yv-method-list">
            <article className="yv-method" aria-label="조후 · 건강·환경">
              <div className="yv-method-head">
                <span className="yv-method-tag">조후 <em>온도 균형 · 건강·환경</em></span>
                <span className="yv-method-badge">{johu.season} · {johu.hanYeolLabel}</span>
              </div>
              <p className="yv-method-desc">{johu.reason}</p>
              <div className="yv-method-foot">
                <span className="yv-foot-k">온도를 맞추는 기운</span>
                <ElChips els={johu.johu} empty="지금은 온도가 알맞아 — 급히 데우거나 식힐 게 없어" />
              </div>
            </article>

            <article className="yv-method" aria-label="격국 · 적성·그릇">
              <div className="yv-method-head">
                <span className="yv-method-tag">격국 <em>타고난 그릇 · 적성</em></span>
              </div>
              <p className="yv-method-title">{gyeokguk.title}</p>
              <p className="yv-method-desc">{gyeokguk.description}</p>
              <p className="yv-method-basis">{gyeokguk.basis} (사주 용어로는 {gyeokguk.name})</p>
              <div className="yv-method-foot">
                <span className="yv-foot-k">그릇을 완성하는 재료 (참고)</span>
                <ElChips els={gyeokguk.sangsin} empty="이 그릇은 딱 떨어지는 재료가 없어" />
                <p className="yv-foot-reason">{gyeokguk.sangsinReason}</p>
              </div>
            </article>

            <article className="yv-method" aria-label="억부 · 수행능력">
              <div className="yv-method-head">
                <span className="yv-method-tag">억부 <em>힘의 균형 · 수행능력</em></span>
              </div>
              <p className="yv-method-desc">너는 {bl.state}이야({bl.term}). {bl.why}.</p>
              <p className="yv-method-basis">{eokbuPlain(eokbu, body)}</p>
              <div className="yv-method-foot">
                <span className="yv-foot-k">힘의 균형을 맞추는 기운</span>
                <ElChips els={eokbu.yongsin} empty="균형형이라 뚜렷하지 않음" />
                {eokbu.gisin.length > 0 && (
                  <>
                    <span className="yv-foot-k yv-foot-k--bad">기대면 오히려 지치는 기운</span>
                    <ElChips els={eokbu.gisin} />
                  </>
                )}
              </div>
            </article>
          </div>
          <p className="saju-myeongri-answer">
            {answer.length
              ? <>세 관점을 겹치면 너한테 약이 되는 건 <b>{label(answer)}</b>이야.</>
              : "세 관점이 한 기운으로 모이지 않는 균형형이야 — 한쪽으로 단정하지 않아도 돼."}{" "}
            <Link href="/saju/yongsin" className="link-tiny">언제·어디에 쓸지는 용신 풀이에서 →</Link>
          </p>
        </section>
      </div>
    </details>
  );
}
