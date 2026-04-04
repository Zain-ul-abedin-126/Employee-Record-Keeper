import { useState } from "react";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, Employee } from "@/lib/storage";

const DEPARTMENTS = ["HR", "Finance", "IT", "Admin", "Sales", "Marketing", "Operations", "Legal"];

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
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.department.trim() || !form.designation.trim() || !form.employeeId.trim()) {
      setError("All fields are required.");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg p-3 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. John Smith"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Employee ID</label>
          <input
            type="text"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            placeholder="e.g. EMP006"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Department</label>
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Designation</label>
          <input
            type="text"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            placeholder="e.g. Senior Developer"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          {initial ? "Save Changes" : "Add Employee"}
        </button>
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

  const refresh = () => setEmployees(getEmployees());

  const handleAdd = (data: Omit<Employee, "id">) => {
    addEmployee(data);
    refresh();
    setShowAdd(false);
  };

  const handleEdit = (data: Omit<Employee, "id">) => {
    if (!editingEmployee) return;
    updateEmployee({ ...editingEmployee, ...data });
    refresh();
    setEditingEmployee(null);
  };

  const handleDelete = (id: string) => {
    deleteEmployee(id);
    refresh();
    setDeleteConfirm(null);
  };

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-slate-400 text-sm mt-1">{employees.length} total employees</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingEmployee(null); }}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          + Add Employee
        </button>
      </div>

      {(showAdd || editingEmployee) && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingEmployee ? `Edit: ${editingEmployee.name}` : "Add New Employee"}
          </h2>
          <EmployeeForm
            initial={editingEmployee || undefined}
            onSave={editingEmployee ? handleEdit : handleAdd}
            onCancel={() => { setShowAdd(false); setEditingEmployee(null); }}
          />
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50 text-slate-300 text-sm">
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Designation</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    No employees found
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-white font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-sm">{emp.employeeId}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-full">
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{emp.designation}</td>
                    <td className="px-4 py-3 text-right">
                      {deleteConfirm === emp.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-slate-400 text-sm">Are you sure?</span>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingEmployee(emp); setShowAdd(false); }}
                            className="px-3 py-1 border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(emp.id)}
                            className="px-3 py-1 border border-red-500/40 text-red-400 hover:bg-red-500/20 text-sm rounded-lg transition-colors"
                          >
                            Delete
                          </button>
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
