export type AttendanceStatus = "present" | "late" | "halfDay" | "absent";
export type EarlyExitFlag = "earlyExit" | "missingTimeout" | null;

export interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  employeeId: string;
  password: string;
  status: "active" | "inactive";
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: number | null;
  status: AttendanceStatus;
  flag: EarlyExitFlag;
  note: string;
}

export interface AuthSession {
  role: "admin" | "employee";
  employeeId?: string;
}

const EMPLOYEES_KEY = "carroza_employees";
const ATTENDANCE_KEY = "carroza_attendance";
const INITIALIZED_KEY = "carroza_initialized_v2";
const ADMIN_PASSWORD_KEY = "carroza_admin_password";

export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseTime12h(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.trim().split(" ");
  const ampm = parts[1];
  let [hours, minutes] = parts[0].split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

export function calcHoursDiff(timeIn: string, timeOut: string): number {
  const inTime = parseTime12h(timeIn);
  const outTime = parseTime12h(timeOut);
  const inMinutes = inTime.hours * 60 + inTime.minutes;
  const outMinutes = outTime.hours * 60 + outTime.minutes;
  const diff = outMinutes - inMinutes;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

export function calcAttendanceStatus(timeIn: string): AttendanceStatus {
  const { hours, minutes } = parseTime12h(timeIn);
  const totalMinutes = hours * 60 + minutes;
  const onTimeCutoff = 10 * 60 + 30; // 10:30 AM
  const halfDayCutoff = 11 * 60; // 11:00 AM
  if (totalMinutes < onTimeCutoff) return "present";
  if (totalMinutes < halfDayCutoff) return "late";
  return "halfDay";
}

export function calcEarlyExitFlag(timeOut: string | null): EarlyExitFlag {
  if (!timeOut) return "missingTimeout";
  const { hours, minutes } = parseTime12h(timeOut);
  const totalMinutes = hours * 60 + minutes;
  const standardOut = 19 * 60; // 7:00 PM
  if (totalMinutes < standardOut) return "earlyExit";
  return null;
}

const CARROZA_EMPLOYEES: Employee[] = [
  { id: "1", name: "ZainUl Abedin", department: "IT", designation: "CSR & IT Executive", employeeId: "ZUA01", password: "123456", status: "active" },
  { id: "2", name: "Syed Ali Naqi Mashadi", department: "Finance", designation: "Account Manager", employeeId: "SAN02", password: "123456", status: "active" },
  { id: "3", name: "Salman Lashari", department: "Operations", designation: "Prep Incharge", employeeId: "SL03", password: "123456", status: "active" },
  { id: "4", name: "Khan", department: "Operations", designation: "Prep Master", employeeId: "K04", password: "123456", status: "active" },
  { id: "5", name: "Zain Bhatti", department: "Sales", designation: "Merchandiser", employeeId: "ZB05", password: "123456", status: "active" },
  { id: "6", name: "Azeem", department: "Sales", designation: "Sales Man", employeeId: "AZ06", password: "123456", status: "active" },
];

function generateDemoAttendance(employees: Employee[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  for (let dayOffset = 20; dayOffset >= 1; dayOffset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    const dateStr = formatDate(date);

    employees.forEach((emp, idx) => {
      const rng = Math.random();
      if (rng < 0.08) {
        records.push({ id: `${emp.employeeId}-${dateStr}`, employeeId: emp.employeeId, date: dateStr, timeIn: null, timeOut: null, totalHours: null, status: "absent", flag: null, note: "" });
        return;
      }
      let inHour: number, inMin: number;
      if (idx % 3 === 0 && dayOffset % 3 === 0) { inHour = 11; inMin = Math.floor(Math.random() * 30); }
      else if (idx % 2 === 0 && dayOffset % 2 === 0) { inHour = 10; inMin = 30 + Math.floor(Math.random() * 29); }
      else { inHour = 8 + Math.floor(Math.random() * 2); inMin = Math.floor(Math.random() * 59); }

      const inDate = new Date(date);
      inDate.setHours(inHour, inMin, 0, 0);
      const timeIn = formatTime(inDate);
      const status = calcAttendanceStatus(timeIn);

      const outHour = 18 + Math.floor(Math.random() * 3);
      const outMin = Math.floor(Math.random() * 59);
      const outDate = new Date(date);
      outDate.setHours(outHour, outMin, 0, 0);
      const timeOut = formatTime(outDate);
      const flag = calcEarlyExitFlag(timeOut);

      records.push({ id: `${emp.employeeId}-${dateStr}`, employeeId: emp.employeeId, date: dateStr, timeIn, timeOut, totalHours: calcHoursDiff(timeIn, timeOut), status, flag, note: "" });
    });
  }
  return records;
}

export function initializeData(): void {
  if (localStorage.getItem(INITIALIZED_KEY)) return;
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(CARROZA_EMPLOYEES));
  const attendance = generateDemoAttendance(CARROZA_EMPLOYEES);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));
  localStorage.setItem(ADMIN_PASSWORD_KEY, "admin123");
  localStorage.setItem(INITIALIZED_KEY, "true");
}

export function getAdminPassword(): string {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || "admin123";
}

export function setAdminPassword(pwd: string): void {
  localStorage.setItem(ADMIN_PASSWORD_KEY, pwd);
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
  if (idx !== -1) { employees[idx] = updated; saveEmployees(employees); }
}

export function deleteEmployee(id: string): void {
  saveEmployees(getEmployees().filter((e) => e.id !== id));
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
  return getAttendance().find((r) => r.employeeId === employeeId && r.date === today) || null;
}

export function doTimeIn(employeeId: string): AttendanceRecord {
  const now = new Date();
  const timeStr = formatTime(now);
  const dateStr = formatDate(now);
  const records = getAttendance();
  const existing = records.find((r) => r.employeeId === employeeId && r.date === dateStr);
  if (existing) return existing;
  const record: AttendanceRecord = {
    id: `${employeeId}-${dateStr}`,
    employeeId, date: dateStr, timeIn: timeStr, timeOut: null,
    totalHours: null, status: calcAttendanceStatus(timeStr), flag: "missingTimeout", note: "",
  };
  records.push(record);
  saveAttendance(records);
  return record;
}

export function doTimeOut(employeeId: string): AttendanceRecord | null {
  const today = formatDate(new Date());
  const timeStr = formatTime(new Date());
  const records = getAttendance();
  const idx = records.findIndex((r) => r.employeeId === employeeId && r.date === today);
  if (idx === -1) return null;
  const record = records[idx];
  if (!record.timeIn) return null;
  records[idx] = { ...record, timeOut: timeStr, totalHours: calcHoursDiff(record.timeIn, timeStr), flag: calcEarlyExitFlag(timeStr) };
  saveAttendance(records);
  return records[idx];
}

export function updateAttendanceRecord(record: AttendanceRecord): void {
  const records = getAttendance();
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx !== -1) { records[idx] = record; saveAttendance(records); }
  else { records.push(record); saveAttendance(records); }
}

export function getTodayStats() {
  const employees = getEmployees().filter((e) => e.status === "active");
  const today = formatDate(new Date());
  const records = getAttendance().filter((r) => r.date === today);
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const halfDay = records.filter((r) => r.status === "halfDay").length;
  const checkedIn = records.filter((r) => r.timeIn && !r.timeOut).length;
  const totalChecked = present + late + halfDay;
  const absent = Math.max(0, employees.length - totalChecked);
  return { total: employees.length, present, late, halfDay, absent, currentlyIn: checkedIn };
}

export function getCurrentlyIn(): Array<{ employee: Employee; record: AttendanceRecord }> {
  const today = formatDate(new Date());
  const employees = getEmployees();
  const records = getAttendance().filter((r) => r.date === today && r.timeIn && !r.timeOut);
  return records.map((r) => ({ employee: employees.find((e) => e.employeeId === r.employeeId)!, record: r })).filter((x) => x.employee);
}

export function exportToCSV(records: AttendanceRecord[], employees: Employee[]): void {
  const headers = ["Employee Name", "Employee ID", "Department", "Date", "Time In", "Time Out", "Total Hours", "Status", "Flag", "Note"];
  const rows = records.map((r) => {
    const emp = employees.find((e) => e.employeeId === r.employeeId);
    return [emp?.name || "Unknown", r.employeeId, emp?.department || "", r.date, r.timeIn || "-", r.timeOut || "-", r.totalHours !== null ? r.totalHours.toFixed(2) : "-", r.status, r.flag || "-", r.note || ""];
  });
  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "carroza_attendance.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function getSession(): AuthSession | null {
  const data = sessionStorage.getItem("carroza_session");
  return data ? JSON.parse(data) : null;
}

export function setSession(session: AuthSession): void {
  sessionStorage.setItem("carroza_session", JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem("carroza_session");
}

export function loginAdmin(password: string): boolean {
  return password === getAdminPassword();
}

export function loginEmployee(employeeId: string, password: string): Employee | null {
  const employees = getEmployees();
  const emp = employees.find((e) => e.employeeId === employeeId && e.password === password && e.status === "active");
  return emp || null;
}
