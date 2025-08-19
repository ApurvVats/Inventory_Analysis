import React, { useEffect, useState } from "react";
import { route } from "../../route";
import "./Variations.css";

export default function Variations() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", tags: "", itemsText: "" });

  const load = async () => {
    const { data } = await route.get("/marketing/variations", { params: { search: q, page, limit } });
    setItems(data.items || []);
    setTotal(data.total || 0);
  };

  useEffect(() => { load(); /* eslint-disable */ }, [q, page, limit]);

  const openCreate = () => {
    setForm({ name: "", code: "", tags: "", itemsText: "" });
    setModalOpen(true);
  };

  const save = async () => {
    const items = (form.itemsText || "")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        // allow "SKU,ASIN" or just SKU or just ASIN
        const parts = line.split(",").map(x => x.trim());
        return { sku: parts[0] || "", asin: parts[2] || "" };
      });
    const tags = (form.tags || "").split(",").map(s => s.trim()).filter(Boolean);

    await route.post("/marketing/variations", { name: form.name, code: form.code, items, tags });
    setModalOpen(false);
    load();
  };

  const deactivate = async (id) => {
    await route.delete(`/marketing/variations/${id}`);
    load();
  };

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <h2>Manage Variations</h2>
        <div style={{ display:"flex", gap:8 }}>
          <input placeholder="Search" value={q} onChange={e=>{setPage(1); setQ(e.target.value);}} />
          <button onClick={openCreate}>New Variation</button>
        </div>
      </div>

      <div className="card">
        <div className="row head">
          <div>Name</div><div>Code</div><div>Tags</div><div>Items</div><div>Actions</div>
        </div>
        {items.map(v => (
          <div className="row" key={v._id}>
            <div>{v.name}</div>
            <div>{v.code || "-"}</div>
            <div>{(v.tags||[]).join(", ") || "-"}</div>
            <div>{(v.items||[]).map(it => it.sku || it.asin).filter(Boolean).slice(0,5).join(", ")}{(v.items||[]).length>5?"…":""}</div>
            <div>
              <button onClick={()=>deactivate(v._id)} title="Deactivate">Disable</button>
            </div>
          </div>
        ))}
        {!items.length && <div className="empty">No variations yet.</div>}
      </div>

      {modalOpen && (
        <div className="modal">
          <div className="panel">
            <h3>New Variation</h3>
            <label>Name</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
            <label>Code (optional)</label>
            <input value={form.code} onChange={e=>setForm(f=>({...f, code:e.target.value}))} />
            <label>Tags (comma separated)</label>
            <input value={form.tags} onChange={e=>setForm(f=>({...f, tags:e.target.value}))} />
            <label>Items (one per line: "SKU,ASIN" or just "SKU")</label>
            <textarea rows={6} value={form.itemsText} onChange={e=>setForm(f=>({...f, itemsText:e.target.value}))}/>
            <div className="actions">
              <button onClick={()=>setModalOpen(false)}>Cancel</button>
              <button onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
