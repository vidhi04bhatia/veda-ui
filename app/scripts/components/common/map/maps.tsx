import React, {
  ReactNode,
  Children,
  useMemo,
  ReactElement,
  JSXElementConstructor,
  useState,
  createContext
} from 'react';
import styled from 'styled-components';
import {
  CollecticonChevronLeftSmall,
  CollecticonChevronRightSmall,
  iconDataURI
} from '@devseed-ui/collecticons';
import { themeVal } from '@devseed-ui/theme-provider';
import { ProjectionOptions } from 'veda';
import useDimensions from 'react-cool-dimensions';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'mapbox-gl-compare/dist/mapbox-gl-compare.css';
import MapboxStyleOverride from './mapbox-style-override';
import { Styles } from './styles';
import useMapCompare from './hooks/use-map-compare';
import MapComponent from './map-component';
import useMaps, { useMapsContext } from './hooks/use-maps';
import { Cursor } from './types';

const chevronRightURI = () =>
  iconDataURI(CollecticonChevronRightSmall, {
    color: 'white'
  });

const chevronLeftURI = () =>
  iconDataURI(CollecticonChevronLeftSmall, {
    color: 'white'
  });

const MapsContainer = styled.div`
  ${MapboxStyleOverride}
  height: 100%;

  .mapboxgl-map {
    position: absolute !important;
    inset: 0;
  }

  .mapboxgl-compare .compare-swiper-vertical {
    background: ${themeVal('color.primary')};
    display: flex;
    align-items: center;
    justify-content: center;

    &::before,
    &::after {
      display: inline-block;
      content: '';
      background-repeat: no-repeat;
      background-size: 1rem 1rem;
      width: 1rem;
      height: 1rem;
    }

    &::before {
      background-image: url('${chevronLeftURI()}');
    }
    &::after {
      background-image: url('${chevronRightURI()}');
    }
  }
`;

type MapsProps = Pick<MapsContextWrapperProps, 'projection'> & {
  children: ReactNode;
};

function Maps({ children, projection }: MapsProps) {
  // Instantiate MGL Compare, if compare is enabled
  useMapCompare();

  // Split children into layers and controls, using all children provided
  const { generators, compareGenerators, controls } = useMemo(() => {
    const childrenArr = Children.toArray(children) as ReactElement[];

    const sortedChildren = childrenArr.reduce(
      (acc, child) => {
        const componentName = (child.type as JSXElementConstructor<any>).name;
        if (componentName === 'Compare') {
          acc.compareGenerators = Children.toArray(
            child.props.children
          ) as ReactElement[];
        } else if (['Basemap', 'RasterTimeseries'].includes(componentName)) {
          acc.generators = [...acc.generators, child];
        } else {
          acc.controls = [...acc.controls, child];
        }
        return acc;
      },
      {
        generators: [] as ReactElement[],
        controls: [] as ReactElement[],
        compareGenerators: [] as ReactElement[]
      }
    );

    return sortedChildren;
  }, [children]);

  const maps = useMaps();

  const { observe } = useDimensions({
    onResize: () => {
      setTimeout(() => {
        maps.main?.resize();
        maps.compared?.resize();
      }, 0);
    }
  });

  const { containerId } = useMapsContext();

  return (
    <MapsContainer id={containerId} ref={observe}>
      <Styles>
        {generators}
        <MapComponent controls={controls} projection={projection} />
      </Styles>
      {!!compareGenerators.length && (
        <Styles isCompared>
          {compareGenerators}
          <MapComponent
            isCompared
            controls={controls}
            projection={projection}
          />
        </Styles>
      )}
    </MapsContainer>
  );
}

export interface MapsContextWrapperProps {
  children: ReactNode;
  id: string;
  projection?: ProjectionOptions;
}

export default function MapsContextWrapper(props: MapsContextWrapperProps) {
  const { id } = props;
  const mainId = `main-map-${id}`;
  const comparedId = `compared-map-${id}`;
  const containerId = `comparison-container-${id}`;

  // Holds the initial view state for the main map, used by compare map at mount
  const [initialViewState, setInitialViewState] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 1
  });

  const [cursor, setCursor] = useState<Cursor>('grab');

  return (
    <MapsContext.Provider
      value={{
        initialViewState,
        setInitialViewState,
        mainId,
        comparedId,
        containerId,
        cursor,
        setCursor
      }}
    >
      <Maps {...props}>{props.children}</Maps>
    </MapsContext.Provider>
  );
}

interface MapsContextType {
  initialViewState: any;
  setInitialViewState: (viewState: any) => void;
  mainId: string;
  comparedId: string;
  containerId: string;
  cursor: Cursor;
  setCursor: (cursor: Cursor) => void;
}

export const MapsContext = createContext<MapsContextType>({
  initialViewState: {},
  setInitialViewState: () => undefined,
  mainId: '',
  comparedId: '',
  containerId: '',
  cursor: 'grab',
  setCursor: () => undefined
});
