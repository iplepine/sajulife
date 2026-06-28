# 개선 전(v1) vs 개선 후(최종) 비교 HTML 빌더 (AI 호출 0)
import json, re, html, os

ROOT="scripts/eval/out"
OUT=f"{ROOT}/final/개선전후_보고서.html"
KIND_LABEL={"saju":"개인 사주","tci":"기질","fusion":"융합","family":"가족","consult":"상담"}
KINDS=["saju","tci","fusion","family","consult"]

after={r["kind"]:r["judge"] for r in json.load(open(f"{ROOT}/final/scores.json"))}
before={s["kind"]:s["judge"] for s in json.load(open(f"{ROOT}/versions/scores.json")) if s["version"]==1}

def path_before(k): return f"{ROOT}/versions/reports/{k}-v1.txt"
def path_after(k):  return f"{ROOT}/final/reports/{k}.txt"

def esc(s): return html.escape(s or "")
def body_block(t): return f'<div class="body">{esc(t).strip()}</div>'

def flatten_json_html(o):
    L=[]
    if o.get("title"): L.append(f'<h4 class="rtitle">{esc(o["title"])}</h4>')
    if o.get("keywords"):
        L.append('<ul class="kw">'+''.join(f'<li><b>{esc(k.get("word",""))}</b> — {esc(k.get("desc",""))}</li>' for k in o["keywords"])+'</ul>')
    for c in (o.get("cast") or []):
        L.append(f'<p>· ({esc(c.get("relation",""))}) <b>{esc(c.get("name",""))}</b> — {esc(c.get("character",""))}</p>')
    for s in (o.get("sections") or []):
        L.append(f'<div class="sec"><div class="sec-h">{esc(s.get("id",""))}</div>')
        if s.get("summary"): L.append(f'<div class="sec-s">{esc(s["summary"])}</div>')
        L.append(body_block(s.get("body",""))); L.append('</div>')
    for d in (o.get("lifeline") or []):
        pass
    if o.get("lifeline"):
        L.append('<div class="sec"><div class="sec-h">인생 시기 (대운)</div>')
        for d in o["lifeline"]:
            L.append(f'<p>· <b>{d.get("startAge")}–{d.get("endAge")}세</b> · {esc(d.get("seasonLabel",""))} ({esc(d.get("tone",""))}) — {esc(d.get("summary",""))}</p>')
        L.append('</div>')
    rm=o.get("roadmap")
    if rm:
        L.append('<div class="sec"><div class="sec-h">한 눈 요약</div>')
        for lab,key in [("캐릭터","character"),("자원(인풋)","resourceInput"),("자원(아웃풋)","resourceOutput"),("그림자","riskShadow"),("툴킷","riskTool"),("방향","direction")]:
            if rm.get(key): L.append(f'<p>· <b>{lab}:</b> {esc(rm[key])}</p>')
        L.append('</div>')
    if "flexibility" in o: L.append(f'<p class="flex">유연성(8축): <b>{esc(str(o["flexibility"]))}</b></p>')
    if o.get("actionPlan"):
        L.append('<div class="sec"><div class="sec-h">액션 플랜</div>')
        for a in o["actionPlan"]: L.append(f'<p>· <b>[{esc(a.get("timeframe",""))}]</b> {esc(a.get("title",""))}'+(f' <span class="muted">({esc(a.get("hint",""))})</span>' if a.get("hint") else '')+'</p>')
        L.append('</div>')
    if o.get("disclaimer"): L.append(f'<p class="disc">{esc(o["disclaimer"])}</p>')
    return "\n".join(L)

def strip_trailers(t):
    t=re.sub(r'(?:^|\n)[ \t]*FLEX\s*=\s*\d{1,3}[ \t]*$','',t,flags=re.M)
    t=re.sub(r'(?:^|\n)[ \t]*ACTIONS\s*=\s*\[.*$','',t,flags=re.M)
    return t.strip()

def flatten_text_html(t):
    t=strip_trailers(t); out=[]
    for para in re.split(r'\n\s*\n', t):
        p=para.strip()
        if not p: continue
        m=re.match(r'^\s*▣\s*(.+)$', p, re.S)
        if m:
            first,*rest=m.group(1).split("\n",1)
            out.append(f'<div class="sec"><div class="sec-h">{esc(first.strip())}</div>')
            if rest: out.append(body_block(rest[0]))
            out.append('</div>')
        else: out.append(body_block(p))
    return "\n".join(out)

def report_html(path):
    raw=open(path,encoding="utf-8").read().strip()
    if raw.startswith("{"):
        try: return flatten_json_html(json.loads(raw))
        except Exception as e: return f'<div class="body">(파싱 실패 {esc(str(e))})</div>'
    return flatten_text_html(raw)

def body_chars(path):
    raw=open(path,encoding="utf-8").read()
    if raw.strip().startswith("{"):
        try:
            o=json.loads(raw); secs="".join(s.get("body","") for s in (o.get("sections") or []))
            return len(re.sub(r'\s','',secs)) or len(re.sub(r'\s','',raw))
        except: pass
    return len(re.sub(r'\s','',strip_trailers(raw)))

avg=lambda d:sum(d.values())/3
def chip(n):
    cls="s9" if n>=9 else "s78" if n>=7 else "s56" if n>=5 else "s4"
    return f'<span class="chip {cls}">{n}</span>'
def scorebar(j):
    eff,exp,hy=j["efficacy"],j["experience"],j["hygiene"]
    h='<span class="hy ok">위생 OK</span>' if hy["pass"] else '<span class="hy bad">위생 ⚠</span>'
    v="".join(f'<li>{esc(x)}</li>' for x in hy.get("violations",[]))
    vh=f'<ul class="viol">{v}</ul>' if v else ""
    return (f'<div class="scol"><span class="lbl">효용 {avg(eff):.1f}</span>'+ "".join(f'<span class="ax">{k[:2]}{chip(val)}</span>' for k,val in eff.items())+'</div>'
            f'<div class="scol"><span class="lbl">경험 {avg(exp):.1f}</span>'+ "".join(f'<span class="ax">{k[:2]}{chip(val)}</span>' for k,val in exp.items())+'</div>'+h+vh)

CHANGES={
 "saju":"간지 이름 금지(한글 '무신'까지 차단) + 한 메타포 우려먹기 금지(섹션마다 새 장면). v12→v13",
 "tci":"새로움 가드 — 점수→형용사 1:1 통설·단일 비유 반복 금지. v16→v17 (포맷은 이미 개인사주와 통일된 JSON)",
 "fusion":"간지(한글 포함)·사주/기질 통설 반복 금지 — 의외의 연결로. v18→v19",
 "family":"새로움 가드 — 오행 통설 나열 금지, 가족 구체 구성에 붙은 연결로. v8→v9",
 "consult":"분량 1,100~1,700 → 1,800~2,200자 + 표면 질문을 관계로만 치환 말고 질문 영역 실무 단서 강제. v7→v8",
}

def delta(b,a):
    d=a-b
    if abs(d)<0.05: return '<span class="d0">±0</span>'
    cls="dup" if d>0 else "ddn"
    return f'<span class="{cls}">{"▲" if d>0 else "▼"}{abs(d):.1f}</span>'

# 매트릭스
mrows=""
for k in KINDS:
    b,a=before.get(k),after.get(k)
    eb,xb=avg(b["efficacy"]),avg(b["experience"]); ea,xa=avg(a["efficacy"]),avg(a["experience"])
    bp="OK" if b["hygiene"]["pass"] else "⚠"; ap="OK" if a["hygiene"]["pass"] else "⚠"
    mrows+=(f'<tr><th>{KIND_LABEL[k]}</th>'
            f'<td>{eb:.1f} / {xb:.1f} <span class="mhy {"bad" if bp=="⚠" else ""}">{bp}</span></td>'
            f'<td class="aft">{ea:.1f} {delta(eb,ea)} / {xa:.1f} {delta(xb,xa)} <span class="mhy {"bad" if ap=="⚠" else ""}">{ap}</span></td></tr>')

def kind_block(k):
    b,a=before.get(k),after.get(k)
    return f'''<section class="kind"><h2>{KIND_LABEL[k]} 리포트</h2>
      <div class="chg">🔧 바꾼 것: {esc(CHANGES[k])}</div>
      <div class="cols">
        <div class="col before">
          <div class="ctag">개선 전 (v1)</div>
          <div class="scores">{scorebar(b)}</div>
          <div class="hl">📝 {esc(b.get("highlight",""))}</div>
          <details><summary>전문 보기 ▾ <span class="len">본문 {body_chars(path_before(k)):,}자</span></summary><div class="report">{report_html(path_before(k))}</div></details>
        </div>
        <div class="col after">
          <div class="ctag">개선 후 ✦</div>
          <div class="scores">{scorebar(a)}</div>
          <div class="hl">📝 {esc(a.get("highlight",""))}</div>
          <details><summary>전문 보기 ▾ <span class="len">본문 {body_chars(path_after(k)):,}자</span></summary><div class="report">{report_html(path_after(k))}</div></details>
        </div>
      </div></section>'''

HTML=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>리포트 개선 전후 보고서 — 박정호</title>
<style>
:root{{--ink:#2b2622;--ink2:#6b625a;--paper:#f4efe6;--card:#fbf8f2;--line:#e3dccf;--accent:#7a5c3e;--good:#3f7d4f;--bad:#b4452f}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--paper);color:var(--ink);font:15px/1.7 -apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}}
.wrap{{max-width:1100px;margin:0 auto;padding:24px 18px 80px}}
h1{{font-size:26px;margin:0 0 4px}} h2{{font-size:20px;margin:30px 0 12px}}
.sub{{color:var(--ink2);margin:0 0 16px}}
.note{{background:#efe7d8;border:1px solid var(--line);border-radius:10px;padding:12px 16px;font-size:13.5px;color:var(--ink2);margin:14px 0}}
table.matrix{{border-collapse:collapse;width:100%;font-size:14px;margin:8px 0}}
.matrix th,.matrix td{{border:1px solid var(--line);padding:10px 8px;text-align:center}} .matrix th{{background:#ece3d4}}
.matrix td.aft{{background:#eaf3ea;font-weight:600}} .matrix .mhy{{font-size:11px;color:var(--good);font-weight:700}} .matrix .mhy.bad{{color:var(--bad)}}
.dup{{color:var(--good);font-weight:800}} .ddn{{color:var(--bad);font-weight:800}} .d0{{color:var(--ink2)}}
.mleg{{font-size:12px;color:var(--ink2)}}
.kind{{margin:26px 0;border-top:2px solid var(--line);padding-top:8px}}
.chg{{background:#f0ebe0;border-radius:8px;padding:8px 12px;font-size:13px;margin-bottom:12px}}
.cols{{display:flex;flex-direction:column;gap:12px}}
@media(min-width:820px){{.cols{{flex-direction:row}} .col{{flex:1;min-width:0}}}}
.col{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px}}
.col.before{{border-left:5px solid #b9b0a0}} .col.after{{border-left:5px solid var(--good)}}
.ctag{{font-weight:800;margin-bottom:8px}} .col.after .ctag{{color:var(--good)}}
.scores{{display:flex;flex-direction:column;gap:6px;margin-bottom:8px}} .scol{{display:flex;gap:6px;align-items:center;flex-wrap:wrap}}
.lbl{{font-weight:700;font-size:13px;min-width:58px}} .ax{{font-size:11px;color:var(--ink2);display:inline-flex;align-items:center;gap:2px}}
.chip{{display:inline-block;min-width:20px;text-align:center;border-radius:5px;font-weight:800;font-size:12px;padding:1px 4px;color:#fff}}
.s9{{background:#3f7d4f}}.s78{{background:#8a9a3f}}.s56{{background:#c98a2e}}.s4{{background:#b4452f}}
.hy{{font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px;display:inline-block}} .hy.ok{{background:#dceede;color:var(--good)}} .hy.bad{{background:#f6ddd5;color:var(--bad)}}
.viol{{margin:6px 0 0;padding-left:16px;font-size:12px;color:var(--bad)}}
.hl{{font-size:13px;color:var(--ink2);background:#f0ebe0;border-radius:8px;padding:8px 11px;margin:6px 0}}
summary{{cursor:pointer;color:var(--accent);font-weight:700;font-size:13.5px}} .len{{color:var(--ink2);font-weight:500;font-size:12px}}
.report{{margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px 16px;max-height:520px;overflow:auto}}
.report .rtitle{{font-size:17px;margin:0 0 8px}} .report .sec{{margin:12px 0;padding-top:8px;border-top:1px dashed var(--line)}}
.report .sec-h{{font-weight:800;color:var(--accent)}} .report .sec-s{{font-style:italic;color:var(--ink2);margin:3px 0 6px}}
.report .body{{white-space:pre-wrap}} .report .disc{{color:var(--ink2);font-size:13px}} .report .muted{{color:var(--ink2)}}
</style></head><body><div class="wrap">
<h1>리포트 개선 전후 보고서</h1>
<p class="sub">박정호 계정 실데이터 · 5종 · 개선 전(현재 운영 v1) → 개선 후(defaults.ts 반영본) · 생성·채점 모두 Claude(무 Gemini) · 2026-06-28</p>

<div class="note">
<b>구조 결정</b> — 개인사주·기질·융합·가족은 <b>특정 질문과 무관한 독립 종합 리포트</b>, '상속 준비' 같은 시점성 질문은 <b>상담 전담</b>으로 분리.<br>
<b>바꾼 것</b> — ① 간지 이름 누출 차단(사주·융합) ② 새로움 가드: 통설·단일 비유 반복 금지(4종) ③ 상담 분량 2,000자 + 질문 영역 실무 단서 강제.<br>
<b>★정직 고지★</b> — 개인·융합·가족의 <b>'고민해소' 점수 상승은 상당 부분 채점 기준 정정 때문</b>이야: 이전엔 "상속을 안 다뤘다"고 깎았는데, 이번엔 "4종은 특정 질문 안 다뤄도 됨"으로 올바르게 채점함. 순수 프롬프트가 실제 고친 건 <b>간지 누출(위생)·새로움·상담 분량/실질</b>. 또 생성·채점 다 Claude라 운영(Gemini) 품질 아닌 '구조 상한'이고, 확정본은 실모델 1회 교차검증 권장.
</div>

<h2>점수 한눈에 (효용/경험, 전 → 후)</h2>
<table class="matrix"><tr><th></th><th>개선 전 (v1)</th><th>개선 후 ✦</th></tr>{mrows}</table>
<p class="mleg">칸 = 효용평균 / 경험평균 (10점). ▲=상승 ▼=하락. 사주는 개선 전 '무신' 간지 누출로 위생 ⚠ 였던 게 OK로 바뀜.</p>

{''.join(kind_block(k) for k in KINDS)}
</div></body></html>'''

os.makedirs(os.path.dirname(OUT),exist_ok=True)
open(OUT,"w",encoding="utf-8").write(HTML)
print("작성:",OUT,f"({len(HTML):,} bytes)")
