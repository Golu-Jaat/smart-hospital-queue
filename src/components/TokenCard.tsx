type TokenCardProps = {
  tokenNumber: number;
  doctor: string;
  status: string;
};

export function TokenCard({ tokenNumber, doctor, status }: TokenCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">Current token</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="text-4xl font-bold text-blue-700">#{tokenNumber}</p>
        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
          {status}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600">{doctor}</p>
    </section>
  );
}
