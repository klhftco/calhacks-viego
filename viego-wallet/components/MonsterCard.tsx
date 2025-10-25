interface MonsterCardProps {
  name: string;
  type: string;
  level: number;
  emoji: string;
  color?: string;
}

export default function MonsterCard({
  name,
  type,
  level,
  emoji,
  color = "bg-blue-500",
}: MonsterCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-2">
      <div className="text-6xl mb-3 text-center">{emoji}</div>
      <h3 className="text-xl font-bold text-gray-900 text-center">{name}</h3>
      <p className="text-sm text-gray-600 text-center mb-2">{type}</p>
      <div className="flex items-center justify-center gap-2">
        <div className={`${color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
          Lv. {level}
        </div>
      </div>
      {/* XP Progress */}
      <div className="mt-3">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`${color} h-full rounded-full`}
            style={{ width: `${(level % 10) * 10}%` }}
          />
        </div>
        <p className="text-xs text-center text-gray-500 mt-1">
          {level * 100} / {(level + 1) * 100} XP
        </p>
      </div>
    </div>
  );
}
