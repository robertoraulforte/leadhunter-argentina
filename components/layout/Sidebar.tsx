'use client';

import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/buscar", label: "Buscar Leads" },
  { href: "/empresas", label: "Empresas" },
  { href: "/crm", label: "CRM" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/automatizaciones", label: "Automatizaciones" },
  { href: "/configuracion", label: "Configuración" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen border-r bg-slate-900 text-white">
      <div className="p-6 text-2xl font-bold">
        LeadHunter
      </div>

      <nav className="flex flex-col gap-2 px-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-4 py-2 hover:bg-slate-700 transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}