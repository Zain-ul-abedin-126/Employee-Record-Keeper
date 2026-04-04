import { useState, useMemo } from "react";
import { getAttendance, getEmployees, Employee, AttendanceRecord } from "@/lib/storage";

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

function fmtDate(day: number, month: number, year: number): string {
  return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`;
}

function getCellStyle(status: string | "weekend" | null): string {
  if (status === "weekend") return "bg-slate-700/20 text-slate-600";
  if (status === "present") return "bg-green-500/25 text-green-300 border border-green-500/30";
  if (status === "late") return "bg-amber-500/25 text-amber-300 border border-amber-500/30";
  if (status === "halfDay") return "bg-orange-500/25 text-orange-300 border border-orange-500/30";
  if (status === "absent") return "bg-red-500/25 text-red-300 border border-red-500/30";
  return "bg-slate-800/30 text-slate-700";
}

function getCellLabel(status: string | "weekend" | null): string {
  if (status === "weekend") return "";
  if (status === "present") return "P";
  if (status === "late") return "L";
  if (status === "halfDay") return "H";
  if (status === "absent") return "A";
  return "";
}

export function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedEmployee, setSelectedEmployee] = useState("All");

  const [employees] = useState<Employee[]>(getEmployees);
  const [attendance] = useState<AttendanceRecord[]>(getAttendance);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const filteredEmployees = selectedEmployee === "All" ? employees.filter((e) => e.status === "active") : employees.filter((e) => e.id === selectedEmployee);

  const statusMap = useMemo(() => {
    const map: Record<string, Record<number, string | "weekend" | null>> = {};
    filteredEmployees.forEach((emp) => {
      map[emp.id] = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const dow = getDayOfWeek(year, month, day);
        if (dow === 0 || dow === 6) { map[emp.id][day] = "weekend"; continue; }
        const dateStr = fmtDate(day, month, year);
        const rec = attendance.find((r) => r.employeeId === emp.employeeId && r.date === dateStr);
        map[emp.id][day] = rec ? rec.status : null;
      }
    });
    return map;
  }, [filteredEmployees, attendance, year, month, daysInMonth]);

  const getSummary = (empId: string) => {
    const vals = Object.values(statusMap[empId] || {});
    return {
      present: vals.filter((s) => s === "present").length,
      late: vals.filter((s) => s === "late").length,
      halfDay: vals.filter((s) => s === "halfDay").length,
      absent: vals.filter((s) => s === "absent").length,
    };
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly Report</h1>
          <p className="text-slate-400 text-sm mt-0.5">Attendance calendar view</p>
        </div>
        <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
          <option value="All">All Active Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="px-3 py-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm">← Prev</button>
          <h2 className="text-white font-bold">{months[month]} {year}</h2>
          <button onClick={nextMonth} className="px-3 py-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm">Next →</button>
        </div>

        <div className="flex gap-4 text-xs mb-4 flex-wrap">
          {[["bg-green-500/30 border-green-500/40", "P – On Time"], ["bg-amber-500/30 border-amber-500/40", "L – Late"], ["bg-orange-500/30 border-orange-500/40", "H – Half Day"], ["bg-red-500/30 border-red-500/40", "A – Absent"], ["bg-slate-700/40", "Weekend"]].map(([cls, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${cls}`}></div>
              <span className="text-slate-300">{label}</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-slate-400 font-medium sticky left-0 bg-slate-800 border-b border-slate-700 min-w-[160px]">Employee</th>
                {days.map((d) => {
                  const dow = getDayOfWeek(year, month, d);
                  const isWknd = dow === 0 || dow === 6;
                  return (
                    <th key={d} className={`px-0.5 py-2 text-center font-medium border-b border-slate-700 min-w-[28px] ${isWknd ? "text-slate-600" : "text-slate-400"}`}>
                      <div>{d}</div>
                      <div className="text-[9px] opacity-60">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][dow]}</div>
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-slate-400 font-medium border-b border-slate-700 min-w-[110px] text-center">Summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const s = getSummary(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-3 py-2 sticky left-0 bg-slate-800 border-b border-slate-700/50">
                      <div className="text-white font-medium truncate">{emp.name}</div>
                      <div className="text-slate-500 text-[10px]">{emp.department}</div>
                    </td>
                    {days.map((d) => {
                      const status = statusMap[emp.id]?.[d] ?? null;
                      return (
                        <td key={d} className="px-0.5 py-1 border-b border-slate-700/40 text-center">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold mx-auto ${getCellStyle(status)}`}>
                            {getCellLabel(status)}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 border-b border-slate-700/50 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] flex-wrap">
                        <span className="text-green-400 font-bold">{s.present}P</span>
                        <span className="text-amber-400 font-bold">{s.late}L</span>
                        <span className="text-orange-400 font-bold">{s.halfDay}H</span>
                        <span className="text-red-400 font-bold">{s.absent}A</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
