import type { ScoreBreakdown as Breakdown } from '../types/property';

const CATEGORIES: { key: keyof Breakdown; label: string; max: number; icon: string }[] = [
  { key: 'schools',      label: 'Schools',       max: 30, icon: '🏫' },
  { key: 'pool',         label: 'Pool',           max: 25, icon: '🏊' },
  { key: 'architecture', label: 'Architecture',   max: 20, icon: '🏛️' },
  { key: 'parks',        label: 'Parks & Trails', max: 15, icon: '🌳' },
  { key: 'coffee',       label: 'Walkability',    max: 10, icon: '☕' },
];

function barColor(ratio: number) {
  if (ratio >= 0.85) return 'bg-green-500';
  if (ratio >= 0.6)  return 'bg-blue-500';
  if (ratio >= 0.4)  return 'bg-yellow-500';
  return 'bg-red-500';
}

interface Props {
  breakdown: Breakdown;
  compact?: boolean;
}

export default function ScoreBreakdown({ breakdown, compact = false }: Props) {
  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {CATEGORIES.map(({ key, label, max, icon }) => {
        const score = breakdown[key];
        const ratio = score / max;
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-slate-300 ${compact ? 'text-xs' : 'text-sm'} flex items-center gap-1.5`}>
                <span>{icon}</span>
                <span>{label}</span>
              </span>
              <span className={`font-mono font-semibold ${compact ? 'text-xs' : 'text-sm'} ${
                ratio >= 0.85 ? 'text-green-400' :
                ratio >= 0.6  ? 'text-blue-400' :
                ratio >= 0.4  ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {score}/{max}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${barColor(ratio)}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
