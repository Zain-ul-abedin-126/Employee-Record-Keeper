import { useState, useEffect } from "react";
import { getTodayStats, getCurrentlyIn, getEmployees } from "@/lib/storage";
import { LiveClock } from "@/components/LiveClock";

export function Dashboard() {
  const [stats, setStats] = useState(getTodayStats());
  const [currentlyIn, setCurrentlyIn] = useState(getCurrentlyIn());
  const [employees] = useState(getEmployees);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getTodayStats());
      setCurrentlyIn(getCurrentlyIn());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: "Total Employees",
      value: stats.total,
      color: "from-blue-500 to-blue-600",
      icon: "👥",
    },
    {
      label: "Present Today",
      value: stats.present,
      color: "from-green-500 to-green-600",
      icon: "✓",
    },
    {
      label: "Late Today",
      value: stats.late,
      color: "from-yellow-500 to-yellow-600",
      icon: "⚠",
    },
    {
      label: "Absent Today",
      value: stats.absent,
      color: "from-red-500 to-red-600",
      icon: "✗",
    },
    {
      label: "Currently In Office",
      value: stats.currentlyIn,
      color: "from-purple-500 to-purple-600",
      icon: "🏢",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time attendance overview</p>
        </div>
        <LiveClock />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} rounded-xl p-5 text-white shadow-lg`}
          >
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm opacity-80 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Currently In Office ({currentlyIn.length})
          </h2>
          {currentlyIn.length === 0 ? (
            <div className="text-slate-400 text-center py-8">No employees currently in office</div>
          ) : (
            <div className="space-y-3">
              {currentlyIn.map(({ employee, record }) => (
                <div key={employee.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{employee.name}</div>
                    <div className="text-slate-400 text-sm">{employee.department} · {employee.designation}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm font-medium">In since</div>
                    <div className="text-white text-sm font-bold">{record.timeIn}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Today's Attendance Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: "Present", value: stats.present, total: employees.length, color: "bg-green-500" },
              { label: "Late", value: stats.late, total: employees.length, color: "bg-yellow-500" },
              { label: "Absent", value: stats.absent, total: employees.length, color: "bg-red-500" },
            ].map(({ label, value, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{label}</span>
                  <span className="text-white font-medium">{value} / {total}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700">
            <h3 className="text-slate-300 text-sm font-medium mb-3">All Employees Status</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {employees.map((emp) => {
                const inOffice = currentlyIn.find((c) => c.employee.id === emp.id);
                return (
                  <div key={emp.id} className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{emp.name}</span>
                    {inOffice ? (
                      <span className="text-green-400 text-xs bg-green-500/20 px-2 py-0.5 rounded-full">IN</span>
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
