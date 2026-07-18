"use client";

import { useState } from "react";
import InkPoster from "@/components/home-impact-designs/InkPoster";
import IndexLedger from "@/components/home-impact-designs/IndexLedger";
import OneSheet from "@/components/home-impact-designs/OneSheet";
import Prescription from "@/components/home-impact-designs/Prescription";

type Draft = {
  id: string;
  number: string;
  lead: string;
  role: string;
  title: string;
  premise: string;
  strength: string;
  caution: string;
};

const DRAFTS: Draft[] = [
  { id: "prescription", number: "01", lead: "신윤복", role: "디자인실장 · 여백과 담채", title: "오늘의 한 줄 처방", premise: "한 문장을 오늘의 가장 중요한 장면으로 올립니다.", strength: "부드럽지만 개인적인 몰입", caution: "첫 화면의 정보량은 절제됩니다." },
  { id: "one-sheet", number: "02", lead: "김홍도", role: "디자이너 · 생활형 UX", title: "오늘의 한 장", premise: "해석보다 지금 할 한 가지를 먼저 결정하게 합니다.", strength: "즉시 행동으로 이어지는 구조", caution: "리포트 탐색은 아래 영역으로 밀립니다." },
  { id: "ink-poster", number: "03", lead: "이중섭", role: "디자이너 · 수묵 포스터", title: "한 장의 수묵 포스터", premise: "용과 문장을 화면 전체에 각인시키는 대표 장면입니다.", strength: "가장 강한 브랜드 기억점", caution: "감정적 강도가 높아 취향을 탑니다." },
  { id: "ledger", number: "04", lead: "신사임당", role: "디자이너 · 기록과 균형", title: "기록 색인 표지", premise: "오행의 균형을 오늘의 기준으로 정리해 보여줍니다.", strength: "신뢰감 있는 재방문 구조", caution: "무드보다 정보의 명료함을 우선합니다." },
];

const ELEMENTS = [
  ["wood", "木", "목 · 시작"],
  ["fire", "火", "화 · 표현"],
  ["earth", "土", "토 · 중심"],
  ["metal", "金", "금 · 정리"],
  ["water", "水", "수 · 회복"],
];

export default function HomeImpactDesignsPage() {
  const [selected, setSelected] = useState("prescription");
  const active = DRAFTS.find((draft) => draft.id === selected) ?? DRAFTS[0];

  return (
    <main className="hid-page">
      <header className="hid-header">
        <div>
          <p>SAJULIFE · HOME IMPACT REVIEW</p>
          <h1>첫 화면을<br /><em>기억나는 한 장면</em>으로.</h1>
        </div>
        <aside>
          <b>디자인 회의 / 04</b>
          <span>같은 홈 문제를 네 명이 서로 다른 기준으로 풀었습니다. 실제 사용 흐름은 선택 후 확장합니다.</span>
        </aside>
      </header>

      <div className="hid-element-spectrum" aria-label="사주라이프 오행 색 체계">
        <p>FIVE ELEMENTS / COLOR AS SIGNAL</p>
        <div>{ELEMENTS.map(([tone, character, label]) => <span key={tone} className={`element-${tone}`}><b>{character}</b>{label}</span>)}</div>
      </div>

      <section className="hid-stage">
        <div className="hid-device" key={active.id}>
          {active.id === "prescription" && <Prescription />}
          {active.id === "one-sheet" && <OneSheet />}
          {active.id === "ink-poster" && <InkPoster />}
          {active.id === "ledger" && <IndexLedger />}
        </div>
        <div className="hid-detail">
          <p className="hid-detail-index">{active.number} / 04</p>
          <p className="hid-detail-lead">{active.lead} <span>{active.role}</span></p>
          <h2>{active.title}</h2>
          <p className="hid-detail-premise">{active.premise}</p>
          <dl>
            <div><dt>남는 인상</dt><dd>{active.strength}</dd></div>
            <div><dt>유의할 점</dt><dd>{active.caution}</dd></div>
          </dl>
          <button type="button">이 방향으로 확장하기 <b>↗</b></button>
        </div>
      </section>

      <nav className="hid-selector" aria-label="홈 시안 선택">
        {DRAFTS.map((draft) => (
          <button key={draft.id} type="button" onClick={() => setSelected(draft.id)} className={selected === draft.id ? "is-selected" : ""}>
            <span>{draft.number}</span><b>{draft.lead}</b><small>{draft.title}</small>
          </button>
        ))}
      </nav>
    </main>
  );
}
