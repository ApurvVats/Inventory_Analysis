import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import React from "react";
import { setToken, meThunk } from "./store/slices/authSlice";
import Layout from "./components/Layout";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
// --- Page Imports ---
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import InventoryView from "./pages/InventoryView";
import InventoryAnalysis from "./pages/InventoryAnalysis";
import SalesTrend from "./pages/SalesTrend";
import SalesAnalysis from "./pages/SalesAnalysis";
import Variations from "./pages/marketing/Variations";
import MarketingWeekly from "./pages/marketing/WeeklyReport";
import MarketingStats from "./pages/marketing/AccountStats";
import ExplorePage from "./pages/demand/ExplorePage";
import ManageReportsPage from "./pages/demand/ManageReportsPage";
import ReportDetailPage from "./pages/demand/ReportDetailPage";
const GOOGLE_CLIENT_ID =
  "334767179510-8bqnvirclht6st5bsd51fg9jjh2vfuvp.apps.googleusercontent.com";
// This component protects routes that ONLY unauthenticated users should see.
const PublicRoute = ({ token }) => {
  return token ? <Navigate to="/" replace /> : <Outlet />;
};
// This component protects routes that ONLY authenticated users should see.
const ProtectedRoute = ({ token }) => {
  return token ? <Layout /> : <Navigate to="/login" replace />;
};
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
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Toaster />
        <Routes>
          <Route element={<PublicRoute token={token} />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route path="/" element={<ProtectedRoute token={token} />}>
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
            <Route path="demand">
              <Route path="explore" element={<ExplorePage />} />
              <Route path="reports" element={<ManageReportsPage />} />
              <Route path="reports/:reportId" element={<ReportDetailPage />} />
            </Route>
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
      </GoogleOAuthProvider>
    </>
  );
}
