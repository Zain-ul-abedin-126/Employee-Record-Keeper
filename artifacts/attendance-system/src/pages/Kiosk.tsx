import { useState, useEffect } from "react";
import { getEmployees, getTodayRecord, timeIn, timeOut, Employee, AttendanceRecord } from "@/lib/storage";

function LiveKioskClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const hours = time.getHours() % 12 || 12;
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const day = time.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="text-center mb-8">
      <div className="text-6xl font-bold text-white font-mono tracking-wider">
        {hours}:{minutes}:{seconds} <span className="text-3xl text-blue-300">{ampm}</span>
      </div>
      <div className="text-blue-200 text-lg mt-2">{day}</div>
    </div>
  );
}

type KioskState = "select" | "checkin" | "checkout" | "success-in" | "success-out";

export function Kiosk() {
  const [employees] = useState<Employee[]>(getEmployees);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [kioskState, setKioskState] = useState<KioskState>("select");
  const [lastRecord, setLastRecord] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState("");

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    const record = getTodayRecord(emp.employeeId);
    setTodayRecord(record);
    setError("");
    if (record && record.timeIn && record.timeOut) {
      setKioskState("success-out");
      setLastRecord(record);
    } else if (record && record.timeIn) {
      setKioskState("checkout");
    } else {
      setKioskState("checkin");
    }
  };

  const handleTimeIn = () => {
    if (!selectedEmployee) return;
    const record = timeIn(selectedEmployee.employeeId);
    setLastRecord(record);
    setKioskState("success-in");
    setTimeout(() => resetKiosk(), 5000);
  };

  const handleTimeOut = () => {
    if (!selectedEmployee) return;
    const record = timeOut(selectedEmployee.employeeId);
    if (record) {
      setLastRecord(record);
      setKioskState("success-out");
      setTimeout(() => resetKiosk(), 5000);
    } else {
      setError("Could not record time out. Please try again.");
    }
  };

  const resetKiosk = () => {
    setSelectedEmployee(null);
    setTodayRecord(null);
    setSearch("");
    setLastRecord(null);
    setKioskState("select");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex flex-col items-center justify-center p-6">
      <LiveKioskClock />

      {kioskState === "select" && (
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-white text-center mb-2">Employee Check-In / Check-Out</h1>
          <p className="text-blue-200 text-center mb-8">Search your name or enter your Employee ID</p>

          <input
            type="text"
            placeholder="Search by name, Employee ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-4 rounded-xl text-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4 backdrop-blur-sm"
            autoFocus
          />

          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {filteredEmployees.length === 0 && (
              <div className="text-white/60 text-center py-8">No employees found</div>
            )}
            {filteredEmployees.map((emp) => {
              const record = getTodayRecord(emp.employeeId);
              const isIn = record && record.timeIn && !record.timeOut;
              const isDone = record && record.timeIn && record.timeOut;
              return (
                <button
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white text-lg">{emp.name}</div>
                      <div className="text-blue-200 text-sm">{emp.employeeId} · {emp.department} · {emp.designation}</div>
                    </div>
                  </div>
                  <div>
                    {isDone && <span className="bg-green-500/20 border border-green-500/40 text-green-300 text-sm px-3 py-1 rounded-full">Done</span>}
                    {isIn && <span className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm px-3 py-1 rounded-full">Checked In</span>}
                    {!record && <span className="bg-slate-500/20 border border-slate-500/40 text-slate-300 text-sm px-3 py-1 rounded-full">Not Checked In</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(kioskState === "checkin" || kioskState === "checkout") && selectedEmployee && (
        <div className="w-full max-w-lg text-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
              {selectedEmployee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <h2 className="text-3xl font-bold text-white">{selectedEmployee.name}</h2>
            <p className="text-blue-200 mt-1">{selectedEmployee.employeeId} · {selectedEmployee.department} · {selectedEmployee.designation}</p>

            {kioskState === "checkout" && todayRecord && (
              <div className="mt-4 bg-blue-500/20 border border-blue-500/40 rounded-lg p-3">
                <p className="text-blue-200 text-sm">Checked in at</p>
                <p className="text-white font-bold text-xl">{todayRecord.timeIn}</p>
              </div>
            )}
          </div>

          {error && <div className="text-red-300 mb-4 bg-red-500/20 border border-red-500/40 rounded-lg p-3">{error}</div>}

          <div className="flex gap-4">
            <button
              onClick={resetKiosk}
              className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-lg font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            {kioskState === "checkin" ? (
              <button
                onClick={handleTimeIn}
                className="flex-1 py-4 rounded-xl bg-green-500 hover:bg-green-400 text-white text-lg font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
              >
                Time In
              </button>
            ) : (
              <button
                onClick={handleTimeOut}
                className="flex-1 py-4 rounded-xl bg-red-500 hover:bg-red-400 text-white text-lg font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
              >
                Time Out
              </button>
            )}
          </div>
        </div>
      )}

      {kioskState === "success-in" && selectedEmployee && lastRecord && (
        <div className="w-full max-w-lg text-center">
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/40 rounded-2xl p-10">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome, {selectedEmployee.name}!</h2>
            <p className="text-green-200 text-lg">Checked in successfully</p>
            <div className="mt-6 bg-white/10 rounded-xl p-4">
              <div className="text-green-200 text-sm">Time In</div>
              <div className="text-white font-bold text-3xl">{lastRecord.timeIn}</div>
              <div className="text-green-300 mt-2 capitalize font-semibold">
                Status: {lastRecord.status === "present" ? "✓ Present" : "⚠ Late"}
              </div>
            </div>
            <p className="text-green-200/60 mt-6 text-sm">This screen will reset in 5 seconds...</p>
          </div>
        </div>
      )}

      {kioskState === "success-out" && selectedEmployee && lastRecord && (
        <div className="w-full max-w-lg text-center">
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/40 rounded-2xl p-10">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-3xl font-bold text-white mb-2">Goodbye, {selectedEmployee.name}!</h2>
            <p className="text-blue-200 text-lg">Checked out successfully</p>
            <div className="mt-6 bg-white/10 rounded-xl p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-blue-200 text-sm">Time In</div>
                <div className="text-white font-bold text-xl">{lastRecord.timeIn}</div>
              </div>
              <div>
                <div className="text-blue-200 text-sm">Time Out</div>
                <div className="text-white font-bold text-xl">{lastRecord.timeOut}</div>
              </div>
              <div className="col-span-2">
                <div className="text-blue-200 text-sm">Total Hours Worked</div>
                <div className="text-white font-bold text-3xl">{lastRecord.totalHours?.toFixed(2)} hrs</div>
              </div>
            </div>
            {!lastRecord.timeOut && (
              <p className="text-blue-200/60 mt-4 text-sm">You have already completed your check-in and check-out for today.</p>
            )}
            {lastRecord.timeOut && (
              <p className="text-blue-200/60 mt-6 text-sm">This screen will reset in 5 seconds...</p>
            )}
            {!lastRecord.timeOut && (
              <button onClick={resetKiosk} className="mt-6 px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-semibold transition-all">
                Back
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
