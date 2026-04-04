import { useState, useEffect } from "react";
import { getTodayStats, getCurrentlyIn, getEmployees } from "@/lib/storage";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);
  const h = time.getHours() % 12 || 12;
  const m = time.getMinutes().toString().padStart(2, "0");
  const s = time.getSeconds().toString().padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  return (
    <div className="text-right">
      <div className="text-2xl font-black text-white font-mono">{h}:{m}:{s} {ampm}</div>
      <div className="text-slate-400 text-xs mt-0.5">{time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState(getTodayStats());
  const [currentlyIn, setCurrentlyIn] = useState(getCurrentlyIn());
  const [employees] = useState(getEmployees);

  useEffect(() => {
    const i = setInterval(() => { setStats(getTodayStats()); setCurrentlyIn(getCurrentlyIn()); }, 5000);
    return () => clearInterval(i);
  }, []);

  const cards = [
    { label: "Total Employees", value: stats.total, color: "from-blue-700 to-blue-800", border: "border-blue-600/30", icon: "👥" },
    { label: "On Time Today", value: stats.present, color: "from-green-700 to-green-800", border: "border-green-600/30", icon: "✓" },
    { label: "Late Today", value: stats.late, color: "from-amber-700 to-amber-800", border: "border-amber-600/30", icon: "⏱" },
    { label: "Half Day", value: stats.halfDay, color: "from-orange-700 to-orange-800", border: "border-orange-600/30", icon: "½" },
    { label: "Absent Today", value: stats.absent, color: "from-red-700 to-red-800", border: "border-red-600/30", icon: "✗" },
    { label: "Currently In", value: stats.currentlyIn, color: "from-purple-700 to-purple-800", border: "border-purple-600/30", icon: "🏢" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time attendance overview</p>
        </div>
        <LiveClock />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-xl p-5 text-white shadow-lg`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-3xl font-black">{card.value}</div>
            <div className="text-xs opacity-75 mt-1 leading-tight">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>
            Currently In Office ({currentlyIn.length})
          </h2>
          {currentlyIn.length === 0 ? (
            <div className="text-slate-500 text-center py-8 text-sm">No employees currently checked in</div>
          ) : (
            <div className="space-y-3">
              {currentlyIn.map(({ employee, record }) => (
                <div key={employee.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{employee.name}</div>
                    <div className="text-slate-400 text-xs">{employee.department} · {employee.designation}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-green-400 text-xs">In since</div>
                    <div className="text-white text-sm font-bold">{record.timeIn}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Today's Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: "On Time", value: stats.present, total: stats.total, color: "bg-green-500" },
              { label: "Late", value: stats.late, total: stats.total, color: "bg-amber-500" },
              { label: "Half Day", value: stats.halfDay, total: stats.total, color: "bg-orange-500" },
              { label: "Absent", value: stats.absent, total: stats.total, color: "bg-red-500" },
            ].map(({ label, value, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span className="text-white font-semibold">{value} / {total}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">All Employees</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {employees.filter((e) => e.status === "active").map((emp) => {
                const inOffice = currentlyIn.find((c) => c.employee.id === emp.id);
                return (
                  <div key={emp.id} className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{emp.name}</span>
                    {inOffice ? (
                      <span className="text-green-400 text-xs bg-green-500/15 px-2 py-0.5 rounded-full font-semibold">IN</span>
                    ) : (
                      <span className="text-slate-500 text-xs bg-slate-700 px-2 py-0.5 rounded-full">OUT</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
