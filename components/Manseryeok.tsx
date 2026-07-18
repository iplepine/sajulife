"use client";

import { useEffect, useRef, useState } from "react";
import { EL_BG, EL_CLASS, EL_ORDER, EL_VAR } from "@/components/report/PersonalReportBody";
import { scheduleCenterCurrent } from "@/lib/ui/scroll";
import type { LuckColumn, Manseryeok as ManseryeokData } from "@/lib/saju/manseryeok";
import { TEN_SPIRIT_LABELS } from "@/lib/saju/tenSpirits";
import { TWELVE_STAGE_META } from "@/lib/saju/twelveStages";

/**
 * 만세력 원본 표. 원국, 대운, 세운, 월운을 같은 칸 언어로 펼친다.
 * 앱 톤: 오행 색이 주인공이고 한자는 작은 회색 병기, 십이운성은 텍스트로만 읽힌다.
 * 데이터는 전부 결정론적 계산(AI 0). 월운은 접이식이며 연도를 바꿔 볼 수 있다.
 */
export default function Manseryeok({
  data,
  onChangeWolwoonYear,
  wolwoonLoading,
}: {
  data: ManseryeokData;
  onChangeWolwoonYear?: (year: number) => void;
  wolwoonLoading?: boolean;
}) {
  const [wolOpen, setWolOpen] = useState(false);

  // 진입 시(그리고 연도·월운 펼침 변화 시) 대운·세운·월운 레일을 '지금' 칸이
  // 가운데 오도록 스크롤한다. 세운은 올해를 가운데 두고 앞뒤로 펼쳐두므로 특히 필요.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return scheduleCenterCurrent(
      () => [...root.querySelectorAll<HTMLElement>(".mnr-track")],
      ".mnr-col.on",
    );
  }, [data, wolOpen]);

  function pickYear(year: number) {
    if (!onChangeWolwoonYear) return;
    onChangeWolwoonYear(year);
    setWolOpen(true);
  }

  return (
    <div className="mnr" ref={rootRef}>
      <MetaSummary data={data} />

      <p className="mnr-lead">
        네 사주 원본이야. 앱이 풀이할 때 쓰는 재료를 그대로 펼쳐놨어. 정확한 만세력 기준이라
        어디 가서 봐도 이 값이야. 색은 오행을, 아래 글자는 그때의 기운 세기인 십이운성을 뜻해.
      </p>

      <Section title="원국" hint="타고난 네 기둥이야. 평생 바뀌지 않고, 가운데 일의 천간이 바로 너인 일간이야.">
        <Track>
          {data.natal.map((c) => (
            <LuckCol key={c.key} col={c} />
          ))}
        </Track>
      </Section>

      <Section title="대운" hint="10년마다 바뀌는 큰 흐름이야. 지금 칸이 네가 올라탄 대운이야.">
        <Track>
          {data.daewoon.map((c) => (
            <LuckCol key={c.key} col={c} />
          ))}
        </Track>
      </Section>

      <Section title="세운" hint="해마다 달라지는 기운이야. 올해를 가운데에 두고 앞뒤로 펼쳤어.">
        <Track>
          {data.saewoon.map((c) => (
            <LuckCol
              key={c.key}
              col={c}
              onClick={onChangeWolwoonYear ? () => pickYear(Number(c.label)) : undefined}
              clickHint="이 해 월운 보기"
            />
          ))}
        </Track>
      </Section>

      <section className="mnr-sec">
        <button
          type="button"
          className="mnr-sec-head mnr-sec-toggle"
          aria-expanded={wolOpen}
          onClick={() => setWolOpen((v) => !v)}
        >
          <span className="mnr-sec-title">
            월운 <span className="mnr-sec-year">{data.wolwoon.year}년</span>
          </span>
          <span className="mnr-toggle-mark">{wolOpen ? "접기 ▲" : "펼치기 ▼"}</span>
        </button>
        {wolOpen && (
          <>
            <div className="mnr-year-nav">
              {onChangeWolwoonYear ? (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onChangeWolwoonYear(data.wolwoon.year - 1)}
                    disabled={wolwoonLoading}
                  >
                    ← {data.wolwoon.year - 1}
                  </button>
                  <span className="mnr-year-now">{data.wolwoon.year}년 (양력)</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onChangeWolwoonYear(data.wolwoon.year + 1)}
                    disabled={wolwoonLoading}
                  >
                    {data.wolwoon.year + 1} →
                  </button>
                </>
              ) : (
                <span className="mnr-year-now">{data.wolwoon.year}년 (양력)</span>
              )}
            </div>
            <p className="mnr-hint">양력 달 기준(절기로 갈리는 자리라 달 중순 기운으로 잡았어). 세운 칸을 눌러도 그 해로 바뀌어.</p>
            <Track dim={wolwoonLoading}>
              {data.wolwoon.columns.map((c) => (
                <LuckCol key={c.key} col={c} />
              ))}
            </Track>
          </>
        )}
      </section>

      <Legend />
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="mnr-sec">
      <div className="mnr-sec-head">
        <span className="mnr-sec-title">{title}</span>
      </div>
      <p className="mnr-hint">{hint}</p>
      {children}
    </section>
  );
}

function Track({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div className={`mnr-track${dim ? " dim" : ""}`} role="list">
      {children}
    </div>
  );
}

function LuckCol({ col, onClick, clickHint }: { col: LuckColumn; onClick?: () => void; clickHint?: string }) {
  const empty = !col.gan || !col.zhi;
  const cls = [
    "mnr-col",
    col.current ? "on" : "",
    col.dayMaster ? "me" : "",
    onClick ? "tappable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <div className="mnr-col-head">
        <span className="mnr-col-label">{col.label}</span>
        {col.subLabel && <span className="mnr-col-sub">{col.subLabel}</span>}
        {col.current && <span className="mnr-now">지금</span>}
        {col.dayMaster && <span className="mnr-me-badge">나</span>}
      </div>

      {empty ? (
        <div className="mnr-empty">시각 모름</div>
      ) : (
        <>
          <SpiritTag spirit={col.gan!.tenSpirit} dayMaster={col.dayMaster} />
          <GzBlock ko={col.gan!.ko} hanja={col.gan!.hanja} wuxing={col.gan!.wuxing} yinyang={col.gan!.yinyang} />
          <GzBlock ko={col.zhi!.ko} hanja={col.zhi!.hanja} wuxing={col.zhi!.wuxing} yinyang={col.zhi!.yinyang} />
          <SpiritTag spirit={col.zhi!.tenSpirit} />
          <StageTag stage={col.zhi!.twelveStage} />
          {col.zhi!.hiddenStems.length > 0 && (
            <div className="mnr-hidden">
              장간 {col.zhi!.hiddenStems.map((h) => h.ko).join(", ")}
            </div>
          )}
          {col.zhi!.stars.length > 0 && (
            <div className="mnr-stars">
              {col.zhi!.stars.slice(0, 3).map((s) => (
                <span key={s.name} className={s.kind === "귀인" ? "good" : ""}>
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={cls} role="listitem" onClick={onClick} title={clickHint} aria-label={`${col.label} ${clickHint ?? ""}`}>
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} role="listitem">
      {inner}
    </div>
  );
}

function GzBlock({ ko, hanja, wuxing, yinyang }: { ko: string; hanja: string; wuxing: string; yinyang: "양" | "음" }) {
  const bg = EL_BG[wuxing] ?? "--el-earth-bg";
  const fg = EL_VAR[wuxing] ?? "--el-earth";
  return (
    <div className="mnr-gz" style={{ background: `var(${bg})` }}>
      <span className="mnr-gz-ko" style={{ color: `var(${fg})` }}>{ko}</span>
      <span className="mnr-gz-han">{hanja} {wuxing}{yinyang}</span>
    </div>
  );
}

function SpiritTag({ spirit, dayMaster }: { spirit: string | null; dayMaster?: boolean }) {
  if (dayMaster) return <span className="mnr-spirit me">일간 나</span>;
  if (!spirit) return <span className="mnr-spirit empty" aria-hidden />;
  const label = TEN_SPIRIT_LABELS[spirit as keyof typeof TEN_SPIRIT_LABELS]?.short;
  return (
    <span className="mnr-spirit">
      {spirit}
      {label && <em>{label}</em>}
    </span>
  );
}

function StageTag({ stage }: { stage: string | null }) {
  if (!stage) return <span className="mnr-stage empty" aria-hidden />;
  const m = TWELVE_STAGE_META[stage as keyof typeof TWELVE_STAGE_META];
  return (
    <span className="mnr-stage" title={m?.gloss}>
      {stage}
    </span>
  );
}

function MetaSummary({ data }: { data: ManseryeokData }) {
  const { meta } = data;
  const birth = `${meta.birthDate} ${meta.birthTimeKnown ? meta.birthTime : "시각 모름"} ${meta.calendar === "lunar" ? "음력" : "양력"}`;
  const dm = `${meta.dayMaster.ko}(${meta.dayMaster.hanja}) ${meta.dayMaster.wuxing}${meta.dayMaster.yinyang}`;
  const rows: Array<[string, string]> = [
    ["이름 / 나이", `${meta.name || "미입력"} ${meta.currentAge != null ? `만 ${meta.currentAge}세` : "나이 미상"}`],
    ["성별 / 띠", `${meta.gender} ${meta.shengXiao.ko}띠`],
    ["생년월일시", birth],
    ["일간(나)", dm],
  ];
  return (
    <section className="mnr-meta" aria-label="사주 기준 정보">
      <dl className="mnr-meta-grid">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Legend() {
  return (
    <section className="mnr-legend" aria-label="보는 법">
      <p className="mnr-legend-title">읽는 법</p>
      <div className="mnr-legend-els">
        {EL_ORDER.map((k) => (
          <span key={k} className="mnr-legend-el">
            <i className={`el-dot ${EL_CLASS[k]}`} />
            {k}
          </span>
        ))}
      </div>
      <ul className="mnr-legend-list">
        <li><b>십신</b>은 그 글자가 너인 일간에게 하는 역할이야. 재물, 명예, 표현, 경쟁처럼 읽어.</li>
        <li><b>십이운성</b>은 그 자리에서 네 기운이 오르는지 내려가는지를 보여줘.</li>
        <li><b>신살</b>은 도화, 역마, 귀인 같은 특수 태그야. 있으면 그 시기 성격이 더 또렷해져.</li>
        <li><b>장간</b>은 지지 속에 숨은 보조 기운이야.</li>
      </ul>
    </section>
  );
}
