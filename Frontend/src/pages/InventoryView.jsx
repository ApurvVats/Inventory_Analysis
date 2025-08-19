import React, { useEffect, useState } from "react";
import { route } from "../route";
import "./InventoryView.css";

export default function InventoryView(){
  const [windowDays, setWindowDays] = useState(30);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try{
      const { data } = await route.get(`/inventory/view?window=${windowDays}`);
      setRows(data.rows || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); }, [windowDays]);

  return (
    <div className="iv-card">
      <div className="iv-toolbar">
        <h1>Inventory Report</h1>
        <div className="iv-controls">
          <label>Window</label>
          <select value={windowDays} onChange={e=>setWindowDays(Number(e.target.value))}>
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={60}>60d</option>
            <option value={90}>90d</option>
          </select>
        </div>
      </div>

      <div className="iv-table">
        <div className="iv-row iv-head">
          <div>Image</div><div>ASIN</div><div>SKU</div>
          <div>Avg Daily</div><div>1m</div><div>2m</div><div>3m</div>
          <div>FBA</div><div>MFN</div><div>Vendor</div><div>Total</div><div>Run-out (d)</div>
        </div>
        {loading ? <div className="iv-row"><div>Loading...</div></div> :
          rows.length === 0 ? <div className="iv-row"><div>No data</div></div> :
          rows.map((r,i)=>(
            <div className="iv-row" key={`${r.asin}_${r.sku}_${i}`}>
              <div>{r.imageUrl ? <img src={r.imageUrl} alt="" /> : "—"}</div>
              <div>{r.asin}</div>
              <div>{r.sku}</div>
              <div>{r.avgDailySales}</div>
              <div>{r.proj1m}</div>
              <div>{r.proj2m}</div>
              <div>{r.proj3m}</div>
              <div>{r.fbaQty}</div>
              <div>{r.mfnQty}</div>
              <div>{r.vendorQty}</div>
              <div>{r.totalQty}</div>
              <div>{r.daysToOOS ?? "—"}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
