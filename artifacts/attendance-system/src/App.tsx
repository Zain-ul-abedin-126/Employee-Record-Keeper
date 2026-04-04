import { useState, useEffect } from "react";
import { initializeData } from "@/lib/storage";
import { Kiosk } from "@/pages/Kiosk";
import { Dashboard } from "@/pages/Dashboard";
import { Employees } from "@/pages/Employees";
import { AttendanceLog } from "@/pages/AttendanceLog";
import { Reports } from "@/pages/Reports";
import { AdminLogin } from "@/pages/AdminLogin";

type Page = "kiosk" | "dashboard" | "employees" | "attendance" | "reports";

const NAV_ITEMS: { id: Page; label: string; icon: string; adminOnly?: boolean }[] = [
  { id: "kiosk", label: "Kiosk", icon: "🖥" },
  { id: "dashboard", label: "Dashboard", icon: "📊", adminOnly: true },
  { id: "employees", label: "Employees", icon: "👥", adminOnly: true },
  { id: "attendance", label: "Attendance Log", icon: "📋", adminOnly: true },
  { id: "reports", label: "Reports", icon: "📅", adminOnly: true },
];

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("kiosk");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingPage, setPendingPage] = useState<Page | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initializeData();
    const auth = sessionStorage.getItem("admin_authenticated") === "true";
    setIsAuthenticated(auth);
  }, []);

  const handleNavClick = (page: Page) => {
    const item = NAV_ITEMS.find((n) => n.id === page);
    if (item?.adminOnly && !isAuthenticated) {
      setPendingPage(page);
      setShowLoginPrompt(true);
    } else {
      setCurrentPage(page);
    }
    setSidebarOpen(false);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowLoginPrompt(false);
    if (pendingPage) {
      setCurrentPage(pendingPage);
      setPendingPage(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
    setCurrentPage("kiosk");
  };

  if (showLoginPrompt) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  if (currentPage === "kiosk") {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-lg text-white transition-colors"
            title="Open menu"
          >
            ☰
          </button>
          {isAuthenticated && (
            <span className="text-white/60 text-xs bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded">Admin</span>
          )}
        </div>

        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-700 z-50 flex flex-col">
              <div className="p-6 border-b border-slate-700">
                <h1 className="text-lg font-bold text-white">EMS</h1>
                <p className="text-slate-400 text-xs mt-0.5">Attendance System</p>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-left"
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.adminOnly && !isAuthenticated && (
                      <span className="ml-auto text-slate-500 text-xs">🔒</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}

        <Kiosk />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white">EMS</h1>
          <p className="text-slate-400 text-xs mt-0.5">Employee Attendance System</p>
          {isAuthenticated && (
            <span className="inline-block mt-2 text-xs text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded">
              Admin Mode
            </span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-left ${
                currentPage === item.id
                  ? "bg-blue-500 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <span>🚪</span>
              <span>Logout Admin</span>
            </button>
          )}
          <div className="text-slate-600 text-xs text-center">
            Employee Attendance System v1.0
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            ☰
          </button>
          <span className="text-white font-semibold">
            {NAV_ITEMS.find((n) => n.id === currentPage)?.label}
          </span>
        </header>

        <main className="flex-1 overflow-auto">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "employees" && <Employees />}
          {currentPage === "attendance" && <AttendanceLog />}
          {currentPage === "reports" && <Reports />}
        </main>
      </div>
    </div>
  );
}

export default App;
