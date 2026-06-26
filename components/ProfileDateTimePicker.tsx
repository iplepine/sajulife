"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject, type UIEvent } from "react";

type DateStep = "year" | "month" | "day";

type ProfileDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

type ProfileTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 121 }, (_, i) => CURRENT_YEAR - i);
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function ProfileDatePicker({
  value,
  onChange,
  label,
  required,
  disabled = false,
}: ProfileDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DateStep>("year");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showAllYears, setShowAllYears] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const parsed = parseDateValue(value);

  function openPicker() {
    if (disabled) return;
    if (parsed) {
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.month - 1);
      setStep("day");
    } else {
      setSelectedYear(null);
      setSelectedMonth(null);
      setStep("year");
    }
    setShowAllYears(false);
    setOpen(true);
  }

  function selectDay(day: number) {
    if (selectedYear == null || selectedMonth == null) return;
    onChange(toDateValue(selectedYear, selectedMonth + 1, day));
    setOpen(false);
  }

  function back() {
    if (step === "day") setStep("month");
    if (step === "month") setStep("year");
  }

  useDismissOnOutside(open, modalRef, () => setOpen(false));

  const title = step === "year"
    ? "연도를 선택해주세요"
    : step === "month"
      ? `${selectedYear}년`
      : `${selectedYear}년 ${selectedMonth != null ? selectedMonth + 1 : ""}월`;

  return (
    <div className="picker-field">
      {label && (
        <label className="picker-label">
          {label}{required ? <span aria-hidden="true"> *</span> : null}
        </label>
      )}
      <button
        type="button"
        className="picker-display"
        onClick={openPicker}
        disabled={disabled}
      >
        <span className={value ? "picker-display-value" : "picker-display-placeholder"}>
          {value ? formatDateDisplay(value) : "날짜를 선택해주세요"}
        </span>
        <CalendarIcon />
      </button>

      {open && (
        <PickerOverlay>
          <div className="picker-panel" ref={modalRef}>
            <PickerHeader
              title={title}
              stepIndex={step === "year" ? 0 : step === "month" ? 1 : 2}
              stepCount={3}
              onBack={step === "year" ? undefined : back}
              onClose={() => setOpen(false)}
            />
            <div className="picker-body">
              {step === "year" && (
                <>
                  <div className="picker-grid picker-grid--year">
                    {(showAllYears ? YEARS : YEARS.slice(0, 24)).map((year) => (
                      <button
                        key={year}
                        type="button"
                        className={`picker-option${parsed?.year === year ? " on" : ""}${year === CURRENT_YEAR ? " today" : ""}`}
                        onClick={() => {
                          setSelectedYear(year);
                          setStep("month");
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                  {!showAllYears && (
                    <button type="button" className="picker-more" onClick={() => setShowAllYears(true)}>
                      더보기
                    </button>
                  )}
                </>
              )}
              {step === "month" && selectedYear != null && (
                <div className="picker-grid picker-grid--month">
                  {Array.from({ length: 12 }, (_, i) => i).map((month) => {
                    const isFuture = selectedYear === CURRENT_YEAR && month > new Date().getMonth();
                    return (
                      <button
                        key={month}
                        type="button"
                        disabled={isFuture}
                        className={`picker-option${parsed?.year === selectedYear && parsed.month === month + 1 ? " on" : ""}`}
                        onClick={() => {
                          setSelectedMonth(month);
                          setStep("day");
                        }}
                      >
                        {month + 1}월
                      </button>
                    );
                  })}
                </div>
              )}
              {step === "day" && selectedYear != null && selectedMonth != null && (
                <>
                  <div className="picker-weekdays">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="picker-grid picker-grid--day">
                    {renderDayOptions(selectedYear, selectedMonth, parsed, selectDay)}
                  </div>
                </>
              )}
            </div>
            <div className="picker-footer">
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>
                취소
              </button>
            </div>
          </div>
        </PickerOverlay>
      )}
    </div>
  );
}

export function ProfileTimePicker({
  value,
  onChange,
  label,
  disabled = false,
}: ProfileTimePickerProps) {
  const [open, setOpen] = useState(false);
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
    setOpen(true);
  }

  function save() {
    const hour24 = period === "am"
      ? hour12 === 12 ? 0 : hour12
      : hour12 === 12 ? 12 : hour12 + 12;
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
            <PickerHeader
              title="출생 시각"
              badge={formatTimeParts(period, hour12, minute)}
              onClose={() => setOpen(false)}
            />
            <div className="picker-time-body">
              <div className="picker-period">
                <button type="button" className={period === "am" ? "on" : ""} onClick={() => setPeriod("am")}>오전</button>
                <button type="button" className={period === "pm" ? "on" : ""} onClick={() => setPeriod("pm")}>오후</button>
              </div>
              <WheelColumn label="시" options={HOURS_12} value={hour12} onChange={setHour12} format={(v) => String(v).padStart(2, "0")} />
              <WheelColumn label="분" options={MINUTES} value={minute} onChange={setMinute} format={(v) => String(v).padStart(2, "0")} />
            </div>
            <div className="picker-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>취소</button>
              <button type="button" className="btn btn-primary" onClick={save}>확인</button>
            </div>
          </div>
        </PickerOverlay>
      )}
    </div>
  );
}

function WheelColumn({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const isScrollSelectingRef = useRef(false);

  useEffect(() => {
    if (isScrollSelectingRef.current) return;
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, [value]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  function selectClosest(scrollEl: HTMLDivElement) {
    const buttons = Array.from(scrollEl.querySelectorAll<HTMLButtonElement>("button[data-wheel-value]"));
    const centerY = scrollEl.getBoundingClientRect().top + scrollEl.clientHeight / 2;
    let closest: { button: HTMLButtonElement; distance: number } | null = null;

    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      const buttonCenterY = rect.top + rect.height / 2;
      const distance = Math.abs(buttonCenterY - centerY);
      if (!closest || distance < closest.distance) closest = { button, distance };
    }

    const nextValue = Number(closest?.button.dataset.wheelValue);
    if (Number.isFinite(nextValue) && nextValue !== value) onChange(nextValue);
  }

  function handleScroll(e: UIEvent<HTMLDivElement>) {
    const scrollEl = e.currentTarget;
    isScrollSelectingRef.current = true;

    if (rafRef.current == null) {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        selectClosest(scrollEl);
      });
    }

    if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      isScrollSelectingRef.current = false;
      selectedRef.current?.scrollIntoView({ block: "center" });
    }, 140);
  }

  return (
    <section className="picker-wheel">
      <p>{label}</p>
      <div className="picker-wheel-frame">
        <div className="picker-wheel-highlight" aria-hidden="true" />
        <div className="picker-wheel-scroll" onScroll={handleScroll}>
          <div className="picker-wheel-spacer" />
          {options.map((option) => (
            <button
              key={option}
              type="button"
              data-wheel-value={option}
              ref={option === value ? selectedRef : undefined}
              className={option === value ? "on" : ""}
              onClick={() => {
                isScrollSelectingRef.current = false;
                onChange(option);
              }}
            >
              {format(option)}
            </button>
          ))}
          <div className="picker-wheel-spacer" />
        </div>
      </div>
    </section>
  );
}

function PickerOverlay({ children }: { children: ReactNode }) {
  return <div className="picker-overlay">{children}</div>;
}

function PickerHeader({
  title,
  badge,
  stepIndex,
  stepCount,
  onBack,
  onClose,
}: {
  title: string;
  badge?: string;
  stepIndex?: number;
  stepCount?: number;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="picker-header">
      <div className="picker-header-main">
        {onBack && (
          <button type="button" className="picker-icon-btn" onClick={onBack} aria-label="이전">
            <ChevronLeftIcon />
          </button>
        )}
        <h4>{title}</h4>
      </div>
      <div className="picker-header-side">
        {badge && <span className="picker-badge">{badge}</span>}
        {stepCount != null && stepIndex != null && (
          <span className="picker-steps" aria-hidden="true">
            {Array.from({ length: stepCount }, (_, i) => (
              <i key={i} className={i === stepIndex ? "on" : ""} />
            ))}
          </span>
        )}
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

function renderDayOptions(
  year: number,
  monthIndex: number,
  selected: { year: number; month: number; day: number } | null,
  onSelect: (day: number) => void,
) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(<span key={`empty-${i}`} className="picker-day-empty" />);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const isSelected = selected?.year === year && selected.month === monthIndex + 1 && selected.day === day;
    const isToday = today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day;
    const isFuture = new Date(year, monthIndex, day) > today;
    cells.push(
      <button
        key={day}
        type="button"
        className={`picker-day${isSelected ? " on" : ""}${isToday ? " today" : ""}`}
        disabled={isFuture}
        onClick={() => onSelect(day)}
      >
        {day}
      </button>,
    );
  }
  return cells;
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

function toDateValue(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDateDisplay(value: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return value;
  return `${parsed.year}. ${String(parsed.month).padStart(2, "0")}. ${String(parsed.day).padStart(2, "0")}.`;
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
      <path d="M4 10h16" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v5l3.2 2" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
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
