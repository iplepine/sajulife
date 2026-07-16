import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { getSavedReport } from "@/lib/store/reports";
import { getYongsinReading } from "@/lib/store/yongsinReading";
import type { ReportKind, SavedReport } from "@/lib/store/types";

export const runtime = "nodejs";

type NotificationKind = ReportKind | "yongsin";

export type CompletedReportNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  generatedAt: string;
};

type NotificationDefinition = {
  kind: NotificationKind;
  title: string;
  href: string;
};

const REPORT_NOTIFICATIONS: NotificationDefinition[] = [
  { kind: "personal", title: "사주언니와 팔자토크", href: "/saju" },
  { kind: "yongsin", title: "내 용신 리포트", href: "/saju/yongsin" },
  { kind: "tci", title: "기질오빠와 성향토크", href: "/tci/report" },
  { kind: "fusion", title: "사주 + 기질 리포트", href: "/fusion" },
  { kind: "family", title: "가족 사주 리포트", href: "/family" },
];

function sortByNewest(a: CompletedReportNotification, b: CompletedReportNotification): number {
  return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
}

/**
 * 알림함은 종류별 최신 저장본의 생성 완료 시각을 보여준다.
 * 현재 리포트 저장소가 종류별 최신 1건만 보관하므로, 재생성 전의 과거 완료 이력은 표시하지 않는다.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = scope.scopeId;
  const [personal, yongsin, tci, fusion, family] = await Promise.all([
    getSavedReport(userId, "personal"),
    getYongsinReading(userId),
    getSavedReport(userId, "tci"),
    getSavedReport(userId, "fusion"),
    getSavedReport(userId, "family"),
  ]);

  const completed: Record<NotificationKind, Pick<SavedReport, "generatedAt"> | null> = {
    personal,
    yongsin,
    tci,
    fusion,
    family,
  };

  const notifications = REPORT_NOTIFICATIONS.flatMap((definition) => {
    const saved = completed[definition.kind];
    if (!saved?.generatedAt || Number.isNaN(new Date(saved.generatedAt).getTime())) return [];

    return [{
      id: `${definition.kind}:${saved.generatedAt}`,
      kind: definition.kind,
      title: `${definition.title} 풀이가 완료됐어`,
      description: "생성한 리포트를 지금 바로 확인할 수 있어.",
      href: definition.href,
      generatedAt: saved.generatedAt,
    }];
  }).sort(sortByNewest);

  return NextResponse.json({ notifications });
}
