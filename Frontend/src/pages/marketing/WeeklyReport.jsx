import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { route } from "../../route";

export default function MarketingWeekly() {
  const [start, setStart] = useState(dayjs().subtract(7, "week").startOf("week").format("YYYY-MM-DD"));
  const [end, setEnd] = useState(dayjs().endOf("week").format("YYYY-MM-DD"));
  const [groupBy, setGroupBy] = useState("campaign");
  const [rows, setRows] = useState([]);

  const load = async () => {
    // Placeholder until backend weekly endpoint is ready
    setRows([]);
  };
  useEffect(()=>{ load(); }, [start, end, groupBy]);

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <h2>Weekly Marketing Report</h2>
        <div style={{ display:"flex", gap:8 }}>
          <label>Start</label><input type="date" value={start} onChange={e=>setStart(e.target.value)} />
          <label>End</label><input type="date" value={end} onChange={e=>setEnd(e.target.value)} />
          <label>Group</label>
          <select value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
            <option value="campaign">Campaign</option>
            <option value="variation">Variation</option>
          </select>
        </div>
      </div>
      <div>No data yet. Upload marketing report to populate.</div>
    </div>
  );
}
