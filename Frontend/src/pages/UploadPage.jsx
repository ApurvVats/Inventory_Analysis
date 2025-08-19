import { useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { route } from "../route";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import React from "react";
export default function UploadPage() {
  const { pathname } = useLocation();

  // Determine upload mode from URL
  const mode = useMemo(() => {
    if (pathname.includes("/marketing/upload")) return "marketing";
    if (pathname.includes("/sales/upload")) return "sales";
    if (pathname.includes("/inventory/upload-vendor"))
      return "inventory_vendor";
    if (pathname.includes("/inventory/upload")) return "inventory";
    return "inventory";
  }, [pathname]);

  // Configure per-mode labels and endpoints
  const cfg = useMemo(() => {
    switch (mode) {
      case "sales":
        return {
          title: "Upload sales report",
          postUrl: "/sales/upload", // basic upload; can switch to /sales/preview then /sales/import-mapped later
          typeFilter: "sales",
          accept: ".csv,.xlsx,.xls",
          dateLabels: { start: "Date start", end: "Date end" },
        };
      case "inventory_vendor":
        return {
          title: "Upload vendor report",
          postUrl: "/inventory/upload-vendor",
          typeFilter: "inventory_vendor",
          accept: ".csv,.xlsx,.xls",
          dateLabels: { start: "Date start", end: "Date end" },
        };
      case "marketing":
        return {
          title: "Upload marketing report",
          postUrl: "/marketing/upload",
          typeFilter: "marketing",
          accept: ".csv,.xlsx,.xls",
          dateLabels: { start: "Date start", end: "Date end" },
        };
      case "inventory":
      default:
        return {
          title: "Upload inventory report",
          postUrl: "/inventory/upload",
          typeFilter: "inventory",
          accept: ".csv,.xlsx,.xls",
          dateLabels: { start: "Date start", end: "Date end" },
        };
    }
  }, [mode]);

  const [dateStart, setStart] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [dateEnd, setEnd] = useState(
    dayjs().endOf("month").format("YYYY-MM-DD")
  );
  const [file, setFile] = useState(null);
  const [mine, setMine] = useState([]);
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Choose a CSV/Excel file");
    const form = new FormData();
    form.append("file", file);
    form.append("dateStart", dateStart);
    form.append("dateEnd", dateEnd);
    try {
      await route.post(cfg.postUrl, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Upload successful");
      setFile(null);
      await refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Upload failed");
    }
  };

  const refresh = async () => {
    const { data } = await route.get("/upload/mine");
    // Only show uploads of the active type in this screen
    setMine((data.uploads || []).filter((u) => u.type === cfg.typeFilter));
  };

  useEffect(() => {
    // Reset dates when switching tab to avoid confusion between modes
    setStart(dayjs().startOf("month").format("YYYY-MM-DD"));
    setEnd(dayjs().endOf("month").format("YYYY-MM-DD"));
    setFile(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div>
      <h2>{cfg.title}</h2>
      <form onSubmit={onSubmit} className="upload-form">
        <label>{cfg.dateLabels.start}</label>
        <input
          type="date"
          value={dateStart}
          onChange={(e) => setStart(e.target.value)}
        />

        <label>{cfg.dateLabels.end}</label>
        <input
          type="date"
          value={dateEnd}
          onChange={(e) => setEnd(e.target.value)}
        />

        <label>CSV/Excel file</label>
        <input
          type="file"
          accept={cfg.accept}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button>Upload</button>
      </form>
      <h3>Your uploads</h3>
      <ul>
        {mine.map((u) => (
          <li key={u.id}>
            {" "}
            {/* <-- ADD THIS KEY PROP */}
            {u.type} | {new Date(u.createdAt).toLocaleString()} | {u.status}
          </li>
        ))}
        {!mine.length && <li>No uploads yet.</li>}
      </ul>
    </div>
  );
}
