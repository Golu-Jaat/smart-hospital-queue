export type UserRole = "patient" | "doctor" | "admin";

export type HospitalType = "government" | "private";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type QueueStatus = "active" | "paused" | "closed";

export type TokenPriority = "normal" | "urgent" | "emergency";

export type TokenStatus = "waiting" | "called" | "completed" | "skipped" | "cancelled";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  hospital_id: string | null;
  created_at: string;
};

export type PatientHealthProfile = {
  patient_id: string;
  avatar_path: string | null;
  avatar_emoji: string | null;
  blood_group: string | null;
  age: number | null;
  gender: string | null;
  allergies: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  address: string | null;
  updated_at: string;
};

export type Hospital = {
  id: string;
  name: string;
  type: HospitalType;
  address: string;
  city: string;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
};

export type Department = {
  id: string;
  hospital_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type Doctor = {
  id: string;
  hospital_id: string;
  department_id: string;
  profile_id: string;
  display_name: string;
  specialization: string;
  room_number: string | null;
  average_consultation_minutes: number;
  is_active: boolean;
};

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string;
  appointment_date: string;
  slot_start: string;
  slot_end: string;
  status: AppointmentStatus;
  created_at: string;
};

export type Token = {
  id: string;
  queue_id: string;
  patient_id: string;
  appointment_id: string | null;
  token_number: number;
  priority: TokenPriority;
  status: TokenStatus;
  joined_at: string;
  called_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
};
