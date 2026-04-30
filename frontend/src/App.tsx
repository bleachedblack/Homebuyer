import { useState } from 'react';
import SearchBar from './components/SearchBar';
import PropertyCard from './components/PropertyCard';
import SavedProperties from './components/SavedProperties';
import type { Property, SearchResult } from './types/property';

export default function App() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'search' | 'compare'>('search');

  const handleSearch = async (address: string) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setSelectedProperty(null);
    try {
      const res = await fetch(`/api/property/search?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      if (data.length === 0) throw new Error('No listings found for that address. Try including the city and state.');
      setSearchResults(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = async (result: SearchResult) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/property/details?propertyId=${result.propertyId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load property');
      setSelectedProperty(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (property: Property) => {
    if (!savedProperties.find((p) => p.propertyId === property.propertyId)) {
      setSavedProperties((prev) => [...prev, property]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              Home<span className="text-blue-400">Scout</span>
            </h1>
            <p className="text-xs text-slate-500">Personalized home buying analysis</p>
          </div>

          <nav className="flex gap-1">
            {(['search', 'compare'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors relative ${
                  view === v
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {v}
                {v === 'compare' && savedProperties.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {savedProperties.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {view === 'search' ? (
          <>
            {/* Priority legend */}
            <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
                Your priorities
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                {[
                  ['🏫', 'Top elementary schools (30 pts)'],
                  ['🏊', 'Pool — high priority (25 pts)'],
                  ['🏛️', 'Interesting architecture, no cheap flips (20 pts)'],
                  ['🌳', 'Parks & green space walkability (15 pts)'],
                  ['☕', 'Indie coffee & walkability (10 pts)'],
                  ['🚗', 'Commute to JPMC Plano'],
                ].map(([icon, label]) => (
                  <span key={label} className="bg-slate-800 px-2 py-1 rounded-md">
                    {icon} {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <SearchBar onSearch={handleSearch} loading={loading} />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl p-4 mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Autocomplete results */}
            {searchResults.length > 0 && (
              <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-slate-800/80 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {searchResults.length} listing{searchResults.length !== 1 ? 's' : ''} found — select one to analyze
                </div>
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectResult(r)}
                    className="w-full text-left px-4 py-3.5 hover:bg-slate-800 border-b border-slate-800 last:border-0 transition-colors group"
                  >
                    <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {r.name}
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">{r.subName}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Property detail card */}
            {selectedProperty && (
              <PropertyCard
                property={selectedProperty}
                onSave={handleSave}
                isSaved={savedProperties.some((p) => p.propertyId === selectedProperty.propertyId)}
              />
            )}

            {!loading && !error && !selectedProperty && searchResults.length === 0 && (
              <div className="text-center py-16 text-slate-600">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-slate-500 text-lg font-medium">Enter an address to get started</p>
                <p className="text-slate-600 text-sm mt-1">
                  Pulls live data from Redfin and scores against your priorities
                </p>
              </div>
            )}
          </>
        ) : (
          <SavedProperties
            properties={savedProperties}
            onRemove={(id) => setSavedProperties((prev) => prev.filter((p) => p.propertyId !== id))}
          />
        )}
      </main>
    </div>
  );
}
