"use client";

import { useState } from "react";
import InkTickets from "@/components/home-report-designs/InkTickets";
import LedgerFold from "@/components/home-report-designs/LedgerFold";
import MarketTiles from "@/components/home-report-designs/MarketTiles";
import MoonScroll from "@/components/home-report-designs/MoonScroll";

const DRAFTS = [
  { id: "moon", number: "01", lead: "신윤복", label: "달빛 두루마리", thesis: "배너의 달빛과 여백을 네 개의 조용한 초대장으로 이어갑니다.", note: "가장 감성적이고 부드러운 재방문 경험" },
  { id: "market", number: "02", lead: "김홍도", label: "오행 장터 표찰", thesis: "각 리포트를 행동이 분명한 작은 표찰로 바꿔, 바로 고르게 합니다.", note: "첫 클릭이 가장 빠른 방향" },
  { id: "ink", number: "03", lead: "이중섭", label: "수묵 인장 티켓", thesis: "작은 포스터 네 장으로 리포트를 기억나는 장면으로 만듭니다.", note: "가장 강한 시각 대비와 브랜드 장면" },
  { id: "ledger", number: "04", lead: "신사임당", label: "오행 병풍", thesis: "기록을 한 겹씩 펼치는 듯, 네 흐름을 질서 있게 연결합니다.", note: "배너와 가장 자연스럽게 이어지는 정보 구조" },
];

export default function HomeReportDesignsPage() {
  const [selected, setSelected] = useState("moon");
  const active = DRAFTS.find((draft) => draft.id === selected) ?? DRAFTS[0];
  return (
    <main className="hrd-page">
      <header>
        <p>SAJULIFE · BELOW THE BANNER</p>
        <h1>배너 다음에도<br /><em>같은 세계가 이어지게.</em></h1>
        <span>상단의 수묵 리포트 배너와 자연스럽게 이어지는 네 개의 리포트 입구 시안입니다.</span>
      </header>
      <section className="hrd-stage">
        <div className="hrd-device" key={active.id}>
          {active.id === "moon" && <MoonScroll />}
          {active.id === "market" && <MarketTiles />}
          {active.id === "ink" && <InkTickets />}
          {active.id === "ledger" && <LedgerFold />}
        </div>
        <aside>
          <p>{active.number} / 04</p><b>{active.lead}</b><h2>{active.label}</h2><strong>{active.thesis}</strong><small>{active.note}</small>
          <button type="button">이 방향으로 확장하기 ↗</button>
        </aside>
      </section>
      <nav aria-label="배너 아래 시안 선택">{DRAFTS.map((draft) => <button key={draft.id} type="button" className={selected === draft.id ? "is-selected" : ""} onClick={() => setSelected(draft.id)}><span>{draft.number}</span><b>{draft.lead}</b><small>{draft.label}</small></button>)}</nav>
      <style>{`
        .hrd-page{min-height:100vh;padding:clamp(28px,5vw,72px) clamp(18px,7vw,120px) 44px;color:#2d2923;background:#e9e2d5;background-image:radial-gradient(circle at 8% 5%,#fffdf6 0,transparent 27%),url('/yongsin-dragon-assets/sliced/textures/texture-ivory-grain.png');background-size:auto,180px auto}.hrd-page>header{display:grid;grid-template-columns:1fr auto;gap:14px;max-width:990px;margin:0 auto 42px}.hrd-page>header p{grid-column:1/-1;margin:0;color:#9a693e;font:800 10px Arial,sans-serif;letter-spacing:.14em}.hrd-page>header h1{margin:0;font:400 clamp(31px,4vw,54px)/1.1 'Gowun Batang',Georgia,serif;letter-spacing:-.08em}.hrd-page>header h1 em{color:#a44c35;font-style:normal}.hrd-page>header>span{align-self:end;max-width:255px;color:#6b6257;font:12px/1.6 Arial,sans-serif}.hrd-stage{display:grid;grid-template-columns:minmax(280px,360px) minmax(260px,1fr);gap:clamp(42px,11vw,150px);align-items:center;max-width:890px;margin:auto}.hrd-device{width:min(100%,350px);justify-self:center;padding:8px;border:1px solid #3b342b;border-radius:32px;background:#25221e;box-shadow:0 25px 42px rgba(52,38,22,.24)}.hrd-device>section{min-height:590px;border-radius:24px}.hrd-stage aside p{margin:0 0 13px;color:#a06b3f;font:800 10px Arial,sans-serif;letter-spacing:.14em}.hrd-stage aside>b{font:800 13px Arial,sans-serif}.hrd-stage aside h2{margin:12px 0;font:400 39px/1.08 'Gowun Batang',Georgia,serif;letter-spacing:-.08em}.hrd-stage aside strong{display:block;color:#51483e;font:15px/1.65 Arial,sans-serif;font-weight:500}.hrd-stage aside small{display:block;margin-top:15px;color:#8b7560;font:12px Arial,sans-serif}.hrd-stage aside button{margin-top:29px;padding:13px 15px;border:0;background:#2c2721;color:#fff8ed;font:800 12px Arial,sans-serif;cursor:pointer}.hrd-page nav{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:890px;margin:42px auto 0}.hrd-page nav button{display:grid;grid-template-columns:25px 1fr;gap:1px 7px;min-height:67px;padding:11px;border:1px solid #c5b9a9;background:rgba(255,255,255,.2);color:#42392f;text-align:left;cursor:pointer}.hrd-page nav button.is-selected{border-color:#362e26;background:#362e26;color:#fff8eb}.hrd-page nav span{grid-row:span 2;color:#af7550;font:800 10px Arial,sans-serif}.hrd-page nav b{font:800 12px Arial,sans-serif}.hrd-page nav small{font:10px 'Gowun Dodum',sans-serif;opacity:.7}@media(max-width:680px){.hrd-page{padding:28px 17px 34px}.hrd-page>header{display:block;margin-bottom:28px}.hrd-page>header h1{font-size:32px}.hrd-page>header>span{display:none}.hrd-stage{display:block}.hrd-stage aside{margin:24px 5px 0}.hrd-stage aside h2{font-size:33px}.hrd-page nav{grid-template-columns:repeat(2,1fr);margin-top:28px}.hrd-device{width:min(100%,350px)}}
      `}</style>
    </main>
  );
}
