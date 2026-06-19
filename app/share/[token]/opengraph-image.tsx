import { ImageResponse } from "next/og";
import { REPORT_LABEL } from "@/lib/share/labels";
import { getShare, type ShareSnapshot } from "@/lib/store/shares";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#f7f4ee"; // 한지 크림
const INK = "#1f1d1a"; // 먹
const MUTED = "#6b6457";

function heroLine(snap: ShareSnapshot): string {
  switch (snap.kind) {
    case "personal":
      return `${snap.saju.shengXiao.ko}띠 · ${snap.saju.dayMaster.wuxing} 일간`;
    case "tci":
    case "fusion":
      return (
        [...snap.scores]
          .sort((a, b) => b.percent - a.percent)
          .slice(0, 3)
          .map((s) => s.label)
          .join(" · ") || "기질 분석"
      );
    case "family":
      return `우리 가족 ${snap.circleMembers.length}명의 결`;
  }
}

/**
 * Satori는 한국어 글리프가 담긴 폰트 버퍼가 필요하다(레이아웃의 CDN <link>는 못 씀).
 * Google Fonts에서 카드에 쓰는 글자만 text= 로 subset해 가볍게 받아온다(Vercel og 공식 패턴).
 * 네트워크 실패 시 null → 폰트 없이 렌더(개발 중 한글이 깨지면 이 단계 점검).
 */
async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snap = await getShare(token);

  const brand = "sajulife";
  const label = snap ? REPORT_LABEL[snap.kind] : "AI 사주·기질 리포트";
  const owner = snap ? `${snap.ownerName}님의 리포트` : "공유된 리포트";
  const hero = snap ? heroLine(snap) : "지금 확인해보세요";
  const footer = "AI 사주·기질 리포트 · sajulife";

  const fontData = await loadKoreanFont(`${brand}${label}${owner}${hero}${footer}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          color: INK,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          fontFamily: fontData ? "NotoSerifKR" : "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 2, color: MUTED }}>{brand}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, color: MUTED, marginBottom: 16 }}>{owner}</div>
          <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.1 }}>{label}</div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 18 }}>{hero}</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: MUTED }}>{footer}</div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "NotoSerifKR", data: fontData, weight: 700 as const, style: "normal" as const }]
        : [],
    },
  );
}
