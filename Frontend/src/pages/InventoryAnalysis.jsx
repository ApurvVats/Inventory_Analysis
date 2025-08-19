import React, { useEffect, useState } from "react";
import { route } from "../route";
import "./InventoryAnalysis.css";

export default function InventoryAnalysis(){
  const [windowDays, setWindowDays] = useState(30);
  const [kpi, setKpi] = useState({ totalSkus:0, totalUnits:0, avgDaily:0, atRisk:0 });
  const [watch, setWatch] = useState([]);

  const load = async () => {
    const { data } = await route.get(`/inventory/view?window=${windowDays}`);
    const rows = data.rows || [];
    const totalSkus = rows.length;
    const totalUnits = rows.reduce((s,r)=>s+(r.totalQty||0),0);
    const avgDaily = rows.reduce((s,r)=>s+(r.avgDailySales||0),0);
    const atRisk = rows.filter(r => (r.daysToOOS ?? 999999) < 14).length;
    const topWatch = rows
      .filter(r=>r.avgDailySales>0)
      .sort((a,b)=>(a.daysToOOS??1e9)-(b.daysToOOS??1e9))
      .slice(0,10);
    setKpi({ totalSkus, totalUnits, avgDaily:+avgDaily.toFixed(2), atRisk });
    setWatch(topWatch);
  };

  useEffect(()=>{ load(); }, [windowDays]);

  return (
    <div className="ia-wrap">
      <div className="ia-toolbar">
        <h1>Inventory Analysis</h1>
        <div className="ia-controls">
          <label>Window</label>
          <select value={windowDays} onChange={e=>setWindowDays(Number(e.target.value))}>
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={60}>60d</option>
            <option value={90}>90d</option>
          </select>
        </div>
      </div>

      <div className="ia-kpis">
        <div className="kpi"><div className="kpi-h">Total SKUs</div><div className="kpi-v">{kpi.totalSkus}</div></div>
        <div className="kpi"><div className="kpi-h">Total Units</div><div className="kpi-v">{kpi.totalUnits}</div></div>
        <div className="kpi"><div className="kpi-h">Avg Daily Units</div><div className="kpi-v">{kpi.avgDaily}</div></div>
        <div className="kpi"><div className="kpi-h">SKUs at Risk (&lt;14d)</div><div className="kpi-v">{kpi.atRisk}</div></div>
      </div>

      <h2 className="ia-sub">Low-stock watchlist</h2>
      <div className="ia-table">
        <div className="ia-row ia-head">
          <div>ASIN</div><div>SKU</div><div>Avg Daily</div><div>Total</div><div>Run-out (d)</div>
        </div>
        {watch.map((r,i)=>(
          <div className="ia-row" key={`${r.asin}_${r.sku}_${i}`}>
            <div>{r.asin}</div>
            <div>{r.sku}</div>
            <div>{r.avgDailySales}</div>
            <div>{r.totalQty}</div>
            <div>{r.daysToOOS ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
