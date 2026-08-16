import Link from "next/link";

type SidebarProps = {
  title: string;
  items: Array<{ href: string; label: string }>;
};

export function Sidebar({ title, items }: SidebarProps) {
  return (
    <aside className="border-r border-slate-200 bg-white p-5">
      <h2 className="mb-5 text-sm font-semibold uppercase text-slate-500">{title}</h2>
      <div className="grid gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
