// Scoring weights total 100 pts:
//   Schools      30
//   Pool         25
//   Architecture 20
//   Parks        15
//   Coffee        10
// Commute is calculated separately (not part of score).

const PREFERRED_SCHOOLS = [
  'lakewood',
  'white rock',
  'bowie',
  'brentfield',
  'mohawk',
  'prestonwood',
  'spring creek',
  'prairie creek',
];

const FLIP_INDICATORS = [
  'fresh paint',
  'new carpet',
  'move-in ready',
  'turnkey',
  'just renovated',
  'brand new',
  'investor special',
  'as-is',
  'priced to sell',
  "won't last",
];

const CHARACTER_KEYWORDS = [
  'original hardwood',
  'craftsman',
  'mid-century',
  'tudor',
  'ranch style',
  'architectural',
  'art deco',
  'prairie style',
  'restored',
  'character home',
  'charming',
  'vintage',
  'custom built',
  'architect designed',
  'unique',
  'historic',
  'period detail',
  'wood beam',
  'vaulted ceiling',
  'original detail',
];

// JPMC Plano office coordinates (used for Haversine estimate when Maps API is absent)
const JPMC = { lat: 33.0772, lng: -96.7991 };

function scoreProperty(property, mapsData = null) {
  const breakdown = {
    schools: scoreSchools(property.schools),
    pool: property.hasPool ? 25 : 0,
    architecture: scoreArchitecture(property),
    parks: scoreParks(property, mapsData),
    coffee: scoreCoffee(property, mapsData),
  };

  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);

  return {
    total,
    maxPossible: 100,
    grade: getGrade(total),
    breakdown,
    commute: buildCommuteInfo(property, mapsData),
    flags: buildFlags(property),
  };
}

function scoreSchools(schools) {
  const elem =
    schools.find((s) => s.level === 'Elementary' && s.servesHome) ??
    schools.find((s) => s.level === 'Elementary');

  if (!elem) return 0;

  if (PREFERRED_SCHOOLS.some((p) => elem.name.toLowerCase().includes(p))) return 30;

  // Partial credit via GreatSchools rating
  if (elem.rating >= 9) return 18;
  if (elem.rating >= 7) return 12;
  if (elem.rating >= 5) return 6;
  return 2;
}

function scoreArchitecture(property) {
  let score = 10; // neutral baseline
  const desc = (property.description ?? '').toLowerCase();
  const year = property.yearBuilt ?? 0;

  if (year > 0) {
    if (year < 1950) score += 6;
    else if (year < 1970) score += 4;
    else if (year < 1990) score += 2;
    else if (year > 2015) score -= 2;
  }

  score += Math.min(CHARACTER_KEYWORDS.filter((k) => desc.includes(k)).length * 2, 6);
  score -= Math.min(FLIP_INDICATORS.filter((k) => desc.includes(k)).length * 2, 8);

  return Math.max(0, Math.min(20, score));
}

function scoreParks(property, mapsData) {
  if (mapsData?.nearbyParks != null) return Math.min(15, mapsData.nearbyParks * 3);

  const ws = property.walkScore;
  if (ws == null) return 7;
  if (ws >= 80) return 14;
  if (ws >= 60) return 11;
  if (ws >= 40) return 8;
  if (ws >= 20) return 4;
  return 2;
}

function scoreCoffee(property, mapsData) {
  if (mapsData?.nearbyCoffee != null) return Math.min(10, mapsData.nearbyCoffee * 2);

  const ws = property.walkScore;
  if (ws == null) return 5;
  if (ws >= 80) return 9;
  if (ws >= 60) return 7;
  if (ws >= 40) return 5;
  if (ws >= 20) return 3;
  return 1;
}

function buildCommuteInfo(property, mapsData) {
  const { lat, lng } = property.address;
  const gmapsUrl =
    lat && lng
      ? `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=8181+Communications+Pkwy,+Plano,+TX+75024&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(property.address.full + ' ' + property.address.city + ' ' + property.address.state)}&destination=8181+Communications+Pkwy,+Plano,+TX+75024&travelmode=driving`;

  if (mapsData?.commuteMinutes) {
    const m = mapsData.commuteMinutes;
    return {
      minutes: m,
      isEstimate: false,
      label: commuteLabel(m),
      gmapsUrl,
    };
  }

  if (lat && lng) {
    const dist = haversineKm(lat, lng, JPMC.lat, JPMC.lng);
    const est = Math.round((dist * 1.35 / 50) * 60);
    return {
      estimatedMinutes: est,
      distanceKm: Math.round(dist * 10) / 10,
      isEstimate: true,
      label: commuteLabel(est),
      gmapsUrl,
    };
  }

  return { isEstimate: true, label: 'Unknown', gmapsUrl };
}

function commuteLabel(mins) {
  if (mins < 20) return 'Excellent';
  if (mins < 30) return 'Good';
  if (mins < 45) return 'Acceptable';
  return 'Long';
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getGrade(score) {
  if (score >= 85) return { letter: 'A', label: 'Excellent match', color: 'green' };
  if (score >= 70) return { letter: 'B', label: 'Good match', color: 'blue' };
  if (score >= 55) return { letter: 'C', label: 'Decent match', color: 'yellow' };
  if (score >= 40) return { letter: 'D', label: 'Weak match', color: 'orange' };
  return { letter: 'F', label: 'Poor match', color: 'red' };
}

function buildFlags(property) {
  const flags = [];
  const desc = (property.description ?? '').toLowerCase();

  // Pool
  flags.push(
    property.hasPool
      ? { type: 'positive', label: 'Has pool' }
      : { type: 'negative', label: 'No pool listed' }
  );

  // School
  const elem =
    property.schools.find((s) => s.level === 'Elementary' && s.servesHome) ??
    property.schools.find((s) => s.level === 'Elementary');

  if (elem) {
    const preferred = PREFERRED_SCHOOLS.some((p) => elem.name.toLowerCase().includes(p));
    flags.push({
      type: preferred ? 'positive' : 'neutral',
      label: preferred
        ? `Preferred school: ${elem.name}`
        : `School: ${elem.name}${elem.rating != null ? ` (${elem.rating}/10)` : ''}`,
    });
  } else {
    flags.push({ type: 'neutral', label: 'Elementary school data unavailable' });
  }

  // Architecture / flip
  const flipHits = FLIP_INDICATORS.filter((k) => desc.includes(k)).length;
  const charHits = CHARACTER_KEYWORDS.filter((k) => desc.includes(k)).length;

  if (flipHits >= 2) {
    flags.push({ type: 'negative', label: 'Listing language suggests possible cheap flip' });
  }
  if (charHits >= 2) {
    flags.push({ type: 'positive', label: 'Description mentions architectural character' });
  }

  // Walk score
  if (property.walkScore != null) {
    if (property.walkScore >= 70) {
      flags.push({
        type: 'positive',
        label: `Walk Score ${property.walkScore} — ${property.walkScoreDescription ?? 'Very Walkable'}`,
      });
    } else if (property.walkScore < 30) {
      flags.push({
        type: 'negative',
        label: `Walk Score ${property.walkScore} — Car Dependent`,
      });
    }
  }

  return flags;
}

module.exports = { scoreProperty };
