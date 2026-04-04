import { useState } from "react";
import { loginAdmin, loginEmployee, setSession, AuthSession } from "@/lib/storage";
import carrozaLogo from "@assets/image_1775295887823.png";

interface LoginProps {
  onLogin: (session: AuthSession) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [tab, setTab] = useState<"admin" | "employee">("employee");
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emp = loginEmployee(empId.trim().toUpperCase(), password);
    if (emp) {
      const session: AuthSession = { role: "employee", employeeId: emp.employeeId };
      setSession(session);
      onLogin(session);
    } else {
      setError("Invalid Employee ID or password. Contact Admin if you need help.");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (loginAdmin(adminPassword)) {
      const session: AuthSession = { role: "admin" };
      setSession(session);
      onLogin(session);
    } else {
      setError("Incorrect admin password.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* CARROZA Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-2">
            <img
              src={carrozaLogo}
              alt="CARROZA"
              style={{ width: 240, filter: "brightness(1.1) drop-shadow(0 0 12px rgba(200,200,200,0.15))" }}
              className="object-contain"
            />
          </div>
          <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Attendance Management</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#111111] border border-zinc-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab("employee"); setError(""); setShowForgot(false); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "employee" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"}`}
          >
            Employee Login
          </button>
          <button
            onClick={() => { setTab("admin"); setError(""); setShowForgot(false); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "admin" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-white"}`}
          >
            Admin Login
          </button>
        </div>

        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {showForgot ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto text-2xl">🔑</div>
              <h3 className="text-white font-bold text-lg">Forgot Password?</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {tab === "admin"
                  ? "Please contact the system owner to reset the admin password."
                  : "Please contact your Admin to reset your password. Your Admin can reset it from the Employee Management panel."}
              </p>
              <button
                onClick={() => setShowForgot(false)}
                className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
              >
                ← Back to login
              </button>
            </div>
          ) : tab === "employee" ? (
            <form onSubmit={handleEmployeeLogin} className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Welcome Back</h2>
                <p className="text-zinc-500 text-sm">Sign in with your Employee ID</p>
              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-zinc-400 text-sm font-medium mb-1.5">Employee ID</label>
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="e.g. ZUA01"
                  autoFocus
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder-zinc-600 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder-zinc-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Sign In
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Admin Access</h2>
                <p className="text-zinc-500 text-sm">Full system access</p>
              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-zinc-400 text-sm font-medium mb-1.5">Admin Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder-zinc-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Admin Login
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-zinc-800 text-xs text-center mt-6">
          © 2026 CARROZA · Attendance Management System
        </p>
      </div>
    </div>
  );
}
