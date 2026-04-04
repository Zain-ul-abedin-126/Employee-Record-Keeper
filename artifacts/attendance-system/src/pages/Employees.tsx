import { useState } from "react";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, Employee } from "@/lib/storage";

const DEPARTMENTS = ["IT", "Finance", "Operations", "Sales", "HR", "Marketing", "Admin", "Legal"];

interface Toast { msg: string; type: "success" | "error" }

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const show = (msg: string, type: Toast["type"] = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

interface EmployeeFormProps {
  initial?: Employee;
  onSave: (data: Omit<Employee, "id">) => void;
  onCancel: () => void;
}

function EmployeeForm({ initial, onSave, onCancel }: EmployeeFormProps) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    department: initial?.department || "",
    designation: initial?.designation || "",
    employeeId: initial?.employeeId || "",
    password: "",
    status: (initial?.status || "active") as "active" | "inactive",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.department || !form.designation || !form.employeeId) {
      setError("All fields except password are required.");
      return;
    }
    const existing = getEmployees().find((e) => e.employeeId === form.employeeId && e.id !== initial?.id);
    if (existing) { setError("Employee ID already exists."); return; }

    onSave({
      name: form.name,
      department: form.department,
      designation: form.designation,
      employeeId: form.employeeId,
      password: form.password || initial?.password || "123456",
      status: form.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/15 border border-red-500/30 text-red-300 rounded-lg p-3 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Full Name *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-sm" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Employee ID *</label>
          <input type="text" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value.toUpperCase() })} placeholder="e.g. ZUA01" disabled={!!initial} className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Department *</label>
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Designation *</label>
          <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Job title" className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-sm" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">
            {initial ? "Reset Password" : "Password *"}
            {initial && <span className="text-slate-500 text-xs ml-1">(leave blank to keep current)</span>}
          </label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={initial ? "New password (optional)" : "Default: 123456"} className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-sm" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg font-medium transition-colors text-sm">Cancel</button>
        <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm">{initial ? "Save Changes" : "Add Employee"}</button>
      </div>
    </form>
  );
}

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(getEmployees);
  const [showAdd, setShowAdd] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { toast, show: showToast } = useToast();

  const refresh = () => setEmployees(getEmployees());

  const handleAdd = (data: Omit<Employee, "id">) => {
    addEmployee(data);
    refresh();
    setShowAdd(false);
    showToast("Employee added successfully!");
  };

  const handleEdit = (data: Omit<Employee, "id">) => {
    if (!editingEmployee) return;
    updateEmployee({ ...editingEmployee, ...data });
    refresh();
    setEditingEmployee(null);
    showToast("Employee updated successfully!");
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    refresh();
    setDeleteConfirm(null);
    showToast("Employee removed.", "error");
  };

  const handleToggleStatus = (emp: Employee) => {
    updateEmployee({ ...emp, status: emp.status === "active" ? "inactive" : "active" });
    refresh();
    showToast(`Employee ${emp.status === "active" ? "deactivated" : "activated"}.`);
  };

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-slate-400 text-sm mt-0.5">{employees.filter((e) => e.status === "active").length} active · {employees.length} total</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditingEmployee(null); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition-colors">
          + Add Employee
        </button>
      </div>

      {(showAdd || editingEmployee) && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">{editingEmployee ? `Edit: ${editingEmployee.name}` : "Add New Employee"}</h2>
          <EmployeeForm initial={editingEmployee || undefined} onSave={editingEmployee ? handleEdit : handleAdd} onCancel={() => { setShowAdd(false); setEditingEmployee(null); }} />
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <input type="text" placeholder="Search by name, ID, department..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/30 text-slate-400 text-xs">
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Designation</th>
                <th className="px-4 py-3 text-left font-medium">Password</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No employees found</td></tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className={`hover:bg-slate-700/20 transition-colors ${emp.status === "inactive" ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs font-bold">{emp.employeeId}</td>
                    <td className="px-4 py-3"><span className="bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs px-2 py-0.5 rounded-full">{emp.department}</span></td>
                    <td className="px-4 py-3 text-slate-300">{emp.designation}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono tracking-widest text-xs">••••••</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${emp.status === "active" ? "bg-green-500/15 text-green-300 border border-green-500/25" : "bg-slate-600/30 text-slate-400 border border-slate-600"}`}>
                        {emp.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {deleteConfirm === emp.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-slate-400 text-xs">Confirm delete?</span>
                          <button onClick={() => handleDelete(emp.id)} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors">Delete</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs rounded-lg transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditingEmployee(emp); setShowAdd(false); }} className="px-2.5 py-1 border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs rounded-lg transition-colors">Edit</button>
                          <button onClick={() => handleToggleStatus(emp)} className={`px-2.5 py-1 border text-xs rounded-lg transition-colors ${emp.status === "active" ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}>
                            {emp.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => setDeleteConfirm(emp.id)} className="px-2.5 py-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs rounded-lg transition-colors">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
