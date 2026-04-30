import { useState } from 'react';
import type { Property } from '../types/property';
import ScoreBreakdown from './ScoreBreakdown';

const GRADE_STYLES: Record<string, string> = {
  green:  'bg-green-500/20 text-green-400 border-green-500/40',
  blue:   'bg-blue-500/20 text-blue-400 border-blue-500/40',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  red:    'bg-red-500/20 text-red-400 border-red-500/40',
};

const FLAG_STYLES = {
  positive: 'bg-green-500/10 text-green-400 border-green-500/20',
  negative: 'bg-red-500/10 text-red-400 border-red-500/20',
  neutral:  'bg-slate-700/50 text-slate-400 border-slate-700',
};

const FLAG_ICONS = { positive: '✓', negative: '✗', neutral: '~' };

interface Props {
  property: Property;
  onSave: (p: Property) => void;
  isSaved: boolean;
}

export default function PropertyCard({ property, onSave, isSaved }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { score, address, schools } = property;
  const gradeColor = score?.grade.color ?? 'blue';
  const elem = schools.find((s) => s.level === 'Elementary' && s.servesHome)
    ?? schools.find((s) => s.level === 'Elementary');
  const commute = score?.commute;

  const desc = property.description ?? '';
  const truncated = desc.length > 400 && !showFullDesc ? desc.slice(0, 400) + '…' : desc;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

      {/* Photo carousel */}
      {property.photos.length > 0 ? (
        <div className="relative h-72 bg-slate-800 overflow-hidden">
          <img
            src={property.photos[photoIdx]}
            alt={address.full}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {property.photos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIdx((i) => (i - 1 + property.photos.length) % property.photos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
              >
                ‹
              </button>
              <button
                onClick={() => setPhotoIdx((i) => (i + 1) % property.photos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {photoIdx + 1} / {property.photos.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="h-40 bg-slate-800 flex items-center justify-center text-slate-600 text-sm">
          No photos available
        </div>
      )}

      <div className="p-6">

        {/* Header: address + score badge */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{address.full}</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {address.city}, {address.state} {address.zip}
            </p>
            {property.price && (
              <p className="text-2xl font-bold text-white mt-2">{property.price}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
              {property.beds != null && <span>{property.beds} bd</span>}
              {property.baths != null && <span>{property.baths} ba</span>}
              {property.sqft != null && <span>{property.sqft.toLocaleString()} sqft</span>}
              {property.yearBuilt != null && <span>Built {property.yearBuilt}</span>}
              {property.daysOnMarket != null && (
                <span className={property.daysOnMarket > 60 ? 'text-yellow-400' : ''}>
                  {property.daysOnMarket}d on market
                </span>
              )}
            </div>
          </div>

          {score && (
            <div className={`flex-shrink-0 border rounded-2xl px-4 py-3 text-center min-w-[80px] ${GRADE_STYLES[gradeColor]}`}>
              <div className="text-4xl font-black leading-none">{score.grade.letter}</div>
              <div className="text-xs font-semibold mt-1 opacity-80">{score.total}/100</div>
              <div className="text-xs opacity-60 mt-0.5">{score.grade.label}</div>
            </div>
          )}
        </div>

        {/* Two-column layout: score breakdown + flags */}
        {score && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                Priority Score
              </h3>
              <ScoreBreakdown breakdown={score.breakdown} />
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                Assessment
              </h3>
              <div className="space-y-2">
                {score.flags.map((flag, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg border ${FLAG_STYLES[flag.type]}`}
                  >
                    <span className="font-bold mt-px">{FLAG_ICONS[flag.type]}</span>
                    <span>{flag.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Commute */}
        {commute && (
          <div className="mb-5 p-4 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Commute to JPMC Plano
              </div>
              <div className="text-white font-semibold">
                {commute.minutes != null
                  ? `${commute.minutes} min`
                  : commute.estimatedMinutes != null
                  ? `~${commute.estimatedMinutes} min`
                  : 'Unknown'}
                {' '}<span className="text-slate-400 font-normal text-sm">— {commute.label}</span>
              </div>
              {commute.isEstimate && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Straight-line estimate{commute.distanceKm != null ? ` (${commute.distanceKm} km)` : ''}
                  {' · '}Add Google Maps API key for live traffic data
                </div>
              )}
            </div>
            <a
              href={commute.gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              View route
            </a>
          </div>
        )}

        {/* Schools */}
        {schools.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">Schools</h3>
            <div className="space-y-2">
              {schools.filter((s) => s.servesHome || schools.length <= 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-white font-medium">{s.name}</span>
                    <span className="text-slate-500 ml-2">{s.level} · {s.grades}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.rating != null && (
                      <span className={`font-bold ${s.rating >= 8 ? 'text-green-400' : s.rating >= 6 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {s.rating}/10
                      </span>
                    )}
                    {s.distance != null && (
                      <span className="text-slate-500 text-xs">{s.distance.toFixed(1)} mi</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {elem && (
              <p className="text-xs text-slate-500 mt-2">
                {['lakewood','white rock','bowie','brentfield','mohawk','prestonwood','spring creek','prairie creek']
                  .some((p) => elem.name.toLowerCase().includes(p))
                  ? '✓ Assigned to a preferred elementary school'
                  : 'Not assigned to a preferred elementary school'}
              </p>
            )}
          </div>
        )}

        {/* Pool + Walk score row */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
            property.hasPool
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            <span>🏊</span>
            <span>{property.hasPool ? 'Pool' : 'No pool listed'}</span>
          </div>

          {property.walkScore != null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm">
              <span>🚶</span>
              <span className="text-slate-300">Walk Score</span>
              <span className={`font-bold ${
                property.walkScore >= 70 ? 'text-green-400' :
                property.walkScore >= 50 ? 'text-yellow-400' : 'text-slate-400'
              }`}>{property.walkScore}</span>
              {property.walkScoreDescription && (
                <span className="text-slate-500 text-xs">— {property.walkScoreDescription}</span>
              )}
            </div>
          )}

          {property.yearBuilt != null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300">
              <span>🏛️</span>
              <span>Built {property.yearBuilt}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {desc && (
          <div className="mb-5">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Description</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{truncated}</p>
            {desc.length > 400 && (
              <button
                onClick={() => setShowFullDesc((v) => !v)}
                className="text-blue-400 text-sm mt-1 hover:text-blue-300"
              >
                {showFullDesc ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => onSave(property)}
            disabled={isSaved}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isSaved
                ? 'bg-slate-800 text-slate-500 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isSaved ? 'Saved to Compare' : 'Save to Compare'}
          </button>

          {property.redfinUrl && (
            <a
              href={property.redfinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              View on Redfin
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
