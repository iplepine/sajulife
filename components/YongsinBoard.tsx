import {
  ELEMENT_META,
  type Element,
  type FlowCell,
  type Verdict,
  type YongsinView,
} from "@/lib/saju/yongsinView";

/** 오행 칩 — 색점 + 이모지 + 이름(+선택 결). 색은 오행 신호로만. */
function ElChip({ el, showGist = false }: { el: Element; showGist?: boolean }) {
  const m = ELEMENT_META[el];
  return (
    <span
      className="ys-chip"
      style={{
        color: `var(${m.cssVar})`,
        background: `var(${m.cssVar}-bg)`,
        borderColor: `color-mix(in srgb, var(${m.cssVar}) 45%, transparent)`,
      }}
    >
      <span className="ys-chip-emoji" aria-hidden>{m.emoji}</span>
      <b>{m.label}</b>
      {showGist && <em>{m.gist}</em>}
    </span>
  );
}

function ElChips({ els, empty }: { els: Element[]; empty?: string }) {
  if (!els.length) return <span className="ys-none">{empty ?? "없음"}</span>;
  return (
    <span className="ys-chips">
      {els.map((e) => <ElChip key={e} el={e} />)}
    </span>
  );
}

const VERDICT_UI: Record<Verdict, { cls: string; tag: string }> = {
  용신: { cls: "good", tag: "좋은 결" },
  도움: { cls: "help", tag: "무난" },
  중립: { cls: "mid", tag: "보통" },
  기신: { cls: "bad", tag: "버거움" },
};

function FlowRail({ title, hint, cells }: { title: string; hint: string; cells: FlowCell[] }) {
  if (!cells.length) {
    return (
      <div className="ys-rail-wrap">
        <div className="ys-rail-head"><b>{title}</b><em>{hint}</em></div>
        <p className="ys-none" style={{ padding: "4px 2px" }}>흐름 정보를 계산하지 못했어(태어난 시각 정보가 필요할 수 있어).</p>
      </div>
    );
  }
  return (
    <div className="ys-rail-wrap">
      <div className="ys-rail-head"><b>{title}</b><em>{hint}</em></div>
      <div className="ys-rail" role="list">
        {cells.map((c, i) => {
          const m = ELEMENT_META[c.element];
          const v = VERDICT_UI[c.verdict];
          return (
            <div
              key={`${c.label}-${i}`}
              role="listitem"
              className={`ys-cell ys-cell--${v.cls}${c.isNow ? " is-now" : ""}`}
            >
              {c.isNow && <span className="ys-now-pill">지금</span>}
              <span className="ys-cell-el" style={{ color: `var(${m.cssVar})` }} aria-hidden>{m.emoji}</span>
              <b className="ys-cell-label">{c.label}</b>
              <span className="ys-cell-gz">{c.ganzhi}</span>
              <span className="ys-cell-season">{c.season}</span>
              <span className={`ys-cell-tag ys-cell-tag--${v.cls}`}>{v.tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function YongsinBoard({ view }: { view: YongsinView }) {
  const { ilgan, body, eokbu, gyeokguk, johu, primaryYong, helperYong, gisin, flow } = view;

  const bodyCopy: Record<typeof body, string> = {
    신강: "내 기운이 센 편이야. 그럴 땐 나를 적당히 '빼주는' 기운이 보약이 돼 — 안 그럼 고집·과열로 흘러.",
    중화: "세기가 꽤 균형 잡혀 있어. 억부로는 '딱 이거다' 하는 용신이 뚜렷하지 않으니, 아래 조후(온도)랑 격국(그릇) 신호를 더 봐.",
    신약: "내 기운이 여린 편이야. 그럴 땐 나를 '받쳐주는' 기운이 보약이 돼 — 혼자 다 감당하려 말고 기대는 게 이득이야.",
  };

  const daewoon = flow.filter((c) => c.kind === "대운");
  const seun = flow.filter((c) => c.kind === "세운");

  return (
    <div className="ys">
      {/* 헤더 */}
      <header className="ys-hero">
        <span className="ys-hero-emoji" aria-hidden>{ilgan.emoji}</span>
        <div className="ys-hero-copy">
          <h1 className="ys-hero-title">{ilgan.ko} 같은 사람의 <b>용신</b></h1>
          <p className="ys-hero-lead">
            용신은 <b>지금 네 사주에 제일 필요한 기운</b>이야. 잡는 방법이 여러 갈래라
            <b> 격국·억부·조후</b> 셋으로 나눠 보고, 세 개가 겹치는 걸 {"‘종합 용신’"}으로 뽑았어.
          </p>
        </div>
      </header>

      {/* 종합 용신 — 결론 먼저 */}
      <section className="ys-verdict card">
        <div className="ys-verdict-row">
          <div className="ys-verdict-col">
            <span className="ys-verdict-k ys-verdict-k--good">보약 되는 기운</span>
            <ElChips els={primaryYong.length ? primaryYong : helperYong} empty="딱 하나로 안 몰려 — 아래 세 방법을 각각 참고해" />
          </div>
          <div className="ys-verdict-col">
            <span className="ys-verdict-k ys-verdict-k--bad">과부하 되는 기운</span>
            <ElChips els={gisin} empty="뚜렷한 과부하 기운은 없어" />
          </div>
        </div>
        <p className="ys-verdict-note">
          {primaryYong.length
            ? "세 방법 중 둘 이상이 같이 가리킨 기운이야. 이 기운이 들어오는 시기·환경·사람이 널 살려."
            : "방법마다 가리키는 게 갈려. 한쪽으로 단정하지 말고 상황 따라 골라 써."}
        </p>
      </section>

      {/* 세 방법 */}
      <h2 className="ys-h2">용신 잡는 세 방법</h2>

      {/* 격국 */}
      <section className="ys-method card">
        <div className="ys-method-head">
          <span className="ys-method-tag">격국 <em>그릇·틀</em></span>
        </div>
        <p className="ys-method-what">타고난 사주의 {"‘유형(그릇)’"}을 먼저 정하고, 그 그릇을 완성시키는 재료를 찾는 방법이야.</p>
        <div className="ys-gyeok">
          <b className="ys-gyeok-title">{gyeokguk.title}</b>
          <span className="ys-gyeok-name">{gyeokguk.name}</span>
        </div>
        <p className="ys-method-desc">{gyeokguk.description}</p>
        <p className="ys-method-basis">{gyeokguk.basis}</p>
        <div className="ys-method-foot">
          <span className="ys-foot-k">이 그릇을 살리는 재료</span>
          <ElChips els={gyeokguk.sangsin} />
          <p className="ys-foot-reason">{gyeokguk.sangsinReason}</p>
        </div>
      </section>

      {/* 억부 */}
      <section className="ys-method card">
        <div className="ys-method-head">
          <span className="ys-method-tag">억부 <em>세기 균형</em></span>
          <span className="ys-body-badge">{body}</span>
        </div>
        <p className="ys-method-what">내 기운이 센지(신강) 여린지(신약)를 보고, 시소를 수평 맞추듯 부족한 쪽을 채우는 방법이야. 실무에서 제일 기본이 돼.</p>
        <p className="ys-method-desc">{bodyCopy[body]}</p>
        <p className="ys-method-basis">{eokbu.reasoning}</p>
        <div className="ys-method-foot">
          <span className="ys-foot-k">보약 되는 기운</span>
          <ElChips els={eokbu.yongsin} empty="균형형이라 뚜렷하지 않음" />
          {eokbu.gisin.length > 0 && (
            <>
              <span className="ys-foot-k ys-foot-k--bad">과부하 되는 기운</span>
              <ElChips els={eokbu.gisin} />
            </>
          )}
        </div>
      </section>

      {/* 조후 */}
      <section className="ys-method card">
        <div className="ys-method-head">
          <span className="ys-method-tag">조후 <em>온도 균형</em></span>
          <span className="ys-body-badge">{johu.season} · {johu.hanYeolLabel}</span>
        </div>
        <p className="ys-method-what">태어난 계절의 춥고 더움을 맞추는 방법이야. 에어컨·난방처럼, 얼었으면 불로 데우고 달궈졌으면 물로 식혀.</p>
        <p className="ys-method-desc">{johu.reason}</p>
        <div className="ys-method-foot">
          <span className="ys-foot-k">온도를 맞추는 기운</span>
          <ElChips els={johu.johu} empty="지금은 온도 균형 — 급한 조후 없음" />
        </div>
      </section>

      {/* 생애 흐름표 */}
      <h2 className="ys-h2">생애 흐름 — 언제 그 기운이 들어오나</h2>
      <p className="ys-flow-lead">
        위에서 뽑은 <b>보약 기운</b>이 들어오는 시기는 순풍, <b>과부하 기운</b>이 겹치는 시기는 역풍이야.
        큰 흐름(대운, 10년)과 올해부터의 해 흐름(세운)을 색으로 표시했어.
      </p>
      <div className="ys-legend">
        <span className="ys-lg ys-lg--good">좋은 결</span>
        <span className="ys-lg ys-lg--help">무난</span>
        <span className="ys-lg ys-lg--mid">보통</span>
        <span className="ys-lg ys-lg--bad">버거움</span>
      </div>

      <FlowRail title="대운" hint="10년 단위 큰 흐름 · 옆으로 밀어봐" cells={daewoon} />
      <FlowRail title="세운" hint="올해부터 10년, 해마다 · 옆으로 밀어봐" cells={seun} />

      <p className="ys-disclaimer">
        용신은 명리에서 유파마다 잡는 법이 갈리는 영역이야(억부·조후·격국·통관·종격…). 여기 계산은
        만세력을 근거로 한 <b>결정론적 참고안</b>이고, {"‘운명 등급’"}이 아니라 {"‘나한테 약 되는 기운 / 버거운 기운’"}
        정도로 가볍게 봐. 큰 결정은 이걸로만 하지 말고.
      </p>
    </div>
  );
}
