import { Flame } from "lucide-react";

interface StreakCardProps {
  days: number;
  title?: string;
  description?: string;
}

export default function StreakCard({ days, title = "Savings Streak", description }: StreakCardProps) {
  return (
    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 shadow-lg text-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Flame size={32} className="animate-pulse" />
      </div>
      <p className="text-5xl font-bold mb-2">{days}</p>
      <p className="text-2xl font-semibold mb-2">Days</p>
      {description && <p className="text-white/90 text-sm">{description}</p>}
    </div>
  );
}
