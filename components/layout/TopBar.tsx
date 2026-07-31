'use client';

export default function TopBar() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold">
          LeadHunter Argentina
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <input
          className="border rounded-lg px-3 py-2 w-72"
          placeholder="Buscar empresa..."
        />

        <button className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
          Buscar
        </button>
      </div>
    </header>
  );
}