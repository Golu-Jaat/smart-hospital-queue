type AppointmentCardProps = {
  doctor: string;
  department: string;
  time: string;
  status: string;
};

export function AppointmentCard({
  doctor,
  department,
  time,
  status,
}: AppointmentCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">{doctor}</h3>
          <p className="text-sm text-slate-600">{department}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600">{time}</p>
    </article>
  );
}
