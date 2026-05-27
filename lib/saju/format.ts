import type { Pillar, SajuResult } from "./calculator";

function pillarLine(label: string, p: Pillar): string {
  return `- ${label}: ${p.korean} / 천간 ${p.gan.ko}(${p.gan.wuxing}·${p.gan.yinyang}) · 지지 ${p.zhi.ko}(${p.zhi.wuxing}) · 납음 ${p.naYin}`;
}

export function formatSajuForPrompt(saju: SajuResult): string {
  const { pillars, dayMaster, shengXiao, wuxingCount } = saju;
  const timeLine = pillars.time
    ? pillarLine("시주", pillars.time)
    : "- 시주: 모름 (출생시각 미입력 — 시주 기반 해석은 생략하고 연·월·일주만으로 풀이할 것)";
  const wuxingNote = pillars.time ? "" : " · (시주 제외, 6글자 기준)";
  const lines = [
    pillarLine("연주", pillars.year),
    pillarLine("월주", pillars.month),
    pillarLine("일주", pillars.day),
    timeLine,
    "",
    `일간(나): ${dayMaster.ko}(${dayMaster.hanja}) · ${dayMaster.wuxing} · ${dayMaster.yinyang}`,
    `띠: ${shengXiao.ko}(${shengXiao.hanja})`,
    `오행 분포${wuxingNote}: 목 ${wuxingCount.목} / 화 ${wuxingCount.화} / 토 ${wuxingCount.토} / 금 ${wuxingCount.금} / 수 ${wuxingCount.수}`,
  ];
  return lines.join("\n");
}

export function formatDayPillar(saju: SajuResult): string {
  return saju.pillars.day.korean;
}
