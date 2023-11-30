import { AnySourceImpl, Layer, Style } from 'mapbox-gl';
import React, {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useState
} from 'react';
import useMaps from './hooks/use-maps';
import {
  ExtendedLayer,
  ExtendedMetadata,
  GeneratorStyleParams,
  LayerOrderPosition
} from './types';

interface StylesContextType {
  updateStyle: (params: GeneratorStyleParams) => void;
  style?: Style;
  updateMetaData?: (params: unknown) => void;
  metaData?: unknown;
  isCompared?: boolean;
}

export const StylesContext = createContext<StylesContextType>({
  updateStyle: (params: GeneratorStyleParams) => {
    return params;
  },
  isCompared: false
});

const LAYER_ORDER: LayerOrderPosition[] = [
  'basemap-background',
  'raster',
  'vector',
  'basemap-foreground',
  'markers'
];

export type ExtendedStyle = ReturnType<typeof generateStyle>;

// Takes in a dictionary associating each generator id with a series of
//  Mapbox layers and sources to be added to the final style. Outputs
//  a style object directly usable by the map instance.
const generateStyle = (
  stylesData: Record<string, GeneratorStyleParams>,
  currentMapStyle
) => {
  let sources: Record<string, AnySourceImpl> = {};
  let layers: ExtendedLayer[] = [];

  Object.entries(stylesData).forEach(([generatorId, generatorParams]) => {
    // TODO check duplicate source ids?
    sources = {
      ...sources,
      ...generatorParams.sources
    };

    const generatorLayers = generatorParams.layers.map((generatorLayer) => {
      const metadata: ExtendedMetadata = generatorLayer.metadata ?? {};
      metadata.generatorId = generatorId;

      const mapLayer = { ...generatorLayer, metadata } as Layer;

      if (generatorParams.params?.hidden) {
        mapLayer.layout = {
          ...mapLayer.layout,
          visibility: 'none'
        };
      }
      return mapLayer as ExtendedLayer;
    });

    layers = [...layers, ...generatorLayers];
  });

  // Allow sort as it uses a copy of the array so mutating is ok
  /* eslint-disable-next-line fp/no-mutating-methods */
  layers = [...layers].sort((layerA, layerB) => {
    const layerAOrder = layerA.metadata?.layerOrderPosition;
    const layerBOrder = layerB.metadata?.layerOrderPosition;
    const layerAIndex = LAYER_ORDER.indexOf(layerAOrder);
    const layerBIndex = LAYER_ORDER.indexOf(layerBOrder);
    const layerOrder = layerAIndex - layerBIndex;
    const generatorA = stylesData[layerA.metadata?.generatorId];
    const generatorB = stylesData[layerB.metadata?.generatorId];
    const generatorOrder =
      generatorA.params?.generatorOrder !== undefined &&
      generatorB.params?.generatorOrder !== undefined
        ? generatorA.params.generatorOrder - generatorB.params.generatorOrder
        : 0;
    // If compared layers have different layer orders, sort by layer order, otherwise
    // fallback on generatorId to ensure layer stacks from the same generator stay contiguous
    return layerOrder !== 0 ? layerOrder : generatorOrder;
  });

  // Include existent layers/sources not created by the generators.
  // This is needed to avoid a flickering effect of the aoi drawing layer which
  // was very visible while the analysis was loading. This would happen because
  // the dataset layers update, causing the style to be generated again. This
  // would cause the aoi layers to be removed and then re-added by the plugin
  // causing a flickering effect. Bu keeping any layer we did not generate, we
  // avoid this issue.
  const nonGeneratorLayers =
    currentMapStyle?.layers.filter((layer) => !layer.metadata?.generatorId) ??
    [];
  const noneGeneratorSources = nonGeneratorLayers.reduce((acc, layer) => {
    const sourceId = layer.source;
    return !sourceId || acc[sourceId]
      ? acc
      : {
          ...acc,
          [sourceId]: currentMapStyle.sources[sourceId]
        };
  }, {});

  layers = [...layers, ...nonGeneratorLayers];
  sources = { ...sources, ...noneGeneratorSources };

  return {
    version: 8,
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    // This is the spritesheet used in the default satellite basemap (cldu1cb8f00ds01p6gi583w1m)
    sprite:
      'mapbox://sprites/covid-nasa/cldu1cb8f00ds01p6gi583w1m/e3w0e56evrnnyy9tj4v36mbo4',
    layers,
    sources
  };
};

export function Styles({
  onStyleUpdate,
  children,
  isCompared
}: {
  onStyleUpdate?: (style: ExtendedStyle) => void;
  children?: ReactNode;
  isCompared?: boolean;
}) {
  const [stylesData, setStylesData] = useState<
    Record<string, GeneratorStyleParams>
  >({});

  const [style, setStyle] = useState<Style | undefined>();

  const updateStyle = useCallback((params: GeneratorStyleParams) => {
    setStylesData((prevStyle) => ({
      ...prevStyle,
      [params.generatorId]: params
    }));
  }, []);

  const { main } = useMaps();

  useEffect(() => {
    const style = generateStyle(stylesData, main?.getStyle());
    onStyleUpdate?.(style);
    setStyle(style as any);
  }, [stylesData, onStyleUpdate]);

  return (
    <StylesContext.Provider value={{ updateStyle, style, isCompared }}>
      {children}
    </StylesContext.Provider>
  );
}
