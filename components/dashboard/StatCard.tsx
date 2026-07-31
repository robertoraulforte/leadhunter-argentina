type StatCardProps = {
  title: string;
  value: number | string;
  description: string;
};

export default function StatCard({
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-sm text-gray-500">{title}</h3>

      <div className="mt-3 text-3xl font-bold">
        {value}
      </div>

      <p className="mt-2 text-sm text-gray-400">
        {description}
      </p>
    </div>
  );
}