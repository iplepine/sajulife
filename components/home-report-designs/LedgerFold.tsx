"use client";

const REPORTS = [
  ["내 사주", "나의 중심", "personal", "/yongsin-dragon-assets/sliced/icons/icon-report.png"],
  ["내 용신", "필요한 기운", "yongsin", "/yongsin-dragon-assets/sliced/dragons/dragon-five-elements.png"],
  ["가족 사주", "관계의 온도", "family", "/yongsin-dragon-assets/sliced/icons/icon-family.png"],
  ["내 기질", "나의 반응", "temperament", "/yongsin-dragon-assets/sliced/icons/icon-profile.png"],
];

export default function LedgerFold() {
  return (
    <section className="saim-fold" aria-label="신사임당의 오행 병풍 시안">
      <header><span>SAJULIFE · PERSONAL LEDGER</span><b>07.18</b></header>
      <div className="saim-fold-banner">
        <p>오늘의 나를<br /><em>천천히 펼쳐보기.</em></p>
        <img src="/yongsin-dragon-assets/sliced/icons/icon-report.png" alt="" draggable={false} />
        <i />
      </div>
      <p className="saim-fold-caption">네 겹의 기록을 펼치면, 오늘의 흐름이 이어져요.</p>
      <nav>
        {REPORTS.map(([title, cue, tone, icon]) => (
          <a key={title} href="#" className={`saim-fold-row saim-fold-row--${tone}`}>
            <img src={icon} alt="" draggable={false} /><strong>{title}</strong><small>{cue}</small><b>↗</b>
          </a>
        ))}
      </nav>
      <footer><i /> 나를 읽는 네 개의 기록</footer>
      <style>{`
        .saim-fold{position:relative;min-height:100%;overflow:hidden;padding:19px 17px;color:#30291f;background:#f7f0df;background-image:linear-gradient(rgba(142,113,73,.08) 1px,transparent 1px),url('/yongsin-dragon-assets/sliced/textures/texture-ivory-grain.png');background-size:100% 33px,180px auto;font-family:Arial,'Noto Sans KR',sans-serif}.saim-fold header{display:flex;justify-content:space-between;color:#876544;font-size:8px;font-weight:800;letter-spacing:.11em}.saim-fold-banner{position:relative;height:145px;overflow:hidden;margin:18px -17px 0;padding:22px 18px;border-top:1px solid #b99b76;border-bottom:1px solid #b99b76;background:rgba(255,250,237,.45)}.saim-fold-banner p{position:relative;z-index:2;margin:0;font:400 24px/1.18 Georgia,'Noto Serif KR',serif;letter-spacing:-.09em}.saim-fold-banner em{color:#a86a31;font-style:normal}.saim-fold-banner img{position:absolute;right:17px;bottom:14px;width:74px;height:74px;object-fit:contain;filter:sepia(.23) saturate(.8);transform:rotate(-7deg)}.saim-fold-banner i{position:absolute;top:23px;right:27px;width:28px;border-top:2px solid #b37345;transform:rotate(8deg)}.saim-fold-caption{margin:14px 0 12px;color:#76644e;font:11px/1.5 Arial,sans-serif}.saim-fold nav{display:grid;gap:6px}.saim-fold-row{display:grid;grid-template-columns:33px 1fr auto 16px;gap:8px;align-items:center;min-height:55px;padding:0 10px;border:1px solid #cbbca5;background:rgba(255,252,244,.55);color:#332c24;text-decoration:none;box-shadow:2px 2px 0 rgba(57,41,22,.08);transition:transform .18s ease}.saim-fold-row:hover{transform:translateX(3px)}.saim-fold-row img{width:28px;height:28px;object-fit:contain;filter:sepia(.15) saturate(.85)}.saim-fold-row strong{font:700 13px Arial,sans-serif}.saim-fold-row small{color:#806c55;font-size:9px}.saim-fold-row b{color:#594838;font-size:13px}.saim-fold-row--personal{border-left:4px solid #a46d2e}.saim-fold-row--yongsin{border-left:4px solid #315eb4}.saim-fold-row--family{border-left:4px solid #d65b43}.saim-fold-row--temperament{border-left:4px solid #378965}.saim-fold footer{display:flex;align-items:center;gap:8px;margin-top:15px;color:#8a765e;font:9px Georgia,serif;letter-spacing:.09em}.saim-fold footer i{width:24px;height:1px;background:#a66b43}@media(max-width:360px){.saim-fold-row small{display:none}.saim-fold-row{grid-template-columns:33px 1fr 16px}}
      `}</style>
    </section>
  );
}
