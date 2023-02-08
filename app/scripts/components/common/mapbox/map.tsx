import React, {
  useEffect,
  RefObject,
  MutableRefObject,
  ReactElement,
  useState,
  useMemo
} from 'react';
import styled, { useTheme } from 'styled-components';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ProjectionOptions } from 'veda/thematics';

import { AoiChangeListenerOverload, AoiState } from '../aoi/types';
import MapboxStyleOverride from './mapbox-style-override';
import MbDrawPopover from './aoi/mb-draw-popover';
import { aoiCursorStyles, useMbDraw } from './aoi/mb-aoi-draw';
import MapOptions from './map-options';
import { useMapboxControl } from './use-mapbox-control';
import { convertProjectionToMapbox } from './map-options/utils';

import { BasemapId, BASEMAP_STYLES } from './map-options/basemaps';
import { round } from '$utils/format';

mapboxgl.accessToken = process.env.MAPBOX_TOKEN ?? '';

const SingleMapContainer = styled.div`
  && {
    position: absolute;
    inset: 0;
  }
  ${MapboxStyleOverride}
  ${aoiCursorStyles}
`;

interface SimpleMapProps {
  [key: string]: unknown;
  mapRef: MutableRefObject<mapboxgl.Map | null>;
  containerRef: RefObject<HTMLDivElement>;
  onLoad?(e: mapboxgl.EventData): void;
  onMoveEnd?(e: mapboxgl.EventData): void;
  onUnmount?: () => void;
  mapOptions: Partial<Omit<mapboxgl.MapboxOptions, 'container'>>;
  withGeocoder?: boolean;
  aoi?: AoiState;
  onAoiChange?: AoiChangeListenerOverload;
  projection?: ProjectionOptions;
  onProjectionChange?: (projection: ProjectionOptions) => void;
  attributionPosition?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | false;
}

export function SimpleMap(props: SimpleMapProps): ReactElement {
  const {
    mapRef,
    containerRef,
    onLoad,
    onMoveEnd,
    onUnmount,
    mapOptions,
    withGeocoder,
    aoi,
    onAoiChange,
    projection,
    onProjectionChange,
    attributionPosition = 'bottom-left',
    ...rest
  } = props;

  const theme = useTheme();

  const [currentBasemapStyleId, setCurrentBasemapStyleId] =
    useState<BasemapId>('satellite');

  const mapOptionsControl = useMapboxControl(() => {
    if (!projection || !onProjectionChange) return null;

    return (
      <MapOptions
        projection={projection}
        onProjectionChange={onProjectionChange}
        currentBasemapStyleId={currentBasemapStyleId}
      />
    );
  }, [projection, onProjectionChange]);

  const styleUrl = useMemo(() => {
    return currentBasemapStyleId
      ? BASEMAP_STYLES.find((b) => b.id === currentBasemapStyleId)!.url
      : BASEMAP_STYLES[0].url;
  }, [currentBasemapStyleId]);

  useEffect(() => {
    if (!mapRef.current || !styleUrl) return;

    console.log('updating style', styleUrl);
    mapRef.current.setStyle(styleUrl);
  }, [styleUrl]);

  useEffect(() => {
    if (!containerRef.current) return;

    const mbMap = new mapboxgl.Map({
      container: containerRef.current,
      attributionControl: false,
      projection: projection && convertProjectionToMapbox(projection),
      ...mapOptions
    });

    mapRef.current = mbMap;

    if (onProjectionChange && projection) {
      mapRef.current.addControl(mapOptionsControl, 'top-left');
    }

    // Add Geocoder control
    if (withGeocoder) {
      const geocoderControl = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        marker: false,
        collapsed: true
      }) as MapboxGeocoder & { _inputEl: HTMLInputElement };

      // Close the geocoder when the result is selected.
      geocoderControl.on('result', () => {
        geocoderControl.clear();
        geocoderControl._inputEl.blur();
      });

      mbMap.addControl(geocoderControl, 'top-left');
    }

    // Add zoom controls without compass.
    if (mapOptions?.interactive !== false) {
      mbMap.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        'top-left'
      );
    }

    onLoad && mbMap.once('load', onLoad);

    // Trigger a resize to handle flex layout quirks.
    setTimeout(() => mbMap.resize(), 1);

    return () => {
      mbMap.remove();
      mapRef.current = null;
      onUnmount?.();
    };
    // Only use the props on mount. We don't want to update the map if they
    // change.
  }, []);

  // Handle Attribution
  useEffect(() => {
    if (!mapRef.current || !attributionPosition) return;

    const ctrl = new mapboxgl.AttributionControl();
    mapRef.current.addControl(ctrl, attributionPosition);
    return () => {
      mapRef.current?.removeControl(ctrl);
    };
    /* mapRef is a ref */
  }, [attributionPosition]);

  useEffect(() => {
    if (!mapRef.current || !projection) return;
    // @ts-expect-error setProjection is missing on type
    mapRef.current.setProjection({ ...convertProjectionToMapbox(projection) });
  }, [mapRef, projection]);

  useEffect(() => {
    if (!mapRef.current || typeof onMoveEnd !== 'function') return;
    const mbMap = mapRef.current;

    const listener = (e) => {
      onMoveEnd({
        // The existence of originalEvent indicates that it was not caused by
        // a method call.
        userInitiated: Object.prototype.hasOwnProperty.call(e, 'originalEvent'),
        lng: round(mbMap.getCenter().lng, 4),
        lat: round(mbMap.getCenter().lat, 4),
        zoom: round(mbMap.getZoom(), 2)
      });
    };

    mbMap.on('moveend', listener);

    return () => {
      mbMap.off('moveend', listener);
    };
  }, [onMoveEnd, mapRef]);

  useMbDraw({
    mapRef,
    theme,
    onChange: onAoiChange,
    drawing: aoi?.drawing,
    selectedContext: aoi?.selectedContext,
    featureCollection: aoi?.featureCollection
  });

  return (
    <>
      <SingleMapContainer ref={containerRef} {...rest} />
      <MbDrawPopover
        mapRef={mapRef}
        onChange={onAoiChange}
        selectedContext={aoi?.selectedContext}
      />
    </>
  );
}
