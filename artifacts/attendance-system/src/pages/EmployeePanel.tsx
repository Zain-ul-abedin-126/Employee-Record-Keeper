import { useState, useEffect } from "react";
import { getEmployees, getAttendance, getTodayRecord, doTimeIn, doTimeOut, Employee, AttendanceRecord } from "@/lib/storage";
import carrozaLogo from "@assets/image_1775295887823.png";

function StatusBadge({ status }: { status: string }) {
  if (status === "present") return <span className="bg-green-500/15 border border-green-500/25 text-green-400 text-xs px-2.5 py-1 rounded-full font-semibold">On Time</span>;
  if (status === "late") return <span className="bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs px-2.5 py-1 rounded-full font-semibold">Late</span>;
  if (status === "halfDay") return <span className="bg-red-500/15 border border-red-500/25 text-red-400 text-xs px-2.5 py-1 rounded-full font-semibold">Half Day</span>;
  if (status === "absent") return <span className="bg-zinc-700/40 border border-zinc-700 text-zinc-400 text-xs px-2.5 py-1 rounded-full font-semibold">Absent</span>;
  return null;
}

function FlagBadge({ flag }: { flag?: string | null }) {
  if (flag === "earlyExit") return <span className="bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs px-2 py-0.5 rounded-full">Early Exit</span>;
  if (flag === "missingTimeout") return <span className="bg-red-500/15 border border-red-500/25 text-red-400 text-xs px-2 py-0.5 rounded-full">Missing Timeout</span>;
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
      <div className="text-4xl font-black text-white font-mono tracking-wider">{h}:{m}:{s} <span className="text-xl text-zinc-500">{ampm}</span></div>
      <div className="text-zinc-500 text-sm mt-1">{date}</div>
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
    <div className="min-h-screen bg-black">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg transition-all ${toast.type === "success" ? "bg-green-700" : "bg-red-700"}`}>
          {toast.msg}
        </div>
      )}

      {/* Top Header */}
      <header className="bg-[#111111] border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={carrozaLogo} alt="CARROZA" style={{ width: 90, filter: "brightness(1.05)" }} className="object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-xs">{initials}</div>
            <div className="text-right hidden sm:block">
              <div className="text-white text-sm font-semibold">{employee?.name}</div>
              <div className="text-zinc-500 text-xs">{employee?.employeeId} · {employee?.department}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-500/40 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Clock */}
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-8">
          <LiveClock />
        </div>

        {/* Today's Status */}
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Today's Attendance</h2>

          {todayRecord?.timeIn && todayRecord?.timeOut ? (
            <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-5 text-center mb-5">
              <div className="text-green-400 text-2xl mb-1">✓</div>
              <p className="text-green-300 font-semibold">Attendance Complete for Today</p>
              <div className="flex justify-center gap-6 mt-3">
                <div><div className="text-zinc-500 text-xs">Time In</div><div className="text-white font-bold">{todayRecord.timeIn}</div></div>
                <div><div className="text-zinc-500 text-xs">Time Out</div><div className="text-white font-bold">{todayRecord.timeOut}</div></div>
                <div><div className="text-zinc-500 text-xs">Hours</div><div className="text-white font-bold">{todayRecord.totalHours?.toFixed(2)}h</div></div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <StatusBadge status={todayRecord.status} />
                <FlagBadge flag={todayRecord.flag} />
              </div>
            </div>
          ) : todayRecord?.timeIn ? (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-5 flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-white font-medium">You are currently checked in</p>
                <p className="text-zinc-500 text-sm">Checked in at <span className="text-white font-semibold">{todayRecord.timeIn}</span></p>
              </div>
              <div className="ml-auto"><StatusBadge status={todayRecord.status} /></div>
            </div>
          ) : (
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 mb-5">
              <p className="text-zinc-500 text-sm text-center">You have not checked in yet today</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleTimeIn}
              disabled={!!todayRecord?.timeIn}
              className={`py-5 rounded-xl font-bold text-xl transition-all duration-200 ${
                todayRecord?.timeIn
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-600 text-white hover:scale-105 active:scale-95"
              }`}
            >
              TIME IN
            </button>
            <button
              onClick={handleTimeOut}
              disabled={!todayRecord?.timeIn || !!todayRecord?.timeOut}
              className={`py-5 rounded-xl font-bold text-xl transition-all duration-200 ${
                !todayRecord?.timeIn || !!todayRecord?.timeOut
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-600 text-white hover:scale-105 active:scale-95"
              }`}
            >
              TIME OUT
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-zinc-700">
            On Time: before 10:30 AM · Late: 10:30–10:59 AM · Half Day: 11:00 AM+
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="text-white font-bold text-lg">Attendance History (Last 30 Days)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-800/50 text-zinc-500 text-xs">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Time In</th>
                  <th className="px-4 py-3 text-left font-medium">Time Out</th>
                  <th className="px-4 py-3 text-left font-medium">Hours</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {history.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-600">No attendance records found</td></tr>
                ) : (
                  history.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{r.date}</td>
                      <td className="px-4 py-3 text-white">{r.timeIn || <span className="text-zinc-600">-</span>}</td>
                      <td className="px-4 py-3 text-white">{r.timeOut || <span className="text-zinc-600">-</span>}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono">{r.totalHours !== null ? `${r.totalHours.toFixed(1)}h` : "-"}</td>
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
