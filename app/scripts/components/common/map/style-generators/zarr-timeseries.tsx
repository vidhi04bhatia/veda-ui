import React from 'react';

import { useZarr } from './hooks';
import { RasterPaintLayer } from './raster-paint-layer';
import { RasterTimeseriesProps } from './raster-timeseries';


export function ZarrTimeseries(props: RasterTimeseriesProps) {
  const {
    id,
    stacCol,
    stacApiEndpoint,
    date,
    onStatusChange,
  } = props;

  const stacApiEndpointToUse = stacApiEndpoint?? process.env.API_STAC_ENDPOINT;
  const tileParams = useZarr({id, stacCol, stacApiEndpointToUse, date, onStatusChange, sourceParams: props.sourceParams});  
  return <RasterPaintLayer {...props} tileParams={tileParams} />;
}