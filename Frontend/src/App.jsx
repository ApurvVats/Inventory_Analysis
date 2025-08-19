import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import React from "react";
import { setToken, meThunk } from "./store/slices/authSlice";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import InventoryView from "./pages/InventoryView";
import InventoryAnalysis from "./pages/InventoryAnalysis";
import { Toaster } from "react-hot-toast";
import SalesTrend from "./pages/SalesTrend";
import SalesAnalysis from "./pages/SalesAnalysis";
import Variations from "./pages/marketing/Variations";
import MarketingWeekly from "./pages/marketing/WeeklyReport";
import MarketingStats from "./pages/marketing/AccountStats";

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t && !token) {
      dispatch(setToken(t));
      dispatch(meThunk());
    }
  }, [dispatch, token]);

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={token ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory">
            <Route path="upload" element={<UploadPage />} />
            <Route path="upload-vendor" element={<UploadPage />} />
            <Route path="view" element={<InventoryView />} />
            <Route path="analysis" element={<InventoryAnalysis />} />
          </Route>
          <Route path="sales">
            <Route path="upload" element={<UploadPage />} />
            <Route path="daily-trend" element={<SalesTrend />} />
            <Route path="analysis" element={<SalesAnalysis />} />
          </Route>
          <Route path="marketing">
            <Route path="variations" element={<Variations />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="weekly" element={<MarketingWeekly />} />
            <Route path="stats" element={<MarketingStats />} />
          </Route>
          {/* legacy redirects */}
          <Route
            path="upload/inventory"
            element={<Navigate to="/inventory/upload" replace />}
          />
          <Route
            path="upload/marketing"
            element={<Navigate to="/marketing/upload" replace />}
          />
          <Route
            path="upload/sales"
            element={<Navigate to="/sales/upload" replace />}
          />
        </Route>
      </Routes>
    </>
  );
}
