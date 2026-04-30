import type { Property, ScoreBreakdown } from '../types/property';
import ScoreBreakdown_ from './ScoreBreakdown';

const GRADE_STYLES: Record<string, string> = {
  green:  'bg-green-500/20 text-green-400 border-green-500/40',
  blue:   'bg-blue-500/20 text-blue-400 border-blue-500/40',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  red:    'bg-red-500/20 text-red-400 border-red-500/40',
};

interface Props {
  properties: Property[];
  onRemove: (id: string) => void;
}

function bestIn(properties: Property[], key: keyof ScoreBreakdown): number {
  return Math.max(...properties.map((p) => p.score?.breakdown[key] ?? 0));
}

export default function SavedProperties({ properties, onRemove }: Props) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-24 text-slate-500">
        <div className="text-5xl mb-4">🏠</div>
        <p className="text-lg font-medium text-slate-400">No properties saved yet</p>
        <p className="text-sm mt-1">Search for a property and click "Save to Compare"</p>
      </div>
    );
  }

  const bests = {
    schools:      bestIn(properties, 'schools'),
    pool:         bestIn(properties, 'pool'),
    architecture: bestIn(properties, 'architecture'),
    parks:        bestIn(properties, 'parks'),
    coffee:       bestIn(properties, 'coffee'),
  } as ScoreBreakdown;

  const topScore = Math.max(...properties.map((p) => p.score?.total ?? 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          Comparing {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
        </h2>
        <p className="text-sm text-slate-500">Best values highlighted in green</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {properties.map((p) => {
          const score = p.score;
          const isTop = score && score.total === topScore && properties.length > 1;
          const commute = score?.commute;
          const elem = p.schools.find((s) => s.level === 'Elementary' && s.servesHome)
            ?? p.schools.find((s) => s.level === 'Elementary');

          return (
            <div
              key={p.propertyId}
              className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
                isTop ? 'border-green-500/50 ring-1 ring-green-500/30' : 'border-slate-800'
              }`}
            >
              {isTop && (
                <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 text-green-400 text-xs font-semibold flex items-center gap-1.5">
                  <span>★</span> Best match
                </div>
              )}

              {/* Photo */}
              {p.photos[0] ? (
                <div className="h-44 overflow-hidden">
                  <img src={p.photos[0]} alt={p.address.full} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-28 bg-slate-800 flex items-center justify-center text-slate-600 text-sm">
                  No photo
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-snug">{p.address.full}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{p.address.city}, {p.address.state}</p>
                    {p.price && <p className="text-white font-bold mt-1">{p.price}</p>}
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                      {p.beds != null && <span>{p.beds}bd</span>}
                      {p.baths != null && <span>{p.baths}ba</span>}
                      {p.sqft != null && <span>{p.sqft.toLocaleString()} sqft</span>}
                    </div>
                  </div>

                  {score && (
                    <div className={`flex-shrink-0 border rounded-xl px-3 py-2 text-center ${GRADE_STYLES[score.grade.color]}`}>
                      <div className="text-2xl font-black leading-none">{score.grade.letter}</div>
                      <div className="text-xs font-semibold mt-0.5 opacity-80">{score.total}/100</div>
                    </div>
                  )}
                </div>

                {/* Score bars */}
                {score && (
                  <div className="mb-4">
                    <ScoreBreakdown_ breakdown={score.breakdown} compact />
                    {/* Highlight best categories */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(Object.keys(bests) as (keyof ScoreBreakdown)[]).map((k) => {
                        const val = score.breakdown[k];
                        if (val > 0 && val === bests[k] && properties.length > 1) {
                          const labels: Record<keyof ScoreBreakdown, string> = {
                            schools: 'Best school', pool: 'Pool winner',
                            architecture: 'Best character', parks: 'Most walkable', coffee: 'Best coffee access',
                          };
                          return (
                            <span key={k} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                              {labels[k]}
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}

                {/* Key facts */}
                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span>{p.hasPool ? '🏊' : '⚪'}</span>
                    <span className={p.hasPool ? 'text-blue-400' : 'text-slate-500'}>
                      {p.hasPool ? 'Has pool' : 'No pool'}
                    </span>
                  </div>
                  {elem && (
                    <div className="flex items-center gap-2">
                      <span>🏫</span>
                      <span className="text-slate-400 truncate text-xs">{elem.name}</span>
                      {elem.rating != null && (
                        <span className={`text-xs font-bold ml-auto flex-shrink-0 ${elem.rating >= 8 ? 'text-green-400' : 'text-slate-400'}`}>
                          {elem.rating}/10
                        </span>
                      )}
                    </div>
                  )}
                  {commute && (
                    <div className="flex items-center gap-2">
                      <span>🚗</span>
                      <span className="text-slate-400 text-xs">
                        {commute.minutes != null
                          ? `${commute.minutes} min`
                          : commute.estimatedMinutes != null
                          ? `~${commute.estimatedMinutes} min${commute.isEstimate ? ' (est.)' : ''}`
                          : '—'}
                        {' '}to JPMC
                      </span>
                      {commute.gmapsUrl && (
                        <a href={commute.gmapsUrl} target="_blank" rel="noopener noreferrer"
                           className="text-blue-400 text-xs ml-auto hover:underline">
                          Map
                        </a>
                      )}
                    </div>
                  )}
                  {p.walkScore != null && (
                    <div className="flex items-center gap-2">
                      <span>🚶</span>
                      <span className="text-slate-400 text-xs">
                        Walk Score <span className={`font-bold ${p.walkScore >= 70 ? 'text-green-400' : p.walkScore >= 50 ? 'text-yellow-400' : ''}`}>
                          {p.walkScore}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  {p.redfinUrl && (
                    <a href={p.redfinUrl} target="_blank" rel="noopener noreferrer"
                       className="flex-1 text-center text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors">
                      Redfin
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(p.propertyId)}
                    className="flex-1 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
