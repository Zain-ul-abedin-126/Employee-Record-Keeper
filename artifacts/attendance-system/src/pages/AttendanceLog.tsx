import { useState, useMemo } from "react";
import { getAttendance, getEmployees, exportToCSV, updateAttendanceRecord, AttendanceRecord, Employee, calcAttendanceStatus, calcEarlyExitFlag, calcHoursDiff } from "@/lib/storage";

function StatusBadge({ status }: { status: string }) {
  if (status === "present") return <span className="bg-green-500/15 border border-green-500/25 text-green-400 text-xs px-2 py-0.5 rounded-full">On Time</span>;
  if (status === "late") return <span className="bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs px-2 py-0.5 rounded-full">Late</span>;
  if (status === "halfDay") return <span className="bg-red-500/15 border border-red-500/25 text-red-400 text-xs px-2 py-0.5 rounded-full">Half Day</span>;
  if (status === "absent") return <span className="bg-zinc-700/40 border border-zinc-700 text-zinc-500 text-xs px-2 py-0.5 rounded-full">Absent</span>;
  return null;
}

function FlagBadge({ flag }: { flag?: string | null }) {
  if (flag === "earlyExit") return <span className="bg-orange-500/15 border border-orange-500/25 text-orange-400 text-xs px-1.5 py-0.5 rounded-full">Early Exit</span>;
  if (flag === "missingTimeout") return <span className="bg-red-400/15 border border-red-400/25 text-red-400 text-xs px-1.5 py-0.5 rounded-full">Missing T/O</span>;
  return null;
}

interface EditModalProps {
  record: AttendanceRecord;
  employee: Employee | undefined;
  onSave: (updated: AttendanceRecord) => void;
  onCancel: () => void;
}

function EditModal({ record, employee, onSave, onCancel }: EditModalProps) {
  const [form, setForm] = useState({
    timeIn: record.timeIn || "",
    timeOut: record.timeOut || "",
    status: record.status,
    note: record.note || "",
  });

  const handleSave = () => {
    const updatedStatus = form.timeIn ? calcAttendanceStatus(form.timeIn) : "absent";
    const updatedFlag = form.timeIn ? calcEarlyExitFlag(form.timeOut || null) : null;
    const updatedHours = (form.timeIn && form.timeOut) ? calcHoursDiff(form.timeIn, form.timeOut) : null;
    onSave({
      ...record,
      timeIn: form.timeIn || null,
      timeOut: form.timeOut || null,
      status: form.status !== record.status ? form.status : updatedStatus,
      flag: updatedFlag,
      totalHours: updatedHours,
      note: form.note,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-1">Edit Attendance Record</h3>
        <p className="text-zinc-500 text-sm mb-5">{employee?.name} · {record.date}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 text-xs font-medium mb-1">Time In (e.g. 9:30 AM)</label>
              <input type="text" value={form.timeIn} onChange={(e) => setForm({ ...form, timeIn: e.target.value })} placeholder="9:00 AM" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder-zinc-600" />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs font-medium mb-1">Time Out (e.g. 7:00 PM)</label>
              <input type="text" value={form.timeOut} onChange={(e) => setForm({ ...form, timeOut: e.target.value })} placeholder="7:00 PM" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder-zinc-600" />
            </div>
          </div>
          <div>
            <label className="block text-zinc-500 text-xs font-medium mb-1">Override Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceRecord["status"] })} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500">
              <option value="present">On Time (Present)</option>
              <option value="late">Late</option>
              <option value="halfDay">Half Day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div>
            <label className="block text-zinc-500 text-xs font-medium mb-1">Admin Note</label>
            <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note..." className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 placeholder-zinc-600" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-bold transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

const STATUSES = ["All", "present", "late", "halfDay", "absent"];
const STATUS_LABELS: Record<string, string> = { All: "All Statuses", present: "On Time", late: "Late", halfDay: "Half Day", absent: "Absent" };

export function AttendanceLog() {
  const [employees] = useState(getEmployees);
  const [attendance, setAttendance] = useState(getAttendance);
  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refresh = () => setAttendance(getAttendance());

  const filtered = useMemo(() => {
    return attendance.filter((r) => {
      const emp = employees.find((e) => e.employeeId === r.employeeId);
      if (!emp) return false;
      if (filterDate) {
        const [year, month, day] = filterDate.split("-");
        if (r.date !== `${day}/${month}/${year}`) return false;
      }
      if (filterEmployee !== "All" && r.employeeId !== filterEmployee) return false;
      if (filterStatus !== "All" && r.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => {
      const [da, ma, ya] = a.date.split("/");
      const [db, mb, yb] = b.date.split("/");
      return new Date(`${yb}-${mb}-${db}`).getTime() - new Date(`${ya}-${ma}-${da}`).getTime();
    });
  }, [attendance, employees, filterDate, filterEmployee, filterStatus]);

  const handleMarkAbsent = (employeeId: string) => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, "0");
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const year = today.getFullYear();
    const dateStr = `${day}/${month}/${year}`;
    const id = `${employeeId}-${dateStr}`;
    const records = getAttendance();
    const existing = records.find((r) => r.id === id);
    if (existing) { showToast("Record already exists for today.", "error"); return; }
    updateAttendanceRecord({ id, employeeId, date: dateStr, timeIn: null, timeOut: null, totalHours: null, status: "absent", flag: null, note: "Marked absent by admin" });
    refresh();
    showToast("Marked as absent.");
  };

  const handleSaveEdit = (updated: AttendanceRecord) => {
    updateAttendanceRecord(updated);
    refresh();
    setEditingRecord(null);
    showToast("Record updated successfully!");
  };

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-700" : "bg-red-700"}`}>
          {toast.msg}
        </div>
      )}

      {editingRecord && (
        <EditModal
          record={editingRecord}
          employee={employees.find((e) => e.employeeId === editingRecord.employeeId)}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRecord(null)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance Log</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{filtered.length} records</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportToCSV(filtered, employees)}
            className="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-zinc-500 text-xs font-medium mb-1.5">Date</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm" />
          </div>
          <div>
            <label className="block text-zinc-500 text-xs font-medium mb-1.5">Employee</label>
            <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm">
              <option value="All">All Employees</option>
              {employees.map((e) => <option key={e.id} value={e.employeeId}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-zinc-500 text-xs font-medium mb-1.5">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFilterDate(""); setFilterEmployee("All"); setFilterStatus("All"); }} className="w-full py-2 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 rounded-lg text-sm transition-colors">Clear Filters</button>
          </div>
        </div>
      </div>

      {/* Mark Absent */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-zinc-400 text-sm font-semibold mb-3">Mark Absent Today</h3>
        <div className="flex flex-wrap gap-2">
          {employees.filter((e) => e.status === "active").map((emp) => (
            <button key={emp.id} onClick={() => handleMarkAbsent(emp.employeeId)} className="px-3 py-1.5 border border-red-500/25 text-red-500 hover:bg-red-500/10 rounded-lg text-xs transition-colors">
              {emp.name} ({emp.employeeId})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-500 text-xs">
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Time In</th>
                <th className="px-4 py-3 text-left font-medium">Time Out</th>
                <th className="px-4 py-3 text-left font-medium">Hours</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Flag</th>
                <th className="px-4 py-3 text-left font-medium">Note</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-600">No records found</td></tr>
              ) : (
                filtered.map((record) => {
                  const emp = employees.find((e) => e.employeeId === record.employeeId);
                  return (
                    <tr key={record.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {emp?.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div className="text-white text-xs font-medium">{emp?.name || "Unknown"}</div>
                            <div className="text-zinc-600 text-xs">{record.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{record.date}</td>
                      <td className="px-4 py-3 text-white text-sm">{record.timeIn || <span className="text-zinc-600">-</span>}</td>
                      <td className="px-4 py-3 text-white text-sm">{record.timeOut || <span className="text-zinc-600">-</span>}</td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{record.totalHours !== null ? `${record.totalHours.toFixed(1)}h` : "-"}</td>
                      <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                      <td className="px-4 py-3"><FlagBadge flag={record.flag} /></td>
                      <td className="px-4 py-3 text-zinc-600 text-xs max-w-[120px] truncate">{record.note || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditingRecord(record)} className="px-2.5 py-1 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs rounded-lg transition-colors">Edit</button>
                      </td>
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
