import { Lunar, Solar } from "lunar-javascript";
import type { SajuProfile } from "../store/types";
import {
  GAN_KO,
  GAN_TO_WUXING,
  GAN_YINYANG,
  SHENGXIAO_KO,
  WUXING_KO,
  ZHI_KO,
  ZHI_TO_WUXING,
} from "./readings";

export type Pillar = {
  raw: string;       // "庚午"
  korean: string;    // "경오(庚午)"
  gan: { hanja: string; ko: string; wuxing: string; yinyang: "양" | "음" };
  zhi: { hanja: string; ko: string; wuxing: string };
  naYin: string;     // "路旁土"
};

export type SajuResult = {
  input: {
    birthDate: string;
    birthTime: string;
    birthTimeKnown: boolean;
    calendar: SajuProfile["calendar"];
    gender: SajuProfile["gender"];
  };
  pillars: { year: Pillar; month: Pillar; day: Pillar; time: Pillar | null };
  dayMaster: {
    hanja: string;
    ko: string;
    wuxing: string;
    yinyang: "양" | "음";
  };
  shengXiao: { hanja: string; ko: string };
  wuxingCount: Record<"목" | "화" | "토" | "금" | "수", number>;
};

function buildPillar(raw: string, naYin: string): Pillar {
  const g = raw[0];
  const z = raw[1];
  return {
    raw,
    korean: `${GAN_KO[g] ?? g}${ZHI_KO[z] ?? z}(${raw})`,
    gan: {
      hanja: g,
      ko: GAN_KO[g] ?? g,
      wuxing: WUXING_KO[GAN_TO_WUXING[g] ?? ""] ?? "",
      yinyang: GAN_YINYANG[g] ?? "양",
    },
    zhi: {
      hanja: z,
      ko: ZHI_KO[z] ?? z,
      wuxing: WUXING_KO[ZHI_TO_WUXING[z] ?? ""] ?? "",
    },
    naYin,
  };
}

export function calculateSaju(profile: SajuProfile): SajuResult {
  const [y, m, d] = profile.birthDate.split("-").map(Number);
  const birthTimeKnown = !!profile.birthTime;
  // 출생시각이 모르면 정오로 계산해서 연·월·일주가 자정 경계에 흔들리지 않게 한다.
  const [hh, mm] = birthTimeKnown
    ? profile.birthTime.split(":").map(Number)
    : [12, 0];

  const lunar =
    profile.calendar === "solar"
      ? Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar()
      : Lunar.fromYmdHms(y, m, d, hh, mm, 0);

  const ec = lunar.getEightChar();

  const year = buildPillar(ec.getYear(), ec.getYearNaYin());
  const month = buildPillar(ec.getMonth(), ec.getMonthNaYin());
  const day = buildPillar(ec.getDay(), ec.getDayNaYin());
  const time = birthTimeKnown ? buildPillar(ec.getTime(), ec.getTimeNaYin()) : null;

  const wuxingCount: SajuResult["wuxingCount"] = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const countable = time ? [year, month, day, time] : [year, month, day];
  for (const p of countable) {
    if (p.gan.wuxing) wuxingCount[p.gan.wuxing as keyof typeof wuxingCount] += 1;
    if (p.zhi.wuxing) wuxingCount[p.zhi.wuxing as keyof typeof wuxingCount] += 1;
  }

  const shengHanja = lunar.getYearShengXiao();

  return {
    input: {
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthTimeKnown,
      calendar: profile.calendar,
      gender: profile.gender,
    },
    pillars: { year, month, day, time },
    dayMaster: day.gan,
    shengXiao: { hanja: shengHanja, ko: SHENGXIAO_KO[shengHanja] ?? shengHanja },
    wuxingCount,
  };
}
