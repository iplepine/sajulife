export function getNowVars(): {
  today: string;
  currentYear: string;
  currentMonth: string;
  previousYear: string;
  nextYear: string;
} {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    today: `${y}-${m}-${day}`,
    currentYear: String(y),
    currentMonth: `${y}-${m}`,
    previousYear: String(y - 1),
    nextYear: String(y + 1),
  };
}

export function calculateCurrentAge(birthDate: string, today: string): number {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  if (!birthYear || !birthMonth || !birthDay || !todayYear || !todayMonth || !todayDay) return 0;

  let age = todayYear - birthYear;
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age -= 1;
  }
  return Math.max(0, age);
}
