import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

type DoctorRequest = {
  fullName?: unknown;
  email?: unknown;
  hospitalId?: unknown;
  departmentId?: unknown;
  specialization?: unknown;
  roomNumber?: unknown;
  averageConsultationMinutes?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return errorResponse("Invalid request origin.", 403);
  }

  const userClient = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return errorResponse("Authentication required.", 401);
  }

  const { data: requesterProfile, error: profileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || requesterProfile?.role !== "admin") {
    return errorResponse("Admin access required.", 403);
  }

  let body: DoctorRequest;
  try {
    body = (await request.json()) as DoctorRequest;
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const fullName = cleanText(body.fullName, 100);
  const email = cleanText(body.email, 254).toLowerCase();
  const hospitalId = cleanText(body.hospitalId, 36);
  const departmentId = cleanText(body.departmentId, 36);
  const specialization = cleanText(body.specialization, 100);
  const roomNumber = cleanText(body.roomNumber, 40);
  const averageConsultationMinutes = Number(body.averageConsultationMinutes);

  if (fullName.length < 2) {
    return errorResponse("Doctor name must be at least 2 characters.", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse("Enter a valid doctor email address.", 400);
  }
  if (!isUuid(hospitalId) || !isUuid(departmentId)) {
    return errorResponse("Select a valid hospital and department.", 400);
  }
  if (specialization.length < 2) {
    return errorResponse("Specialization is required.", 400);
  }
  if (
    !Number.isInteger(averageConsultationMinutes) ||
    averageConsultationMinutes < 5 ||
    averageConsultationMinutes > 120
  ) {
    return errorResponse("Consultation time must be between 5 and 120 minutes.", 400);
  }

  let adminClient;
  try {
    adminClient = createAdminSupabaseClient();
  } catch (error) {
    console.error("Doctor creation is not configured", error);
    return errorResponse("Doctor invitation service is not configured.", 503);
  }

  const { data: department, error: departmentError } = await adminClient
    .from("departments")
    .select("id, hospital_id, is_active, hospitals!inner(is_active)")
    .eq("id", departmentId)
    .eq("hospital_id", hospitalId)
    .eq("is_active", true)
    .eq("hospitals.is_active", true)
    .maybeSingle();

  if (departmentError || !department) {
    return errorResponse("Hospital and department selection is invalid.", 400);
  }

  const inviteRedirect = new URL("/reset-password", request.url).toString();
  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteRedirect,
      data: { full_name: fullName },
    });

  if (inviteError || !inviteData.user) {
    const message = inviteError?.message || "Unable to invite doctor.";
    return errorResponse(
      /already|registered|exists/i.test(message)
        ? "This email already has an account. Use a different email."
        : message,
      /already|registered|exists/i.test(message) ? 409 : 502,
    );
  }

  const invitedUserId = inviteData.user.id;
  const { error: recordError } = await adminClient.rpc("create_doctor_record", {
    target_user_id: invitedUserId,
    doctor_full_name: fullName,
    doctor_email: email,
    target_hospital_id: hospitalId,
    target_department_id: departmentId,
    doctor_specialization: specialization,
    doctor_room_number: roomNumber,
    consultation_minutes: averageConsultationMinutes,
  });

  if (recordError) {
    console.error("Doctor record creation failed", recordError);
    await adminClient.from("profiles").delete().eq("id", invitedUserId);
    await adminClient.auth.admin.deleteUser(invitedUserId);
    return errorResponse("Doctor record could not be created.", 500);
  }

  return Response.json(
    { message: `Invitation sent to ${email}.` },
    { status: 201 },
  );
}
