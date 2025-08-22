import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import dayjs from "dayjs";
import "./SalesTrend.css";

export default function SalesTrend() {
  const token = useSelector((s) => s.auth.token);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [has30, setHas30] = useState(false);
  const [items, setItems] = useState([]);

  const headers = useMemo(() => {
    if (!items?.length) return [];
    return items[0].days?.map((d) => d.date) || [];
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/sales/daily/trend", {
        params: { days },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setHas30(!!data?.has30DaysData);
      setItems(data?.items || []);
    } catch (e) {
      // optional toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const downloadCSV = () => {
    const rows = [];
    items.forEach((row) => {
      const rec = { ASIN: row.asin, Expected: row.expected };
      row.days.forEach((d) => (rec[d.date] = d.qty));
      rows.push(rec);
    });
    const cols = rows.length ? Object.keys(rows[0]) : ["ASIN", "Expected"];
    const csv = [cols.join(",")]
      .concat(rows.map((r) => cols.map((c) => (r[c] ?? "")).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily_sales_trend_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="st-wrap">
      <div className="st-header">
        <h2>Daily Sales Performance</h2>
        <div className="st-controls">
          <label>Days</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>7</option>
            <option value={14}>14</option>
          </select>
          <button onClick={downloadCSV}>Download CSV</button>
        </div>
      </div>

      <div className="st-note">
        {has30 ? "Data available for the last 30 days." : "Less than 30 days of data is available."}
      </div>

      {loading ? (
        <div className="st-loading">Loading…</div>
      ) : (
        <div className="st-table">
          <div className="st-row st-head">
            <div>ASIN</div>
            <div>Expected</div>
            {headers.map((h) => (
              <div key={h}>{h.slice(5)}</div>
            ))}
          </div>

          {items.map((it) => (
            <div className="st-row" key={it.asin}>
              <div className="st-cell-asin">{it.asin}</div>
              <div>{it.expected}</div>
              {it.days.map((d) => (
                <div key={d.date} className="st-cell-day" title={`${d.date}: ${d.qty}`}>
                  <span className={`st-dot ${d.status}`} />
                  <span className="st-qty">{d.qty}</span>
                </div>
              ))}
            </div>
          ))}

          {!loading && !items.length && <div className="st-empty">No sales data.</div>}
        </div>
      )}
    </div>
  );
}
