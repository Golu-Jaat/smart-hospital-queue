export type AnalyticsTrendPoint = {
  date?: string;
  time?: string;
  tokens: number;
  completed: number;
};

export type AnalyticsDepartment = {
  name: string;
  value: number;
};

export type AnalyticsRecentToken = {
  id: string;
  token_number: number;
  status: string;
  patient_name: string | null;
  department_name: string | null;
  specialization: string | null;
  joined_at: string;
};

export type AdminAnalytics = {
  rangeStart: string;
  rangeEnd: string;
  generatedAt: string;
  totalPatients: number;
  totalHospitals: number;
  totalDoctors: number;
  totalDepartments: number;
  totalAppointments: number;
  totalTokens: number;
  waiting: number;
  called: number;
  completed: number;
  skipped: number;
  cancelled: number;
  avgWaitMinutes: number;
  clearanceRate: number;
  byDay: AnalyticsTrendPoint[];
  byHour: AnalyticsTrendPoint[];
  byDepartment: AnalyticsDepartment[];
  recentTokens: AnalyticsRecentToken[];
};

export const emptyAdminAnalytics: AdminAnalytics = {
  rangeStart: "",
  rangeEnd: "",
  generatedAt: "",
  totalPatients: 0,
  totalHospitals: 0,
  totalDoctors: 0,
  totalDepartments: 0,
  totalAppointments: 0,
  totalTokens: 0,
  waiting: 0,
  called: 0,
  completed: 0,
  skipped: 0,
  cancelled: 0,
  avgWaitMinutes: 0,
  clearanceRate: 0,
  byDay: [],
  byHour: [],
  byDepartment: [],
  recentTokens: [],
};

export function getDateDaysAgo(days: number, now = new Date()) {
  const date = new Date(`${getIndiaDate(now)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
import { getIndiaDate } from "./scheduling";
