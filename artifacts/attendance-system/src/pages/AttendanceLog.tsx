import { useState, useMemo } from "react";
import { getAttendance, getEmployees, exportToCSV } from "@/lib/storage";

const DEPARTMENTS = ["All", "HR", "Finance", "IT", "Admin", "Sales", "Marketing", "Operations", "Legal"];
const STATUSES = ["All", "present", "late", "absent"];

export function AttendanceLog() {
  const [employees] = useState(getEmployees);
  const [attendance] = useState(getAttendance);

  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = useMemo(() => {
    return attendance.filter((r) => {
      const emp = employees.find((e) => e.employeeId === r.employeeId);
      if (!emp) return false;

      if (filterDate) {
        const [year, month, day] = filterDate.split("-");
        const dateStr = `${day}/${month}/${year}`;
        if (r.date !== dateStr) return false;
      }

      if (filterEmployee !== "All" && r.employeeId !== filterEmployee) return false;
      if (filterDepartment !== "All" && emp.department !== filterDepartment) return false;
      if (filterStatus !== "All" && r.status !== filterStatus) return false;

      return true;
    }).sort((a, b) => {
      const [da, ma, ya] = a.date.split("/");
      const [db, mb, yb] = b.date.split("/");
      const dateA = new Date(`${ya}-${ma}-${da}`);
      const dateB = new Date(`${yb}-${mb}-${db}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [attendance, employees, filterDate, filterEmployee, filterDepartment, filterStatus]);

  const statusBadge = (status: string) => {
    if (status === "present") return <span className="bg-green-500/20 border border-green-500/30 text-green-300 text-xs px-2 py-0.5 rounded-full">Present</span>;
    if (status === "late") return <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs px-2 py-0.5 rounded-full">Late</span>;
    return <span className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs px-2 py-0.5 rounded-full">Absent</span>;
  };

  const clearFilters = () => {
    setFilterDate("");
    setFilterEmployee("All");
    setFilterDepartment("All");
    setFilterStatus("All");
  };

  const handleExport = () => {
    exportToCSV(filtered, employees);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance Log</h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} records found</p>
        </div>
        <button
          onClick={handleExport}
          className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Employee</label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="All">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.employeeId}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={clearFilters}
          className="mt-3 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50 text-slate-300 text-sm">
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Time In</th>
                <th className="px-4 py-3 text-left font-medium">Time Out</th>
                <th className="px-4 py-3 text-left font-medium">Total Hours</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const emp = employees.find((e) => e.employeeId === record.employeeId);
                  return (
                    <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {emp?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{emp?.name || "Unknown"}</div>
                            <div className="text-slate-400 text-xs">{record.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-300 text-sm">{emp?.department}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm font-mono">{record.date}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{record.timeIn || "-"}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{record.timeOut || "-"}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm font-mono">
                        {record.totalHours !== null ? `${record.totalHours.toFixed(2)}h` : "-"}
                      </td>
                      <td className="px-4 py-3">{statusBadge(record.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
