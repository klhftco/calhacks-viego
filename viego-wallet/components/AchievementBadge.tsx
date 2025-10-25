import { Trophy } from "lucide-react";

interface AchievementBadgeProps {
  title: string;
  description: string;
  emoji: string;
  color?: string;
  unlocked?: boolean;
}

export default function AchievementBadge({
  title,
  description,
  emoji,
  color = "from-yellow-400 to-orange-500",
  unlocked = true,
}: AchievementBadgeProps) {
  return (
    <div
      className={`rounded-xl p-4 shadow-lg transition-all hover:scale-105 ${
        unlocked
          ? `bg-gradient-to-br ${color} text-white`
          : 'bg-gray-200 text-gray-500 opacity-50'
      }`}
    >
      <div className="text-4xl mb-2">{emoji}</div>
      <h4 className="font-bold mb-1 flex items-center gap-2">
        {title}
        {unlocked && <Trophy size={16} />}
      </h4>
      <p className={`text-sm ${unlocked ? 'text-white/90' : 'text-gray-600'}`}>
        {description}
      </p>
      {!unlocked && (
        <div className="mt-2 bg-gray-300 rounded-full h-1 overflow-hidden">
          <div className="bg-gray-400 h-full w-1/3" />
        </div>
      )}
    </div>
  );
}
