import { useEffect } from "react";
import { Map as MapboxMap } from 'mapbox-gl';
import { OptionalBbox } from "../types";
import { FIT_BOUNDS_PADDING, checkFitBoundsFromLayer } from "../utils";

/**
 * Centers on the given bounds if the current position is not within the bounds,
 * and there's no user defined position (via user initiated map movement). Gives
 * preference to the layer defined bounds over the STAC collection bounds.
 *
 * @param mapInstance Mapbox instance
 * @param isUserPositionSet Whether the user has set a position
 * @param initialBbox Bounding box from the layer
 * @param stacBbox Bounds from the STAC collection
 */
export default function useFitBbox(
  mapInstance: MapboxMap,
  isUserPositionSet: boolean,
  initialBbox: OptionalBbox,
  stacBbox: OptionalBbox
) {
  useEffect(() => {
    if (isUserPositionSet) return;

    // Prefer layer defined bounds to STAC collection bounds.
    const bounds = (initialBbox ?? stacBbox) as
      | [number, number, number, number]
      | undefined;

    if (bounds?.length && checkFitBoundsFromLayer(bounds, mapInstance)) {
      mapInstance.fitBounds(bounds, { padding: FIT_BOUNDS_PADDING });
    }
  }, [mapInstance, isUserPositionSet, initialBbox, stacBbox]);
}
