"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ExploreCta, ExploreHero, ExploreOffer, HowBlock, LockedPreview,
  type ExploreCtaState,
} from "@/components/explore/parts";
import { calendarTheme, isThemeSeason, themeForSaju, type ThemeSeason } from "@/lib/saju/seasonTheme";
import { stemMeta } from "@/lib/saju/seasonClock";
import {
  MAX_FAMILY_REPORT_MEMBERS,
  MAX_FAMILY_REPORT_PEOPLE,
  selectedFamilyReportMembers,
} from "@/lib/saju/familyReportSelection";
import type { SajuResult } from "@/lib/saju/calculator";
import type { FamilyStore } from "@/lib/store/types";

/**
 * 가족 사주 구매 유도 페이지.
 *
 * ★이 상품이 막히는 지점★ — 다른 넷은 나 하나만 있으면 되는데 ★가족은 사람이 더 필요하다★.
 * 그래서 이 화면의 진짜 일은 설득이 아니라 ★"한 명만 더 넣으면 된다"는 문턱 낮추기★다.
 * 등록된 가족을 실제로 나열해 보여주는 이유도 그것 — 지금 몇 명인지 눈으로 봐야
 * "아, 한 명만 더 넣으면 되네"가 된다.
 *
 * ★준비 상태는 반드시 /api/family 기준★ — 예전엔 /api/people(계정에 등록된 인물)을 세서
 * "4명 등록, 바로 볼 수 있음"이라고 했는데, 실제 /family 화면은 ★현재 인물에게 딸린 가족★이
 * 없으면 생성을 막는다. 둘은 다른 데이터다. 소개가 약속한 상태와 실제 화면이 어긋나면
 * 사용자는 "된다며?" 하고 막힌 화면을 만난다. 그래서 이 화면도 /family와 같은 출처를 본다.
 *
 * ★등록 가족 수 ≠ 이번 풀이에 넣을 가족 수★ — 가족은 여러 명 저장하되 리포트에는 최대 3명만
 * 고른다. 선택 규칙은 familyReportSelection의 단일 헬퍼를 그대로 쓴다(복사 금지).
 *
 * ★톤 주의★: 가족 리포트는 '너'에게만 반말이고 가족 구성원은 존중 묘사가 규칙이다(CLAUDE.md).
 * 이 화면도 같은 규칙을 따른다 — 가족을 두고 팩폭하지 않는다.
 */

const SECTIONS = [
  { name: "기본 성향", desc: "가족 안에서 네가 어떤 사람으로 굴러가는지" },
  { name: "가족 역할 지도", desc: "각자가 맡고 있는 자리와, 아무도 안 맡은 빈자리" },
  { name: "관계별 케미", desc: "한 사람씩 짝지어 잘 통하는 지점과 어긋나는 지점" },
  { name: "가족 분위기", desc: "이 조합이 만들어내는 집 안의 온도" },
  { name: "갈등 시나리오", desc: "어떤 상황에서 어떻게 부딪히는지, 그때 뭘 하면 되는지" },
  { name: "가족 건강운", desc: "각자 먼저 신호가 오는 곳" },
  { name: "가족 금전운", desc: "돈을 두고 생기는 온도차" },
  { name: "가족 대운 비교", desc: "누가 지금 순풍이고 누가 힘든 구간인지" },
  { name: "올해 실행전략", desc: "올해 이 가족이 같이 해볼 것" },
] as const;

/** 가족 입력 폼으로 바로 떨어지는 주소. /family가 해시를 보고 폼을 펼친다. */
const FAMILY_FORM_HREF = "/family#family-form";

type Chart = { saju: SajuResult | null; name?: string; currentYear?: number };
type ReportState = { saved?: unknown; status?: "generating" | "error" | "idle" };

/** 조회 성공과 실패를 ★구분해서★ 담는다. null 하나로 뭉치면 실패가 "없음"으로 둔갑한다. */
type Fetched<T> = { ok: true; data: T } | { ok: false };

async function readJson<T>(url: string): Promise<Fetched<T>> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false };
  }
}

export default function FamilyIntroPage() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [family, setFamily] = useState<FamilyStore | null>(null);
  const [report, setReport] = useState<ReportState | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rootSeason, setRootSeason] = useState<ThemeSeason | null>(null);

  useEffect(() => {
    const attr = document.documentElement.dataset.seasonTheme;
    if (isThemeSeason(attr)) setRootSeason(attr);
  }, []);

  const load = useCallback(async () => {
    setLoaded(false);
    const [chartRes, familyRes, reportRes] = await Promise.all([
      readJson<Chart>("/api/saju/chart"),
      readJson<FamilyStore | { family: FamilyStore }>("/api/family"),
      readJson<ReportState>("/api/family/report"),
    ]);
    // 셋 중 하나라도 실패하면 준비 상태를 단정하지 않는다.
    const failed = !chartRes.ok || !familyRes.ok || !reportRes.ok;
    setLoadFailed(failed);
    setChart(chartRes.ok ? chartRes.data : null);
    setFamily(
      familyRes.ok
        ? ("family" in familyRes.data ? familyRes.data.family : (familyRes.data as FamilyStore))
        : null,
    );
    setReport(reportRes.ok ? reportRes.data : null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await load();
      if (!alive) return;
    })();
    return () => { alive = false; };
  }, [load]);

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const season = saju ? themeForSaju(saju, currentYear) : (rootSeason ?? calendarTheme());

  // ★등록★된 가족(계정 인물이 아니라 현재 인물에게 딸린 가족)과, ★이번 풀이에 선택★된 가족.
  const registered = family?.members ?? [];
  const selected = family ? selectedFamilyReportMembers(family) : [];
  const hasSaved = !!report?.saved;
  const generating = report?.status === "generating";

  const cta: ExploreCtaState = !loaded
    ? { href: "/family", label: "준비 중…", note: "", pending: true }
    : loadFailed
      ? {
          href: "/family",
          label: "다시 불러오기",
          note: "가족 정보를 불러오지 못했어. 잠깐 뒤에 다시 눌러줘.",
          pending: false,
          retry: () => { void load(); },
        }
      : !saju
        ? {
            href: `/onboarding?next=${encodeURIComponent("/explore/family")}`,
            label: "먼저 내 사주 정보 입력",
            note: "나부터 넣어야 가족이랑 겹칠 수 있어.",
            pending: false,
          }
        : generating
          ? {
              href: "/family",
              label: "가족 풀이 생성 중",
              note: "지금 만들고 있어. 다 되면 알림으로 콕 찔러줄게.",
              pending: false,
            }
          : hasSaved
            ? { href: "/family", label: "우리 가족 풀이 보기", note: "이미 만들어둔 가족 풀이가 있어.", pending: false }
            : registered.length === 0
              ? {
                  href: FAMILY_FORM_HREF,
                  label: "가족 한 명 추가하기",
                  note: "지금은 너 혼자야. 한 명만 더 넣으면 관계를 볼 수 있어.",
                  pending: false,
                }
              : selected.length === 0
                ? {
                    href: "/family",
                    label: "풀이에 포함할 가족 선택하기",
                    note: `가족 ${registered.length}명이 등록돼 있어. 이번 풀이에 넣을 가족부터 골라줘.`,
                    pending: false,
                  }
                : {
                    href: "/family",
                    label: "가족 풀이 만들기",
                    note: `너까지 총 ${selected.length + 1}명으로 풀어줄게.`,
                    pending: false,
                  };

  const orbit = saju
    ? [
        saju.pillars.year.gan.hanja, saju.pillars.year.zhi.hanja,
        saju.pillars.month.gan.hanja, saju.pillars.month.zhi.hanja,
        saju.pillars.day.zhi.hanja,
        ...(saju.pillars.time ? [saju.pillars.time.gan.hanja, saju.pillars.time.zhi.hanja] : []),
      ]
    : undefined;

  return (
    <main className="page intro-page pi-page">
      <ExploreHero
        titleId="fmi-title"
        eyebrow="가족 사주"
        title={<>같은 말을 해도<br />왜 저 사람한테만 안 통할까</>}
        lead="가족은 제일 가까운데 제일 안 통해. 각자 타고난 결이 달라서 그래 — 그걸 겹쳐서 보자."
        season={season}
        ready={loaded || rootSeason !== null}
        center={saju?.dayMaster.hanja}
        orbit={orbit}
      />

      <ExploreCta cta={cta} />

      <MyFamily
        registered={registered}
        selectedCount={selected.length}
        chart={chart}
        loaded={loaded}
        loadFailed={loadFailed}
        onRetry={() => { void load(); }}
      />

      <HowBlock
        titleId="fmi-how-title"
        kicker="가족 얘기까지 사주로 봐도 되나?"
        title="누가 잘못했나를 안 따져"
        items={[
          { t: "사람을 탓하지 않아", d: "'엄마가 예민해서'가 아니라 '두 사람 결이 이렇게 달라서'로 풀어." },
          { t: "각자 흐름을 같이 놓고 봐", d: "지금 누가 순풍이고 누가 버거운 구간인지 나란히 두면 이해가 달라져." },
          { t: "말의 방향까지 짚어", d: "부딪히기 전에 어떤 말을 어떤 순서로 꺼내면 되는지까지 내려가." },
        ]}
        close="가족 얘기라 조심할게. 팩폭은 너한테만 해."
      />

      <ExploreOffer
        titleId="fmi-offer-title"
        title="우리 가족은 뭐가 나오냐면"
        lead="각자 타고난 결을 겹쳐서, 어디서 부딪히고 뭘 어떻게 말하면 되는지 아홉 갈래로 풀어줄게."
        specs={[
          { k: "대상", v: `너 + 고른 가족 최대 ${MAX_FAMILY_REPORT_MEMBERS}명` },
          { k: "구성", v: "아홉 갈래" },
          { k: "다시보기", v: "언제든 무료" },
        ]}
      >
        <LockedPreview cover="우리 가족 풀이" sections={SECTIONS} />
      </ExploreOffer>
    </main>
  );
}

/**
 * 무료 증거 — ★등록된 가족★과 각자 타고난 결.
 * 사주 정보가 있는 가족만 센다(생년월일 없는 사람은 계산이 안 되므로 세면 거짓말이 된다).
 * 조회가 실패했으면 "없음"이 아니라 실패라고 말한다.
 */
function MyFamily({
  registered,
  selectedCount,
  chart,
  loaded,
  loadFailed,
  onRetry,
}: {
  registered: FamilyStore["members"];
  selectedCount: number;
  chart: Chart | null;
  loaded: boolean;
  loadFailed: boolean;
  onRetry: () => void;
}) {
  if (!loaded) {
    return (
      <section className="pi-mine pi-mine--empty" aria-label="가족 구성원">
        <p className="pi-empty-copy">불러오는 중…</p>
      </section>
    );
  }

  if (loadFailed) {
    return (
      <section className="pi-mine pi-mine--empty" aria-label="가족 구성원">
        <p className="pi-empty-copy">가족 정보를 불러오지 못했어. 네트워크가 잠깐 흔들렸을 수도 있어.</p>
        <button type="button" className="btn btn-ghost btn-sm mt3" onClick={onRetry}>다시 시도</button>
      </section>
    );
  }

  const withChart = registered.filter((m) => m.profile?.birthDate);

  return (
    <section className="pi-mine" aria-label="가족 구성원">
      <p className="h-sec">지금 겹칠 수 있는 사람</p>
      {withChart.length > 0 ? (
        <ul className="pi-family">
          {withChart.map((m) => (
            <li key={m.id}>
              <strong>{m.profile.name || "이름 없음"}</strong>
              <em>{m.relation || "가족"} · {m.profile.birthDate}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pi-ys-none">아직 등록한 가족이 없어.</p>
      )}
      <p className="pi-note">
        {withChart.length === 0
          ? "혼자서는 관계를 볼 수 없어. 한 명만 더 있으면 바로 시작돼."
          : selectedCount === 0
            ? `가족 ${withChart.length}명이 등록돼 있어. 이번 풀이에 넣을 가족을 아직 안 골랐어.`
            : `이번 풀이엔 너까지 ${selectedCount + 1}명 — 관계를 ${((selectedCount + 1) * selectedCount) / 2}쌍으로 볼 수 있어.`}
      </p>
      {withChart.length > MAX_FAMILY_REPORT_MEMBERS && (
        <p className="pi-note">
          가족은 얼마든지 저장해도 돼. 다만 한 번의 풀이엔 너 포함 {MAX_FAMILY_REPORT_PEOPLE}명까지만 들어가.
        </p>
      )}
      {chart?.saju && (
        <p className="pi-note pi-note--foot">
          네 타고난 결은 <b>{stemMeta(chart.saju.dayMaster.hanja).metaphor}</b> — 가족 각자도 이렇게 하나씩 나와.{" "}
          <Link href={FAMILY_FORM_HREF} className="link-tiny">가족 추가하기 →</Link>
        </p>
      )}
    </section>
  );
}
