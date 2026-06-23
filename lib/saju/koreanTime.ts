export type KoreanTimeCorrection = {
  /** 계산 전 사용자가 입력한 한국 민간 기록 시각(양력 기준). */
  recordedSolarDate: string;
  recordedTime: string;
  /** 만세력 계산에 실제로 넣은 UTC+9 기준 보정 시각(양력 기준). */
  calculationSolarDate: string;
  calculationTime: string;
  /** 계산 시각 = 기록 시각 + correctionMinutes. */
  correctionMinutes: number;
  applied: boolean;
  reason: string;
};

type CorrectionInterval = {
  start: string;
  end: string;
  correctionMinutes: number;
  reason: string;
};

// 한국 출생 기록 시각을 현재 한국 표준시(UTC+9) 기준의 계산 시각으로 정규화한다.
// 출생지는 받지 않으므로 진태양시 보정은 하지 않는다.
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

export function correctKoreanBirthTime(solarDate: string, time: string): KoreanTimeCorrection {
  const recordedMinute = wallMinute(solarDate, time);
  const interval = KOREA_TIME_INTERVALS.find((i) => {
    const start = dateTimeMinute(i.start);
    const end = dateTimeMinute(i.end);
    return recordedMinute >= start && recordedMinute <= end;
  });

  const correctionMinutes = interval?.correctionMinutes ?? 0;
  const corrected = shiftWallMinute(recordedMinute, correctionMinutes);

  return {
    recordedSolarDate: solarDate,
    recordedTime: normalizeTime(time),
    calculationSolarDate: corrected.date,
    calculationTime: corrected.time,
    correctionMinutes,
    applied: correctionMinutes !== 0,
    reason: interval?.reason ?? "보정 없음",
  };
}

export function formatKoreanTimeCorrection(correction?: KoreanTimeCorrection | null): string | null {
  if (!correction?.applied) return null;
  const sign = correction.correctionMinutes > 0 ? "+" : "";
  return `${correction.recordedSolarDate} ${correction.recordedTime} → ${correction.calculationSolarDate} ${correction.calculationTime} (${correction.reason}, ${sign}${correction.correctionMinutes}분)`;
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
