import defaultsDeep from 'lodash.defaultsdeep';
import axios from 'axios';
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval
} from 'date-fns';
import { endOfDay, startOfDay } from 'date-fns';
import { userTzDate2utcString } from '$utils/date';
import {
  datasets,
  DatasetLayer,
  DatasetLayerCompareInternal,
  DatasetLayerCompareSTAC,
  DatasetDatumFn,
  DatasetDatumFnResolverBag,
  DatasetDatumReturnType,
  DatasetLayerCompareNormalized
} from 'delta/thematics';

import { utcString2userTzDate } from '$utils/date';
import { AsyncDatasetLayer } from '$context/layer-data';
import { MapLayerRasterTimeseries, StacFeature } from './raster-timeseries';
import { S_FAILED, S_IDLE, S_LOADING, S_SUCCEEDED } from '$utils/status';
import { HintedError } from '$utils/hinted-error';
import mapboxgl from 'mapbox-gl';

export const getLayerComponent = (
  isTimeseries: boolean,
  layerType: 'raster' | 'vector'
): React.FunctionComponent<any> | null => {
  if (isTimeseries) {
    if (layerType === 'raster') return MapLayerRasterTimeseries;
  }

  return null;
};

/**
 * Returns the correct data for the compare layer depending on whether is a
 * layer from another dataset, or a STAC layer declared inline.
 *
 * @param layerData object The data for the current layer
 * @returns object
 */
export const getCompareLayerData = (
  layerData: DatasetLayer | null
): DatasetLayerCompareNormalized | null => {
  if (!layerData?.compare) return null;
  const { compare } = layerData;

  /* eslint-disable-next-line prettier/prettier */
  const compareInternal = compare as DatasetLayerCompareInternal;
  const compareSTAC = compare as DatasetLayerCompareSTAC;

  // If the stacCol property exists it is a layer to be loaded from STAC. In the
  // case of a STAC layer defined inline the missing properties are inherited
  // from the parent layer.
  if (compareSTAC.stacCol) {
    // Extract properties that need special handling, letting the other ones
    // through.
    const { stacCol, type, zoomExtent, sourceParams, ...passThroughProps } =
      compareSTAC;

    return {
      id: stacCol,
      stacCol,
      type: type || layerData.type,
      zoomExtent: zoomExtent || layerData.zoomExtent,
      sourceParams: defaultsDeep({}, sourceParams, layerData.sourceParams),
      ...passThroughProps
    };
  }

  // When we're comparing against a layer from another dataset, that layer's
  // properties are overridden with the ones provided in the compare object.
  if (compareInternal.layerId) {
    // Extract properties that need special handling, letting the other ones
    // through.
    const {
      datasetId,
      layerId,
      zoomExtent,
      sourceParams,
      ...passThroughProps
    } = compareInternal;

    const errorHints: string[] = [];

    const datasetData = datasets[datasetId]?.data;
    if (!datasetData) {
      errorHints.push(`Dataset [${datasetId}] not found (compare.datasetId)`);
    }

    const otherLayer = datasetData?.layers?.find((l) => l.id === layerId);
    if (!otherLayer) {
      errorHints.push(
        `Layer [${layerId}] not found in dataset [${datasetId}] (compare.layerId)`
      );
    }

    if (!datasetData || !otherLayer) {
      throw new HintedError(
        `Malformed compare for layer: ${layerData.id}`,
        errorHints
      );
    }

    return {
      id: otherLayer.id,
      type: otherLayer.type,
      stacCol: otherLayer.stacCol,
      zoomExtent: zoomExtent || otherLayer.zoomExtent,
      sourceParams: defaultsDeep({}, sourceParams, otherLayer.sourceParams),
      ...passThroughProps
    };
  }

  throw new Error('Layer specified in compare was not found.');
};

type Fn = (...args: any[]) => any;

type ObjResMap<T> = {
  [K in keyof T]: Res<T[K]>;
};

type Res<T> = T extends Fn
  ? T extends DatasetDatumFn<DatasetDatumReturnType>
    ? DatasetDatumReturnType
    : never
  : T extends any[]
  ? Array<Res<T[number]>>
  : T extends object
  ? ObjResMap<T>
  : T;

export function resolveConfigFunctions<T>(
  datum: T,
  bag: DatasetDatumFnResolverBag
): Res<T>;
export function resolveConfigFunctions<T extends Array<any>>(
  datum: T,
  bag: DatasetDatumFnResolverBag
): Array<Res<T[number]>>;
export function resolveConfigFunctions(
  datum: any,
  bag: DatasetDatumFnResolverBag
): any {
  if (Array.isArray(datum)) {
    return datum.map((v) => resolveConfigFunctions(v, bag));
  }

  if (datum != null && typeof datum === 'object') {
    // Use for loop instead of reduce as it faster.
    const ready = {};
    for (const [k, v] of Object.entries(datum as object)) {
      ready[k] = resolveConfigFunctions(v, bag);
    }
    return ready;
  }

  if (typeof datum === 'function') {
    try {
      return datum(bag);
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.error(
        'Failed to resolve function %s(%o) with error %s',
        datum.name,
        bag,
        error.message
      );
      return null;
    }
  }

  return datum;
}

/**
 * Checks the loading status of a layer taking into account the base layer and
 * the compare layer if any.
 * @param asyncLayer The async layer to check
 * @returns Coalesced status
 */
export function checkLayerLoadStatus(asyncLayer: AsyncDatasetLayer) {
  const { baseLayer, compareLayer } = asyncLayer;

  if (
    baseLayer.status === S_SUCCEEDED &&
    (!compareLayer || compareLayer.status === S_SUCCEEDED)
  ) {
    return S_SUCCEEDED;
  }

  if (
    baseLayer.status === S_LOADING ||
    (compareLayer && compareLayer.status === S_LOADING)
  ) {
    return S_LOADING;
  }

  if (
    baseLayer.status === S_FAILED ||
    (compareLayer && compareLayer.status === S_FAILED)
  ) {
    return S_FAILED;
  }

  return S_IDLE;
}

declare global {
  interface Array<T> {
    last: T;
  }
}

type AsyncDatasetLayerData<T extends 'baseLayer' | 'compareLayer'> = Exclude<
  AsyncDatasetLayer[T],
  null
>['data'];

/**
 * Resolves the temporal extend of the given Async Layer.
 * Uses the properties from the timeseries to generate the layer's full temporal
 * extent.
 *
 * @param layerData The Async layer data.
 * @returns Array of Dates
 */
export function resolveLayerTemporalExtent(
  layerData:
    | AsyncDatasetLayerData<'baseLayer'>
    | AsyncDatasetLayerData<'compareLayer'>
): Date[] | null {
  if (!layerData?.timeseries) return null;

  const { domain, isPeriodic, timeDensity } = layerData.timeseries;

  if (!isPeriodic) return domain.map((d) => utcString2userTzDate(d));

  if (timeDensity === 'year') {
    return eachYearOfInterval({
      start: utcString2userTzDate(domain[0]),
      end: utcString2userTzDate(domain.last)
    });
  } else if (timeDensity === 'month') {
    return eachMonthOfInterval({
      start: utcString2userTzDate(domain[0]),
      end: utcString2userTzDate(domain.last)
    });
  } else if (timeDensity === 'day') {
    return eachDayOfInterval({
      start: utcString2userTzDate(domain[0]),
      end: utcString2userTzDate(domain.last)
    });
  }

  throw new Error(
    `Invalid time density [${timeDensity}] on layer [${layerData.id}]`
  );
}

// There are cases when the data can't be displayed properly on low zoom levels.
// In these cases instead of displaying the raster tiles, we display markers to
// indicate whether or not there is data in a given location. When the user
// crosses the marker threshold, if below the min zoom we have to request the
// marker position, and if above we have to register a mosaic query. Since this
// switching can happen several times, we cache the api response using the
// request params as key.
const quickCache = new Map<string, any>();
export async function requestQuickCache(
  url: string,
  payload,
  controller: AbortController
) {
  const key = `${url}${JSON.stringify(payload)}`;

  // No cache found, make request.
  if (!quickCache.has(key)) {
    const response = await axios.post(url, payload, {
      signal: controller.signal
    });
    quickCache.set(key, response.data);
  }
  return quickCache.get(key);
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

export function getMergedBBox(features: StacFeature[]) {
  const mergedBBox = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ] as [number, number, number, number];
  features.forEach((feature) => {
    if (feature.bbox[0] < mergedBBox[0]) mergedBBox[0] = feature.bbox[0];
    if (feature.bbox[1] < mergedBBox[1]) mergedBBox[1] = feature.bbox[1];
    if (feature.bbox[2] > mergedBBox[2]) mergedBBox[2] = feature.bbox[2];
    if (feature.bbox[3] > mergedBBox[3]) mergedBBox[3] = feature.bbox[3];
  });
  return mergedBBox;
}

export function checkFitBoundsFromLayer(
  layerBounds?: [number, number, number, number],
  mapInstance?: mapboxgl.Map
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
