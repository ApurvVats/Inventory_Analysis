import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Layout.css";
import { useSelector, useDispatch } from "react-redux";
import { logoutThunk } from "../store/slices/authSlice";
import { connectSocket, disconnectSocket } from "../socket";
export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(() => {
    try {
      const raw = sessionStorage.getItem("nav_open_groups");
      return raw
        ? JSON.parse(raw)
        : { inventory: true, sales: true, marketing: true, demand: true };
    } catch {
      return { inventory: true, sales: true, marketing: true, demand: true };
    }
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
useEffect(() => {
    if (user) {
      connectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [user]); 
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  useEffect(() => {
    sessionStorage.setItem("nav_open_groups", JSON.stringify(open));
  }, [open]);

  useEffect(() => {
    if (pathname.startsWith("/inventory")) {
      setOpen((s) => ({ ...s, inventory: true }));
      if (collapsed) setCollapsed(false);
    } else if (pathname.startsWith("/sales")) {
      setOpen((s) => ({ ...s, sales: true }));
      if (collapsed) setCollapsed(false);
    } else if (pathname.startsWith("/marketing")) {
      setOpen((s) => ({ ...s, marketing: true }));
      if (collapsed) setCollapsed(false);
    } else if (pathname.startsWith("/demand")) {
      setOpen((s) => ({ ...s, demand: true }));
      if (collapsed) setCollapsed(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!user) {
    return <div>Loading User...</div>;
  }

  return (
    <div className={`sh-app ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="sh-sidebar">
        <div className="sh-sb-header">
          <button
            className="sh-hamburger"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle menu"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="sh-brand">Reports</div>
        </div>

        <nav className="sh-nav">
          <button
            type="button"
            className={`sh-group ${open.inventory ? "is-open" : ""}`}
            onClick={() => {
              if (collapsed) setCollapsed(false);
              setOpen((s) => ({ ...s, inventory: !s.inventory }));
            }}
            aria-expanded={open.inventory}
          >
            <span className="sh-ico">📦</span>
            <span className="sh-label">Inventory</span>
            <span className="sh-caret" aria-hidden>
              {open.inventory ? "▾" : "▸"}
            </span>
          </button>
          <div className={`sh-sub ${open.inventory ? "is-open" : ""}`}>
            <NavLink to="/inventory/upload" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">⬆️</span>
              <span className="sh-label">Upload Inventory</span>
            </NavLink>
            <NavLink to="/inventory/upload-vendor" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">🏭</span>
              <span className="sh-label">Upload Vendor Report</span>
            </NavLink>
            <NavLink to="/inventory/view" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">📊</span>
              <span className="sh-label">View Report</span>
            </NavLink>
            <NavLink to="/inventory/analysis" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">🧠</span>
              <span className="sh-label">Inventory Analysis</span>
            </NavLink>
          </div>

          <button
            type="button"
            className={`sh-group ${open.sales ? "is-open" : ""}`}
            onClick={() => {
              if (collapsed) setCollapsed(false);
              setOpen((s) => ({ ...s, sales: !s.sales }));
            }}
            aria-expanded={open.sales}
          >
            <span className="sh-ico">🛒</span>
            <span className="sh-label">Sales</span>
            <span className="sh-caret" aria-hidden>
              {open.sales ? "▾" : "▸"}
            </span>
          </button>
          <div className={`sh-sub ${open.sales ? "is-open" : ""}`}>
            <NavLink to="/sales/upload" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">🧾</span>
              <span className="sh-label">Upload Sales</span>
            </NavLink>
            <NavLink to="/sales/daily-trend" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">📅</span>
              <span className="sh-label">Daily Sales Performance</span>
            </NavLink>
            <NavLink to="/sales/analysis" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">📈</span>
              <span className="sh-label">Sales Analysis</span>
            </NavLink>
          </div>

          <button
            type="button"
            className={`sh-group ${open.marketing ? "is-open" : ""}`}
            onClick={() => {
              if (collapsed) setCollapsed(false);
              setOpen((s) => ({ ...s, marketing: !s.marketing }));
            }}
            aria-expanded={open.marketing}
          >
            <span className="sh-ico">📣</span>
            <span className="sh-label">Marketing</span>
            <span className="sh-caret" aria-hidden>
              {open.marketing ? "▾" : "▸"}
            </span>
          </button>
          <div className={`sh-sub ${open.marketing ? "is-open" : ""}`}>
            <NavLink to="/marketing/variations" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">🧬</span>
              <span className="sh-label">Manage Variations</span>
            </NavLink>
            <NavLink to="/marketing/upload" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">🗂️</span>
              <span className="sh-label">Upload Report</span>
            </NavLink>
            <NavLink to="/marketing/weekly" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">📅</span>
              <span className="sh-label">Weekly Report</span>
            </NavLink>
            <NavLink to="/marketing/stats" className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}>
              <span className="sh-ico">📊</span>
              <span className="sh-label">Account Stats</span>
            </NavLink>
          </div>

          <button
            type="button"
            className={`sh-group ${open.demand ? "is-open" : ""}`}
            onClick={() => {
              if (collapsed) setCollapsed(false);
              setOpen((s) => ({ ...s, demand: !s.demand }));
            }}
            aria-expanded={open.demand}
          >
            <span className="sh-ico">💡</span>
            <span className="sh-label">Demand Analysis</span>
            <span className="sh-caret" aria-hidden>
              {open.demand ? "▾" : "▸"}
            </span>
          </button>
          <div className={`sh-sub ${open.demand ? "is-open" : ""}`}>
            <NavLink
              to="/demand/explore"
              className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}
            >
              <span className="sh-ico">🔍</span>
              <span className="sh-label">Explore Categories</span>
            </NavLink>
            <NavLink
              to="/demand/reports"
              className={({ isActive }) => `sh-link ${isActive ? "is-active" : ""}`}
            >
              <span className="sh-ico">📋</span>
              <span className="sh-label">Manage Reports</span>
            </NavLink>
          </div>
        </nav>
      </aside>

      <div className="sh-main-content-wrapper">
        <header className="sh-top-header">
          <div className="sh-top-header-left" />
          <div className="sh-top-header-right">
            <div className="sh-user-menu">
              <button onClick={() => setMenuOpen(!menuOpen)} className="sh-user-button">
                <div className="sh-user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="sh-user-name">{user.username}</span>
                <svg className={`sh-menu-caret ${menuOpen ? 'is-open' : ''}`} width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="m7 10l5 5l5-5z"/></svg>
              </button>
              {menuOpen && (
                <div className="sh-dropdown-menu">
                  <div className="sh-dropdown-header">
                    Signed in as <strong>{user.username}</strong>
                  </div>
                  <button onClick={handleLogout} className="sh-dropdown-item">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="sh-content">
          <Outlet />
        </main>
      </div>

      <aside className="sh-chat">
        <div className="sh-chat-h">Chatbot</div>
        <div className="sh-chat-b">
          <div className="sh-msg">Hi! Ask me about your reports.</div>
        </div>
        <form
          className="sh-chat-f"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            className="sh-chat-in"
            placeholder="Ask a question..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
              }
            }}
          />
          <button className="sh-chat-send" type="submit" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l14-7-4 14-3-5-7-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </aside>
    </div>
  );
}
