"use client";

import { hasLeapMonth } from "@/lib/saju/lunarLeap";

/**
 * 음력 윤달 선택 — 음력이고, 입력한 해에 그 달의 윤달이 실제로 있을 때만 나타난다.
 * 윤달이 없는 대부분의 사람에게는 보이지 않아 입력 부담을 늘리지 않는다. (lib/saju/lunarLeap.ts)
 */
export default function LeapMonthOption({
  calendar,
  birthDate,
  checked,
  onChange,
}: {
  calendar: string;
  birthDate: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  if (calendar !== "lunar" || !birthDate) return null;
  const [y, m] = birthDate.split("-").map(Number);
  if (!hasLeapMonth(y, m)) return null;
  return (
    <div className="leap-month-option">
      <label className="row gap2">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>윤달이에요 (윤{m}월)</span>
      </label>
      <p className="leap-month-hint">{y}년은 음력 {m}월이 두 번 있어요. 두 번째 {m}월(윤달)에 태어났다면 체크해 주세요.</p>
    </div>
  );
}
