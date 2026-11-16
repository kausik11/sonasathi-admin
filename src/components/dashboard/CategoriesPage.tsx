"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useDashboardData } from "../../hooks/useDashboardData";
import { deleteCategory, saveCategory, type Category } from "../../services/dashboardDataService";
import { ActionButton, EmptyState, Modal, Panel, SearchInput, Table, type FormField, type FormValues } from "./SharedUI";

const id = () => `category-${crypto.randomUUID()}`;
const fields: FormField[] = [{ key: "name", label: "Category name", required: true }, { key: "description", label: "Description", type: "textarea" }, { key: "active", label: "Availability", type: "select", options: [{ label: "Active", value: "true" }, { label: "Hidden", value: "false" }] }];

export default function CategoriesPage() {
  const { data, error, reload } = useDashboardData();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null | false>(false);
  const [toast, setToast] = useState("");
  const rows = useMemo(() => (data?.categories ?? []).filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  function save(values: FormValues) {
    if (!data) return;
    const current = editing || null;
    const name = String(values.name).trim();
    if (data.categories.some((category) => category.name.toLowerCase() === name.toLowerCase() && category.id !== current?.id)) throw new Error("A category with that name already exists.");
    saveCategory({ id: current?.id ?? id(), name, description: String(values.description ?? ""), active: String(values.active) !== "false" });
    setEditing(false); reload(); setToast("Category saved.");
  }
  function remove(category: Category) {
    if (!window.confirm(`Delete the “${category.name}” category? Existing listings will keep their current category label.`)) return;
    deleteCategory(category.id); reload(); setToast("Category deleted.");
  }
  function toggle(category: Category) { saveCategory({ ...category, active: !category.active }); reload(); }
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading categories…</p>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Catalogue setup</p><h1 className="mt-1 text-2xl font-semibold">Categories</h1><p className="mt-1 text-sm text-slate-500">Organize jewellery listings into reusable collections.</p></div><ActionButton onClick={() => setEditing(null)}><Plus size={16} /> Add category</ActionButton></div>
    <Panel title={`${rows.length} categories`} action={<SearchInput value={query} onChange={setQuery} placeholder="Search categories…" />}>
      {rows.length ? <Table headings={["Category", "Description", "Listings", "Status", "Actions"]}>{rows.map((category) => <tr key={category.id}><td className="px-3 py-3 font-medium">{category.name}</td><td className="px-3 py-3 text-slate-600">{category.description || "—"}</td><td className="px-3 py-3">{data.products.filter((product) => product.category === category.name).length}</td><td className="px-3 py-3"><button onClick={() => toggle(category)} className={`rounded-full px-2.5 py-1 text-xs ${category.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{category.active ? "Active" : "Hidden"}</button></td><td className="px-3 py-3"><button onClick={() => setEditing(category)} className="rounded p-2 text-slate-600 hover:bg-gray-100"><Pencil size={15} /></button><button onClick={() => remove(category)} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></td></tr>)}</Table> : <EmptyState message="No categories match your search." />}
    </Panel>
    {editing !== false && <Modal title={editing ? "Edit category" : "Add category"} fields={fields} initial={editing ? { name: editing.name, description: editing.description, active: String(editing.active) } : { name: "", description: "", active: "true" }} onClose={() => setEditing(false)} onSave={save} />}
    {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-[#20382e] px-4 py-3 text-sm text-white shadow-xl">{toast}<button onClick={() => setToast("")} className="ml-4">×</button></div>}
  </div>;
}
