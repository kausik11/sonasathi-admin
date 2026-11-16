"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export type FormField = { key: string; label: string; type?: "text" | "email" | "tel" | "number" | "date" | "time" | "password" | "textarea" | "select" | "file"; options?: { label: string; value: string }[] | ((values: FormValues) => { label: string; value: string }[]); required?: boolean; placeholder?: string; step?: string };
export type FormValues = Record<string, string | number | boolean>;

export function Panel({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-[#e8e4da] bg-white shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4"><div><h2 className="font-semibold text-[#26312b]">{title}</h2>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div>{action}</div><div className="p-5">{children}</div></section>;
}

export function ActionButton({ children, onClick, variant = "primary", type = "button", disabled = false }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "quiet"; type?: "button" | "submit"; disabled?: boolean }) {
  const style = variant === "primary" ? "bg-[#20382e] text-white hover:bg-[#2e4a3d]" : variant === "danger" ? "border border-red-200 bg-white text-red-700 hover:bg-red-50" : variant === "quiet" ? "text-slate-600 hover:bg-gray-100" : "border border-gray-200 bg-white text-slate-700 hover:bg-gray-50";
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}>{children}</button>;
}

export function EmptyState({ message }: { message: string }) { return <p className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-slate-500">{message}</p>; }

export function Table({ headings, children }: { headings: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-gray-100 text-[11px] uppercase tracking-wide text-slate-500">{headings.map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{children}</tbody></table></div>;
}

export function Modal({ title, fields, initial, onClose, onSave, saveLabel = "Save changes" }: { title: string; fields: FormField[]; initial?: FormValues; onClose: () => void; onSave: (values: FormValues) => void | Promise<void>; saveLabel?: string }) {
  const [values, setValues] = useState<FormValues>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { await onSave(values); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Changes could not be saved."); }
    finally { setSaving(false); }
  }
  const inputStyle = "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#a98b52] focus:ring-2 focus:ring-[#d6b46b]/20";
  return <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-label={title} className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><h2 className="font-semibold text-slate-900">{title}</h2><button onClick={onClose} aria-label="Close dialog" className="rounded-md p-2 text-slate-500 hover:bg-gray-100"><X size={18} /></button></div>
      <form onSubmit={submit} className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <label key={field.key} className={`block text-xs font-semibold text-slate-600 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>{field.label}
          {field.type === "textarea" ? <textarea required={field.required} rows={3} value={String(values[field.key] ?? "")} onChange={(event) => setValues((old) => ({ ...old, [field.key]: event.target.value }))} placeholder={field.placeholder} className={inputStyle} />
              : field.type === "select" ? <select required={field.required} value={String(values[field.key] ?? "")} onChange={(event) => setValues((old) => ({ ...old, [field.key]: event.target.value }))} className={inputStyle}>{(typeof field.options === "function" ? field.options(values) : field.options)?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              : field.type === "file" ? <><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 3 * 1024 * 1024) { setError("Shop logo and banner images must be smaller than 3 MB."); return; } const reader = new FileReader(); reader.onload = () => { if (typeof reader.result === "string") setValues((old) => ({ ...old, [field.key]: reader.result as string })); }; reader.readAsDataURL(file); }} className={inputStyle} />{typeof values[field.key] === "string" && String(values[field.key]).startsWith("data:image/") && <Image src={String(values[field.key])} alt={`${field.label} preview`} width={240} height={96} unoptimized className="mt-2 h-16 max-w-full rounded border border-gray-200 object-contain" />}</>
                : <input required={field.required} type={field.type ?? "text"} step={field.step} value={String(values[field.key] ?? "")} onChange={(event) => setValues((old) => ({ ...old, [field.key]: event.target.value }))} placeholder={field.placeholder} className={inputStyle} />}
        </label>)}</div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton><ActionButton type="submit" disabled={saving}>{saving ? "Saving…" : saveLabel}</ActionButton></div>
      </form>
    </div>
  </div>;
}

export function SearchInput({ value, onChange, placeholder = "Search records…" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#a98b52]" />;
}
