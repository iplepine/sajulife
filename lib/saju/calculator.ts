import { Lunar, Solar } from "lunar-javascript";
import type { SajuProfile } from "../store/types";
import { correctKoreanBirthTime, type KoreanTimeCorrection } from "./koreanTime";
import {
  GAN_KO,
  GAN_TO_WUXING,
  GAN_YINYANG,
  SHENGXIAO_KO,
  WUXING_KO,
  ZHI_KO,
  ZHI_TO_WUXING,
  ZHI_YINYANG,
} from "./readings";

export type Pillar = {
  raw: string;       // "庚午"
  korean: string;    // "경오(庚午)"
  gan: { hanja: string; ko: string; wuxing: string; yinyang: "양" | "음" };
  zhi: { hanja: string; ko: string; wuxing: string; yinyang: "양" | "음" };
  naYin: string;     // "路旁土"
};

/** 10년 단위 대운(大運) 한 칸. element(=천간 오행)로 생애 도식의 색을 입힌다. */
export type DaewoonPillar = {
  startAge: number;
  startYear: number;
  gan: { hanja: string; ko: string; wuxing: string; yinyang: "양" | "음" };
  zhi: { hanja: string; ko: string; wuxing: string; yinyang: "양" | "음" };
};

type SolarDateTime = {
  getYear(): number;
  getMonth(): number;
  getDay(): number;
  getHour(): number;
  getMinute(): number;
};

export type SajuResult = {
  input: {
    birthDate: string;
    birthTime: string;
    birthTimeKnown: boolean;
    calculationBirthDate: string;
    calculationBirthTime: string;
    koreanTimeCorrection: KoreanTimeCorrection | null;
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
  /** 대운 흐름 (만 4세 전후 시작 ~ 노년). 계산 불가 시 빈 배열. */
  daewoon: DaewoonPillar[];
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
      yinyang: ZHI_YINYANG[z] ?? "양",
    },
    naYin,
  };
}

export function calculateSaju(profile: SajuProfile): SajuResult {
  const [y, m, d] = profile.birthDate.split("-").map(Number);
  const birthTimeKnown = !!profile.birthTime;
  // 출생시각이 모르면 정오로 계산해서 연·월·일주가 자정 경계에 흔들리지 않게 한다.
  const [inputHour, inputMinute] = birthTimeKnown
    ? profile.birthTime.split(":").map(Number)
    : [12, 0];

  const recordedSolar = (
    profile.calendar === "solar"
      ? Solar.fromYmdHms(y, m, d, inputHour, inputMinute, 0)
      : Lunar.fromYmdHms(y, m, d, inputHour, inputMinute, 0).getSolar()
  ) as unknown as SolarDateTime;

  const recordedSolarDate = [
    recordedSolar.getYear(),
    String(recordedSolar.getMonth()).padStart(2, "0"),
    String(recordedSolar.getDay()).padStart(2, "0"),
  ].join("-");
  const recordedTime = `${String(recordedSolar.getHour()).padStart(2, "0")}:${String(recordedSolar.getMinute()).padStart(2, "0")}`;
  const koreanTimeCorrection = birthTimeKnown
    ? correctKoreanBirthTime(recordedSolarDate, recordedTime)
    : null;
  const calculationBirthDate = koreanTimeCorrection?.calculationSolarDate ?? recordedSolarDate;
  const calculationBirthTime = koreanTimeCorrection?.calculationTime ?? recordedTime;
  const [calcY, calcM, calcD] = calculationBirthDate.split("-").map(Number);
  const [hh, mm] = calculationBirthTime.split(":").map(Number);

  const lunar = Solar.fromYmdHms(calcY, calcM, calcD, hh, mm, 0).getLunar();

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
      calculationBirthDate,
      calculationBirthTime,
      koreanTimeCorrection,
      calendar: profile.calendar,
      gender: profile.gender,
    },
    pillars: { year, month, day, time },
    dayMaster: day.gan,
    shengXiao: { hanja: shengHanja, ko: SHENGXIAO_KO[shengHanja] ?? shengHanja },
    wuxingCount,
    daewoon: computeDaewoon(ec, profile.gender),
  };
}

/**
 * 대운(大運) 계산. lunar-javascript의 getYun(gender)→getDaYun()을 사용한다.
 * gender 규약: 1=남, 0=여. 첫 칸은 대운 진입 전(천간지지 비어있음)이라 제외한다.
 * 어떤 이유로든 계산이 실패하면 빈 배열을 반환해 화면이 graceful하게 동작하게 한다.
 */
function computeDaewoon(
  ec: ReturnType<Lunar["getEightChar"]>,
  gender: SajuProfile["gender"]
): DaewoonPillar[] {
  try {
    const yun = ec.getYun(gender === "male" ? 1 : 0);
    return yun
      .getDaYun()
      .map((d) => ({ ganzhi: d.getGanZhi(), startAge: d.getStartAge(), startYear: d.getStartYear() }))
      .filter((d) => typeof d.ganzhi === "string" && d.ganzhi.length >= 2)
      .map((d) => {
        const g = d.ganzhi[0];
        const z = d.ganzhi[1];
        return {
          startAge: d.startAge,
          startYear: d.startYear,
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
            yinyang: ZHI_YINYANG[z] ?? "양",
          },
        };
      });
  } catch {
    return [];
  }
}
