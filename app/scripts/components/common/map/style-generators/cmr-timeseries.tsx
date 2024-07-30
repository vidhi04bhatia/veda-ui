import React from 'react';

import { useCMR } from './hooks';
import { RasterPaintLayer } from './raster-paint-layer';
import { RasterTimeseriesProps } from './raster-timeseries';

interface AssetUrlReplacement {
  from: string;
  to: string;
}

export type CMRTimeseriesProps = RasterTimeseriesProps & {
  assetUrlReplacements?: AssetUrlReplacement
};

export function CMRTimeseries(props: CMRTimeseriesProps) {
  const {
    id,
    stacCol,
    stacApiEndpoint,
    date,
    assetUrlReplacements,
    onStatusChange,
    sourceParams,
  } = props;

  const stacApiEndpointToUse = stacApiEndpoint?? process.env.API_STAC_ENDPOINT;
  const tileParams = useCMR({
    id,
    stacCol,
    stacApiEndpointToUse,
    date,
    assetUrlReplacements,
    stacApiEndpoint,
    onStatusChange,
    sourceParams
  });
  return <RasterPaintLayer {...props} tileParams={tileParams} />;
}