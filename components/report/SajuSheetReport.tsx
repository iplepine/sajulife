"use client";

import Link from "next/link";
import ShareButton from "@/components/ShareButton";
import type { SajuResult } from "@/lib/saju/calculator";
import { PERSONAL_REPORT_SECTION_IDS, type PersonalReportSectionId } from "@/lib/report/personalContract";
import { REPORT_FIELD_LABELS, ROADMAP_FIELD_ORDER } from "@/lib/report/normalize";
import type { PersonalReport } from "@/lib/report/types";
import styles from "./SajuSheetReport.module.css";

/**
 * 최종 풀이 '사주 풀이' 탭의 한 장짜리 보고서 — 2026-11-18 대표 결정.
 * 전문가 견본(엑셀 '개선점 정리')의 배치를 그대로 따른다:
 * 사주명식·대운 표 → 기질·강점·흐름 → 조후·격국·억부 → 세운(전년·금년·내년) → 필요한 것·행동지침·로드맵·조언.
 * 표의 간지는 코드 계산값(lunar-javascript)이고, 서술은 저장된 개인 사주 풀이를 옮겨 담는다(AI 호출 없음).
 * 옛 저장본은 원래 절의 제목·순서를 유지하며, 없는 11개 항목을 새로 채우지 않는다.
 * 명리 근거는 견본처럼 한자를 그대로 보인다.
 */

const STEMS = "甲乙丙丁戊己庚辛壬癸";
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";

/** 연도 간지(입춘 기준이 아닌 해 단위 표기) — 세운 표의 '丁酉' 칸. */
export function yearGanzhi(year: number): string {
  const i = ((year - 4) % 60 + 60) % 60;
  return `${STEMS[i % 10]}${BRANCHES[i % 12]}`;
}

/** 견본과 같은 11개 절이 모두 있는 새 풀이인가. 저장본의 표시 여부를 제한하지 않는다. */
export function hasSheetSections(report: PersonalReport | null): boolean {
  if (!report) return false;
  const ids = new Set(report.sections.map((section) => section.id));
  return PERSONAL_REPORT_SECTION_IDS.every((id) => ids.has(id));
}

const clean = (text: string) => text.replace(/\*\*/g, "").replace(/\r/g, "").trim();

/**
 * 세운 본문을 해마다 나눈다. 문단에 처음 나온 'YYYY년'으로 귀속하고, 연도 없는 문단은 앞 문단의 해에 잇는다.
 * 한 해라도 비면 나누지 않고 세 줄을 한 칸으로 합쳐 보여준다(내용을 버리지 않기 위해).
 */
export function splitYearly(body: string, years: number[]): { intro: string; byYear: string[] } | null {
  const paragraphs = clean(body).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const buckets = years.map(() => [] as string[]);
  const intro: string[] = [];
  let last = -1;
  for (const paragraph of paragraphs) {
    const found = paragraph.match(/(?:^|[^0-9])(\d{4})\s*년/);
    const index = found ? years.indexOf(Number(found[1])) : -1;
    if (index >= 0) last = index;
    if (last >= 0) buckets[last].push(paragraph);
    else intro.push(paragraph);
  }
  if (buckets.some((bucket) => bucket.length === 0)) return null;
  return { intro: intro.join("\n\n"), byYear: buckets.map((bucket) => bucket.join("\n\n")) };
}

function Body({ text }: { text: string }) {
  return <>{clean(text).split(/\n\s*\n/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</>;
}

export default function SajuSheetReport({ report, saju, generatedAt, currentYear, oldJudgment = false }: {
  report: PersonalReport;
  saju: SajuResult | null;
  generatedAt: string;
  currentYear: number;
  oldJudgment?: boolean;
}) {
  const section = (id: PersonalReportSectionId) => report.sections.find((s) => s.id === id);
  // 세운 서술은 풀이를 만든 해를 기준으로 쓰였다 — 해가 바뀌어도 표의 연도와 글이 어긋나지 않게 그 해를 쓴다.
  const madeYear = Number(new Date(generatedAt).toLocaleString("en-US", { timeZone: "Asia/Seoul", year: "numeric" })) || currentYear;
  const years = [madeYear - 1, madeYear, madeYear + 1];
  const seun = section("세운 분석");
  const yearly = seun ? splitYearly(seun.body, years) : null;
  const fullSheet = hasSheetSections(report) && report.sections.length === PERSONAL_REPORT_SECTION_IDS.length;
  const roadmapItems = ROADMAP_FIELD_ORDER
    .map((key) => ({ label: REPORT_FIELD_LABELS[key] ?? key, text: report.roadmap[key] }))
    .filter((item) => typeof item.text === "string" && item.text.trim());

  const block = (items: Array<[PersonalReportSectionId, string]>) => items.map(([id, label]) => {
    const s = section(id);
    if (!s) return null;
    return <section key={id} className={styles.item} aria-label={label}>
      <h3>■ {label}</h3>
      {/* 견본에는 요약 줄이 없다 — 새 풀이(v28~)는 본문만으로 완결되게 쓴다. */}
      <div className={styles.itemBody}><Body text={s.body} /></div>
    </section>;
  });

  const analysis: Array<[PersonalReportSectionId, string, string]> = [
    ["조후 분석", "조후\n분석", "(건강 및 환경)"],
    ["격국 분석", "격국\n분석", "(적성 및 그릇)"],
    ["억부 분석", "억부\n분석", "(수행능력)"],
  ];

  return <article className={styles.sheet} aria-label="사주 풀이 보고서">
    {saju && <ChartTable saju={saju} />}
    {!saju && <p className={styles.note}>명식 자료를 불러오지 못했지만 저장된 풀이 본문은 읽을 수 있어요.</p>}

    {!fullSheet && <header className={styles.savedHeading}>
      <h2>{report.title}</h2>
      {report.keywords.length > 0 && <dl className={styles.keywords}>{report.keywords.map((keyword, i) => <div key={i}><dt>{keyword.word}</dt><dd>{keyword.desc}</dd></div>)}</dl>}
    </header>}

    {fullSheet ? <>
    <div className={styles.box}>
      {block([["타고난 기질과 성격", "타고난 기질과 성격"], ["강점과 잠재력", "강점과 잠재력"], ["인생의 큰 흐름", "인생의 흐름"]])}
    </div>

    <table className={styles.grid}>
      <tbody>
        {analysis.map(([id, label, note]) => {
          const s = section(id);
          return <tr key={id}>
            <th scope="row" className={styles.labelDark}>{label}<small>{note}</small></th>
            <td className={styles.text}>{s ? <Body text={s.body} /> : null}</td>
          </tr>;
        })}
      </tbody>
    </table>

    {seun && <table className={`${styles.grid} ${styles.seun}`}>
      <caption className={styles.mobileCaption}>세운 분석</caption>
      <tbody>
        {["전년도", "금년도", "내년도"].map((label, i) => <tr key={label}>
          {i === 0 && <th scope="rowgroup" rowSpan={3} className={`${styles.labelDark} ${styles.seunGroup}`}>{"세운\n분석"}</th>}
          <th scope="row" className={`${styles.labelLight} ${styles.year}`}>{label}<small>{years[i]}</small></th>
          <td className={`${styles.labelLight} ${styles.ganzhi}`} lang="zh-Hant">{yearGanzhi(years[i])}</td>
          {yearly ? <td className={styles.text}>{i === 0 && yearly.intro && <p className={styles.lead}>{yearly.intro}</p>}<Body text={yearly.byYear[i]} /></td> :
            i === 0 ? <td rowSpan={3} className={styles.text}><Body text={seun.body} /></td> : null}
        </tr>)}
      </tbody>
    </table>}

    <div className={styles.box}>
      {block([["필요한 것", "필요한 것"], ["행동지침", "행동지침"], ["인생 로드맵", "인생 로드맵"], ["성공 조언", "성공 조언"]])}
    </div>
    </> : report.sections.length > 0 && <div className={styles.box}>
      {report.sections.map((s, i) => <section key={i} className={styles.item} aria-label={s.id}>
        <h3>■ {s.id}</h3>
        <div className={styles.itemBody}>{s.summary && <p className={styles.lead}>{clean(s.summary)}</p>}<Body text={s.body} /></div>
      </section>)}
    </div>}

    {!fullSheet && report.lifeline && report.lifeline.length > 0 && <table className={styles.grid}>
      <caption className={styles.dataCaption}>저장된 대운별 흐름</caption>
      <tbody>{report.lifeline.map((period, i) => <tr key={i}>
        <th scope="row" className={styles.labelLight}>{period.startAge}~{period.endAge}세</th>
        <td className={styles.text}>
          <p className={styles.lead}>{[period.season, period.seasonLabel, period.tone].filter(Boolean).join(" · ")}</p>
          <Body text={period.summary} />
        </td>
      </tr>)}</tbody>
    </table>}

    {!fullSheet && roadmapItems.length > 0 && <table className={styles.grid}>
      <caption className={styles.dataCaption}>저장된 로드맵</caption>
      <tbody>{roadmapItems.map((item) => <tr key={item.label}>
        <th scope="row" className={styles.labelLight}>{item.label}</th>
        <td className={styles.text}><Body text={item.text} /></td>
      </tr>)}</tbody>
    </table>}

    <footer className={styles.foot}>
      {oldJudgment && <p role="note">이 풀이는 기운 판정 기준을 손보기 전에 작성되었습니다. 사주 풀이를 다시 받으시면 새 기준으로 정리됩니다.</p>}
      {report.disclaimer && <p>{clean(report.disclaimer)}</p>}
      <p>작성일 {new Date(generatedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} · 표의 간지는 만세력 계산값입니다.</p>
      <div className={styles.actions}><ShareButton kind="personal" /><Link href="/saju/manseryeok" className="btn btn-ghost btn-sm">만세력 원본 보기</Link></div>
    </footer>
  </article>;
}

/**
 * 견본 1~5행: 사주명식(시·일·월·년) + 대운(나이 큰 쪽이 왼쪽).
 * PC는 견본처럼 한 줄로 잇고(칸 너비 같게 4:대운 수), 모바일은 두 표를 위아래로 쌓아 글자를 키운다.
 */
function ChartTable({ saju }: { saju: SajuResult }) {
  const { pillars } = saju;
  const natal = [pillars.time, pillars.day, pillars.month, pillars.year];
  const dayun = [...saju.daewoon].sort((a, b) => b.startAge - a.startAge);
  return <div className={styles.chartWrap}>
    <div className={styles.chartRow}>
      <table className={styles.chart} aria-label="사주명식" style={{ flexGrow: 4 }}>
        <thead>
          <tr><th colSpan={4} scope="colgroup" className={styles.labelDark}>사주명식</th></tr>
          <tr>{["시", "일", "월", "년"].map((h) => <th key={h} scope="col" className={styles.labelLight}>{h}</th>)}</tr>
        </thead>
        <tbody lang="zh-Hant">
          <tr>{natal.map((p, i) => <td key={i}>{p?.gan.hanja ?? "－"}</td>)}</tr>
          <tr>{natal.map((p, i) => <td key={i}>{p?.zhi.hanja ?? "－"}</td>)}</tr>
        </tbody>
      </table>
      {dayun.length > 0 && <table className={`${styles.chart} ${styles.dayun}`} aria-label="대운" style={{ flexGrow: dayun.length }}>
        <thead>
          <tr><th colSpan={dayun.length} scope="colgroup" className={styles.labelDark}>대운</th></tr>
          <tr>{dayun.map((d) => <th key={d.startAge} scope="col" className={styles.labelLight}>{d.startAge}</th>)}</tr>
        </thead>
        <tbody lang="zh-Hant">
          <tr>{dayun.map((d) => <td key={d.startAge}>{d.gan.hanja}</td>)}</tr>
          <tr>{dayun.map((d) => <td key={d.startAge}>{d.zhi.hanja}</td>)}</tr>
        </tbody>
      </table>}
    </div>
    {!pillars.time && <p className={styles.note}>출생 시각을 알 수 없어 시주는 비워 두었습니다.</p>}
  </div>;
}
