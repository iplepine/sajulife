# 버전 개선 실험 → 자체완결 HTML 보고서 빌더 (AI 호출 0)
import json, re, html, os
from datetime import datetime

ROOT = "scripts/eval/out"
VROOT = f"{ROOT}/versions"
OUT = f"{VROOT}/리포트개선보고서.html"

KIND_LABEL = {"saju":"개인 사주","tci":"기질","fusion":"융합","family":"가족","consult":"상담"}
KINDS = ["saju","tci","fusion","family","consult"]

scores = json.load(open(f"{VROOT}/scores.json"))         # 16 distinct
manifest = json.load(open(f"{VROOT}/manifest.json"))     # 20 slots
score_by = {(s["kind"], s["version"]): s["judge"] for s in scores}

def report_path(kind, v):
    return f"{ROOT}/reports/me-{kind}.txt" if v == 1 else f"{VROOT}/reports/{kind}-v{v}.txt"

# (kind,v) → 실제 보여줄 (소스 버전, 변경여부)
slot = {}
for m in manifest:
    k, v = m["kind"], m["version"]
    src = v if m["changed"] else m["sameAs"]
    slot[(k, v)] = {"src": src, "changed": m["changed"]}

# ---------- 리포트 본문 → 읽기용 HTML ----------
def esc(s): return html.escape(s or "")

def body_block(text):
    # \n 보존, 마커는 그대로 — pre-wrap div
    return f'<div class="body">{esc(text).strip()}</div>'

def flatten_json_html(o):
    L = []
    if o.get("title"): L.append(f'<h4 class="rtitle">{esc(o["title"])}</h4>')
    kw = o.get("keywords") or []
    if kw:
        L.append('<ul class="kw">')
        for k in kw: L.append(f'<li><b>{esc(k.get("word",""))}</b> — {esc(k.get("desc",""))}</li>')
        L.append('</ul>')
    for c in (o.get("cast") or []):
        L.append(f'<p>· ({esc(c.get("relation",""))}) <b>{esc(c.get("name",""))}</b> — {esc(c.get("character",""))}</p>')
    for s in (o.get("sections") or []):
        L.append(f'<div class="sec"><div class="sec-h">{esc(s.get("id",""))}</div>')
        if s.get("summary"): L.append(f'<div class="sec-s">{esc(s["summary"])}</div>')
        L.append(body_block(s.get("body","")))
        L.append('</div>')
    for c in (o.get("compat") or []):
        L.append(f'<div class="sec"><div class="sec-h">{esc(c.get("relation",""))} · {esc(c.get("name",""))}</div>')
        for lab,key in [("만남","meeting"),("잘 맞는 순간","goodMoments"),("부딪치는 순간","frictionMoments"),("시도","oneTry")]:
            if c.get(key): L.append(f'<p>· <b>{lab}:</b> {esc(c[key])}</p>')
        L.append('</div>')
    life = o.get("lifeline") or []
    if life:
        L.append('<div class="sec"><div class="sec-h">인생 시기 (대운)</div>')
        for d in life:
            L.append(f'<p>· <b>{d.get("startAge")}–{d.get("endAge")}세</b> · {esc(d.get("seasonLabel",""))} ({esc(d.get("tone",""))}) — {esc(d.get("summary",""))}</p>')
        L.append('</div>')
    rm = o.get("roadmap")
    if rm:
        L.append('<div class="sec"><div class="sec-h">한 눈 요약</div>')
        for lab,key in [("캐릭터","character"),("자원(인풋)","resourceInput"),("자원(아웃풋)","resourceOutput"),("그림자","riskShadow"),("툴킷","riskTool"),("방향","direction")]:
            if rm.get(key): L.append(f'<p>· <b>{lab}:</b> {esc(rm[key])}</p>')
        L.append('</div>')
    if "flexibility" in o: L.append(f'<p class="flex">유연성(8축): <b>{esc(str(o["flexibility"]))}</b></p>')
    ap = o.get("actionPlan") or []
    if ap:
        L.append('<div class="sec"><div class="sec-h">액션 플랜</div>')
        for a in ap: L.append(f'<p>· <b>[{esc(a.get("timeframe",""))}]</b> {esc(a.get("title",""))}' + (f' <span class="muted">({esc(a.get("hint",""))})</span>' if a.get("hint") else "") + '</p>')
        L.append('</div>')
    if o.get("disclaimer"): L.append(f'<p class="disc">{esc(o["disclaimer"])}</p>')
    return "\n".join(L)

def strip_trailers(t):
    t = re.sub(r'(?:^|\n)[ \t]*FLEX\s*=\s*\d{1,3}[ \t]*$','',t,flags=re.M)
    t = re.sub(r'(?:^|\n)[ \t]*ACTIONS\s*=\s*\[.*$','',t,flags=re.M)
    return t.strip()

def flatten_text_html(t):
    t = strip_trailers(t)
    out=[]
    for para in re.split(r'\n\s*\n', t):
        p = para.strip()
        if not p: continue
        m = re.match(r'^\s*▣\s*(.+)$', p, re.S)
        if m:
            first, *rest = m.group(1).split("\n",1)
            out.append(f'<div class="sec"><div class="sec-h">{esc(first.strip())}</div>')
            if rest: out.append(body_block(rest[0]))
            out.append('</div>')
        else:
            out.append(body_block(p))
    return "\n".join(out)

def report_to_html(kind, v):
    raw = open(report_path(kind, v), encoding="utf-8").read().strip()
    if raw.startswith("{"):
        try: return flatten_json_html(json.loads(raw))
        except Exception as e: return f'<div class="body">(JSON 파싱 실패: {esc(str(e))})\n\n{esc(raw[:2000])}</div>'
    return flatten_text_html(raw)

def body_chars(kind, v):
    raw = open(report_path(kind, v), encoding="utf-8").read()
    if raw.strip().startswith("{"):
        try:
            o=json.loads(raw); secs="".join(s.get("body","") for s in (o.get("sections") or []))
            return len(re.sub(r'\s','',secs)) or len(re.sub(r'\s','',raw))
        except: pass
    return len(re.sub(r'\s','',strip_trailers(raw)))

# ---------- 점수 ----------
def avg(d): return sum(d.values())/len(d)
def chip(n):
    cls = "s9" if n>=9 else "s78" if n>=7 else "s56" if n>=5 else "s4"
    return f'<span class="chip {cls}">{n}</span>'

def score_card(kind, v):
    src = slot[(kind,v)]["src"]
    j = score_by.get((kind, src))
    if not j: return "", 0, 0, True
    eff, exp, hy = j["efficacy"], j["experience"], j["hygiene"]
    ea, xa = avg(eff), avg(exp)
    rows = (
        f'<div class="scol"><span class="lbl">효용 {ea:.1f}</span>'
        + "".join(f'<span class="ax">{k[:2]}{chip(val)}</span>' for k,val in eff.items()) + '</div>'
        f'<div class="scol"><span class="lbl">경험 {xa:.1f}</span>'
        + "".join(f'<span class="ax">{k[:2]}{chip(val)}</span>' for k,val in exp.items()) + '</div>'
    )
    hyflag = '<span class="hy ok">위생 OK</span>' if hy["pass"] else '<span class="hy bad">위생 ⚠</span>'
    viol = "".join(f'<li>{esc(x)}</li>' for x in hy.get("violations",[]))
    viol_html = f'<ul class="viol">{viol}</ul>' if viol else ""
    return rows + hyflag + viol_html, ea, xa, hy["pass"]

# 추천 버전(위생 pass 우선, 효용+경험 합 최대)
rec = {}
for kind in KINDS:
    best=None
    for v in [1,2,3,4]:
        src=slot[(kind,v)]["src"]; j=score_by.get((kind,src))
        if not j: continue
        key=(j["hygiene"]["pass"], avg(j["efficacy"])+avg(j["experience"]), -v)
        if best is None or key>best[0]: best=(key,v)
    rec[kind]=best[1] if best else 1

# ---------- 타임라인(시차 기록) ----------
STAGES = [
  ("v1","베이스 (현재 운영 프롬프트)","2026-06-27 ~20:50",
   "기준선. 합성·실계정 평가에서 드러난 알려진 약점: ① 사주 대운 섹션 한글 간지('무신') 누출 ② 사용자 실제 질문 '상속 준비'를 사주·융합·가족이 미해소 ③ 새로움 천장(오행 통설).",
   "—"),
  ("v2","+ 간지 누출 픽스","2026-06-27 22:16~22:19",
   "사주·융합 대운/간지 이름(무신·정묘 등 60갑자)을 본문에 한자·한글 모두 노출 금지. 무조건 '36~45세 흐름' 같은 자연어 시기로만.",
   "사주·융합"),
  ("v3","+ 상속 질문 전 리포트 주입","2026-06-27 22:08~22:56",
   "사용자가 실제로 입력한 질문 '상속 준비를 어떻게 하면 좋을까?'를 사주·융합·가족·상담 본문에서 정면으로 다루도록 강제. 증여 시점·유언·보험·가족 합의 순서 같은 실무 체크포인트, 단 법률·세무 단정은 회피.",
   "사주·융합·가족·상담"),
  ("v4","+ 새로움 가드","2026-06-27 22:08~22:17",
   "오행→성격 표준 매핑(물=지혜 등) 통설 반복 금지. 직업·가정·실제 고민(상속)에 붙은 '의외의 연결'로만, 섹션마다 다른 메타포로 갈아타기 강제.",
   "5종 전부"),
]

# ---------- HTML ----------
def kind_section(kind):
    cards=[]
    for v in [1,2,3,4]:
        sc_html, ea, xa, ok = score_card(kind, v)
        info = slot[(kind,v)]
        changed = info["changed"]
        src = info["src"]
        j = score_by.get((kind, src), {})
        hl = j.get("highlight","")
        same_note = "" if changed else f'<span class="same">= v{src}와 동일 (이 단계에서 변경 없음)</span>'
        recbadge = '<span class="rec">하네스 추천</span>' if rec[kind]==v else ''
        chars = body_chars(kind, src)
        rid = f"{kind}_{v}"
        cards.append(f'''
        <div class="vcard {'ok' if ok else 'bad'}">
          <div class="vhead">
            <label class="pick"><input type="radio" name="pick_{kind}" value="v{v}" data-kind="{kind}"> <b>v{v}</b></label>
            {recbadge}{same_note}
            <span class="len">본문 {chars:,}자</span>
          </div>
          <div class="scores">{sc_html}</div>
          <div class="hl">📝 {esc(hl)}</div>
          <details><summary>리포트 전문 펼쳐 보기 ▾</summary>
            <div class="report">{report_to_html(kind, src)}</div>
          </details>
        </div>''')
    return f'''<section class="kind" id="k_{kind}" data-kind="{kind}">
      <h2>{KIND_LABEL[kind]} 리포트 <span class="recline">— 추천: v{rec[kind]}</span></h2>
      <div class="vgrid">{''.join(cards)}</div>
    </section>'''

timeline = "".join(
  f'''<div class="stage">
        <div class="sv">{sv}</div>
        <div class="sbody"><div class="st">{esc(title)} <span class="sapply">적용: {esc(applyto)}</span></div>
        <div class="sdate">{esc(date)}</div><div class="sdesc">{esc(desc)}</div></div>
      </div>''' for sv,title,date,desc,applyto in STAGES)

matrix_rows=""
for kind in KINDS:
    cells=""
    for v in [1,2,3,4]:
        src=slot[(kind,v)]["src"]; j=score_by.get((kind,src))
        if not j: cells+="<td>—</td>"; continue
        ea,xa=avg(j["efficacy"]),avg(j["experience"]); ok=j["hygiene"]["pass"]
        tot=ea+xa
        cls="m9" if (ok and tot>=17) else "m8" if (ok and tot>=16) else "mbad" if not ok else "m7"
        star="★" if rec[kind]==v else ""
        cells+=f'<td class="{cls}"><b>{ea:.1f}</b>/<span>{xa:.1f}</span>{"" if ok else " ⚠"}{star}</td>'
    matrix_rows+=f'<tr><th>{KIND_LABEL[kind]}</th>{cells}</tr>'

gen_at = datetime.now().strftime("%Y-%m-%d %H:%M") if False else "2026-06-27"

HTML = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>리포트 개선 보고서 — 박정호 계정</title>
<style>
:root{{--ink:#2b2622;--ink2:#6b625a;--paper:#f4efe6;--card:#fbf8f2;--line:#e3dccf;--accent:#7a5c3e;--good:#3f7d4f;--bad:#b4452f;}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--paper);color:var(--ink);font:15px/1.7 -apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}}
.wrap{{max-width:1080px;margin:0 auto;padding:24px 18px 120px}}
h1{{font-size:26px;margin:0 0 4px}} h2{{font-size:21px;margin:34px 0 14px;border-bottom:2px solid var(--line);padding-bottom:8px}}
.sub{{color:var(--ink2);margin:0 0 18px}}
.note{{background:#efe7d8;border:1px solid var(--line);border-radius:10px;padding:12px 16px;font-size:13.5px;color:var(--ink2);margin:14px 0}}
/* timeline */
.timeline{{border-left:2px solid var(--line);margin:8px 0 8px 8px;padding-left:0}}
.stage{{display:flex;gap:14px;padding:10px 0 14px 16px;position:relative}}
.sv{{flex:0 0 42px;height:42px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;margin-left:-22px}}
.st{{font-weight:800}} .sapply{{font-weight:500;color:var(--accent);font-size:12.5px;margin-left:6px}}
.sdate{{font-size:12px;color:var(--ink2);font-family:monospace}} .sdesc{{margin-top:4px}}
/* matrix */
table.matrix{{border-collapse:collapse;width:100%;margin:6px 0;font-size:14px}}
.matrix th,.matrix td{{border:1px solid var(--line);padding:9px 6px;text-align:center}}
.matrix th{{background:#ece3d4}} .matrix td b{{color:var(--accent)}} .matrix td span{{color:var(--ink2)}}
.m9{{background:#dceede}}.m8{{background:#eaf1e2}}.m7{{background:#fbf8f2}}.mbad{{background:#f6ddd5}}
.mleg{{font-size:12px;color:var(--ink2);margin:4px 0 0}}
/* version cards */
.vgrid{{display:flex;flex-direction:column;gap:12px}}
.vcard{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;border-left:5px solid var(--good)}}
.vcard.bad{{border-left-color:var(--bad)}}
.vhead{{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}}
.pick{{cursor:pointer;font-size:17px}} .pick input{{transform:scale(1.3);margin-right:4px;vertical-align:middle}}
.rec{{background:var(--accent);color:#fff;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:700}}
.same{{color:var(--ink2);font-size:12px;font-style:italic}}
.len{{margin-left:auto;font-size:12px;color:var(--ink2);font-family:monospace}}
.scores{{display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin-bottom:8px}}
.scol{{display:flex;gap:6px;align-items:center;flex-wrap:wrap}} .lbl{{font-weight:700;font-size:13px}}
.ax{{font-size:11px;color:var(--ink2);display:inline-flex;align-items:center;gap:2px}}
.chip{{display:inline-block;min-width:20px;text-align:center;border-radius:5px;font-weight:800;font-size:12px;padding:1px 4px;color:#fff}}
.s9{{background:#3f7d4f}}.s78{{background:#8a9a3f}}.s56{{background:#c98a2e}}.s4{{background:#b4452f}}
.hy{{font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px}} .hy.ok{{background:#dceede;color:var(--good)}} .hy.bad{{background:#f6ddd5;color:var(--bad)}}
.viol{{margin:6px 0 0;padding-left:18px;font-size:12.5px;color:var(--bad)}}
.hl{{font-size:13.5px;color:var(--ink2);background:#f0ebe0;border-radius:8px;padding:8px 12px;margin:8px 0}}
details{{margin-top:6px}} summary{{cursor:pointer;color:var(--accent);font-weight:700;font-size:13.5px}}
.report{{margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:16px 18px;max-height:560px;overflow:auto}}
.report .rtitle{{font-size:18px;margin:0 0 10px}} .report .sec{{margin:14px 0;padding-top:8px;border-top:1px dashed var(--line)}}
.report .sec-h{{font-weight:800;font-size:15px;color:var(--accent)}} .report .sec-s{{font-style:italic;color:var(--ink2);margin:3px 0 6px}}
.report .body{{white-space:pre-wrap}} .report .kw{{padding-left:18px}} .report .disc{{color:var(--ink2);font-size:13px;border-top:1px solid var(--line);padding-top:8px}}
.report .muted{{color:var(--ink2)}} .report .flex{{font-weight:700}}
.recline{{font-size:14px;color:var(--accent);font-weight:600}}
/* sticky pick bar */
#bar{{position:fixed;left:0;right:0;bottom:0;background:var(--ink);color:#fff;padding:10px 16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;z-index:50;font-size:13.5px}}
#bar b{{color:#f4d9a8}} #bar .picks{{display:flex;gap:12px;flex-wrap:wrap}}
#bar button{{margin-left:auto;background:var(--accent);color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}}
#bar .done{{color:#8fd6a0}}
@media(min-width:760px){{ .scores{{gap:26px}} }}
</style></head><body><div class="wrap">

<h1>리포트 개선 보고서 — 4단계 버전 비교</h1>
<p class="sub">박정호 계정 실데이터 기준 · 5종 리포트 × v1~v4 · 생성·채점 모두 Claude(무 Gemini) · {gen_at}</p>

<div class="note">
<b>읽는 법</b> — 리포트마다 v1(현재)→v4로 갈수록 개선 지시가 누적돼. 각 버전 카드의 라디오를 눌러 <b>마음에 드는 버전을 고르면</b> 아래 막대에 모여. 점수는 6축(효용3·경험3, 10점) + 위생. 「리포트 전문 펼쳐 보기」로 실제 본문을 읽을 수 있어.<br>
<b>정직 고지</b> — 생성·채점 모두 Claude라 운영(Gemini) 품질이 아니라 '프롬프트 구조 상한'이야. 또 v1은 직전 별도 실행 결과라 v2~v4와의 차이엔 개선 효과 + 실행 변동이 섞여 있어(특히 상속 커버리지). 최종 확정본은 실모델 1회 교차검증 권장.
</div>

<h2>① 개선 과정 (시차 기록)</h2>
<div class="timeline">{timeline}</div>

<h2>② 점수 매트릭스 (효용/경험, ★=추천, ⚠=위생)</h2>
<table class="matrix"><tr><th></th><th>v1</th><th>v2</th><th>v3</th><th>v4</th></tr>{matrix_rows}</table>
<p class="mleg">칸 = 효용평균 / 경험평균 (10점). 초록=효용+경험 17↑ · 빨강=위생 위반. tci는 v2·v3가 v1과 동일, family·consult는 v2가 v1과 동일(변경 단계 아님).</p>

<h2>③ 리포트별 버전 비교 — 버전을 골라줘</h2>
{''.join(kind_section(k) for k in KINDS)}

</div>
<div id="bar"><b>내 선택</b> <div class="picks" id="picks">아직 선택 안 함</div>
<button onclick="copyPicks()">선택 복사</button></div>
<script>
const KINDS={json.dumps([[k,KIND_LABEL[k]] for k in KINDS],ensure_ascii=False)};
const KEY="sajulife_version_picks";
function load(){{try{{return JSON.parse(localStorage.getItem(KEY))||{{}}}}catch(e){{return {{}}}}}}
function save(p){{localStorage.setItem(KEY,JSON.stringify(p))}}
function render(){{
  const p=load(); const el=document.getElementById('picks');
  const parts=KINDS.map(([k,lab])=> p[k]? `${{lab}}=<b>${{p[k]}}</b>`:`${{lab}}=<span style="opacity:.5">?</span>`);
  el.innerHTML=parts.join(' · ');
  const done=KINDS.every(([k])=>p[k]);
  if(done) el.innerHTML+=' <span class="done">✓ 5종 다 골랐어</span>';
}}
document.querySelectorAll('input[type=radio]').forEach(r=>{{
  r.addEventListener('change',e=>{{const p=load();p[e.target.dataset.kind]=e.target.value;save(p);render();}});
}});
// 복원
(function(){{const p=load();for(const k in p){{const el=document.querySelector(`input[name=pick_${{k}}][value=${{p[k]}}]`);if(el)el.checked=true;}}render();}})();
function copyPicks(){{const p=load();const t='리포트 버전 선택 — '+KINDS.map(([k,lab])=>`${{lab}}:${{p[k]||'?'}}`).join(', ');navigator.clipboard.writeText(t).then(()=>{{const b=event.target;b.textContent='복사됨!';setTimeout(()=>b.textContent='선택 복사',1500);}});}}
</script></body></html>'''

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT,"w",encoding="utf-8").write(HTML)
print("HTML 작성:", OUT, f"({len(HTML):,} bytes)")
print("추천 버전:", {KIND_LABEL[k]:f'v{rec[k]}' for k in KINDS})
