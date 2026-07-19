"use client";

import Image from "next/image";
import { type CSSProperties } from "react";
import YongsinLifeline from "./YongsinLifeline";
import {
  ELEMENT_META,
  type Element,
  type FlowCell,
  type YongsinView,
} from "@/lib/saju/yongsinView";

/**
 * 용신 '기운 처방전' — 프리미엄 결정론 뷰.
 * 계산 엔진(격국·억부·조후·종합용신·생애흐름)은 buildYongsinView가 다 만들고,
 * 여기선 그걸 한방 '처방전'처럼 포장한다. ★AI 호출 없음★ — 정밀 풀이는 페이지의 '풀이 생성' 버튼.
 * 톤은 리포트 화면 설명문구(반말). 명리 용어는 옆 괄호에 일상어 풀이.
 *
 * ★화면 구성 원칙★: 첫 화면에서 "내 상태 + 나한테 필요한 기운"이 스크롤 없이 다 보여야 한다.
 * 그래서 히어로는 압축하고, 신강/신약도 별도 게이지 없이 히어로 안에서 비유 한 문장으로 끝낸다.
 * 생애 흐름은 따로 큰 섹션을 두지 않고 ★방법(격국·억부·조후)마다★ 붙여, "이 방법이 말하는
 * 기운은 언제 오나"를 그 자리에서 답한다.
 */

const EL_HANJA: Record<Element, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

const ELEMENT_ASSET: Record<Element, string> = {
  목: "/element-assets/wood.jpg",
  화: "/element-assets/fire.jpg",
  토: "/element-assets/earth.jpg",
  금: "/element-assets/metal.jpg",
  수: "/element-assets/water.jpg",
};

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

/**
 * 신강/신약을 '한 문장 비유'로 — 별도 게이지 섹션 없이 히어로에서 끝낸다.
 * state(내 상태) → why(왜 그런지, 일상 비유) → lead(그래서 필요한 게) → 보약 기운 이름.
 */
const BODY_LINE: Record<YongsinView["body"], { term: string; state: string; why: string; lead: string; leadNone: string }> = {
  신강: {
    term: "신강",
    state: "기운이 넘치는 편",
    why: "물이 꽉 찬 댐처럼, 안에만 쌓아두면 답답해지고 넘쳐",
    lead: "그래서 밖으로 흘려보내 주는 게",
    leadNone: "그래서 쌓아두지 말고 밖으로 쓰는 게 약이야.",
  },
  중화: {
    term: "중화",
    state: "기운이 고르게 잡힌 편",
    why: "균형 잘 잡힌 자전거처럼 웬만한 길에선 안 넘어져",
    lead: "여기에 얹으면 더 멀리 가는 게",
    leadNone: "한쪽으로 안 쏠려서, 급하게 뭘 채우기보다 지금 균형을 지키는 게 약이야.",
  },
  신약: {
    term: "신약",
    state: "기운이 여린 편",
    why: "배터리가 빨리 닳는 폰처럼 무리하면 금방 방전돼",
    lead: "그래서 너를 충전해주는 게",
    leadNone: "그래서 무리해서 밀어붙이기보다 채우고 쉬는 게 약이야.",
  },
};

function elStyle(el: Element): CSSProperties {
  const v = ELEMENT_META[el].cssVar;
  return { "--el": `var(${v})`, "--el-bg": `var(${v}-bg)` } as CSSProperties;
}

function ElementArt({ el, size = "md", priority = false }: { el: Element; size?: "lg" | "md" | "sm" | "chip"; priority?: boolean }) {
  const asset = ELEMENT_ASSET[el];
  return (
    <span className={`yv-art yv-art--${size}`} style={elStyle(el)} aria-hidden>
      <Image
        src={asset}
        alt=""
        fill
        sizes={size === "lg" ? "148px" : size === "md" ? "72px" : size === "sm" ? "52px" : "42px"}
        priority={priority}
        className="yv-art-img"
      />
      <span className="yv-art-wash" />
      <span className="yv-art-mark">{EL_HANJA[el]}</span>
    </span>
  );
}

/** 오행 칩 — 수묵 이미지 + 이름으로 오행을 구분. */
function ElChips({ els, empty }: { els: Element[]; empty?: string }) {
  if (!els.length) return <span className="yv-elnone">{empty ?? "없음"}</span>;
  return (
    <span className="yv-elchips">
      {els.map((e) => (
        <span key={e} className="yv-elchip" style={elStyle(e)}>
          <ElementArt el={e} size="chip" />
          <b>{ELEMENT_META[e].label}</b>
        </span>
      ))}
    </span>
  );
}

/** 세력 최약/최강 뽑기. */
function minStrength(els: Element[], strength: Record<Element, number>): Element | null {
  return els.length ? [...els].sort((a, b) => strength[a] - strength[b])[0] : null;
}
function maxStrength(els: Element[], strength: Record<Element, number>): Element | null {
  return els.length ? [...els].sort((a, b) => strength[b] - strength[a])[0] : null;
}

/** 방법 카드 안에 붙는 미니 연대기 — "이 방법이 꼽은 기운은 언제 오나". */
function MethodTimeline({
  els,
  label,
  cells,
  currentAge,
  empty,
}: {
  els: Element[];
  label: string;
  cells: FlowCell[];
  currentAge?: number;
  empty: string;
}) {
  if (!els.length) return <p className="yv-method-noline">{empty}</p>;
  return (
    <div className="yv-method-line">
      <span className="yv-method-line-k">이 기운, 평생 언제 들어오나</span>
      <span className="yv-method-line-hint">색칠된 구간이 이 기운이 들어오는 때야.</span>
      <YongsinLifeline cells={cells} currentAge={currentAge} focus={{ els, label }} />
    </div>
  );
}

export default function YongsinBoard({ view }: { view: YongsinView }) {
  const { ilgan, body, eokbu, gyeokguk, johu, primaryYong, helperYong, gisin, flow } = view;
  const strength = eokbu.strength;

  // 채워야 할 1순위 = 종합용신 중 최약(없으면 보조 → 조후 → 억부용신).
  const fillPool = primaryYong.length ? primaryYong : helperYong.length ? helperYong : johu.johu.length ? johu.johu : eokbu.yongsin;
  const fillPrimary = minStrength(fillPool, strength);
  // 덜어내야 할 1순위 = 기신 중 최강.
  const drainPrimary = maxStrength(gisin, strength);

  // 처방 카드로 펼칠 '보약' 오행(종합 우선, 없으면 보조).
  const prescEls = (primaryYong.length ? primaryYong : helperYong).slice().sort((a, b) => strength[a] - strength[b]);

  const daewoon = flow.filter((c) => c.kind === "대운");
  const bl = BODY_LINE[body];

  return (
    <div className="yv" style={fillPrimary ? elStyle(fillPrimary) : undefined}>
      {/* ── 히어로 처방전 — 내 상태 + 필요한 기운을 첫 화면에서 한 번에 ── */}
      <header className="yv-hero">
        <div className="yv-hero-foil" aria-hidden />
        <p className="yv-hero-eyebrow">
          <span className="yv-hero-stamp">用神</span>
          {ilgan.ko} 같은 사람의 기운 처방전
        </p>

        <div className="yv-hero-main">
          {fillPrimary && (
            <span className="yv-hero-art">
              <ElementArt el={fillPrimary} size="md" priority />
            </span>
          )}
          <div className="yv-hero-copy">
            <h1 className="yv-hero-title">
              {fillPrimary ? (
                <>
                  너를 살리는 건{" "}
                  <b style={{ color: `var(${ELEMENT_META[fillPrimary].cssVar})` }}>
                    {ELEMENT_META[fillPrimary].label} 기운
                  </b>
                </>
              ) : (
                "너를 살리는 기운 처방전"
              )}
            </h1>
            <p className="yv-hero-state">
              <span className="yv-hero-badge">
                {bl.term} · {bl.state}
              </span>
              너는 {bl.state}이야. {bl.why}.{" "}
              {fillPrimary ? (
                <>
                  {bl.lead}{" "}
                  <b style={{ color: `var(${ELEMENT_META[fillPrimary].cssVar})` }}>
                    {ELEMENT_META[fillPrimary].label} 기운
                  </b>
                  이야.
                </>
              ) : (
                bl.leadNone
              )}
            </p>
          </div>
        </div>

        <p className="yv-hero-basis">
          타고난 나 · {ilgan.ko} 같은 사람{ilgan.metaphor && ` · ${ilgan.metaphor}`}
        </p>
      </header>

      {/* ── 채워라 / 덜어라 ── */}
      <div className="yv-rx">
        {fillPrimary && (
          <div className="yv-rx-card yv-rx-card--fill" style={elStyle(fillPrimary)}>
            <span className="yv-rx-tag">채워야 할 기운</span>
            <div className="yv-rx-body">
              <ElementArt el={fillPrimary} size="sm" />
              <div><b className="yv-rx-name">{ELEMENT_META[fillPrimary].label} 기운</b><span className="yv-rx-hanja">{EL_HANJA[fillPrimary]}</span></div>
            </div>
            <p className="yv-rx-note">{ELEMENT_META[fillPrimary].gist}</p>
          </div>
        )}
        {drainPrimary && (
          <div className="yv-rx-card yv-rx-card--drain" style={elStyle(drainPrimary)}>
            <span className="yv-rx-tag">덜어내야 할 기운</span>
            <div className="yv-rx-body">
              <ElementArt el={drainPrimary} size="sm" />
              <div><b className="yv-rx-name">{ELEMENT_META[drainPrimary].label} 기운</b><span className="yv-rx-hanja">{EL_HANJA[drainPrimary]}</span></div>
            </div>
            <p className="yv-rx-note yv-rx-note--muted">기댈수록 힘 빠지는 기운 — 여기에 너무 걸지 마</p>
          </div>
        )}
      </div>

      {/* ── 용신 잡는 세 방법: 격국 · 억부 · 조후 (각 방법마다 '언제 오나' 연대기) ── */}
      <section className="yv-block">
        <h2 className="yv-h">이 답이 나온 세 가지 방법</h2>
        <p className="yv-sub">
          용신은 &lsquo;나한테 약이 되는 기운&rsquo;이야. 근데 이걸 찾는 방법이 하나가 아니라서 옛날부터 세 가지를 같이 봐.
          세 방법이 겹쳐서 같은 기운을 가리킬수록 확실한 거고, 그렇게 뽑은 게 맨 위의 답이야.
        </p>
        <div className="yv-method-list">
          {/* 격국 */}
          <article className="yv-method">
            <div className="yv-method-head"><span className="yv-method-tag">격국 <em>타고난 그릇</em></span><span className="yv-method-badge">{gyeokguk.name}</span></div>
            <p className="yv-method-q">&ldquo;나는 원래 어떤 모양의 사람이지?&rdquo;</p>
            <p className="yv-method-what">사람마다 타고난 그릇 모양이 달라. 컵인지 냄비인지 항아리인지 먼저 정하고, 그 모양을 완성시켜 줄 재료를 찾는 방법이야.</p>
            <p className="yv-method-title">{gyeokguk.title}</p>
            <p className="yv-method-desc">{gyeokguk.description}</p>
            <p className="yv-method-basis">{gyeokguk.basis}</p>
            <div className="yv-method-foot">
              <span className="yv-foot-k">이 그릇을 완성시키는 기운</span>
              <ElChips els={gyeokguk.sangsin} empty="이 그릇은 딱 떨어지는 재료가 없어" />
              <p className="yv-foot-reason">{gyeokguk.sangsinReason}</p>
            </div>
            <MethodTimeline
              els={gyeokguk.sangsin}
              label="그릇을 완성시키는 기운"
              cells={daewoon}
              currentAge={view.currentAge}
              empty="이 방법은 콕 집는 기운이 없어서 시기도 따로 안 잡혀."
            />
          </article>

          {/* 억부 */}
          <article className="yv-method">
            <div className="yv-method-head"><span className="yv-method-tag">억부 <em>힘의 균형</em></span><span className="yv-method-badge">{bl.term}</span></div>
            <p className="yv-method-q">&ldquo;지금 내 힘이 남아? 모자라?&rdquo;</p>
            <p className="yv-method-what">시소를 떠올려 봐. 한쪽이 무거우면 반대쪽에 무게를 얹어 맞추잖아. 그렇게 남는 건 덜고 모자란 건 채우는 방법이야 — 셋 중에 제일 기본이라 보통 여기서 시작해.</p>
            <p className="yv-method-desc">너는 {bl.state}이야. {bl.why}.</p>
            <p className="yv-method-basis">{eokbu.reasoning}</p>
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
            <MethodTimeline
              els={eokbu.yongsin}
              label="힘의 균형을 맞추는 기운"
              cells={daewoon}
              currentAge={view.currentAge}
              empty="지금은 힘이 팽팽해서, 이 방법으로는 특별히 기다릴 시기가 없어."
            />
          </article>

          {/* 조후 */}
          <article className="yv-method">
            <div className="yv-method-head"><span className="yv-method-tag">조후 <em>온도</em></span><span className="yv-method-badge">{johu.season} · {johu.hanYeolLabel}</span></div>
            <p className="yv-method-q">&ldquo;나는 너무 춥거나 덥진 않아?&rdquo;</p>
            <p className="yv-method-what">태어난 계절의 온도를 보는 방법이야. 얼어 있으면 불로 데우고, 너무 달아올라 있으면 물로 식혀. 힘이 세고 약하고를 떠나서, 일단 살 만한 온도부터 만드는 거지.</p>
            <p className="yv-method-desc">{johu.reason}</p>
            <div className="yv-method-foot">
              <span className="yv-foot-k">온도를 맞추는 기운</span>
              <ElChips els={johu.johu} empty="지금은 온도가 알맞아 — 급히 데우거나 식힐 게 없어" />
            </div>
            <MethodTimeline
              els={johu.johu}
              label="온도를 맞추는 기운"
              cells={daewoon}
              currentAge={view.currentAge}
              empty="온도가 이미 알맞아서, 이 방법으로는 따로 기다릴 시기가 없어."
            />
          </article>
        </div>
      </section>

      {/* ── 처방 카드: 보약 기운 채우는 법 ── */}
      {prescEls.length > 0 && (
        <section className="yv-block">
          <h2 className="yv-h">그 기운, 이렇게 채워</h2>
          <div className="yv-presc-list">
            {prescEls.map((el, i) => {
              const rx = EL_RX[el];
              return (
                <article key={el} className="yv-presc" style={elStyle(el)}>
                  <header className="yv-presc-head">
                    <ElementArt el={el} size="md" />
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
                    <p className="yv-presc-mind">&ldquo;{rx.mindset}&rdquo;</p>
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
                <ElementArt el={el} size="sm" />
                <span className="yv-warn-copy">
                  <span className="yv-warn-name">{ELEMENT_META[el].label} 기운<i>{EL_HANJA[el]}</i></span>
                  <p>{EL_RX[el].drainNote}</p>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="yv-disclaimer">
        용신은 명리에서 방법마다 답이 갈리는 영역이야(억부·조후·격국·통관·종격…). 여기 계산은 만세력을 근거로 한 <b>참고안</b>이고,
        &lsquo;운명 등급&rsquo;이 아니라 &lsquo;나한테 약 되는 기운 / 버거운 기운&rsquo; 정도로 가볍게 봐. 큰 결정은 이걸로만 하지 말고.
      </p>
    </div>
  );
}
