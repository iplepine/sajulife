import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getNowVars } from "@/lib/datetime";
import { requireGuestId } from "@/lib/guest";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju, type SajuResult } from "@/lib/saju/calculator";
import { formatSajuForPrompt } from "@/lib/saju/format";
import { getFamily, getProfile } from "@/lib/store/guest";
import type { FamilyMember } from "@/lib/store/types";

export const runtime = "nodejs";

function formatMemberBlock(m: FamilyMember, saju: SajuResult): string {
  const g = m.profile.gender === "male" ? "남성" : "여성";
  const c = m.profile.calendar === "lunar" ? "음력" : "양력";
  const t = m.profile.birthTime || "시각 모름";
  return [
    `■ ${m.relation} · ${m.profile.name} (${g}, ${m.profile.birthDate} ${t} ${c})`,
    `  일간: ${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
    `  띠: ${saju.shengXiao.ko}(${saju.shengXiao.hanja})`,
    formatSajuForPrompt(saju)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n"),
  ].join("\n");
}

export async function POST() {
  const guestId = await requireGuestId();
  const [profile, family, prompt] = await Promise.all([
    getProfile(guestId),
    getFamily(guestId),
    getPrompt("family-saju"),
  ]);

  if (!profile) return NextResponse.json({ error: "본인 사주 정보를 먼저 입력하세요." }, { status: 400 });
  if (family.members.length === 0) {
    return NextResponse.json({ error: "가족 구성원을 1명 이상 추가하세요." }, { status: 400 });
  }

  const selfSaju = calculateSaju(profile);
  const memberSajus = family.members.map((m) => ({ member: m, saju: calculateSaju(m.profile) }));

  const familyTable = memberSajus.map(({ member, saju }) => formatMemberBlock(member, saju)).join("\n\n");

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    sajuTable: formatSajuForPrompt(selfSaju),
    dayMaster: `${selfSaju.dayMaster.ko}(${selfSaju.dayMaster.hanja}) · ${selfSaju.dayMaster.wuxing} · ${selfSaju.dayMaster.yinyang}`,
    familyTable,
    ...getNowVars(),
  });

  try {
    const ai = getAIProvider();
    const report = await ai.generate(rendered, { temperature: prompt.temperature });
    return NextResponse.json({
      report,
      saju: { self: selfSaju, members: memberSajus.map(({ member, saju }) => ({ id: member.id, saju })) },
      debug: { prompt: rendered, model: ai.model, provider: ai.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
