type NotificationBellProps = {
  count: number;
};

export function NotificationBell({ count }: NotificationBellProps) {
  return (
    <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
      <span aria-hidden="true">!</span>
      <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
        {count}
      </span>
    </div>
  );
}
