// 가족 리포트 후보 투표 HTML 빌더 — AI 호출 0.
// scratchpad의 family-r1~r6.json + 하네스 페르소나 점수를 임베드해
// 외부 전송 없는 self-contained 단일 HTML(로컬에서 열어 투표)로 떨군다.
// 사용: tsx scripts/eval/build-vote-html.ts [출력경로.html] [리포트JSON디렉터리]
//   리포트 디렉터리(family-r1~r6.json 위치)는 하네스 산출물이라 repo 밖(scratchpad 등)에 있다 — argv[3]로 넘긴다.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = process.argv[3] || join(__dirname, "out", "reports");

type Report = { title: string; sections: { id: string; summary: string; body: string }[]; actionPlan: { title: string; timeframe: string; hint: string }[]; disclaimer: string };

// 하네스 5페르소나 채점 종합(라운드별). crit = 필수 6기준 5인 평균. personas = 페르소나별 overall.
const CANDIDATES = [
  {
    id: "r1", round: "R1", version: "v11", label: "baseline (개선 전)",
    crit: { 가독성: 8.6, 유용성: 8.7, 가족표현: 8.9, 정서안전: 7.8, 구체성: 8.7, 중복없음: 6.5 },
    personas: { 에디터: 7.8, 바넘헌터: 8.3, 당사자: 7.8, 실속파: 7.9, 명리감수: 8.6 },
    overall: 8.08, adjusted: 8.54,
    note: "원본 프롬프트. 탄탄하지만 아이 낙인·죄책감 프레임·복붙 중복이 남아 있던 시작점.",
  },
  {
    id: "r2", round: "R2", version: "v12", label: "반복금지·안전 1차",
    crit: { 가독성: 8.7, 유용성: 8.6, 가족표현: 9.0, 정서안전: 8.6, 구체성: 8.6, 중복없음: 7.2 },
    personas: { 에디터: 8.5, 바넘헌터: 8.0, 당사자: 8.1, 실속파: 8.3, 명리감수: 8.9 },
    overall: 8.36, adjusted: 8.70,
    note: "6기준 종합 최고점(overall 8.36). 반복·아이 낙인·지어내기 규칙을 처음 넣은 판.",
  },
  {
    id: "r3", round: "R3", version: "v13", label: "협박형·pop-psych 봉쇄",
    crit: { 가독성: 8.8, 유용성: 8.2, 가족표현: 8.6, 정서안전: 8.6, 구체성: 8.7, 중복없음: 7.3 },
    personas: { 에디터: 8.4, 바넘헌터: 7.5, 당사자: 8.3, 실속파: 8.3, 명리감수: 8.9 },
    overall: 8.28, adjusted: 8.58,
    note: "협박형 변형·부모 편가르기·pop-psych 차단. 중복 최고(7.3).",
  },
  {
    id: "r4", round: "R4", version: "v14", label: "모티프 1소유·양방향",
    crit: { 가독성: 8.5, 유용성: 8.2, 가족표현: 8.4, 정서안전: 8.7, 구체성: 8.4, 중복없음: 7.2 },
    personas: { 에디터: 8.1, 바넘헌터: 7.4, 당사자: 8.5, 실속파: 7.9, 명리감수: 8.8 },
    overall: 8.14, adjusted: 8.44,
    note: "모티프 1소유 + 중복제거 패스, actionPlan 다양화. 안전 정점 흐름.",
  },
  {
    id: "r5", round: "R5", version: "v15", label: "섹션별 다른 신호(롤백됨)",
    crit: { 가독성: 8.4, 유용성: 8.2, 가족표현: 8.1, 정서안전: 8.4, 구체성: 8.5, 중복없음: 6.8 },
    personas: { 에디터: 7.9, 바넘헌터: 7.5, 당사자: 7.7, 실속파: 8.4, 명리감수: 8.3 },
    overall: 7.96, adjusted: 8.32,
    note: "'섹션별 다른 사주 신호' 규칙 S 투입 — 순위 회귀를 유발해 이후 롤백된 판.",
  },
  {
    id: "r6", round: "R6", version: "v16", label: "최종 (규칙 S 롤백 + 안전 유지)",
    crit: { 가독성: 8.5, 유용성: 8.3, 가족표현: 8.4, 정서안전: 8.8, 구체성: 8.5, 중복없음: 6.9 },
    personas: { 에디터: 8.3, 바넘헌터: 8.2, 당사자: 7.8, 실속파: 7.8, 명리감수: 8.2 },
    overall: 8.06, adjusted: 8.50, passRecalib: true,
    note: "최종 프롬프트. 정서안전 8.8(6라운드 최고). 재보정 게이트(중복 제외 평균 8.5) 통과.",
  },
];

function loadReports() {
  return CANDIDATES.map((c) => ({
    ...c,
    report: JSON.parse(readFileSync(join(REPORTS_DIR, `family-${c.id}.json`), "utf8")) as Report,
  }));
}

function esc(s: string): string {
  return JSON.stringify(s);
}

function main() {
  const outPath = process.argv[2] || join(__dirname, "out", "report-vote.html");
  const data = loadReports();
  const DATA_JSON = JSON.stringify(data).replace(/</g, "\\u003c");

  const html = TEMPLATE.replace("/*__DATA__*/", `window.__VOTE_DATA__ = ${DATA_JSON};`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  const bytes = Buffer.byteLength(html);
  console.log(`빌드 완료: ${(bytes / 1024).toFixed(0)}KB · ${data.length}개 후보 → ${outPath}`);
  console.log(`열기:  open "${outPath}"`);
  void esc;
}

const TEMPLATE = String.raw`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>가족 리포트 후보 투표</title>
<style>
:root{
  --bg:#ece2cf; --grain:#e4d8c0; --surface:#faf5ea; --surface2:#f3ebda;
  --ink:#2a2520; --ink2:#4b433a; --muted:#7c7264; --line:#d8ccb4; --line2:#cabfa4;
  --accent:#8a6d3b;            /* 먹빛 금 */
  --signal:#b4472c;            /* 신호(내 선택) */
  --good:#4f7a53; --warn:#b4472c;
  --shadow:0 1px 2px rgba(60,45,25,.06),0 8px 24px rgba(60,45,25,.08);
  --radius:14px;
  --sans:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Segoe UI",Roboto,"Noto Sans KR",sans-serif;
  --serif:"Apple SD Gothic Neo","Nanum Myeongjo",ui-serif,Georgia,serif;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#191612; --grain:#201c16; --surface:#231f19; --surface2:#2b261f;
    --ink:#ece3d2; --ink2:#c9bfab; --muted:#9a8f7c; --line:#3a342a; --line2:#48412f;
    --accent:#cbab6d; --signal:#e0805f; --good:#8bb98d; --warn:#e0805f;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.35);
  }
}
:root[data-theme="light"]{
  --bg:#ece2cf; --grain:#e4d8c0; --surface:#faf5ea; --surface2:#f3ebda;
  --ink:#2a2520; --ink2:#4b433a; --muted:#7c7264; --line:#d8ccb4; --line2:#cabfa4;
  --accent:#8a6d3b; --signal:#b4472c; --good:#4f7a53; --warn:#b4472c;
  --shadow:0 1px 2px rgba(60,45,25,.06),0 8px 24px rgba(60,45,25,.08);
}
:root[data-theme="dark"]{
  --bg:#191612; --grain:#201c16; --surface:#231f19; --surface2:#2b261f;
  --ink:#ece3d2; --ink2:#c9bfab; --muted:#9a8f7c; --line:#3a342a; --line2:#48412f;
  --accent:#cbab6d; --signal:#e0805f; --good:#8bb98d; --warn:#e0805f;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 10px 30px rgba(0,0,0,.35);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
  line-height:1.68;font-size:16px;-webkit-font-smoothing:antialiased;letter-spacing:-.01em}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.5;
  background:radial-gradient(circle at 20% 10%,var(--grain),transparent 60%),
             radial-gradient(circle at 85% 80%,var(--grain),transparent 55%)}
.wrap{max-width:860px;margin:0 auto;padding:0 18px 120px;position:relative;z-index:1}
a{color:var(--accent)}
button{font-family:inherit;cursor:pointer}

/* header */
header.top{padding:40px 0 20px}
.eyebrow{font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:700}
h1.title{font-family:var(--serif);font-size:clamp(26px,5vw,36px);line-height:1.2;margin:.35em 0 .3em;font-weight:800}
.sub{color:var(--ink2);font-size:15px;max-width:60ch}
.legend{margin-top:16px;display:flex;flex-wrap:wrap;gap:8px 16px;font-size:12.5px;color:var(--muted)}
.legend b{color:var(--ink2)}

/* sticky nav */
.nav{position:sticky;top:0;z-index:20;margin:18px -18px 0;padding:10px 18px;
  background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);
  border-bottom:1px solid var(--line)}
.nav-row{display:flex;gap:8px;align-items:center;overflow-x:auto;scrollbar-width:thin}
.chip{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;
  border:1px solid var(--line2);background:var(--surface);border-radius:11px;
  padding:6px 11px;min-width:66px;text-decoration:none;color:var(--ink);transition:.15s}
.chip:hover{border-color:var(--accent)}
.chip.win{border-color:var(--signal);box-shadow:0 0 0 1px var(--signal)}
.chip .r{font-weight:800;font-size:13px}
.chip .v{font-size:10.5px;color:var(--muted)}
.chip .myscore{font-size:12px;font-weight:800;color:var(--accent);min-height:15px}
.chip .myscore.empty{color:var(--line2)}
.nav-actions{margin-left:auto;display:flex;gap:8px;flex:0 0 auto}
.btn{border:1px solid var(--line2);background:var(--surface);color:var(--ink);
  border-radius:10px;padding:7px 12px;font-size:13px;font-weight:700;white-space:nowrap}
.btn:hover{border-color:var(--accent)}
.btn.primary{background:var(--accent);color:#fff;border-color:var(--accent)}
:root[data-theme="dark"] .btn.primary,@media(prefers-color-scheme:dark){.btn.primary{color:#241d10}}

/* candidate card */
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);
  box-shadow:var(--shadow);margin-top:22px;overflow:hidden;scroll-margin-top:78px}
.card.win{border-color:var(--signal);box-shadow:0 0 0 1px var(--signal),var(--shadow)}
.card-head{padding:18px 20px 4px}
.badges{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}
.badge{font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px;border:1px solid var(--line2);color:var(--ink2);background:var(--surface2)}
.badge.round{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.badge.pass{background:var(--good);color:#fff;border-color:var(--good)}
.badge.rollback{color:var(--muted)}
.badge.safe{border-color:var(--accent);color:var(--accent)}
.card-title{font-family:var(--serif);font-size:clamp(18px,3.4vw,22px);line-height:1.32;font-weight:800;margin:2px 0 2px}
.card-note{font-size:13px;color:var(--muted);margin:0 0 4px}

/* score strip */
.scorestrip{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;background:var(--line);
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-top:12px}
.scorestrip .s{background:var(--surface2);padding:8px 12px;text-align:center}
.scorestrip .s .k{font-size:10.5px;letter-spacing:.06em;color:var(--muted);text-transform:uppercase;font-weight:700}
.scorestrip .s .v{font-size:19px;font-weight:800;font-variant-numeric:tabular-nums;margin-top:1px}
.scorestrip .s.hi .v{color:var(--accent)}

/* vote panel */
.vote{padding:16px 20px;border-bottom:1px solid var(--line);background:var(--surface2)}
.vote h4{margin:0 0 10px;font-size:13px;letter-spacing:.02em;color:var(--ink2)}
.slider-row{display:flex;align-items:center;gap:14px}
.slider-row input[type=range]{flex:1;accent-color:var(--accent);height:4px}
.myval{font-variant-numeric:tabular-nums;font-weight:800;font-size:22px;min-width:2.4ch;text-align:right}
.myval.empty{color:var(--line2);font-weight:600;font-size:14px}
.ticks{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin:2px 2px 0}
.vote-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}
.winbtn{border:1.5px solid var(--line2);background:var(--surface);color:var(--ink2);
  border-radius:10px;padding:8px 14px;font-weight:800;font-size:13.5px;display:flex;gap:6px;align-items:center}
.winbtn:hover{border-color:var(--signal);color:var(--signal)}
.winbtn.on{background:var(--signal);color:#fff;border-color:var(--signal)}
.clearbtn{background:none;border:none;color:var(--muted);font-size:12.5px;text-decoration:underline;padding:4px}
textarea.notes{width:100%;margin-top:10px;min-height:44px;resize:vertical;border:1px solid var(--line2);
  border-radius:10px;background:var(--surface);color:var(--ink);padding:9px 11px;font:inherit;font-size:14px}
textarea.notes:focus{outline:2px solid var(--accent);outline-offset:1px}

/* report body */
.report-toggle{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;cursor:pointer;
  background:none;border:none;width:100%;color:var(--ink);font:inherit;font-weight:700;font-size:14px}
.report-toggle .arw{transition:.2s;color:var(--muted)}
.report-toggle[aria-expanded=true] .arw{transform:rotate(90deg)}
.report{padding:0 20px 8px}
.report section.sec{padding:14px 0;border-top:1px solid var(--line)}
.report section.sec:first-child{border-top:none}
.sec-id{font-family:var(--serif);font-size:16.5px;font-weight:800;margin:0 0 3px}
.sec-sum{color:var(--accent);font-size:14px;font-weight:600;margin:0 0 10px}
.report-collapsed .sec-body{display:none}
.report-collapsed .sec{padding:9px 0}
.sec-body{font-size:14.5px;color:var(--ink2)}
.sec-body h6.sub{font-size:13.5px;font-weight:800;color:var(--ink);margin:14px 0 5px;letter-spacing:.01em}
.sec-body h6.sub::before{content:"";display:inline-block;width:14px;height:1.5px;background:var(--accent);vertical-align:middle;margin-right:7px}
.sec-body h6.rel{font-size:14px;font-weight:800;color:var(--ink);margin:14px 0 5px;padding-left:2px;border-left:3px solid var(--accent);padding-left:9px}
.sec-body h6.scenario{font-size:14px;font-weight:800;color:var(--signal);margin:14px 0 5px}
.sec-body p{margin:7px 0}
.sec-body p.move{background:var(--surface2);border-left:3px solid var(--signal);padding:8px 12px;border-radius:0 8px 8px 0;margin:8px 0;font-size:14px}
.sec-body ul{margin:6px 0;padding-left:4px;list-style:none}
.sec-body li{position:relative;padding-left:16px;margin:5px 0}
.sec-body li::before{content:"·";position:absolute;left:3px;top:-1px;color:var(--accent);font-weight:800}
.sec-body li.deep{padding-left:26px}
.sec-body li.deep::before{content:"▸";left:12px;font-size:10px;top:1px}
.actions{margin-top:12px;padding-top:12px;border-top:1px dashed var(--line2)}
.actions h5{margin:0 0 8px;font-size:13.5px;font-weight:800}
.act{display:flex;gap:10px;align-items:baseline;padding:7px 0;border-top:1px solid var(--line)}
.act:first-of-type{border-top:none}
.tf{flex:0 0 auto;font-size:11px;font-weight:800;background:var(--ink);color:var(--bg);border-radius:6px;padding:2px 8px;white-space:nowrap}
.act .at{font-weight:600;font-size:14px}
.act .ah{color:var(--muted);font-size:12.5px;display:block;margin-top:1px}
.disc{margin-top:12px;font-size:12.5px;color:var(--muted);font-style:italic}

/* persona detail */
.pd{margin:0 20px 16px}
.pd summary{cursor:pointer;font-size:12.5px;color:var(--muted);font-weight:700;padding:8px 0;list-style:none}
.pd summary::-webkit-details-marker{display:none}
.pd summary::before{content:"▸ ";color:var(--accent)}
.pd[open] summary::before{content:"▾ "}
.ptable{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:6px}
.ptable th,.ptable td{padding:5px 8px;text-align:center;border-bottom:1px solid var(--line)}
.ptable th:first-child,.ptable td:first-child{text-align:left;color:var(--ink2)}
.ptable th{color:var(--muted);font-weight:700;font-size:11px}
.ptable td.n{font-variant-numeric:tabular-nums;font-weight:700}

/* results dialog */
dialog#results{border:none;border-radius:16px;padding:0;max-width:640px;width:calc(100% - 32px);
  background:var(--surface);color:var(--ink);box-shadow:0 20px 60px rgba(0,0,0,.35)}
dialog#results::backdrop{background:rgba(30,22,10,.5);backdrop-filter:blur(3px)}
.rz{padding:22px 24px}
.rz h2{font-family:var(--serif);margin:0 0 4px;font-size:22px}
.rz .rsub{color:var(--muted);font-size:13px;margin:0 0 16px}
.lead{display:flex;flex-direction:column;gap:8px}
.lrow{display:grid;grid-template-columns:22px 1fr;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;border:1px solid var(--line)}
.lrow.first{border-color:var(--signal);background:var(--surface2)}
.lrank{font-weight:800;font-variant-numeric:tabular-nums;text-align:center;color:var(--muted)}
.lrow.first .lrank{color:var(--signal)}
.lmain{min-width:0}
.lname{font-weight:700;font-size:14px;display:flex;gap:6px;align-items:center}
.lname .rr{font-size:11px;color:var(--muted);font-weight:700}
.bars{display:flex;flex-direction:column;gap:3px;margin-top:5px}
.bar{display:grid;grid-template-columns:52px 1fr 34px;gap:7px;align-items:center;font-size:10.5px;color:var(--muted)}
.track{height:7px;background:var(--surface2);border-radius:4px;overflow:hidden;border:1px solid var(--line)}
.fill{height:100%;border-radius:4px}
.fill.mine{background:var(--signal)}
.fill.persona{background:var(--accent)}
.fill.adj{background:var(--ink2)}
.bar .bv{text-align:right;font-variant-numeric:tabular-nums;color:var(--ink2);font-weight:700}
.rz .rz-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);
  padding:9px 16px;border-radius:10px;font-size:13px;font-weight:700;z-index:60;opacity:0;transition:.25s;pointer-events:none}
.toast.show{opacity:1}
footer{margin-top:36px;padding-top:18px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}
.hint-note{font-size:12px;color:var(--muted);margin:4px 0 0}
@media(max-width:560px){.scorestrip{grid-template-columns:1fr 1fr 1fr}.slider-row{gap:9px}}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <div class="eyebrow">가족사주 리포트 · 후보 비교</div>
    <h1 class="title">어느 판이 제일 잘 읽혀? 직접 골라봐</h1>
    <p class="sub">박정호家(본인·배우자 서지민·아들 재윤) 기준으로 프롬프트를 6번 고쳐가며 뽑은 후보들이야.
      각 리포트를 쭉 읽고 <b>0~10점</b>으로 매기고, 제일 마음에 드는 하나를 <b>★ 최종 선택</b>해줘.
      점수는 이 브라우저에만 저장돼(외부 전송 없음).</p>
    <div class="legend">
      <span><b>페르소나 종합</b> = 5인 채점단 6기준 평균</span>
      <span><b>재보정</b> = 중복·반증가능성 제외 5기준 평균(게이트 8.5)</span>
      <span><b>안전</b> = 정서안전 점수</span>
    </div>
  </header>

  <nav class="nav">
    <div class="nav-row" id="navRow"></div>
  </nav>

  <main id="feed"></main>

  <footer>
    내부용 비교 도구 · 데이터는 브라우저 localStorage에만 저장됩니다(서버 전송 없음).
    하네스: <code>scripts/eval/render-real-family.ts</code> → Claude 생성 → 5페르소나 채점.
  </footer>
</div>

<dialog id="results">
  <div class="rz">
    <h2>투표 결과</h2>
    <p class="rsub" id="rSub"></p>
    <div class="lead" id="lead"></div>
    <div class="rz-actions">
      <button class="btn primary" id="copyBtn">결과 복사(JSON)</button>
      <button class="btn" id="downloadBtn">파일로 저장</button>
      <button class="btn" id="resetBtn">전체 초기화</button>
      <button class="btn" id="closeBtn" style="margin-left:auto">닫기</button>
    </div>
  </div>
</dialog>
<div class="toast" id="toast"></div>

<script>
/*__DATA__*/
</script>
<script>
(function(){
  "use strict";
  var DATA = window.__VOTE_DATA__ || [];
  var CRIT_KEYS = ["가독성","유용성","가족표현","정서안전","구체성","중복없음"];
  var PERSONA_KEYS = ["에디터","바넘헌터","당사자","실속파","명리감수"];
  var LS = "famReportVote.v2";
  var state = load();

  function load(){
    try{ var s = JSON.parse(localStorage.getItem(LS)||"{}");
      return { scores:s.scores||{}, notes:s.notes||{}, winner:s.winner||null, open:s.open||{} };
    }catch(e){ return {scores:{},notes:{},winner:null,open:{}}; }
  }
  function save(){ try{ localStorage.setItem(LS, JSON.stringify(state)); }catch(e){} }

  // ---- marker renderer ----
  function renderBody(body){
    var lines = String(body).split("\n");
    var out = [], list = null;
    function flush(){ if(list){ out.push("<ul>"+list.join("")+"</ul>"); list=null; } }
    for(var i=0;i<lines.length;i++){
      var raw = lines[i]; var t = raw.trim();
      if(!t){ flush(); continue; }
      var c = t.charAt(0);
      if(c==="─"){ flush(); out.push("<h6 class='sub'>"+e(t.replace(/^─\s*/,""))+"</h6>"); }
      else if(c==="◆"){ flush(); out.push("<h6 class='rel'>"+e(t.replace(/^◆\s*/,""))+"</h6>"); }
      else if(c==="●"){ flush(); out.push("<h6 class='scenario'>"+e(t.replace(/^●\s*/,""))+"</h6>"); }
      else if(c==="→"){ flush(); out.push("<p class='move'>"+e(t.replace(/^→\s*/,""))+"</p>"); }
      else if(c==="•"){ (list=list||[]).push("<li>"+e(t.replace(/^•\s*/,""))+"</li>"); }
      else if(c==="▸"){ (list=list||[]).push("<li class='deep'>"+e(t.replace(/^▸\s*/,""))+"</li>"); }
      else if(c==="·"||c==="･"||c==="・"){ (list=list||[]).push("<li>"+e(t.replace(/^[·･・]\s*/,""))+"</li>"); }
      else { flush(); out.push("<p>"+e(t)+"</p>"); }
    }
    flush();
    return out.join("");
  }
  function e(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  // ---- build cards ----
  var feed = document.getElementById("feed");
  var navRow = document.getElementById("navRow");
  DATA.forEach(function(c){
    navRow.appendChild(navChip(c));
    feed.appendChild(card(c));
  });
  navRow.insertAdjacentHTML("beforeend",
    "<div class='nav-actions'>"+
    "<button class='btn' id='expandAll'>본문 모두 펼치기</button>"+
    "<button class='btn primary' id='resultsBtn'>결과 보기</button></div>");
  document.getElementById("resultsBtn").onclick = openResults;
  var allOpen=false;
  document.getElementById("expandAll").onclick = function(){
    allOpen=!allOpen;
    DATA.forEach(function(c){ setOpen(c.id, allOpen); });
    this.textContent = allOpen? "본문 모두 접기":"본문 모두 펼치기";
  };

  function navChip(c){
    var a=document.createElement("a"); a.href="#card-"+c.id; a.className="chip"; a.id="chip-"+c.id;
    a.innerHTML="<span class='r'>"+c.round+"</span><span class='v'>"+c.version+"</span>"+
      "<span class='myscore empty' id='chipsc-"+c.id+"'>–</span>";
    return a;
  }

  function card(c){
    var el=document.createElement("article"); el.className="card"; el.id="card-"+c.id;
    var r=c.report;
    var passBadge = c.passRecalib? "<span class='badge pass'>재보정 통과</span>" : "";
    var rollback = c.id==="r5"? "<span class='badge rollback'>롤백됨</span>" : "";
    var head =
      "<div class='card-head'>"+
        "<div class='badges'>"+
          "<span class='badge round'>"+c.round+" · "+c.version+"</span>"+
          "<span class='badge'>"+e(c.label)+"</span>"+ passBadge + rollback +
          "<span class='badge safe'>안전 "+c.crit["정서안전"].toFixed(1)+"</span>"+
        "</div>"+
        "<div class='card-title'>"+e(r.title)+"</div>"+
        "<p class='card-note'>"+e(c.note)+"</p>"+
      "</div>"+
      "<div class='scorestrip'>"+
        strip("페르소나 종합", c.overall, false)+
        strip("재보정", c.adjusted, true)+
        strip("안전", c.crit["정서안전"], false)+
      "</div>";

    var vote =
      "<div class='vote'>"+
        "<h4>내 평가</h4>"+
        "<div class='slider-row'>"+
          "<input type='range' min='0' max='10' step='0.5' aria-label='"+c.round+" 점수' id='rg-"+c.id+"'>"+
          "<span class='myval empty' id='mv-"+c.id+"'>미평가</span>"+
        "</div>"+
        "<div class='ticks'><span>0</span><span>5</span><span>10</span></div>"+
        "<div class='vote-actions'>"+
          "<button class='winbtn' id='win-"+c.id+"'>★ 최종 선택</button>"+
          "<button class='clearbtn' id='clr-"+c.id+"'>점수 지우기</button>"+
        "</div>"+
        "<textarea class='notes' id='nt-"+c.id+"' placeholder='메모(선택) — 왜 좋고 왜 별로인지'></textarea>"+
      "</div>";

    var toggle="<button class='report-toggle' id='tg-"+c.id+"' aria-expanded='false'>"+
      "<span>리포트 본문 "+r.sections.length+"섹션 · 액션 "+r.actionPlan.length+"개</span>"+
      "<span class='arw'>›</span></button>";

    var body="<div class='report report-collapsed' id='rp-"+c.id+"'>"+ reportHTML(r) +"</div>";

    var pd = "<details class='pd'><summary>페르소나별 상세 점수</summary>"+ personaTable(c) +"</details>";

    el.innerHTML = head + vote + toggle + body + pd;
    return el;
  }

  function strip(k,v,hi){
    return "<div class='s"+(hi?" hi":"")+"'><div class='k'>"+k+"</div><div class='v'>"+v.toFixed(2)+"</div></div>";
  }

  function reportHTML(r){
    var h="";
    r.sections.forEach(function(s){
      h+="<section class='sec'><div class='sec-id'>"+e(s.id)+"</div>"+
         "<div class='sec-sum'>"+e(s.summary)+"</div>"+
         "<div class='sec-body'>"+renderBody(s.body)+"</div></section>";
    });
    h+="<div class='actions'><h5>코칭 액션 플랜</h5>";
    r.actionPlan.forEach(function(a){
      h+="<div class='act'><span class='tf'>"+e(a.timeframe)+"</span><div><span class='at'>"+e(a.title)+"</span>"+
         "<span class='ah'>"+e(a.hint)+"</span></div></div>";
    });
    h+="</div>";
    h+="<p class='disc'>"+e(r.disclaimer)+"</p>";
    return h;
  }

  function personaTable(c){
    var head="<tr><th>기준</th>"+PERSONA_KEYS.map(function(p){return "<th>"+p+"</th>";}).join("")+"</tr>";
    var crit="<tr><td>필수 6기준 평균</td><td class='n' colspan='"+PERSONA_KEYS.length+"' style='text-align:center'>"+
      CRIT_KEYS.map(function(k){return k+" "+c.crit[k].toFixed(1);}).join(" · ")+"</td></tr>";
    var pr="<tr><td>페르소나 overall</td>"+PERSONA_KEYS.map(function(p){return "<td class='n'>"+c.personas[p].toFixed(1)+"</td>";}).join("")+"</tr>";
    return "<table class='ptable'>"+head+crit+pr+"</table>";
  }

  // ---- wire per-card interactions ----
  DATA.forEach(function(c){
    var rg=document.getElementById("rg-"+c.id);
    var sc = state.scores[c.id];
    if(sc!=null){ rg.value=sc; } else { rg.value=0; }
    reflectScore(c.id);
    rg.addEventListener("input",function(){ state.scores[c.id]=parseFloat(rg.value); reflectScore(c.id); save(); });
    document.getElementById("clr-"+c.id).onclick=function(){ delete state.scores[c.id]; rg.value=0; reflectScore(c.id); save(); };
    var nt=document.getElementById("nt-"+c.id); nt.value=state.notes[c.id]||"";
    nt.addEventListener("input",function(){ state.notes[c.id]=nt.value; save(); });
    var win=document.getElementById("win-"+c.id);
    win.onclick=function(){ state.winner = (state.winner===c.id? null : c.id); reflectWinner(); save(); };
    var tg=document.getElementById("tg-"+c.id);
    tg.onclick=function(){ setOpen(c.id, tg.getAttribute("aria-expanded")!=="true"); };
    if(state.open[c.id]) setOpen(c.id, true);
  });
  reflectWinner();

  function reflectScore(id){
    var sc=state.scores[id];
    var mv=document.getElementById("mv-"+id);
    var chip=document.getElementById("chipsc-"+id);
    if(sc==null){ mv.textContent="미평가"; mv.classList.add("empty"); chip.textContent="–"; chip.classList.add("empty"); }
    else{ mv.textContent=sc.toFixed(1); mv.classList.remove("empty"); chip.textContent=sc.toFixed(1); chip.classList.remove("empty"); }
  }
  function reflectWinner(){
    DATA.forEach(function(c){
      var on = state.winner===c.id;
      var b=document.getElementById("win-"+c.id); b.classList.toggle("on",on);
      b.innerHTML = on? "★ 최종 선택됨" : "★ 최종 선택";
      document.getElementById("card-"+c.id).classList.toggle("win",on);
      document.getElementById("chip-"+c.id).classList.toggle("win",on);
    });
  }
  function setOpen(id,open){
    state.open[id]=open; save();
    var rp=document.getElementById("rp-"+id), tg=document.getElementById("tg-"+id);
    rp.classList.toggle("report-collapsed",!open);
    tg.setAttribute("aria-expanded", open?"true":"false");
  }

  // ---- results ----
  var dlg=document.getElementById("results");
  function openResults(){
    var rated=DATA.filter(function(c){return state.scores[c.id]!=null;});
    var ranked=DATA.slice().sort(function(a,b){
      var sa=state.scores[a.id], sb=state.scores[b.id];
      if(sa==null&&sb==null) return 0; if(sa==null) return 1; if(sb==null) return -1;
      return sb-sa;
    });
    var winName = state.winner? DATA.filter(function(c){return c.id===state.winner;})[0] : null;
    document.getElementById("rSub").textContent =
      (rated.length+"/"+DATA.length+" 평가함")+(winName? " · 최종 선택: "+winName.round+" ("+winName.version+")":" · 최종 선택 없음");
    var lead=document.getElementById("lead"); lead.innerHTML="";
    ranked.forEach(function(c,i){
      var my=state.scores[c.id];
      var row=document.createElement("div"); row.className="lrow"+(i===0&&my!=null?" first":"")+(c.id===state.winner?" first":"");
      row.innerHTML=
        "<div class='lrank'>"+(my!=null?(i+1):"–")+"</div>"+
        "<div class='lmain'><div class='lname'>"+(c.id===state.winner?"★ ":"")+c.round+
          " <span class='rr'>"+c.version+" · "+e(c.label)+"</span></div>"+
          "<div class='bars'>"+
            barRow("내 점수", my, "mine")+
            barRow("종합", c.overall, "persona")+
            barRow("재보정", c.adjusted, "adj")+
          "</div></div>";
      lead.appendChild(row);
    });
    if(typeof dlg.showModal==="function") dlg.showModal(); else dlg.setAttribute("open","");
  }
  function barRow(label,val,cls){
    var pct = val==null? 0 : Math.max(0,Math.min(100,(val/10)*100));
    var txt = val==null? "–" : val.toFixed(val%1?1:2).replace(/\.00$/,".0");
    return "<div class='bar'><span>"+label+"</span><span class='track'><span class='fill "+cls+"' style='width:"+pct+"%'></span></span><span class='bv'>"+txt+"</span></div>";
  }
  document.getElementById("closeBtn").onclick=function(){ dlg.close&&dlg.close(); dlg.removeAttribute("open"); };
  dlg.addEventListener("click",function(ev){ if(ev.target===dlg){ dlg.close&&dlg.close(); dlg.removeAttribute("open"); } });

  function payload(){
    return {
      tool:"family-report-vote", ts:new Date().toISOString(),
      winner: state.winner,
      votes: DATA.map(function(c){ return {round:c.round,version:c.version,myScore:state.scores[c.id]!=null?state.scores[c.id]:null,
        note:state.notes[c.id]||"", personaOverall:c.overall, adjusted:c.adjusted, safety:c.crit["정서안전"]}; })
    };
  }
  document.getElementById("copyBtn").onclick=function(){
    var s=JSON.stringify(payload(),null,2);
    if(navigator.clipboard){ navigator.clipboard.writeText(s).then(function(){toast("결과를 복사했어");},function(){toast("복사 실패 — 파일로 저장해줘");}); }
    else toast("복사 미지원 — 파일로 저장해줘");
  };
  document.getElementById("downloadBtn").onclick=function(){
    var blob=new Blob([JSON.stringify(payload(),null,2)],{type:"application/json"});
    var a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="family-report-vote.json"; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
    toast("저장했어");
  };
  document.getElementById("resetBtn").onclick=function(){
    if(!confirm("모든 점수·메모·선택을 지울까?")) return;
    state={scores:{},notes:{},winner:null,open:{}}; save();
    DATA.forEach(function(c){ var rg=document.getElementById("rg-"+c.id); rg.value=0; reflectScore(c.id);
      document.getElementById("nt-"+c.id).value=""; });
    reflectWinner(); dlg.close&&dlg.close(); dlg.removeAttribute("open"); toast("초기화했어");
  };
  var toastEl=document.getElementById("toast"), toastT;
  function toast(m){ toastEl.textContent=m; toastEl.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(function(){toastEl.classList.remove("show");},1800); }
})();
</script>
</body>
</html>`;

main();
