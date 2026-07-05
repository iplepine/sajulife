"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import BrandIcon from "@/components/BrandIcon";
import { scheduleCenterCurrent } from "@/lib/ui/scroll";
import {
  ELEMENT_META,
  type Element,
  type FlowCell,
  type Verdict,
  type YongsinView,
} from "@/lib/saju/yongsinView";

/**
 * 용신 보기 결정론 뷰 — 격국·억부·조후·종합용신·생애흐름을 한자리에.
 * ★디자인은 개인 사주(PersonalReportBody)와 같은 톤★: 한지+먹, .h-sec 섹션 헤더,
 * 오행은 신호색으로만, 차분한 surface 카드. AI 풀이는 페이지가 ReportView로 따로 렌더한다.
 */

const EL_CLASS: Record<Element, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
const EL_HANJA: Record<Element, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

/** 오행별 처방 카피 — 채우는 법(색·방향·행동·마음가짐) + 과할 때(새는 곳). */
const EL_RX: Record<Element, { colors: string; direction: string; doThis: string; mindset: string; drainNote: string }> = {
  목: {
    colors: "초록·연둣빛", direction: "동쪽",
    doThis: "새 판을 하나 벌여. 배우기·기획·아침 산책처럼 '자라는' 쪽 일이 너한텐 보약이야.",
    mindset: "다 다듬고 시작하려다 평생 못 시작해. 싹부터 틔우고 크면서 다듬어.",
    drainNote: "벌여만 놓고 수습을 못 하면 여기서 방전돼. 새로 손대는 것부터 멈추고 벌인 것부터 매듭지어.",
  },
  화: {
    colors: "빨강·주홍", direction: "남쪽",
    doThis: "드러내. 사람 만나고, 표현하고, 햇빛 받아. 켜야 빛나는 타입이라 꺼놓으면 네가 제일 답답해.",
    mindset: "속으로 삭이지 마. 네 열은 나눠 써야 안 타버려.",
    drainNote: "끝까지 태우면 재만 남아. 텐션 최대로 올리는 버릇이 번아웃의 시작이야 — 일부러 꺼두는 시간을 만들어.",
  },
  토: {
    colors: "노랑·베이지·흙빛", direction: "중앙",
    doThis: "루틴을 깔아. 정리·기록·같은 시간에 같은 일 — 땅 다지는 반복이 너를 단단하게 해.",
    mindset: "빨리 못 간다고 조급해 마. 너는 쌓아서 이기는 사람이야.",
    drainNote: "다 끌어안고 안 놓으면 여기서 무거워져. 쟁여둔 것·묵은 관계, 좀 덜어내.",
  },
  금: {
    colors: "흰색·은빛·회색", direction: "서쪽",
    doThis: "매듭지어. 안 쓰는 거 버리고 애매한 거 결론 내. 쳐낼수록 또렷해지는 타입이야.",
    mindset: "다 좋게 남기려다 아무것도 못 끝내. 자를 건 과감히 잘라.",
    drainNote: "너무 날 세우면 여기서 뻣뻣해져. 맞다·틀리다로 가르는 버릇, 좀 무디게 가.",
  },
  수: {
    colors: "검정·남색", direction: "북쪽",
    doThis: "쉬고, 읽고, 물가에 가. 멈춰서 생각 정리하는 시간이 너한텐 진짜 약이야.",
    mindset: "쉬는 데 죄책감 갖지 마. 너는 고여야 맑아지는 사람이야.",
    drainNote: "재기만 하면 여기서 못 움직여. 생각만 굴리는 늪, 일단 한 발부터 담가.",
  },
};

const BODY_COPY: Record<YongsinView["body"], string> = {
  신강: "기운이 센 편이야(신강). 안에 쟁여두면 답답해지니, 밖으로 쓰고 덜어내는 기운이 보약이 돼.",
  중화: "기운 균형이 잘 잡힌 편이야(중화). 억부로는 '딱 이거다'가 은근해서, 격국·조후 신호를 더 봐.",
  신약: "기운이 여린 편이야(신약). 혼자 다 감당하려 말고, 너를 받쳐주는 기운에 기대는 게 이득이야.",
};

function elStyle(el: Element): CSSProperties {
  const v = ELEMENT_META[el].cssVar;
  return {
    color: `var(${v})`,
    background: `var(${v}-bg)`,
    borderColor: `color-mix(in srgb, var(${v}) 42%, transparent)`,
  };
}

/** 오행 칩 — 이모지 + 이름. 오행 신호색만. */
function ElChips({ els, empty }: { els: Element[]; empty?: string }) {
  if (!els.length) return <span className="yv-elnone">{empty ?? "없음"}</span>;
  return (
    <span className="yv-els">
      {els.map((e) => (
        <span key={e} className="yv-el" style={elStyle(e)}>
          <span aria-hidden>{ELEMENT_META[e].emoji}</span>
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
        <p className="yv-elnone">흐름 정보를 계산하지 못했어(태어난 시각 정보가 필요할 수 있어).</p>
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
              {c.isNow && <span className="yv-now">지금</span>}
              <span className="yv-cell-el" style={{ color: `var(${m.cssVar})` }} aria-hidden>{m.emoji}</span>
              <b className="yv-cell-label">{c.label}</b>
              <span className="yv-cell-gz">{c.ganzhi}</span>
              <span className="yv-cell-season">{c.season}</span>
              <span className={`yv-cell-tag yv-cell-tag--${v.cls}`}>{v.tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pickPrimary(els: Element[], strength: Record<Element, number>): Element | null {
  return els.length ? [...els].sort((a, b) => strength[a] - strength[b])[0] : null;
}

export default function YongsinBoard({ view }: { view: YongsinView }) {
  const { ilgan, body, eokbu, gyeokguk, johu, primaryYong, helperYong, gisin, flow } = view;
  const strength = eokbu.strength;
  const total = (Object.values(strength) as number[]).reduce((s, n) => s + n, 0) || 1;

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return scheduleCenterCurrent(() => [...root.querySelectorAll<HTMLElement>(".yv-rail")], ".yv-cell.is-now");
  }, [view]);

  const goodEls = primaryYong.length ? primaryYong : helperYong;
  const primary = pickPrimary(primaryYong.length ? primaryYong : helperYong.length ? helperYong : johu.johu, strength);
  const prescEls = [...goodEls].sort((a, b) => strength[a] - strength[b]);

  const daewoon = flow.filter((c) => c.kind === "대운");
  const seun = flow.filter((c) => c.kind === "세운");

  function roleTag(el: Element): { label: string; cls: string } | null {
    if (primaryYong.includes(el) || helperYong.includes(el)) return { label: "약", cls: "good" };
    if (gisin.includes(el)) return { label: "과", cls: "bad" };
    return null;
  }

  return (
    <div className="yv" ref={rootRef}>
      {/* ── 히어로 (개인 사주와 같은 hero-identity) ── */}
      <div className="hero-identity mt4">
        <BrandIcon name="saju-unni" className="hero-identity-icon" />
        <div className="hero-identity-copy">
          <p className="hero-guide">사주언니가 보는 네 용신은</p>
          <p className="hero-line">
            {primary ? (
              <>지금 너한테 제일 필요한 건 <b style={{ color: `var(${ELEMENT_META[primary].cssVar})` }}>{ilgan.ko} 같은 사람에게 {ELEMENT_META[primary].label}({EL_HANJA[primary]}) 기운</b></>
            ) : (
              <>{ilgan.ko} 같은 사람 — 방법마다 가리키는 게 갈려, 아래 세 방법을 따로 참고해</>
            )}
          </p>
        </div>
      </div>

      {/* ── 결론 먼저: 채울 기운 / 덜 기운 ── */}
      <p className="h-sec mt5">지금 필요한 기운</p>
      <div className="yv-verdict">
        <div className="yv-verdict-col">
          <span className="yv-vk yv-vk--good">채우면 약이 되는 기운</span>
          <ElChips els={goodEls} empty="딱 하나로 안 몰려 — 세 방법을 각각 봐" />
        </div>
        <div className="yv-verdict-col">
          <span className="yv-vk yv-vk--bad">기대면 방전되는 기운</span>
          <ElChips els={gisin} empty="뚜렷한 과부하 기운은 없어" />
        </div>
      </div>
      <p className="yv-note">
        {primaryYong.length
          ? "격국·억부·조후 중 둘 이상이 같이 가리킨 기운이야. 이 기운이 들어오는 시기·환경·사람이 널 살려."
          : "방법마다 가리키는 게 갈려. 한쪽으로 단정하지 말고 상황 따라 골라 써."}
      </p>

      {/* ── 다섯 기운의 세력 (오행구성과 같은 .dist/.legend) ── */}
      <p className="h-sec mt5">타고난 다섯 기운의 세력</p>
      <div className="dist">
        {(Object.keys(ELEMENT_META) as Element[]).map((el) => (
          <span key={el} className={EL_CLASS[el]} style={{ width: `${(strength[el] / total) * 100}%` }} />
        ))}
      </div>
      <div className="legend">
        {(Object.keys(ELEMENT_META) as Element[]).map((el) => {
          const r = roleTag(el);
          return (
            <div key={el}>
              <span className={`el-dot ${EL_CLASS[el]}`} />
              {ELEMENT_META[el].label} {Math.round((strength[el] / total) * 100)}%
              {r && <span className={`yv-role yv-role--${r.cls}`}>{r.label}</span>}
            </div>
          );
        })}
      </div>

      {/* ── 용신 잡는 세 방법 ── */}
      <p className="h-sec mt5">용신 잡는 세 방법</p>
      <div className="yv-methods">
        <section className="card yv-method">
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
        </section>

        <section className="card yv-method">
          <div className="yv-method-head"><span className="yv-method-tag">억부 <em>세기 균형</em></span><span className="yv-method-badge">{body}</span></div>
          <p className="yv-method-what">기운이 센지(신강)·여린지(신약)를 보고, 시소 맞추듯 부족한 쪽을 채우는 방법이야. 실무에서 제일 기본이 돼.</p>
          <p className="yv-method-desc">{BODY_COPY[body]}</p>
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
        </section>

        <section className="card yv-method">
          <div className="yv-method-head"><span className="yv-method-tag">조후 <em>온도 균형</em></span><span className="yv-method-badge">{johu.season} · {johu.hanYeolLabel}</span></div>
          <p className="yv-method-what">태어난 계절의 춥고 더움을 맞추는 방법이야. 얼었으면 불로 데우고, 달궈졌으면 물로 식혀.</p>
          <p className="yv-method-desc">{johu.reason}</p>
          <div className="yv-method-foot">
            <span className="yv-foot-k">온도를 맞추는 기운</span>
            <ElChips els={johu.johu} empty="지금은 온도 균형 — 급한 조후 없음" />
          </div>
        </section>
      </div>

      {/* ── 채우는 법 ── */}
      {prescEls.length > 0 && (
        <>
          <p className="h-sec mt5">이 기운을 이렇게 채워</p>
          <div className="yv-presc-list">
            {prescEls.map((el) => {
              const rx = EL_RX[el];
              return (
                <div key={el} className={`card yv-presc yv-presc--${EL_CLASS[el]}`}>
                  <div className="yv-presc-head">
                    <span className="el-dot" style={{ background: `var(${ELEMENT_META[el].cssVar})` }} />
                    <b>{ELEMENT_META[el].label} 기운 <span className="yv-presc-hanja">{EL_HANJA[el]}</span></b>
                  </div>
                  <div className="yv-presc-tags">
                    <span className="yv-tag">색 · {rx.colors}</span>
                    <span className="yv-tag">방향 · {rx.direction}</span>
                  </div>
                  <p className="yv-presc-do">{rx.doThis}</p>
                  <p className="yv-presc-mind">{rx.mindset}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── 새는 곳 ── */}
      {gisin.length > 0 && (
        <>
          <p className="h-sec mt5">이 기운은 새는 곳을 막아</p>
          <div className="yv-warn-list">
            {gisin.map((el) => (
              <div key={el} className="card yv-warn">
                <span className="yv-warn-el"><span className="el-dot" style={{ background: `var(${ELEMENT_META[el].cssVar})` }} />{ELEMENT_META[el].label} 기운</span>
                <p>{EL_RX[el].drainNote}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 생애 흐름 ── */}
      <p className="h-sec mt5">생애 흐름 — 언제 그 기운이 들어오나</p>
      <p className="yv-note">
        위에서 뽑은 <b>보약 기운</b>이 들어오는 시기는 순풍, <b>과부하 기운</b>이 겹치는 시기는 역풍이야. 큰 흐름(대운, 10년)과 올해부터의 해 흐름(세운)을 표시했어.
      </p>
      <div className="yv-legend">
        <span className="yv-lg yv-lg--good">순풍</span>
        <span className="yv-lg yv-lg--help">무난</span>
        <span className="yv-lg yv-lg--mid">보통</span>
        <span className="yv-lg yv-lg--bad">역풍</span>
      </div>
      <FlowRail title="대운" hint="10년 단위 큰 흐름 · 옆으로 밀어봐" cells={daewoon} />
      <FlowRail title="세운" hint="올해부터 10년, 해마다 · 옆으로 밀어봐" cells={seun} />

      <p className="yv-disclaimer">
        용신은 명리에서 유파마다 잡는 법이 갈리는 영역이야(억부·조후·격국·통관·종격…). 여기 계산은 만세력을 근거로 한 <b>결정론적 참고안</b>이고, ‘운명 등급’이 아니라 ‘나한테 약 되는 기운 / 버거운 기운’ 정도로 가볍게 봐. 큰 결정은 이걸로만 하지 말고.
      </p>
    </div>
  );
}
