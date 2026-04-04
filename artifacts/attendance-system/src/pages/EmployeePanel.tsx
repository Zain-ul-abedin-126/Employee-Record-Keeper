import { useState, useEffect } from "react";
import { getEmployees, getAttendance, getTodayRecord, doTimeIn, doTimeOut, Employee, AttendanceRecord, formatDate } from "@/lib/storage";

function StatusBadge({ status, flag }: { status: string; flag?: string | null }) {
  if (status === "present") return <span className="bg-green-500/20 border border-green-500/40 text-green-300 text-xs px-2.5 py-1 rounded-full font-semibold">On Time</span>;
  if (status === "late") return <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs px-2.5 py-1 rounded-full font-semibold">Late</span>;
  if (status === "halfDay") return <span className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs px-2.5 py-1 rounded-full font-semibold">Half Day</span>;
  if (status === "absent") return <span className="bg-slate-500/20 border border-slate-500/40 text-slate-300 text-xs px-2.5 py-1 rounded-full font-semibold">Absent</span>;
  return null;
}

function FlagBadge({ flag }: { flag?: string | null }) {
  if (flag === "earlyExit") return <span className="bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs px-2 py-0.5 rounded-full">Early Exit</span>;
  if (flag === "missingTimeout") return <span className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs px-2 py-0.5 rounded-full">Missing Timeout</span>;
  return null;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const h = time.getHours() % 12 || 12;
  const m = time.getMinutes().toString().padStart(2, "0");
  const s = time.getSeconds().toString().padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const date = time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="text-center">
      <div className="text-4xl font-black text-white font-mono tracking-wider">{h}:{m}:{s} <span className="text-xl text-blue-400">{ampm}</span></div>
      <div className="text-slate-400 text-sm mt-1">{date}</div>
    </div>
  );
}

interface EmployeePanelProps {
  employeeId: string;
  onLogout: () => void;
}

export function EmployeePanel({ employeeId, onLogout }: EmployeePanelProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refresh = () => {
    const employees = getEmployees();
    const emp = employees.find((e) => e.employeeId === employeeId) || null;
    setEmployee(emp);
    setTodayRecord(getTodayRecord(employeeId));
    const all = getAttendance().filter((r) => r.employeeId === employeeId);
    const sorted = all.sort((a, b) => {
      const [da, ma, ya] = a.date.split("/");
      const [db, mb, yb] = b.date.split("/");
      return new Date(`${yb}-${mb}-${db}`).getTime() - new Date(`${ya}-${ma}-${da}`).getTime();
    });
    setHistory(sorted.slice(0, 30));
  };

  useEffect(() => { refresh(); }, [employeeId]);

  const handleTimeIn = () => {
    if (todayRecord?.timeIn) { showToast("You have already checked in today.", "error"); return; }
    doTimeIn(employeeId);
    refresh();
    showToast("Time In recorded successfully!");
  };

  const handleTimeOut = () => {
    if (!todayRecord?.timeIn) { showToast("Please Time In first.", "error"); return; }
    if (todayRecord?.timeOut) { showToast("You have already checked out today.", "error"); return; }
    doTimeOut(employeeId);
    refresh();
    showToast("Time Out recorded successfully!");
  };

  const initials = employee?.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Top Header */}
      <header className="bg-[#0f172a] border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#1e3a5f"/>
              <path d="M8 28 Q14 20 24 20 Q34 20 40 28" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M6 28 L42 28 Q42 34 36 34 L12 34 Q6 34 6 28Z" fill="#1e40af"/>
              <path d="M14 28 L16 22 Q17 20 20 20 L28 20 Q31 20 32 22 L34 28" fill="#2563eb"/>
              <circle cx="15" cy="34" r="3.5" fill="#93c5fd" stroke="#1e3a5f" strokeWidth="1"/>
              <circle cx="33" cy="34" r="3.5" fill="#93c5fd" stroke="#1e3a5f" strokeWidth="1"/>
            </svg>
            <span className="text-white font-black tracking-widest text-lg">CARROZA</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">{initials}</div>
            <div className="text-right hidden sm:block">
              <div className="text-white text-sm font-semibold">{employee?.name}</div>
              <div className="text-slate-400 text-xs">{employee?.employeeId} · {employee?.department}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/40 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Clock */}
        <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-8">
          <LiveClock />
        </div>

        {/* Today's Status */}
        <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Today's Attendance</h2>

          {todayRecord?.timeIn && todayRecord?.timeOut ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center mb-5">
              <div className="text-green-400 text-2xl mb-1">✓</div>
              <p className="text-green-300 font-semibold">Attendance Complete for Today</p>
              <div className="flex justify-center gap-6 mt-3">
                <div><div className="text-slate-400 text-xs">Time In</div><div className="text-white font-bold">{todayRecord.timeIn}</div></div>
                <div><div className="text-slate-400 text-xs">Time Out</div><div className="text-white font-bold">{todayRecord.timeOut}</div></div>
                <div><div className="text-slate-400 text-xs">Hours</div><div className="text-white font-bold">{todayRecord.totalHours?.toFixed(2)}h</div></div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <StatusBadge status={todayRecord.status} />
                <FlagBadge flag={todayRecord.flag} />
              </div>
            </div>
          ) : todayRecord?.timeIn ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-5 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-blue-300 font-medium">You are currently checked in</p>
                <p className="text-slate-400 text-sm">Checked in at <span className="text-white font-semibold">{todayRecord.timeIn}</span></p>
              </div>
              <div className="ml-auto"><StatusBadge status={todayRecord.status} /></div>
            </div>
          ) : (
            <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4 mb-5">
              <p className="text-slate-400 text-sm text-center">You have not checked in yet today</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleTimeIn}
              disabled={!!todayRecord?.timeIn}
              className={`py-5 rounded-xl font-bold text-xl transition-all duration-200 ${
                todayRecord?.timeIn
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-green-600/30"
              }`}
            >
              TIME IN
            </button>
            <button
              onClick={handleTimeOut}
              disabled={!todayRecord?.timeIn || !!todayRecord?.timeOut}
              className={`py-5 rounded-xl font-bold text-xl transition-all duration-200 ${
                !todayRecord?.timeIn || !!todayRecord?.timeOut
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
              }`}
            >
              TIME OUT
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            On Time: before 10:30 AM · Late: 10:30–10:59 AM · Half Day: 11:00 AM+
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-[#0f172a] border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-700">
            <h2 className="text-white font-bold text-lg">Attendance History (Last 30 Days)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Time In</th>
                  <th className="px-4 py-3 text-left font-medium">Time Out</th>
                  <th className="px-4 py-3 text-left font-medium">Hours</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {history.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No attendance records found</td></tr>
                ) : (
                  history.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{r.date}</td>
                      <td className="px-4 py-3 text-white">{r.timeIn || <span className="text-slate-500">-</span>}</td>
                      <td className="px-4 py-3 text-white">{r.timeOut || <span className="text-slate-500">-</span>}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{r.totalHours !== null ? `${r.totalHours.toFixed(1)}h` : "-"}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3"><FlagBadge flag={r.flag} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
