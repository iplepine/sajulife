import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteBaseUrl } from "@/lib/baseUrl";
import { computeCautionMonths } from "@/lib/saju/cautionMonths";
import { shareDescription, shareTitle } from "@/lib/share/labels";
import { getShare } from "@/lib/store/shares";
import ShareReportRenderer from "./ShareReportRenderer";

export const runtime = "nodejs";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const snap = await getShare(token);
  if (!snap) return { title: "공유된 리포트를 찾을 수 없어요 · sajulife" };

  const title = shareTitle(snap.ownerName, snap.kind);
  const description = shareDescription(snap.ownerName, snap.kind);
  const base = await siteBaseUrl();
  const url = `${base}/share/${token}`;
  const image = `${url}/opengraph-image`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const snap = await getShare(token);
  if (!snap) notFound();

  // '주의가 필요한 시기' 별점 카드는 결정론 계산이라 서버에서 뽑아 내려준다(클라 번들에 lunar 미포함).
  const cautionMonths = snap.kind === "personal" ? computeCautionMonths(snap.saju, snap.currentYear) : undefined;
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="share-public">
      <header className="share-pub-head">
        <span className="share-pub-brand">sajulife</span>
        <h1 className="share-pub-title">{shareTitle(snap.ownerName, snap.kind)}</h1>
      </header>

      <ShareReportRenderer snap={snap} cautionMonths={cautionMonths} currentMonth={currentMonth} />

      <Link href="/" className="btn btn-primary btn-block share-pub-cta" style={{ textDecoration: "none" }}>
        나도 내 사주 보기
      </Link>
      <p className="share-pub-foot">AI 사주·기질 리포트 · sajulife</p>
    </div>
  );
}
