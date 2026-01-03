import { Target, CheckCircle } from "lucide-react";

interface GoalProgressProps {
  title: string;
  current: number;
  target: number;
  emoji?: string;
  color?: string;
}

export default function GoalProgress({
  title,
  current,
  target,
  emoji = "🎯",
  color = "bg-blue-500",
}: GoalProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{emoji}</div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              ${current.toFixed(2)} / ${target.toFixed(2)}
            </p>
          </div>
        </div>
        {isComplete ? (
          <CheckCircle className="text-green-500" size={32} />
        ) : (
          <Target className="text-gray-400" size={32} />
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
        <div
          className={`${color} h-full rounded-full transition-all duration-500 ${
            isComplete ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{percentage.toFixed(0)}% Complete</span>
        {isComplete ? (
          <span className="text-green-600 font-semibold">Goal Reached! 🎉</span>
        ) : (
          <span className="text-gray-600">${(target - current).toFixed(2)} to go</span>
        )}
      </div>
    </div>
  );
}
