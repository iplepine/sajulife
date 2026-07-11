"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { scheduleAlignCurrentStart } from "@/lib/ui/scroll";
import YongsinLifeline from "./YongsinLifeline";
import {
  ELEMENT_META,
  type Element,
  type FlowCell,
  type Verdict,
  type YongsinView,
} from "@/lib/saju/yongsinView";

/**
 * 용신 '기운 처방전' — 프리미엄 결정론 뷰.
 * 계산 엔진(격국·억부·조후·종합용신·생애흐름)은 buildYongsinView가 다 만들고,
 * 여기선 그걸 한방 '처방전'처럼 포장한다. ★AI 호출 없음★ — 정밀 풀이는 페이지의 '풀이 생성' 버튼.
 * 톤은 리포트 화면 설명문구(반말). 한자·명리어는 옆 괄호에 일상어 풀이.
 */

const EL_HANJA: Record<Element, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

/** 오행별 처방 카피 — 채우는 법(doThis/mindset/색·방향) + 과할 때(drainNote). */
const EL_RX: Record<Element, { essence: string; colors: string; direction: string; doThis: string; mindset: string; drainNote: string }> = {
  목: {
    essence: "쭉 뻗는 추진력, 새로 벌이는 기획력, 자라려는 욕심",
    colors: "초록·연둣빛", direction: "동쪽(해 뜨는 쪽)",
    doThis: "새 판을 하나 벌여. 배우기·기획·아침 산책처럼 '자라는' 쪽 일이 너한텐 보약이야.",
    mindset: "다 다듬고 시작하려다 평생 못 시작해. 싹부터 틔우고 크면서 다듬어.",
    drainNote: "벌여만 놓고 수습을 못 하면 여기서 방전돼. 새로 손대는 것부터 멈추고 벌인 것부터 매듭지어.",
  },
  화: {
    essence: "확 타오르는 표현력, 사람 끌어당기는 열정, 주목받는 존재감",
    colors: "빨강·주홍", direction: "남쪽",
    doThis: "드러내. 사람 만나고, 표현하고, 햇빛 받아. 켜야 빛나는 타입이라 꺼놓으면 네가 제일 답답해.",
    mindset: "속으로 삭이지 마. 네 열은 나눠 써야 안 타버려.",
    drainNote: "끝까지 태우면 재만 남아. 텐션 최대로 올리는 버릇이 번아웃의 시작이야 — 일부러 꺼두는 시간을 만들어.",
  },
  토: {
    essence: "묵직한 안정감, 사람 믿게 만드는 신뢰, 끝까지 가는 꾸준함",
    colors: "노랑·베이지·흙빛", direction: "중앙",
    doThis: "루틴을 깔아. 정리·기록·같은 시간에 같은 일 — 땅 다지는 반복이 너를 단단하게 해.",
    mindset: "빨리 못 간다고 조급해 마. 너는 쌓아서 이기는 사람이야.",
    drainNote: "다 끌어안고 안 놓으면 여기서 무거워져. 쟁여둔 것·묵은 관계, 좀 덜어내.",
  },
  금: {
    essence: "칼 같은 결단, 군더더기 쳐내는 정리력, 흔들리지 않는 기준",
    colors: "흰색·은빛·회색", direction: "서쪽",
    doThis: "매듭지어. 안 쓰는 거 버리고 애매한 거 결론 내. 쳐낼수록 또렷해지는 타입이야.",
    mindset: "다 좋게 남기려다 아무것도 못 끝내. 자를 건 과감히 잘라.",
    drainNote: "너무 날 세우면 여기서 뻣뻣해져. 맞다·틀리다로 가르는 버릇, 좀 무디게 가.",
  },
  수: {
    essence: "깊이 파고드는 통찰, 상황 따라 흐르는 유연함, 회복시키는 쉼",
    colors: "검정·남색", direction: "북쪽",
    doThis: "쉬고, 읽고, 물가에 가. 멈춰서 생각 정리하는 시간이 너한텐 진짜 약이야.",
    mindset: "쉬는 데 죄책감 갖지 마. 너는 고여야 맑아지는 사람이야.",
    drainNote: "재기만 하면 여기서 못 움직여. 생각만 굴리는 늪, 일단 한 발부터 담가.",
  },
};

const BODY_COPY: Record<YongsinView["body"], { headline: string; explain: string }> = {
  신강: {
    headline: "기운이 센 편이야 (신강 - 나를 돕는 힘 > 빼는 힘)",
    explain: "타고난 배터리가 두둑해. 문제는 안에 쟁여두면 답답해진다는 거 — 밖으로 쓰고 덜어낼 때 제일 잘 풀려. 그래서 '더 채우는 기운'보다 '내보내는 기운'이 약이야.",
  },
  중화: {
    headline: "균형이 잘 잡힌 편이야 (중화 - 돕는 힘과 빼는 힘이 팽팽)",
    explain: "한쪽으로 안 쏠려서 웬만한 흐름에 잘 버텨. 대신 억부로는 '딱 이거다' 하는 처방이 은근한 편이라, 아래 격국(그릇)·조후(온도) 신호를 더 봐.",
  },
  신약: {
    headline: "기운이 여린 편이야 (신약 - 나를 빼는 힘 > 돕는 힘)",
    explain: "배터리가 빨리 닳는 편이라 무리하게 밀어붙이면 금방 방전돼. 채우고 기대고 회복하는 게 약이야 — 너를 돕는 기운을 옆에 둘수록 힘이 붙어.",
  },
};

function elStyle(el: Element): CSSProperties {
  const v = ELEMENT_META[el].cssVar;
  return { "--el": `var(${v})`, "--el-bg": `var(${v}-bg)` } as CSSProperties;
}

function Seal({ el, size = "lg" }: { el: Element; size?: "lg" | "sm" }) {
  return (
    <span className={`yv-seal yv-seal--${size}`} style={elStyle(el)} aria-hidden>
      <span className="yv-seal-ring" />
      <span className="yv-seal-hanja">{EL_HANJA[el]}</span>
    </span>
  );
}

/** 오행 칩 — 색점(신호) + 이름. 이모지 없이 색만으로 오행을 구분. */
function ElChips({ els, empty }: { els: Element[]; empty?: string }) {
  if (!els.length) return <span className="yv-elnone">{empty ?? "없음"}</span>;
  return (
    <span className="yv-elchips">
      {els.map((e) => (
        <span key={e} className="yv-elchip" style={elStyle(e)}>
          <i className="yv-elchip-dot" aria-hidden />
          <b>{ELEMENT_META[e].label}</b>
        </span>
      ))}
    </span>
  );
}

const VERDICT_UI: Record<Verdict, { cls: string; tag: string }> = {
  용신: { cls: "good", tag: "순풍" },
  도움: { cls: "help", tag: "무난" },
  중립: { cls: "mid", tag: "보통" },
  기신: { cls: "bad", tag: "역풍" },
};

function FlowRail({ title, hint, cells }: { title: string; hint: string; cells: FlowCell[] }) {
  if (!cells.length) {
    return (
      <div className="yv-rail-wrap">
        <div className="yv-rail-head"><b>{title}</b><em>{hint}</em></div>
        <p className="yv-elnone" style={{ padding: "4px 2px" }}>흐름 정보를 계산하지 못했어(태어난 시각 정보가 필요할 수 있어).</p>
      </div>
    );
  }
  return (
    <div className="yv-rail-wrap">
      <div className="yv-rail-head"><b>{title}</b><em>{hint}</em></div>
      <div className="yv-rail" role="list">
        {cells.map((c, i) => {
          const m = ELEMENT_META[c.element];
          const v = VERDICT_UI[c.verdict];
          return (
            <div key={`${c.label}-${i}`} role="listitem" className={`yv-cell yv-cell--${v.cls}${c.isNow ? " is-now" : ""}`}>
              <span className="yv-cell-top">
                <b className="yv-cell-label">{c.label}</b>
                {c.isNow && <span className="yv-cell-now">지금</span>}
              </span>
              <span className="yv-cell-gz">{c.ganzhi}<i>{m.label}</i></span>
              <span className="yv-cell-season">{c.season}</span>
              <span className={`yv-cell-tag yv-cell-tag--${v.cls}`}>{v.tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 세력 최약/최강 뽑기. */
function minStrength(els: Element[], strength: Record<Element, number>): Element | null {
  return els.length ? [...els].sort((a, b) => strength[a] - strength[b])[0] : null;
}
function maxStrength(els: Element[], strength: Record<Element, number>): Element | null {
  return els.length ? [...els].sort((a, b) => strength[b] - strength[a])[0] : null;
}

export default function YongsinBoard({ view }: { view: YongsinView }) {
  const { ilgan, body, eokbu, gyeokguk, johu, primaryYong, helperYong, gisin, flow } = view;
  const strength = eokbu.strength;
  const total = (Object.values(strength) as number[]).reduce((s, n) => s + n, 0) || 1;

  // 진입 시 대운·세운 레일을 '지금' 칸이 맨 왼쪽에 오도록 정렬 — 지금→미래를 먼저 보여준다.
  // (가운데 정렬은 이미 지난 과거 칸에 폭을 낭비했다.)
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return scheduleAlignCurrentStart(() => [...root.querySelectorAll<HTMLElement>(".yv-rail")], ".yv-cell.is-now");
  }, [view]);

  // 채워야 할 1순위 = 종합용신 중 최약(없으면 보조 → 조후 → 억부용신).
  const fillPool = primaryYong.length ? primaryYong : helperYong.length ? helperYong : johu.johu.length ? johu.johu : eokbu.yongsin;
  const fillPrimary = minStrength(fillPool, strength);
  // 덜어내야 할 1순위 = 기신 중 최강.
  const drainPrimary = maxStrength(gisin, strength);

  // 처방 카드로 펼칠 '보약' 오행(종합 우선, 없으면 보조).
  const prescEls = (primaryYong.length ? primaryYong : helperYong).slice().sort((a, b) => strength[a] - strength[b]);

  const daewoon = flow.filter((c) => c.kind === "대운");
  const seun = flow.filter((c) => c.kind === "세운");

  function roleOf(el: Element): "yong" | "helper" | "gi" | "neutral" {
    if (primaryYong.includes(el)) return "yong";
    if (helperYong.includes(el)) return "helper";
    if (gisin.includes(el)) return "gi";
    return "neutral";
  }

  return (
    <div className="yv" ref={rootRef}>
      {/* ── 히어로 처방전 ── */}
      <header className="yv-hero">
        <div className="yv-hero-foil" aria-hidden />
        <p className="yv-hero-eyebrow">
          <span className="yv-hero-stamp">用神</span>
          {ilgan.ko} 같은 사람의 기운 처방전
        </p>
        {fillPrimary && (
          <div className="yv-hero-seal-wrap"><Seal el={fillPrimary} /></div>
        )}
        <h1 className="yv-hero-title">
          {fillPrimary ? <>너를 살리는 건 <b style={{ color: `var(${ELEMENT_META[fillPrimary].cssVar})` }}>{ELEMENT_META[fillPrimary].label} 기운</b></> : "너를 살리는 기운 처방전"}
        </h1>
        <p className="yv-hero-sub">
          {fillPrimary
            ? `${EL_RX[fillPrimary].essence} — 격국·억부·조후를 겹쳐 뽑은, 지금 너한테 제일 필요한 기운이야.`
            : "방법마다 가리키는 게 갈려. 아래 격국·억부·조후를 각각 참고해서 상황 따라 골라 써."}
        </p>
        <p className="yv-hero-basis">타고난 나 · {ilgan.ko} 같은 사람{ilgan.metaphor && ` · ${ilgan.metaphor}`}</p>
      </header>

      {/* ── 채워라 / 덜어라 ── */}
      <div className="yv-rx">
        {fillPrimary && (
          <div className="yv-rx-card yv-rx-card--fill" style={elStyle(fillPrimary)}>
            <span className="yv-rx-tag">채워야 할 기운</span>
            <div className="yv-rx-body">
              <Seal el={fillPrimary} size="sm" />
              <div><b className="yv-rx-name">{ELEMENT_META[fillPrimary].label} 기운</b><span className="yv-rx-hanja">{EL_HANJA[fillPrimary]}</span></div>
            </div>
            <p className="yv-rx-note">{ELEMENT_META[fillPrimary].gist}</p>
          </div>
        )}
        {drainPrimary && (
          <div className="yv-rx-card yv-rx-card--drain" style={elStyle(drainPrimary)}>
            <span className="yv-rx-tag">덜어내야 할 기운</span>
            <div className="yv-rx-body">
              <Seal el={drainPrimary} size="sm" />
              <div><b className="yv-rx-name">{ELEMENT_META[drainPrimary].label} 기운</b><span className="yv-rx-hanja">{EL_HANJA[drainPrimary]}</span></div>
            </div>
            <p className="yv-rx-note yv-rx-note--muted">기댈수록 힘 빠지는 기운 — 여기에 너무 걸지 마</p>
          </div>
        )}
      </div>

      {/* ── 신강/신약 게이지 ── */}
      <section className="yv-block yv-gauge-block">
        <h2 className="yv-h">지금 네 기운 상태</h2>
        <div className="yv-gauge">
          <div className="yv-gauge-bar">
            <span className="yv-gauge-fill" style={{ width: `${gaugePct(eokbu.support, eokbu.drain)}%` }} />
            <span className="yv-gauge-needle" style={{ left: `${gaugePct(eokbu.support, eokbu.drain)}%` }}>
              <em className="yv-gauge-verdict">{body}</em>
            </span>
          </div>
          <div className="yv-gauge-ends">
            <span>여린 편<small>빼는 힘 {round1(eokbu.drain)}</small></span>
            <span className="yv-gauge-end--r">센 편<small>돕는 힘 {round1(eokbu.support)}</small></span>
          </div>
        </div>
        <p className="yv-lead">{BODY_COPY[body].headline}</p>
        <p className="yv-p">{BODY_COPY[body].explain}</p>
      </section>

      {/* ── 다섯 기운 세력 지도 ── */}
      <section className="yv-block">
        <h2 className="yv-h">타고난 다섯 기운의 세력</h2>
        <p className="yv-sub">막대 길이는 지금 네가 가진 기운의 양이야. <b className="yv-tag-yong">약</b>은 채울수록 힘이 되는 기운, <b className="yv-tag-gi">과</b>는 기댈수록 방전되는 기운이고 — 양이 아니라 ‘성격’을 표시한 거야.</p>
        <ul className="yv-map">
          {(Object.keys(ELEMENT_META) as Element[]).map((el) => {
            const role = roleOf(el);
            const pct = Math.round((strength[el] / total) * 100);
            return (
              <li key={el} className="yv-map-row" data-role={role} style={elStyle(el)}>
                <span className="yv-map-name">{ELEMENT_META[el].label}<i>{EL_HANJA[el]}</i></span>
                <span className="yv-map-track"><span className="yv-map-fill" style={{ width: `${Math.max(pct, 4)}%` }} /></span>
                <span className="yv-map-val">{pct}%</span>
                {role === "yong" && <span className="yv-map-badge yong">약</span>}
                {role === "helper" && <span className="yv-map-badge helper">약</span>}
                {role === "gi" && <span className="yv-map-badge gi">과</span>}
                {role === "neutral" && <span className="yv-map-badge neutral">·</span>}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── 용신 잡는 세 방법: 격국 · 억부 · 조후 ── */}
      <section className="yv-block">
        <h2 className="yv-h">용신 잡는 세 방법</h2>
        <p className="yv-sub">용신은 유파마다 잡는 법이 갈려. 그릇(격국)·세기(억부)·온도(조후) 셋으로 나눠 보고, 겹치는 걸 위에서 ‘종합’으로 뽑았어.</p>
        <div className="yv-method-list">
          {/* 격국 */}
          <article className="yv-method">
            <div className="yv-method-head"><span className="yv-method-tag">격국 <em>그릇·틀</em></span><span className="yv-method-badge">{gyeokguk.name}</span></div>
            <p className="yv-method-what">타고난 사주의 ‘유형(그릇)’을 정하고, 그 그릇을 완성시키는 재료를 찾는 방법이야.</p>
            <p className="yv-method-title">{gyeokguk.title}</p>
            <p className="yv-method-desc">{gyeokguk.description}</p>
            <p className="yv-method-basis">{gyeokguk.basis}</p>
            <div className="yv-method-foot">
              <span className="yv-foot-k">이 그릇을 살리는 재료</span>
              <ElChips els={gyeokguk.sangsin} />
              <p className="yv-foot-reason">{gyeokguk.sangsinReason}</p>
            </div>
          </article>
          {/* 억부 */}
          <article className="yv-method">
            <div className="yv-method-head"><span className="yv-method-tag">억부 <em>세기 균형</em></span><span className="yv-method-badge">{body}</span></div>
            <p className="yv-method-what">기운이 센지(신강)·여린지(신약)를 보고, 시소 맞추듯 부족한 쪽을 채우는 방법이야. 실무에서 제일 기본이 돼.</p>
            <p className="yv-method-basis">{eokbu.reasoning}</p>
            <div className="yv-method-foot">
              <span className="yv-foot-k">보약 되는 기운</span>
              <ElChips els={eokbu.yongsin} empty="균형형이라 뚜렷하지 않음" />
              {eokbu.gisin.length > 0 && (
                <>
                  <span className="yv-foot-k yv-foot-k--bad">과부하 되는 기운</span>
                  <ElChips els={eokbu.gisin} />
                </>
              )}
            </div>
          </article>
          {/* 조후 */}
          <article className="yv-method">
            <div className="yv-method-head"><span className="yv-method-tag">조후 <em>온도 균형</em></span><span className="yv-method-badge">{johu.season} · {johu.hanYeolLabel}</span></div>
            <p className="yv-method-what">태어난 계절의 춥고 더움을 맞추는 방법이야. 얼었으면 불로 데우고, 달궈졌으면 물로 식혀.</p>
            <p className="yv-method-desc">{johu.reason}</p>
            <div className="yv-method-foot">
              <span className="yv-foot-k">온도를 맞추는 기운</span>
              <ElChips els={johu.johu} empty="지금은 온도 균형 — 급한 조후 없음" />
            </div>
          </article>
        </div>
      </section>

      {/* ── 처방 카드: 보약 기운 채우는 법 ── */}
      {prescEls.length > 0 && (
        <section className="yv-block">
          <h2 className="yv-h">보약 기운을 이렇게 채워</h2>
          <div className="yv-presc-list">
            {prescEls.map((el, i) => {
              const rx = EL_RX[el];
              return (
                <article key={el} className="yv-presc" style={elStyle(el)}>
                  <header className="yv-presc-head">
                    <Seal el={el} size="sm" />
                    <div className="yv-presc-title">
                      <b>{ELEMENT_META[el].label} 기운<span className="yv-presc-hanja">{EL_HANJA[el]}</span></b>
                      <span className="yv-presc-essence">{rx.essence}</span>
                    </div>
                    {i === 0 && <span className="yv-presc-rank">1순위</span>}
                  </header>
                  <div className="yv-presc-fields">
                    <div className="yv-presc-swatches">
                      <span className="yv-chiplike">색 · {rx.colors}</span>
                      <span className="yv-chiplike">방향 · {rx.direction}</span>
                    </div>
                    <p className="yv-presc-do">{rx.doThis}</p>
                    <p className="yv-presc-mind">“{rx.mindset}”</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 덜어내는 주의 ── */}
      {gisin.length > 0 && (
        <section className="yv-block">
          <h2 className="yv-h">이 기운은 새는 곳을 막아</h2>
          <div className="yv-warn-list">
            {gisin.map((el) => (
              <div key={el} className="yv-warn" style={elStyle(el)}>
                <span className="yv-warn-name">{ELEMENT_META[el].label} 기운<i>{EL_HANJA[el]}</i></span>
                <p>{EL_RX[el].drainNote}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 생애 흐름: 언제 순풍/역풍인가 ── */}
      <section className="yv-block">
        <h2 className="yv-h">생애 흐름 — 언제 그 기운이 들어오나</h2>
        <p className="yv-sub">위에서 뽑은 <b className="yv-tag-yong">보약 기운</b>이 들어오는 시기는 순풍, <b className="yv-tag-gi">과부하 기운</b>이 겹치는 시기는 역풍이야. 큰 흐름(대운, 10년)과 올해부터의 해 흐름(세운)을 색으로 표시했어.</p>
        <div className="yv-legend">
          <span className="yv-lg yv-lg--good">순풍</span>
          <span className="yv-lg yv-lg--help">무난</span>
          <span className="yv-lg yv-lg--mid">보통</span>
          <span className="yv-lg yv-lg--bad">역풍</span>
        </div>
        <YongsinLifeline cells={daewoon} currentAge={view.currentAge} />
        <FlowRail title="대운 자세히" hint="10년 단위 · 간지·계절까지 · 옆으로 밀어봐" cells={daewoon} />
        <FlowRail title="세운" hint="올해부터 10년, 해마다 · 옆으로 밀어봐" cells={seun} />
      </section>

      <p className="yv-disclaimer">
        용신은 명리에서 유파마다 잡는 법이 갈리는 영역이야(억부·조후·격국·통관·종격…). 여기 계산은 만세력을 근거로 한 <b>결정론적 참고안</b>이고, ‘운명 등급’이 아니라 ‘나한테 약 되는 기운 / 버거운 기운’ 정도로 가볍게 봐. 큰 결정은 이걸로만 하지 말고.
      </p>
    </div>
  );
}

function gaugePct(support: number, drain: number): number {
  const t = support + drain;
  return t > 0 ? Math.round((support / t) * 100) : 50;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
