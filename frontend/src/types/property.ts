export interface PropertyAddress {
  full: string;
  city: string;
  state: string;
  zip: string;
  lat?: number | null;
  lng?: number | null;
}

export interface School {
  name: string;
  level: 'Elementary' | 'Middle' | 'High';
  rating?: number | null;
  distance?: number | null;
  grades?: string;
  servesHome: boolean;
  type: string;
}

export interface Amenity {
  label: string;
  content: string;
}

export interface ScoreBreakdown {
  schools: number;
  pool: number;
  architecture: number;
  parks: number;
  coffee: number;
}

export interface Grade {
  letter: string;
  label: string;
  color: 'green' | 'blue' | 'yellow' | 'orange' | 'red';
}

export interface ScoreFlag {
  type: 'positive' | 'negative' | 'neutral';
  label: string;
}

export interface CommuteInfo {
  minutes?: number;
  estimatedMinutes?: number;
  distanceKm?: number;
  isEstimate: boolean;
  label: string;
  gmapsUrl: string;
}

export interface PropertyScore {
  total: number;
  maxPossible: number;
  grade: Grade;
  breakdown: ScoreBreakdown;
  commute?: CommuteInfo;
  flags: ScoreFlag[];
}

export interface Property {
  propertyId: string;
  redfinUrl?: string | null;
  address: PropertyAddress;
  price?: string | null;
  priceRaw?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lotSqft?: number | null;
  yearBuilt?: number | null;
  daysOnMarket?: number | null;
  status?: string | null;
  pricePerSqft?: string | null;
  schools: School[];
  amenities: Amenity[];
  hasPool: boolean;
  photos: string[];
  description?: string;
  walkScore?: number | null;
  walkScoreDescription?: string | null;
  bikeScore?: number | null;
  transitScore?: number | null;
  score?: PropertyScore;
}

export interface SearchResult {
  id: string;
  name: string;
  subName: string;
  url: string;
  propertyId: string;
}
