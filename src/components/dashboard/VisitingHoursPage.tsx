"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Plus, Trash2 } from "lucide-react";
import { getDemoSession } from "../../services/demoSession";
import { saveVisitingHours, type SpecialDate, type VisitingHours } from "../../services/dashboardDataService";
import { useDashboardData } from "../../hooks/useDashboardData";
import { ActionButton, Modal, Panel, Table, type FormField, type FormValues } from "./SharedUI";

const specialFields: FormField[] = [{ key: "date", label: "Date", type: "date", required: true }, { key: "label", label: "Holiday or event name", required: true }, { key: "closed", label: "Hours", type: "select", options: [{ label: "Closed all day", value: "true" }, { label: "Special opening hours", value: "false" }] }, { key: "open", label: "Opens at", type: "time" }, { key: "close", label: "Closes at", type: "time" }];

export default function VisitingHoursPage({ role }: { role: "admin" | "jeweller" }) {
  const { data, error, reload } = useDashboardData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingSpecial, setAddingSpecial] = useState(false);
  const [toast, setToast] = useState("");
  const sessionId = role === "jeweller" ? getDemoSession()?.id : null;
  const jewellers = useMemo(() => (data?.jewellers ?? []).filter((item) => !sessionId || item.id === sessionId), [data, sessionId]);
  const activeId = sessionId ?? selectedId ?? jewellers[0]?.id ?? "";
  const hours = data?.visitingHours.find((item) => item.jewellerId === activeId);

  function update(next: VisitingHours) { saveVisitingHours(next); reload(); setToast("Visiting hours saved."); }
  function addSpecial(values: FormValues) {
    if (!hours) return;
    const item: SpecialDate = { date: String(values.date), label: String(values.label), closed: String(values.closed) === "true", intervals: String(values.closed) === "true" ? [] : [{ open: String(values.open || "10:00"), close: String(values.close || "18:00") }] };
    update({ ...hours, specialDates: [...hours.specialDates.filter((date) => date.date !== item.date), item] });
  }
  function removeSpecial(date: string) { if (hours) update({ ...hours, specialDates: hours.specialDates.filter((item) => item.date !== date) }); }
  function addHoliday() { if (!hours) return; const date = window.prompt("Holiday date (YYYY-MM-DD)"); if (!date) return; if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setToast("Enter the date as YYYY-MM-DD."); return; } update({ ...hours, holidays: [...new Set([...hours.holidays, date])] }); }
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data || !hours) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading visiting hours…</p>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Store schedule</p><h1 className="mt-1 text-2xl font-semibold">Visiting Hours</h1><p className="mt-1 text-sm text-slate-500">Set regular hours, closed days, holidays and special dates.</p></div>{role === "admin" && <select value={activeId} onChange={(event) => setSelectedId(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">{jewellers.map((item) => <option key={item.id} value={item.id}>{item.shop.shopName}</option>)}</select>}</div>
    <Panel title="Weekly hours" description="You can add more than one opening interval for a day.">
      <div className="space-y-3">{hours.week.map((day, index) => <div key={day.day} className="grid gap-3 rounded-lg border border-gray-100 p-3 sm:grid-cols-[150px_100px_1fr_auto] sm:items-start"><div className="pt-2 text-sm font-medium">{day.day}</div><label className="flex items-center gap-2 pt-2 text-xs text-slate-600"><input type="checkbox" checked={day.closed} onChange={(event) => update({ ...hours, week: hours.week.map((item, i) => i === index ? { ...item, closed: event.target.checked, intervals: event.target.checked ? [] : item.intervals.length ? item.intervals : [{ open: "10:00", close: "18:00" }] } : item) })} /> Closed</label><div className="space-y-2">{!day.closed && day.intervals.map((interval, intervalIndex) => <div key={intervalIndex} className="flex flex-wrap items-center gap-2"><input aria-label={`${day.day} opening time`} type="time" value={interval.open} onChange={(event) => update({ ...hours, week: hours.week.map((item, i) => i === index ? { ...item, intervals: item.intervals.map((slot, j) => j === intervalIndex ? { ...slot, open: event.target.value } : slot) } : item) })} className="rounded-md border border-gray-200 px-2 py-1.5 text-sm" /><span className="text-xs text-slate-400">to</span><input aria-label={`${day.day} closing time`} type="time" value={interval.close} onChange={(event) => update({ ...hours, week: hours.week.map((item, i) => i === index ? { ...item, intervals: item.intervals.map((slot, j) => j === intervalIndex ? { ...slot, close: event.target.value } : slot) } : item) })} className="rounded-md border border-gray-200 px-2 py-1.5 text-sm" />{day.intervals.length > 1 && <button aria-label="Remove interval" onClick={() => update({ ...hours, week: hours.week.map((item, i) => i === index ? { ...item, intervals: item.intervals.filter((_, j) => j !== intervalIndex) } : item) })} className="rounded p-1.5 text-slate-400 hover:bg-gray-100"><Trash2 size={14} /></button>}</div>)}</div>{!day.closed && <button onClick={() => update({ ...hours, week: hours.week.map((item, i) => i === index ? { ...item, intervals: [...item.intervals, { open: "14:00", close: "19:00" }] } : item) })} className="flex items-center gap-1 text-xs text-[#806334]"><Plus size={14} /> Add interval</button>}</div>)}</div>
    </Panel>
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Holiday dates" description="Dates when the shop is closed." action={<ActionButton variant="secondary" onClick={addHoliday}><CalendarPlus size={15} /> Add holiday</ActionButton>}>{hours.holidays.length ? <div className="space-y-2">{hours.holidays.map((date) => <div key={date} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"><span>{date}</span><button onClick={() => update({ ...hours, holidays: hours.holidays.filter((item) => item !== date) })} className="text-xs text-red-600">Remove</button></div>)}</div> : <p className="text-sm text-slate-500">No holidays added.</p>}</Panel>
      <Panel title="Special dates" description="One-off opening hours or full-day closures." action={<ActionButton variant="secondary" onClick={() => setAddingSpecial(true)}><Plus size={15} /> Add special date</ActionButton>}>{hours.specialDates.length ? <Table headings={["Date", "Event", "Hours", ""]}>{hours.specialDates.map((item) => <tr key={item.date}><td className="px-3 py-2.5">{item.date}</td><td className="px-3 py-2.5">{item.label}</td><td className="px-3 py-2.5">{item.closed ? "Closed" : item.intervals.map((slot) => `${slot.open}–${slot.close}`).join(", ")}</td><td className="px-3 py-2.5"><button onClick={() => removeSpecial(item.date)} className="text-xs text-red-600">Remove</button></td></tr>)}</Table> : <p className="text-sm text-slate-500">No special dates added.</p>}</Panel>
    </div>
    {addingSpecial && <Modal title="Add special date" fields={specialFields} initial={{ date: "", label: "", closed: "false", open: "10:00", close: "18:00" }} onClose={() => setAddingSpecial(false)} onSave={addSpecial} />}
    {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-[#20382e] px-4 py-3 text-sm text-white shadow-xl">{toast}<button onClick={() => setToast("")} className="ml-4">×</button></div>}
  </div>;
}
