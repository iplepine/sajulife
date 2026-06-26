export type KoreanTimeCorrection = {
  /** 계산 전 사용자가 입력한 한국 민간 기록 시각(양력 기준). */
  recordedSolarDate: string;
  recordedTime: string;
  /** 만세력 계산에 실제로 넣은 법정시/DST + 경도 보정 시각(양력 기준). */
  calculationSolarDate: string;
  calculationTime: string;
  /** 계산 시각 = 기록 시각 + correctionMinutes. */
  correctionMinutes: number;
  /** 법정 표준시/서머타임 기록을 UTC+9 기준으로 정규화한 보정. */
  standardTimeCorrectionMinutes: number;
  /** KST 기준 경도 135도와 국내 평균 경도 차이로 적용한 보정. */
  longitudeCorrectionMinutes: number;
  longitudeEast: number;
  standardLongitudeEast: number;
  applied: boolean;
  reason: string;
  parts: KoreanTimeCorrectionPart[];
};

export type KoreanTimeCorrectionPart = {
  label: string;
  minutes: number;
  reason: string;
};

type CorrectionInterval = {
  start: string;
  end: string;
  correctionMinutes: number;
  reason: string;
};

type KoreanBirthTimeCorrectionOptions = {
  /** 출생지 경도. 출생지를 아직 받지 않으므로 기본은 국내 평균에 가까운 동경 127.5도다. */
  longitudeEast?: number;
  applyLongitudeCorrection?: boolean;
};

export const KST_STANDARD_LONGITUDE_EAST = 135;
export const DEFAULT_KOREA_LONGITUDE_EAST = 127.5;

// 한국 출생 기록 시각을 법정시/DST와 기본 경도 기준 계산 시각으로 정규화한다.
const KOREA_TIME_INTERVALS: CorrectionInterval[] = [
  { start: "1948-06-01 01:00", end: "1948-09-12 23:59", correctionMinutes: -60, reason: "1948년 한국 서머타임(KDT, UTC+10)" },
  { start: "1949-04-03 01:00", end: "1949-09-10 23:59", correctionMinutes: -60, reason: "1949년 한국 서머타임(KDT, UTC+10)" },
  { start: "1950-04-01 01:00", end: "1950-09-09 23:59", correctionMinutes: -60, reason: "1950년 한국 서머타임(KDT, UTC+10)" },
  { start: "1951-05-06 01:00", end: "1951-09-08 23:59", correctionMinutes: -60, reason: "1951년 한국 서머타임(KDT, UTC+10)" },

  { start: "1955-05-05 01:00", end: "1955-09-08 23:59", correctionMinutes: -30, reason: "1955년 한국 서머타임(KDT, UTC+9:30)" },
  { start: "1956-05-20 01:00", end: "1956-09-29 23:59", correctionMinutes: -30, reason: "1956년 한국 서머타임(KDT, UTC+9:30)" },
  { start: "1957-05-05 01:00", end: "1957-09-21 23:59", correctionMinutes: -30, reason: "1957년 한국 서머타임(KDT, UTC+9:30)" },
  { start: "1958-05-04 01:00", end: "1958-09-20 23:59", correctionMinutes: -30, reason: "1958년 한국 서머타임(KDT, UTC+9:30)" },
  { start: "1959-05-03 01:00", end: "1959-09-19 23:59", correctionMinutes: -30, reason: "1959년 한국 서머타임(KDT, UTC+9:30)" },
  { start: "1960-05-01 01:00", end: "1960-09-17 23:59", correctionMinutes: -30, reason: "1960년 한국 서머타임(KDT, UTC+9:30)" },

  { start: "1987-05-10 03:00", end: "1987-10-11 02:59", correctionMinutes: -60, reason: "1987년 한국 서머타임(KDT, UTC+10)" },
  { start: "1988-05-08 03:00", end: "1988-10-09 02:59", correctionMinutes: -60, reason: "1988년 한국 서머타임(KDT, UTC+10)" },

  { start: "1908-04-01 00:00", end: "1911-12-31 23:59", correctionMinutes: 30, reason: "한국 표준시 UTC+8:30 기간" },
  { start: "1954-03-20 23:30", end: "1961-08-09 23:59", correctionMinutes: 30, reason: "한국 표준시 UTC+8:30 기간" },
];

export function correctKoreanBirthTime(
  solarDate: string,
  time: string,
  options: KoreanBirthTimeCorrectionOptions = {}
): KoreanTimeCorrection {
  const recordedMinute = wallMinute(solarDate, time);
  const interval = KOREA_TIME_INTERVALS.find((i) => {
    const start = dateTimeMinute(i.start);
    const end = dateTimeMinute(i.end);
    return recordedMinute >= start && recordedMinute <= end;
  });

  const standardTimeCorrectionMinutes = interval?.correctionMinutes ?? 0;
  const longitudeEast = options.longitudeEast ?? DEFAULT_KOREA_LONGITUDE_EAST;
  const longitudeCorrectionMinutes = options.applyLongitudeCorrection === false
    ? 0
    : longitudeCorrection(longitudeEast);
  const correctionMinutes = standardTimeCorrectionMinutes + longitudeCorrectionMinutes;
  const corrected = shiftWallMinute(recordedMinute, correctionMinutes);
  const parts: KoreanTimeCorrectionPart[] = [
    interval && {
      label: "법정시",
      minutes: standardTimeCorrectionMinutes,
      reason: interval.reason,
    },
    longitudeCorrectionMinutes !== 0 && {
      label: "국내 기본 경도",
      minutes: longitudeCorrectionMinutes,
      reason: `국내 평균 경도 보정(동경 ${formatLongitude(longitudeEast)}, KST 기준 동경 ${formatLongitude(KST_STANDARD_LONGITUDE_EAST)})`,
    },
  ].filter((part): part is KoreanTimeCorrectionPart => Boolean(part));

  return {
    recordedSolarDate: solarDate,
    recordedTime: normalizeTime(time),
    calculationSolarDate: corrected.date,
    calculationTime: corrected.time,
    correctionMinutes,
    standardTimeCorrectionMinutes,
    longitudeCorrectionMinutes,
    longitudeEast,
    standardLongitudeEast: KST_STANDARD_LONGITUDE_EAST,
    applied: correctionMinutes !== 0,
    reason: parts.length > 0 ? parts.map((p) => p.reason).join(" + ") : "보정 없음",
    parts,
  };
}

export function formatKoreanTimeCorrection(correction?: KoreanTimeCorrection | null): string | null {
  if (!correction?.applied) return null;
  const parts = correction.parts?.length
    ? `${correction.parts.map((part) => `${part.label} ${signedMinutes(part.minutes)}분`).join(" + ")}, 총 ${signedMinutes(correction.correctionMinutes)}분`
    : `${correction.reason}, ${signedMinutes(correction.correctionMinutes)}분`;
  return `${correction.recordedSolarDate} ${correction.recordedTime} → ${correction.calculationSolarDate} ${correction.calculationTime} (${parts})`;
}

function longitudeCorrection(longitudeEast: number): number {
  return Math.round((longitudeEast - KST_STANDARD_LONGITUDE_EAST) * 4);
}

function formatLongitude(value: number): string {
  return Number.isInteger(value) ? `${value}도` : `${value.toFixed(1)}도`;
}

function signedMinutes(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function dateTimeMinute(value: string): number {
  const [date, time] = value.split(" ");
  return wallMinute(date, time);
}

function wallMinute(date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = normalizeTime(time).split(":").map(Number);
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, minute, 0, 0);
  return Math.floor(d.getTime() / 60000);
}

function shiftWallMinute(minute: number, delta: number): { date: string; time: string } {
  const d = new Date((minute + delta) * 60000);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hour = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hour}:${min}` };
}

function normalizeTime(time: string): string {
  const [hour = "0", minute = "0"] = time.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}
