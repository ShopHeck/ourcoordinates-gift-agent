export interface PlaceCandidate {
  name: string;
  address: string;
  lat: number;
  lng: number;
  source: "google" | "nominatim";
  placeId?: string;
}
