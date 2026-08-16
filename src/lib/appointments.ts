import type { AppointmentStatus } from "@/types/database";

export type AppointmentRequest = {
  patientId: string;
  doctorId: string;
  departmentId: string;
  appointmentDate: string;
  slotStart: string;
  slotEnd: string;
};

export function isValidAppointmentRequest(request: AppointmentRequest) {
  return Boolean(
    request.patientId &&
      request.doctorId &&
      request.departmentId &&
      request.appointmentDate &&
      request.slotStart &&
      request.slotEnd,
  );
}

export function getAppointmentStatusLabel(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    booked: "Booked",
    checked_in: "Checked in",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status];
}
