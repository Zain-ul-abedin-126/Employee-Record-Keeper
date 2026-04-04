export interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  employeeId: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: number | null;
  status: "present" | "late" | "absent";
}

const EMPLOYEES_KEY = "ems_employees";
const ATTENDANCE_KEY = "ems_attendance";
const INITIALIZED_KEY = "ems_initialized";

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseTime12h(timeStr: string): { hours: number; minutes: number } {
  const [timePart, ampm] = timeStr.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

function calcHoursDiff(timeIn: string, timeOut: string): number {
  const inTime = parseTime12h(timeIn);
  const outTime = parseTime12h(timeOut);
  const inMinutes = inTime.hours * 60 + inTime.minutes;
  const outMinutes = outTime.hours * 60 + outTime.minutes;
  const diff = outMinutes - inMinutes;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

function getStatus(timeIn: string): "present" | "late" {
  const { hours, minutes } = parseTime12h(timeIn);
  const totalMinutes = hours * 60 + minutes;
  const cutoff = 9 * 60 + 15;
  return totalMinutes <= cutoff ? "present" : "late";
}

const DEMO_EMPLOYEES: Employee[] = [
  { id: "1", name: "Ali Hassan", department: "HR", designation: "Manager", employeeId: "EMP001" },
  { id: "2", name: "Sara Khan", department: "Finance", designation: "Accountant", employeeId: "EMP002" },
  { id: "3", name: "Usman Malik", department: "IT", designation: "Developer", employeeId: "EMP003" },
  { id: "4", name: "Ayesha Raza", department: "Admin", designation: "Coordinator", employeeId: "EMP004" },
  { id: "5", name: "Bilal Ahmed", department: "Sales", designation: "Executive", employeeId: "EMP005" },
];

function generateDemoAttendance(employees: Employee[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  for (let dayOffset = 6; dayOffset >= 1; dayOffset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = formatDate(date);

    employees.forEach((emp, idx) => {
      const shouldBeAbsent = Math.random() < 0.1;
      if (shouldBeAbsent) {
        records.push({
          id: `${emp.id}-${dateStr}`,
          employeeId: emp.employeeId,
          date: dateStr,
          timeIn: null,
          timeOut: null,
          totalHours: null,
          status: "absent",
        });
        return;
      }

      const isLate = idx === 2 && dayOffset % 2 === 0;
      const inHour = isLate ? 9 : 8 + Math.floor(Math.random() * 1);
      const inMin = isLate ? 20 + Math.floor(Math.random() * 20) : Math.floor(Math.random() * 15);
      const inDate = new Date(date);
      inDate.setHours(inHour, inMin, 0, 0);
      const timeIn = formatTime(inDate);

      const outHour = 17 + Math.floor(Math.random() * 2);
      const outMin = Math.floor(Math.random() * 60);
      const outDate = new Date(date);
      outDate.setHours(outHour, outMin, 0, 0);
      const timeOut = formatTime(outDate);

      records.push({
        id: `${emp.id}-${dateStr}`,
        employeeId: emp.employeeId,
        date: dateStr,
        timeIn,
        timeOut,
        totalHours: calcHoursDiff(timeIn, timeOut),
        status: getStatus(timeIn),
      });
    });
  }

  return records;
}

export function initializeData(): void {
  if (localStorage.getItem(INITIALIZED_KEY)) return;
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(DEMO_EMPLOYEES));
  const attendance = generateDemoAttendance(DEMO_EMPLOYEES);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
  localStorage.setItem(INITIALIZED_KEY, "true");
}

export function getEmployees(): Employee[] {
  const data = localStorage.getItem(EMPLOYEES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveEmployees(employees: Employee[]): void {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

export function addEmployee(emp: Omit<Employee, "id">): Employee {
  const employees = getEmployees();
  const newEmp: Employee = { ...emp, id: Date.now().toString() };
  employees.push(newEmp);
  saveEmployees(employees);
  return newEmp;
}

export function updateEmployee(updated: Employee): void {
  const employees = getEmployees();
  const idx = employees.findIndex((e) => e.id === updated.id);
  if (idx !== -1) {
    employees[idx] = updated;
    saveEmployees(employees);
  }
}

export function deleteEmployee(id: string): void {
  const employees = getEmployees().filter((e) => e.id !== id);
  saveEmployees(employees);
}

export function getAttendance(): AttendanceRecord[] {
  const data = localStorage.getItem(ATTENDANCE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveAttendance(records: AttendanceRecord[]): void {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

export function getTodayRecord(employeeId: string): AttendanceRecord | null {
  const today = formatDate(new Date());
  const records = getAttendance();
  return records.find((r) => r.employeeId === employeeId && r.date === today) || null;
}

export function timeIn(employeeId: string): AttendanceRecord {
  const now = new Date();
  const timeStr = formatTime(now);
  const dateStr = formatDate(now);

  const records = getAttendance();
  const existing = records.find((r) => r.employeeId === employeeId && r.date === dateStr);
  if (existing) return existing;

  const record: AttendanceRecord = {
    id: `${employeeId}-${dateStr}`,
    employeeId,
    date: dateStr,
    timeIn: timeStr,
    timeOut: null,
    totalHours: null,
    status: getStatus(timeStr),
  };

  records.push(record);
  saveAttendance(records);
  return record;
}

export function timeOut(employeeId: string): AttendanceRecord | null {
  const today = formatDate(new Date());
  const now = new Date();
  const timeStr = formatTime(now);
  const records = getAttendance();
  const idx = records.findIndex((r) => r.employeeId === employeeId && r.date === today);

  if (idx === -1) return null;

  const record = records[idx];
  if (!record.timeIn) return null;

  records[idx] = {
    ...record,
    timeOut: timeStr,
    totalHours: calcHoursDiff(record.timeIn, timeStr),
  };
  saveAttendance(records);
  return records[idx];
}

export function getTodayStats() {
  const employees = getEmployees();
  const today = formatDate(new Date());
  const records = getAttendance().filter((r) => r.date === today);

  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const checkedIn = records.filter((r) => r.timeIn && !r.timeOut).length;
  const absent = employees.length - present - late;

  return {
    total: employees.length,
    present,
    late,
    absent: Math.max(0, absent),
    currentlyIn: checkedIn,
  };
}

export function getCurrentlyIn(): Array<{ employee: Employee; record: AttendanceRecord }> {
  const today = formatDate(new Date());
  const employees = getEmployees();
  const records = getAttendance().filter((r) => r.date === today && r.timeIn && !r.timeOut);

  return records.map((r) => ({
    employee: employees.find((e) => e.employeeId === r.employeeId)!,
    record: r,
  })).filter((x) => x.employee);
}

export function exportToCSV(records: AttendanceRecord[], employees: Employee[]): void {
  const headers = ["Employee Name", "Employee ID", "Department", "Date", "Time In", "Time Out", "Total Hours", "Status"];
  const rows = records.map((r) => {
    const emp = employees.find((e) => e.employeeId === r.employeeId);
    return [
      emp?.name || "Unknown",
      r.employeeId,
      emp?.department || "",
      r.date,
      r.timeIn || "-",
      r.timeOut || "-",
      r.totalHours !== null ? r.totalHours.toFixed(2) : "-",
      r.status,
    ];
  });

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance_records.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export { formatDate, formatTime };
