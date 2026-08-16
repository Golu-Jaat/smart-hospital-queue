type DoctorCardProps = {
  name: string;
  department: string;
  room: string;
  wait: string;
};

export function DoctorCard({ name, department, room, wait }: DoctorCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">{name}</h3>
          <p className="text-sm text-slate-600">{department}</p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
          Available
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Room</dt>
          <dd className="font-medium text-slate-800">{room}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Est. wait</dt>
          <dd className="font-medium text-slate-800">{wait}</dd>
        </div>
      </dl>
    </article>
  );
}
