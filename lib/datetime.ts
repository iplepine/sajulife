export function getNowVars(): { today: string; currentYear: string; currentMonth: string } {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    today: `${y}-${m}-${day}`,
    currentYear: String(y),
    currentMonth: `${y}-${m}`,
  };
}
