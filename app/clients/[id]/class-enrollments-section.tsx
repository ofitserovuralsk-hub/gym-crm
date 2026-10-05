import { formatDate, formatTime, getGymToday } from "@/lib/status";

export type ClassEnrollment = {
  id: string;
  classDate: string;
  className: string;
  trainer: string | null;
  startTime: string;
};

export default function ClassEnrollmentsSection({
  enrollments,
}: {
  enrollments: ClassEnrollment[];
}) {
  const today = getGymToday();

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Групповые занятия</h2>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Дата</th>
              <th className="px-4 py-2 font-medium">Время</th>
              <th className="px-4 py-2 font-medium">Занятие</th>
              <th className="px-4 py-2 font-medium">Тренер</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 text-center text-slate-500"
                >
                  Записей на занятия пока нет
                </td>
              </tr>
            ) : (
              enrollments.map((e) => {
                const isPast = e.classDate < today;
                return (
                  <tr
                    key={e.id}
                    className={`border-t border-slate-800 ${
                      isPast ? "text-slate-500" : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      {formatDate(e.classDate)}
                      {e.classDate === today && (
                        <span className="ml-2 text-xs text-emerald-400">
                          сегодня
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {formatTime(e.startTime)}
                    </td>
                    <td className="px-4 py-2">{e.className}</td>
                    <td className="px-4 py-2">{e.trainer ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
