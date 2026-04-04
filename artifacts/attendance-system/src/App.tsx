import { useState, useEffect } from "react";
import { initializeData, getSession, setSession, clearSession, AuthSession, getAdminPassword, setAdminPassword } from "@/lib/storage";
import carrozaLogo from "@assets/image_1775295887823.png";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Employees } from "@/pages/Employees";
import { AttendanceLog } from "@/pages/AttendanceLog";
import { Reports } from "@/pages/Reports";
import { EmployeePanel } from "@/pages/EmployeePanel";

type AdminPage = "dashboard" | "employees" | "attendance" | "reports" | "settings";

const ADMIN_NAV: { id: AdminPage; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "employees", label: "Employees", icon: "👥" },
  { id: "attendance", label: "Attendance Log", icon: "📋" },
  { id: "reports", label: "Monthly Report", icon: "📅" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

function CarrozaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const width = size === "sm" ? 110 : size === "md" ? 150 : 200;
  return (
    <div className="flex flex-col items-start">
      <img src={carrozaLogo} alt="CARROZA" style={{ width, filter: "brightness(1.1) drop-shadow(0 0 4px rgba(200,200,200,0.15))" }} className="object-contain" />
      {size !== "sm" && <div className="text-zinc-500 text-[9px] tracking-[0.25em] uppercase mt-0.5 pl-0.5">Attendance Management</div>}
    </div>
  );
}

function AdminSettings() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPwd !== getAdminPassword()) { setMsg({ text: "Current password is incorrect.", type: "error" }); return; }
    if (newPwd.length < 6) { setMsg({ text: "New password must be at least 6 characters.", type: "error" }); return; }
    if (newPwd !== confirmPwd) { setMsg({ text: "Passwords do not match.", type: "error" }); return; }
    setAdminPassword(newPwd);
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    setMsg({ text: "Admin password changed successfully.", type: "success" });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
      <p className="text-zinc-500 text-sm mb-6">Manage admin password</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-4">Change Admin Password</h2>
        {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === "success" ? "bg-green-500/15 border border-green-500/30 text-green-300" : "bg-red-500/15 border border-red-500/30 text-red-300"}`}>{msg.text}</div>}
        <form onSubmit={handleChange} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm font-medium mb-1.5">Current Password</label>
            <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm font-medium mb-1.5">New Password</label>
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min. 6 characters" className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm placeholder-zinc-600" />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm font-medium mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold text-sm transition-colors">Update Password</button>
        </form>
        <div className="mt-4 pt-4 border-t border-zinc-800 text-zinc-600 text-xs">
          Admin password is never displayed anywhere in the system.
        </div>
      </div>
    </div>
  );
}

function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-zinc-800 flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-zinc-800">
          <CarrozaLogo size="sm" />
          <div className="mt-3 px-1">
            <span className="text-xs text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full font-semibold">Admin Mode</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm transition-all ${
                currentPage === item.id
                  ? "bg-zinc-700 text-white font-semibold"
                  : "text-zinc-500 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
          <div className="text-zinc-800 text-[10px] text-center mt-3">CARROZA v2.0 · Admin</div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-[#111111] border-b border-zinc-800 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            ☰
          </button>
          <CarrozaLogo size="sm" />
        </header>

        <main className="flex-1 overflow-auto">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "employees" && <Employees />}
          {currentPage === "attendance" && <AttendanceLog />}
          {currentPage === "reports" && <Reports />}
          {currentPage === "settings" && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const existing = getSession();
    setSessionState(existing);
    setLoading(false);
  }, []);

  const handleLogin = (s: AuthSession) => {
    setSession(s);
    setSessionState(s);
  };

  const handleLogout = () => {
    clearSession();
    setSessionState(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  if (session.role === "admin") {
    return <AdminLayout onLogout={handleLogout} />;
  }

  if (session.role === "employee" && session.employeeId) {
    return <EmployeePanel employeeId={session.employeeId} onLogout={handleLogout} />;
  }

  return <Login onLogin={handleLogin} />;
}

export default App;
