const days = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

export default function AvailabilityList({ data, onDelete }: any) {
  // grupowanie po dniach
  const grouped = data.reduce((acc: any, item: any) => {
    if (!acc[item.dayOfWeek]) acc[item.dayOfWeek] = [];
    acc[item.dayOfWeek].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.keys(grouped)
        .sort((a, b) => Number(a) - Number(b))
        .map((day) => (
          <div key={day} className="p-4 rounded-2xl bg-black border border-zinc-800">
            {/* DAY HEADER */}
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">{days[Number(day)]}</h2>

            <div className="space-y-2">
              {grouped[day].map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-700"
                >
                  {/* LEFT */}
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {item.startHour}:00 - {item.endHour}:00
                    </span>

                    <span className="text-xs text-zinc-400">
                      {item.gym ? item.gym.name : "Dostępność ogólna"}
                    </span>
                  </div>

                  {/* DELETE */}
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                  >
                    Usuń
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
