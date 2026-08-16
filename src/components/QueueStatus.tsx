type QueueStatusProps = {
  currentToken: number;
  peopleAhead: number;
  estimatedWait: string;
};

export function QueueStatus({
  currentToken,
  peopleAhead,
  estimatedWait,
}: QueueStatusProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-950">Live queue</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-slate-500">Serving</dt>
          <dd className="text-2xl font-semibold text-slate-950">#{currentToken}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">People ahead</dt>
          <dd className="text-2xl font-semibold text-slate-950">{peopleAhead}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Estimated wait</dt>
          <dd className="text-2xl font-semibold text-slate-950">{estimatedWait}</dd>
        </div>
      </dl>
    </section>
  );
}
