import { useState, useMemo } from "react";
import { getAttendance, getEmployees, Employee, AttendanceRecord } from "@/lib/storage";

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

function formatDateStr(day: number, month: number, year: number): string {
  return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`;
}

function getCellColor(status: string | "weekend" | null): string {
  if (status === "weekend") return "bg-slate-700/30 text-slate-500";
  if (status === "present") return "bg-green-500/20 text-green-300 border border-green-500/30";
  if (status === "late") return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
  if (status === "absent") return "bg-red-500/20 text-red-300 border border-red-500/30";
  return "bg-slate-700/20 text-slate-500";
}

function getCellLabel(status: string | "weekend" | null): string {
  if (status === "weekend") return "";
  if (status === "present") return "P";
  if (status === "late") return "L";
  if (status === "absent") return "A";
  return "";
}

export function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("All");

  const [employees] = useState<Employee[]>(getEmployees);
  const [attendance] = useState<AttendanceRecord[]>(getAttendance);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filteredEmployees = selectedEmployee === "All" ? employees : employees.filter((e) => e.id === selectedEmployee);

  const getStatus = useMemo(() => {
    const map: Record<string, Record<number, string | "weekend" | null>> = {};

    filteredEmployees.forEach((emp) => {
      map[emp.id] = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = getDayOfWeek(year, month, day);
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          map[emp.id][day] = "weekend";
        } else {
          const dateStr = formatDateStr(day, month, year);
          const record = attendance.find((r) => r.employeeId === emp.employeeId && r.date === dateStr);
          map[emp.id][day] = record ? record.status : null;
        }
      }
    });

    return map;
  }, [filteredEmployees, attendance, year, month, daysInMonth]);

  const getSummary = (empId: string) => {
    const statuses = Object.values(getStatus[empId] || {});
    return {
      present: statuses.filter((s) => s === "present").length,
      late: statuses.filter((s) => s === "late").length,
      absent: statuses.filter((s) => s === "absent").length,
    };
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monthly Report</h1>
          <p className="text-slate-400 text-sm mt-1">Attendance calendar view</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="All">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            ← Prev
          </button>
          <h2 className="text-lg font-bold text-white">{months[month]} {year}</h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            Next →
          </button>
        </div>

        <div className="flex gap-4 text-xs mb-4 flex-wrap">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500/30 border border-green-500/40 rounded"></div><span className="text-slate-300">Present (P)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-500/30 border border-yellow-500/40 rounded"></div><span className="text-slate-300">Late (L)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500/30 border border-red-500/40 rounded"></div><span className="text-slate-300">Absent (A)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-700/50 rounded"></div><span className="text-slate-300">Weekend</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-700/20 rounded"></div><span className="text-slate-300">No Data</span></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-slate-300 font-medium sticky left-0 bg-slate-800 border-b border-slate-700 min-w-[160px]">Employee</th>
                {days.map((d) => {
                  const dow = getDayOfWeek(year, month, d);
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <th
                      key={d}
                      className={`px-1 py-2 text-center font-medium border-b border-slate-700 min-w-[28px] ${isWeekend ? "text-slate-600" : "text-slate-300"}`}
                    >
                      <div>{d}</div>
                      <div className="text-[10px] opacity-60">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][dow]}
                      </div>
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-slate-300 font-medium border-b border-slate-700 min-w-[100px] text-center">Summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const summary = getSummary(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-3 py-2 sticky left-0 bg-slate-800 border-b border-slate-700/50">
                      <div className="text-white font-medium">{emp.name}</div>
                      <div className="text-slate-400 text-[10px]">{emp.department}</div>
                    </td>
                    {days.map((d) => {
                      const status = getStatus[emp.id]?.[d] ?? null;
                      return (
                        <td key={d} className="px-0.5 py-1 border-b border-slate-700/50 text-center">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold mx-auto ${getCellColor(status)}`}>
                            {getCellLabel(status)}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 border-b border-slate-700/50 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px]">
                        <span className="text-green-400 font-bold">{summary.present}P</span>
                        <span className="text-yellow-400 font-bold">{summary.late}L</span>
                        <span className="text-red-400 font-bold">{summary.absent}A</span>
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
