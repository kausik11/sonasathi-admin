import type { SpecialDate, VisitingHours } from "../services/dashboardDataService";

export function validateVisitAvailability(hours: VisitingHours | undefined, date: string, time: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return "Choose a valid visit date and time.";
  const selected = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(selected.getTime()) || selected.getTime() <= now.getTime()) return "Visit date and time must be in the future.";
  if (!hours) return "Shop visiting hours are not configured.";
  const special: SpecialDate | undefined = hours.specialDates.find((item) => item.date === date);
  if (hours.holidays.includes(date) || special?.closed) return "The shop is closed on that date. Choose another date.";
  const intervals = special ? special.intervals : hours.week.find((item) => item.day === selected.toLocaleDateString("en-US", { weekday: "long" }))?.intervals ?? [];
  const minute = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  if (!intervals.some((interval) => {
    const [oh, om] = interval.open.split(":").map(Number); const [ch, cm] = interval.close.split(":").map(Number);
    return minute >= oh * 60 + om && minute < ch * 60 + cm;
  })) return "That time is outside the shop's visiting hours.";
  return null;
}
