import { atom } from "jotai";
import { atomWithHash } from "jotai-location";
import { Polygon } from "geojson";
import { AoIFeature } from "../../types";
import { decodeAois, encodeAois } from "$utils/polygon-url";

// This is the atom acting as a single source of truth for the AOIs.
export const aoisHashAtom = atomWithHash('aois', '');

// Getter atom to get AoiS as GeoJSON features from the hash.
export const aoisFeaturesAtom = atom<AoIFeature[]>((get) => {
  const hash = get(aoisHashAtom);
  if (!hash) return [];
  return decodeAois(hash);
});

// Setter atom to update AOIs geoometries, writing directly to the hash atom.
export const aoisUpdateGeometryAtom = atom(
  null,
  (get, set, updates: { id: string; geometry: Polygon }[]) => {
    let newFeatures = [...get(aoisFeaturesAtom)];
    updates.forEach(({ id, geometry }) => {
      const existingFeature = newFeatures.find((feature) => feature.id === id);
      if (existingFeature) {
        existingFeature.geometry = geometry;
      } else {
        const newFeature: AoIFeature = {
          type: 'Feature',
          id,
          geometry,
          selected: true,
          properties: {}
        };
        newFeatures = [...newFeatures, newFeature];
      }
    });
    set(aoisHashAtom, encodeAois(newFeatures));
  }
);

// Setter atom to update AOIs selected state, writing directly to the hash atom.
export const aoisSetSelectedAtom = atom(null, (get, set, ids: string[]) => {
  const features = get(aoisFeaturesAtom);
  const newFeatures = features.map((feature) => {
    return { ...feature, selected: ids.includes(feature.id as string) };
  });
  set(aoisHashAtom, encodeAois(newFeatures));
});

// Setter atom to delete AOIs, writing directly to the hash atom.
export const aoisDeleteAtom = atom(null, (get, set, ids: string[]) => {
  const features = get(aoisFeaturesAtom);
  const newFeatures = features.filter(
    (feature) => !ids.includes(feature.id as string)
  );
  set(aoisHashAtom, encodeAois(newFeatures));
});
