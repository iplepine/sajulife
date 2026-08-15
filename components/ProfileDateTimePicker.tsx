"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

type TimeMode = "hour" | "minute";

type ProfileDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

type DateParts = { year: string; month: string; day: string };

type ProfileTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
};

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
const CLOCK_HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const CLOCK_MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,…,55

/**
 * 생년월일 입력 — 년·월·일을 직접 타이핑한다(휠/그리드 없음).
 * 세 칸이 모두 차면 유효성 검사, 이상한 날짜면 alert로 안내하고 값은 비워둔다.
 */
export function ProfileDatePicker({
  value,
  onChange,
  label,
  required,
  disabled = false,
}: ProfileDatePickerProps) {
  const [parts, setParts] = useState<DateParts>(() => toParts(value));
  // 세 칸을 한 덩어리로 들고, 최신값을 ref에도 즉시 복사한다.
  // 월 두 번째 자리를 치면 focus 이동 → onBlur가 리렌더 전에 동기로 실행되는데,
  // 그때 state는 아직 직전 값이라 "10"이 "01"로 덮이던 문제가 있었다. blur는 ref를 본다.
  const partsRef = useRef<DateParts>(parts);
  const lastEmitted = useRef<string>(value);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const { year, month, day } = parts;

  function commit(next: DateParts) {
    partsRef.current = next;
    setParts(next);
  }

  // 외부에서 value가 바뀌면(프로필 로드·폼 리셋 등) 입력칸을 맞춘다.
  // 우리가 방금 emit한 값의 메아리는 무시해 타이핑 중 클로버링을 막는다.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    commit(toParts(value));
  }, [value]);

  function emit(next: DateParts) {
    const result = validateDate(next.year, next.month, next.day);
    const emitted = result.ok ? result.value : "";
    lastEmitted.current = emitted;
    onChange(emitted);
  }

  function change(part: keyof DateParts, raw: string) {
    const cur = partsRef.current;
    const digits = raw.replace(/\D+/g, "").slice(0, part === "year" ? 4 : 2);
    const typed = sanitizePart(part, digits, cur);
    if (typed === null) return; // 13월·32일처럼 될 수 없는 값은 아예 안 받는다
    const next = { ...cur, [part]: typed };
    // 31일을 넣어둔 뒤 2월로 바꾸는 식이면 일자를 그 달 마지막 날로 당겨준다
    if (part !== "day" && next.day) {
      const maxDay = daysInMonth(next.year, next.month);
      if (Number(next.day) > maxDay) next.day = String(maxDay).padStart(2, "0");
    }
    commit(next);
    emit(next);
    if (part === "year" && typed.length === 4) monthRef.current?.focus();
    else if (part === "month" && typed.length === 2) dayRef.current?.focus();
  }

  function blur() {
    const cur = partsRef.current;
    const next: DateParts = {
      year: cur.year,
      month: padOrClear(cur.month),
      day: padOrClear(cur.day),
    };
    if (next.month !== cur.month || next.day !== cur.day) commit(next);
    if (!next.year || !next.month || !next.day) return; // 아직 다 안 채웠으면 조용히 넘어간다
    const result = validateDate(next.year, next.month, next.day);
    if (!result.ok) window.alert(result.message);
    else emit(next);
  }

  return (
    <div className="picker-field">
      {label && (
        <label className="picker-label">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      )}
      <div className={`date-input${disabled ? " is-disabled" : ""}`}>
        <div className="date-seg date-seg--year">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="date-seg-input"
            placeholder="1990"
            aria-label="출생 연도(네 자리)"
            value={year}
            maxLength={4}
            disabled={disabled}
            onChange={(e) => change("year", e.target.value)}
            onBlur={blur}
          />
          <span className="date-seg-unit">년</span>
        </div>
        <div className="date-seg">
          <input
            ref={monthRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="date-seg-input"
            placeholder="06"
            aria-label="출생 월"
            value={month}
            maxLength={2}
            disabled={disabled}
            onChange={(e) => change("month", e.target.value)}
            onBlur={blur}
          />
          <span className="date-seg-unit">월</span>
        </div>
        <div className="date-seg">
          <input
            ref={dayRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="date-seg-input"
            placeholder="14"
            aria-label="출생 일"
            value={day}
            maxLength={2}
            disabled={disabled}
            onChange={(e) => change("day", e.target.value)}
            onBlur={blur}
          />
          <span className="date-seg-unit">일</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 출생 시각 입력 — 아날로그 시계판을 탭/드래그해서 고른다.
 * 시를 고르면 자동으로 분 모드로 넘어가고, 위 숫자를 눌러 언제든 다시 고칠 수 있다.
 */
export function ProfileTimePicker({
  value,
  onChange,
  label,
  disabled = false,
}: ProfileTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TimeMode>("hour");
  const modalRef = useRef<HTMLDivElement>(null);
  const parsed = parseTimeValue(value);
  const [period, setPeriod] = useState<"am" | "pm">(parsed.period);
  const [hour12, setHour12] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);

  useEffect(() => {
    const next = parseTimeValue(value);
    setPeriod(next.period);
    setHour12(next.hour12);
    setMinute(next.minute);
  }, [value]);

  function openPicker() {
    if (disabled) return;
    const next = parseTimeValue(value);
    setPeriod(next.period);
    setHour12(next.hour12);
    setMinute(next.minute);
    setMode("hour");
    setOpen(true);
  }

  function save() {
    const hour24 =
      period === "am"
        ? hour12 === 12
          ? 0
          : hour12
        : hour12 === 12
          ? 12
          : hour12 + 12;
    onChange(`${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    setOpen(false);
  }

  useDismissOnOutside(open, modalRef, () => setOpen(false));

  return (
    <div className="picker-field">
      {label && <label className="picker-label">{label}</label>}
      <button
        type="button"
        className="picker-display"
        onClick={openPicker}
        disabled={disabled}
      >
        <span className={value ? "picker-display-value" : "picker-display-placeholder"}>
          {value ? formatTimeDisplay(value) : "시각을 선택해주세요"}
        </span>
        <ClockIcon />
      </button>

      {open && (
        <PickerOverlay>
          <div className="picker-panel picker-panel--time" ref={modalRef}>
            <PickerHeader title="출생 시각" onClose={() => setOpen(false)} />
            <div className="picker-clock">
              <div className="picker-clock-head">
                <div className="picker-ampm">
                  <button
                    type="button"
                    className={period === "am" ? "on" : ""}
                    onClick={() => setPeriod("am")}
                  >
                    오전
                  </button>
                  <button
                    type="button"
                    className={period === "pm" ? "on" : ""}
                    onClick={() => setPeriod("pm")}
                  >
                    오후
                  </button>
                </div>
                <div className="picker-clock-readout">
                  <button
                    type="button"
                    className={`picker-clock-num${mode === "hour" ? " on" : ""}`}
                    onClick={() => setMode("hour")}
                    aria-label="시 선택"
                  >
                    {String(hour12).padStart(2, "0")}
                  </button>
                  <span className="picker-clock-colon">:</span>
                  <button
                    type="button"
                    className={`picker-clock-num${mode === "minute" ? " on" : ""}`}
                    onClick={() => setMode("minute")}
                    aria-label="분 선택"
                  >
                    {String(minute).padStart(2, "0")}
                  </button>
                </div>
              </div>
              <ClockDial
                mode={mode}
                hour12={hour12}
                minute={minute}
                onHour={setHour12}
                onMinute={setMinute}
                onHourPicked={() => setMode("minute")}
              />
              <p className="picker-clock-hint">
                {mode === "hour"
                  ? "시를 고르면 분으로 넘어가요."
                  : "분을 맞춰주세요. 시는 위 숫자를 눌러 다시 고칠 수 있어요."}
              </p>
            </div>
            <div className="picker-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={save}>
                확인
              </button>
            </div>
          </div>
        </PickerOverlay>
      )}
    </div>
  );
}

function ClockDial({
  mode,
  hour12,
  minute,
  onHour,
  onMinute,
  onHourPicked,
}: {
  mode: TimeMode;
  hour12: number;
  minute: number;
  onHour: (value: number) => void;
  onMinute: (value: number) => void;
  onHourPicked: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const C = 140;
  const RING = 108;

  const activeValue = mode === "hour" ? hour12 : minute;
  const handAngle = mode === "hour" ? hour12 * 30 : minute * 6;
  const hand = polar(C, C, RING, handAngle);
  const labels = mode === "hour" ? CLOCK_HOURS : CLOCK_MINUTES;

  function pick(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let angle = (Math.atan2(clientX - cx, -(clientY - cy)) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    if (mode === "hour") {
      let h = Math.round(angle / 30) % 12;
      if (h === 0) h = 12;
      if (h !== hour12) onHour(h);
    } else {
      const m = Math.round(angle / 6) % 60;
      if (m !== minute) onMinute(m);
    }
  }

  function onDown(e: ReactPointerEvent<SVGSVGElement>) {
    dragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 활성 포인터가 아니면 무시 — 캡처 없이도 드래그는 동작 */
    }
    pick(e.clientX, e.clientY);
  }
  function onMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!dragging.current) return;
    pick(e.clientX, e.clientY);
  }
  function onUp(e: ReactPointerEvent<SVGSVGElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* capture가 이미 풀렸으면 무시 */
    }
    if (mode === "hour") onHourPicked();
  }

  return (
    <svg
      ref={svgRef}
      className="picker-clock-face"
      viewBox="0 0 280 280"
      role="slider"
      aria-label={mode === "hour" ? "시" : "분"}
      aria-valuenow={activeValue}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <circle className="clock-plate" cx={C} cy={C} r={131} />
      <line className="clock-hand" x1={C} y1={C} x2={hand.x} y2={hand.y} />
      <circle className="clock-knob" cx={hand.x} cy={hand.y} r={20} />
      <circle className="clock-center" cx={C} cy={C} r={4} />
      {labels.map((v) => {
        const angle = mode === "hour" ? v * 30 : v * 6;
        const pos = polar(C, C, RING, angle);
        const on = v === activeValue;
        return (
          <text
            key={v}
            className={`clock-num${on ? " on" : ""}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {mode === "hour" ? v : String(v).padStart(2, "0")}
          </text>
        );
      })}
    </svg>
  );
}

function PickerOverlay({ children }: { children: ReactNode }) {
  return <div className="picker-overlay">{children}</div>;
}

function PickerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="picker-header">
      <div className="picker-header-main">
        <h4>{title}</h4>
      </div>
      <div className="picker-header-side">
        <button type="button" className="picker-icon-btn" onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

function useDismissOnOutside(open: boolean, ref: RefObject<HTMLElement | null>, onDismiss: () => void) {
  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, ref, onDismiss]);
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const t = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(t), y: cy - r * Math.cos(t) };
}

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/** "5" → "05". "0"만 남았으면 의미가 없으니 빈 칸으로 되돌린다. */
function padOrClear(part: string) {
  if (!part || Number(part) === 0) return "";
  return part.padStart(2, "0");
}

/**
 * 타이핑 한 글자마다 걸러낸다.
 * - 될 수 없는 값(13월·32일·2월 30일·0월)은 null → 키 입력 자체를 무시
 * - 첫 자리만으로 답이 정해지면(월 2~9, 일 4~9) 바로 "05"처럼 0을 붙여준다
 */
function sanitizePart(part: keyof DateParts, digits: string, cur: DateParts): string | null {
  if (part === "year" || digits === "") return digits;
  if (part === "month") {
    if (digits.length === 1) return Number(digits) >= 2 ? `0${digits}` : digits;
    const month = Number(digits);
    return month >= 1 && month <= 12 ? digits : null;
  }
  const maxDay = daysInMonth(cur.year, cur.month);
  if (digits.length === 1) {
    const d = Number(digits);
    if (d >= 4) return d <= maxDay ? `0${digits}` : null;
    return digits;
  }
  const day = Number(digits);
  return day >= 1 && day <= maxDay ? digits : null;
}

/** 연·월을 아직 다 모르면 넉넉하게 31일까지 허용한다. */
function daysInMonth(year: string, month: string) {
  const m = Number(month);
  if (!m || m < 1 || m > 12) return 31;
  const y = Number(year);
  if (!y || y < MIN_YEAR) return m === 2 ? 29 : new Date(2000, m, 0).getDate();
  return new Date(y, m, 0).getDate();
}

/** "1990-10-14" → 세 입력칸 문자열. 파싱 안 되면 빈 칸. */
function toParts(value: string): DateParts {
  const p = parseDateValue(value);
  if (!p) return { year: "", month: "", day: "" };
  return {
    year: String(p.year),
    month: String(p.month).padStart(2, "0"),
    day: String(p.day).padStart(2, "0"),
  };
}

function toDateValue(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 세 칸이 온전한 날짜인지 검사. 아니면 안내 문구를 돌려준다. */
function validateDate(
  y: string,
  m: string,
  d: string,
): { ok: true; value: string } | { ok: false; message: string } {
  if (!y || !m || !d) return { ok: false, message: "생년월일을 모두 입력해주세요." };
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > CURRENT_YEAR) {
    return { ok: false, message: `연도는 ${MIN_YEAR}년부터 ${CURRENT_YEAR}년 사이로 입력해주세요.` };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, message: "월은 1부터 12 사이로 입력해주세요." };
  }
  const lastDay = new Date(year, month, 0).getDate();
  if (!Number.isInteger(day) || day < 1 || day > lastDay) {
    return { ok: false, message: `${month}월은 ${lastDay}일까지 있어요. 날짜를 다시 확인해주세요.` };
  }
  const picked = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (picked.getTime() > today.getTime()) {
    return { ok: false, message: "아직 오지 않은 날짜예요. 생년월일을 다시 확인해주세요." };
  }
  return { ok: true, value: toDateValue(year, month, day) };
}

function parseTimeValue(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  const hour = match ? Number(match[1]) : 9;
  const minute = match ? Number(match[2]) : 0;
  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;
  return { period: period as "am" | "pm", hour12, minute };
}

function formatTimeDisplay(value: string) {
  const parsed = parseTimeValue(value);
  return formatTimeParts(parsed.period, parsed.hour12, parsed.minute);
}

function formatTimeParts(period: "am" | "pm", hour12: number, minute: number) {
  return `${period === "am" ? "오전" : "오후"} ${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v5l3.2 2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10" />
      <path d="M17 7L7 17" />
    </svg>
  );
}
