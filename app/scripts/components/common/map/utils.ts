import axios, { Method } from 'axios';
import { Map as MapboxMap } from 'mapbox-gl';
import { endOfDay, startOfDay } from "date-fns";
import { StacFeature } from "./types";
import { userTzDate2utcString } from "$utils/date";
import { validateRangeNum } from "$utils/utils";


export const FIT_BOUNDS_PADDING = 32;

export const validateLon = validateRangeNum(-180, 180);
export const validateLat = validateRangeNum(-90, 90);



export function getMergedBBox(features: StacFeature[]) {
  const mergedBBox = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ];
  return features.reduce(
    (acc, feature) => [
      feature.bbox[0] < acc[0] ? feature.bbox[0] : acc[0],
      feature.bbox[1] < acc[1] ? feature.bbox[1] : acc[1],
      feature.bbox[2] > acc[2] ? feature.bbox[2] : acc[2],
      feature.bbox[3] > acc[3] ? feature.bbox[3] : acc[3]
    ],
    mergedBBox
  ) as [number, number, number, number];
}



export function checkFitBoundsFromLayer(
  layerBounds?: [number, number, number, number],
  mapInstance?: MapboxMap
) {
  if (!layerBounds || !mapInstance) return false;

  const [minXLayer, minYLayer, maxXLayer, maxYLayer] = layerBounds;
  const [[minXMap, minYMap], [maxXMap, maxYMap]] = mapInstance
    .getBounds()
    .toArray();
  const isOutside =
    maxXLayer < minXMap ||
    minXLayer > maxXMap ||
    maxYLayer < minYMap ||
    minYLayer > maxYMap;
  const layerExtentSmaller =
    maxXLayer - minXLayer < maxXMap - minXMap &&
    maxYLayer - minYLayer < maxYMap - minYMap;

  // only fitBounds if layer extent is smaller than viewport extent (ie zoom to area of interest),
  // or if layer extent does not overlap at all with viewport extent (ie pan to area of interest)
  return layerExtentSmaller || isOutside;
}



/**
 * Creates the appropriate filter object to send to STAC.
 *
 * @param {Date} date Date to request
 * @param {string} collection STAC collection to request
 * @returns Object
 */
export function getFilterPayload(date: Date, collection: string) {
  return {
    op: 'and',
    args: [
      {
        op: '>=',
        args: [{ property: 'datetime' }, userTzDate2utcString(startOfDay(date))]
      },
      {
        op: '<=',
        args: [{ property: 'datetime' }, userTzDate2utcString(endOfDay(date))]
      },
      {
        op: 'eq',
        args: [{ property: 'collection' }, collection]
      }
    ]
  };
}


// There are cases when the data can't be displayed properly on low zoom levels.
// In these cases instead of displaying the raster tiles, we display markers to
// indicate whether or not there is data in a given location. When the user
// crosses the marker threshold, if below the min zoom we have to request the
// marker position, and if above we have to register a mosaic query. Since this
// switching can happen several times, we cache the api response using the
// request params as key.
const quickCache = new Map<string, any>();
interface RequestQuickCacheParams {
  url: string;
  method?: Method;
  payload?: any;
  controller: AbortController;
}
export async function requestQuickCache({
  url,
  payload,
  controller,
  method = 'post'
}: RequestQuickCacheParams) {
  const key = `${method}:${url}${JSON.stringify(payload)}`;

  // No cache found, make request.
  if (!quickCache.has(key)) {
    const response = await axios({
      url,
      method,
      data: payload,
      signal: controller.signal
    });
    quickCache.set(key, response.data);
  }
  return quickCache.get(key);
}

