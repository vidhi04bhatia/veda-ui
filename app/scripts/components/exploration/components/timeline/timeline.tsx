import { Button } from '@devseed-ui/button';
import { CollecticonPlusSmall } from '@devseed-ui/collecticons';
import { glsp, themeVal } from '@devseed-ui/theme-provider';
import { Heading } from '@devseed-ui/typography';
import { select, zoom } from 'd3';
import {
  add,
  isAfter,
  isBefore,
  isWithinInterval,
  max,
  startOfDay,
  sub
} from 'date-fns';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import useDimensions from 'react-cool-dimensions';
import styled from 'styled-components';

import { DatasetList } from '../datasets/dataset-list';

import { applyTransform, isEqualTransform, rescaleX } from './timeline-utils';
import { TimelineControls } from './timeline-controls';
import {
  TimelineHeadIn,
  TimelineHeadPoint,
  TimelineHeadOut,
  TimelineRangeTrack
} from './timeline-head';
import { DateGrid } from './date-axis';

import {
  selectedCompareDateAtom,
  selectedDateAtom,
  selectedIntervalAtom
} from '$components/exploration/atoms/dates';
import { timelineDatasetsAtom } from '$components/exploration/atoms/datasets';
import {
  timelineSizesAtom,
  timelineWidthAtom,
  zoomTransformAtom
} from '$components/exploration/atoms/timeline';
import { useTimelineDatasetsDomain } from '$components/exploration/atoms/hooks';
import { RIGHT_AXIS_SPACE } from '$components/exploration/constants';
import {
  useLayoutEffectPrevious,
  usePreviousValue
} from '$utils/use-effect-previous';
import {
  useScaleFactors,
  useScales
} from '$components/exploration/hooks/scales-hooks';
import {
  TimelineDatasetStatus,
  TimelineDatasetSuccess,
  ZoomTransformPlain
} from '$components/exploration/types.d.ts';
import { useInteractionRectHover } from '$components/exploration/hooks/use-dataset-hover';
import { datasetLayers } from '$components/exploration/data-utils';
import { useAnalysisController } from '$components/exploration/hooks/use-analysis-data-request';
import useAois from '$components/common/map/controls/hooks/use-aois';

const TimelineWrapper = styled.div`
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-flow: column;
  height: 100%;

  svg {
    display: block;
  }
`;

const NoData = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  max-width: 20rem;
  margin: auto;
  padding: 2rem;
  gap: 1rem;
`;

const InteractionRect = styled.div`
  position: absolute;
  left: 20rem;
  top: 3.5rem;
  bottom: 0;
  right: ${RIGHT_AXIS_SPACE}px;
  /* background-color: rgba(255, 0, 0, 0.08); */
  box-shadow: 1px 0 0 0 ${themeVal('color.base-200')},
    inset 1px 0 0 0 ${themeVal('color.base-200')};
  z-index: 100;
`;

const TimelineHeader = styled.header`
  display: flex;
  flex-shrink: 0;
  box-shadow: 0 1px 0 0 ${themeVal('color.base-200')};
`;

const TimelineDetails = styled.div`
  width: 20rem;
  flex-shrink: 0;
  box-shadow: 1px 0 0 0 ${themeVal('color.base-200')},
    0 1px 0 0 ${themeVal('color.base-200')};
  padding: ${glsp(0.5, 0.5, 0.5, 2)};
  z-index: 1;
`;

const Headline = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TimelineContent = styled.div`
  height: 100%;
  min-height: 0;
  display: flex;
  width: 100%;
  position: relative;
`;

const TimelineContentInner = styled.div`
  height: 100%;
  min-height: 0;
  display: flex;
  overflow-y: scroll;
  overflow-x: hidden;
  width: 100%;
  position: relative;
`;

interface TimelineProps {
  onDatasetAddClick: () => void;
}

export default function Timeline(props: TimelineProps) {
  const { onDatasetAddClick } = props;

  // Refs for non react based interactions.
  // The interaction rect is used to capture the different d3 events for the
  // zoom.
  const interactionRef = useRef<HTMLDivElement>(null);
  // Because the interaction rect traps the events, we need a ref to the
  // container to propagate the needed events to it, like scroll.
  const datasetsContainerRef = useRef<HTMLDivElement>(null);

  const datasets = useAtomValue(timelineDatasetsAtom);

  const dataDomain = useTimelineDatasetsDomain();

  // Observe the width of the timeline wrapper and store it.
  // We then use hooks to get the different needed values.
  const setTimelineWidth = useSetAtom(timelineWidthAtom);
  const { observe } = useDimensions({
    onResize: ({ width }) => {
      setTimelineWidth(width);
    }
  });

  const { contentWidth: width } = useAtomValue(timelineSizesAtom);

  const [selectedDay, setSelectedDay] = useAtom(selectedDateAtom);
  const [selectedCompareDay, setSelectedCompareDay] = useAtom(
    selectedCompareDateAtom
  );
  const [selectedInterval, setSelectedInterval] = useAtom(selectedIntervalAtom);

  const { setObsolete } = useAnalysisController();

  const { features } = useAois();

  useEffect(() => {
    // Set the analysis as obsolete when the selected interval changes.
    setObsolete();
  }, [setObsolete, selectedInterval]);

  const translateExtent = useMemo<[[number, number], [number, number]]>(
    () => [
      [0, 0],
      [width, 0]
    ],
    [width]
  );

  const [zoomTransform, setZoomTransform] = useAtom(zoomTransformAtom);

  // Calculate min and max scale factors, such has each day has a minimum of 2px
  // and a maximum of 100px.
  const { k0, k1 } = useScaleFactors();
  const { scaled: xScaled, main: xMain } = useScales();

  // Create the zoom behavior needed for the timeline interactions.
  const zoomBehavior = useMemo(() => {
    return zoom()
      .scaleExtent([k0, k1])
      .translateExtent(translateExtent)
      .extent(translateExtent)
      .filter((event) => {
        if (event.type === 'wheel' && !event.altKey) {
          // The zoom behavior traps the scroll event. Propagate to the data
          // container to scroll it.
          if (datasetsContainerRef.current) {
            datasetsContainerRef.current.scrollBy(0, event.deltaY);
          }
          return false;
        }
        return true;
      })
      .on('zoom', function (event) {
        const { sourceEvent } = event;

        if (sourceEvent?.type === 'wheel') {
          // Alt key plus wheel makes the browser go back in history. Prevent.
          if (sourceEvent.altKey) {
            sourceEvent.preventDefault();
          }
        }
        const { x, y, k } = event.transform;
        setZoomTransform((t) =>
          isEqualTransform(t, { x, y, k }) ? t : { x, y, k }
        );
      });
  }, [setZoomTransform, translateExtent, k0, k1]);

  useEffect(() => {
    if (!interactionRef.current) return;

    select(interactionRef.current)
      .call(zoomBehavior)
      .on('dblclick.zoom', null)
      .on('click', (event) => {
        const d = xScaled?.invert(event.layerX);
        if (!d) return;

        // TODO: Key click has to be improved! Fixes needed:
        // - Preventing setting start day after end day and vice versa.
        // - Handling when there's no selected interval.
        if (event.shiftKey) {
          setSelectedInterval((interval) =>
            interval ? { ...interval, start: d } : null
          );
        } else if (event.altKey) {
          setSelectedInterval((interval) =>
            interval ? { ...interval, end: d } : null
          );
        } else {
          setSelectedDay(startOfDay(d));
        }
      })
      .on('wheel', function (event) {
        // Wheel is triggered when an horizontal wheel is used or when shift
        // wheel is used. The zoom event is only for vertical wheel so we have
        // to mimic the pan behavior.
        if (event.altKey) {
          event.preventDefault();
        }

        const element = select(this);
        // Get the current zoom transform.
        const currentT = element.property('__zoom');
        // Applying the transform will cause the zoom event to be emitted without
        // a sourceEvent. On the zoom event listener, the updated zoom transform
        // is set on the state, so there's no need to do it here
        applyTransform(
          zoomBehavior,
          element,
          currentT.x - event.deltaX,
          currentT.y,
          currentT.k
        );
      });
  }, [setSelectedDay, xScaled, zoomBehavior]);

  // When a new dataset is added we need to recompute the transform to ensure
  // the timeline view remains the same. Datasets being added cause the scale
  // factors to change.
  // Using useLayoutEffect to ensure the transform is calculate before new
  // renders.
  useLayoutEffectPrevious<
    [number, ZoomTransformPlain, typeof xScaled, typeof xMain, number]
  >(
    ([_k1, _zoomTransform, _xScaled]) => {
      if (
        !interactionRef.current ||
        !_zoomTransform ||
        !_k1 ||
        !_xScaled ||
        !xMain ||
        _k1 === k1
      )
        return;

      // Calculate the new scale factor by using the ration between the old
      // and new scale extents. Can never be less than minimum scale factor (k0)
      const k = Math.max(k0, (k1 / _k1) * _zoomTransform.k);
      // Rescale the main scale to be able to calculate the new x position
      const rescaled = rescaleX(xMain, 0, k);
      // The date at the start of the timeline is the initial domain of the
      // scale used to draw it - the scaled scale in this case.
      const dateAtTimelineStart = _xScaled.domain()[0];

      // Applying the transform will cause the zoom event to be emitted
      // without a sourceEvent. On the zoom event listener, the updated zoom
      // transform is set on the state, so there's no need to do it here.
      applyTransform(
        zoomBehavior,
        select(interactionRef.current),
        rescaled(dateAtTimelineStart) * -1,
        0,
        k
      );
    },
    [k1, zoomTransform, xScaled, xMain, k0]
  );

  const successDatasets = datasets.filter(
    (d): d is TimelineDatasetSuccess => d.status === TimelineDatasetStatus.SUCCESS
  );

  // When a loaded dataset is added from an empty state, compute the correct
  // transform taking into account the min scale factor (k0).
  const successDatasetsCount = successDatasets.length;
  const prevDatasetsCount = usePreviousValue(successDatasets.length);
  useLayoutEffect(() => {
    if (
      !interactionRef.current ||
      prevDatasetsCount !== 0 ||
      successDatasetsCount === 0
    )
      return;

    applyTransform(zoomBehavior, select(interactionRef.current), 0, 0, k0);
  }, [prevDatasetsCount, successDatasetsCount, k0, zoomBehavior]);

  // Set correct dates when the date domain changes.
  const prevDataDomain = usePreviousValue(dataDomain);
  useEffect(() => {
    if (prevDataDomain === dataDomain) return;

    // If all datasets are removed, reset the selected day/interval.
    if (!dataDomain) {
      setSelectedDay(null);
      setSelectedInterval(null);
      return;
    }

    const [start, end] = dataDomain;
    // If the selected day is not within the new domain, set it to the last
    // available dataset date. We can't use the date domain, because the end of
    // the domain is the max date + a duration so that all dataset dates fit in
    // the timeline.
    if (!selectedDay || !isWithinInterval(selectedDay, { start, end })) {
      const maxDate = max(successDatasets.map(d => d.data.domain.last));
      setSelectedDay(maxDate);
    }
  }, [
    prevDataDomain,
    dataDomain,
    setSelectedDay,
    setSelectedInterval,
    selectedDay,
    selectedInterval,
    successDatasets
  ]);

  // Set a date range selection when the user creates a new AOI.
  const prevFeaturesCount = usePreviousValue(features.length);
  useEffect(() => {
    // If no feature change, no selected day, or no domain, skip.
    if (prevFeaturesCount === features.length || !selectedDay || !dataDomain)
      return;

    if (!features.length) {
      // All features were removed. Reset the selected day/interval.
      setSelectedInterval(null);
    }

    if (prevFeaturesCount === 0 && features.length > 0) {
      // We went from 0 features to some features.
      const startDate = sub(selectedDay, { months: 2 });
      const endDate = add(selectedDay, { months: 2 });

      // Set start and end days from the selected day, if able.
      const [start, end] = dataDomain;
      setSelectedInterval({
        start: isAfter(startDate, start) ? startDate : selectedDay,
        end: isBefore(endDate, end) ? endDate : end
      });
    }
  }, [
    features.length,
    prevFeaturesCount,
    selectedDay,
    dataDomain,
    setSelectedInterval
  ]);

  const shouldRenderTimeline = xScaled && dataDomain;

  // Attach the needed event listeners to the interaction rectangle to capture
  // the mouse position. See source file for more information.
  useInteractionRectHover(interactionRef.current);

  // Some of these values depend on each other, but we check all of them so
  // typescript doesn't complain.
  if (datasets.length === 0) {
    return (
      <TimelineWrapper ref={observe}>
        <NoData>
          <p>Select a dataset to start exploration</p>
        </NoData>
      </TimelineWrapper>
    );
  }

  return (
    <TimelineWrapper ref={observe}>
      <InteractionRect
        ref={interactionRef}
        style={!shouldRenderTimeline ? { pointerEvents: 'none' } : undefined}
      />
      <TimelineHeader>
        <TimelineDetails>
          <Headline>
            <Heading as='h2' size='xsmall'>
              Datasets
            </Heading>
            <Button
              variation='base-text'
              size='small'
              onClick={onDatasetAddClick}
            >
              <CollecticonPlusSmall meaningful title='Add dataset' />
            </Button>
          </Headline>
          <p>
            {datasets.length} of {datasetLayers.length}
          </p>
        </TimelineDetails>
        <TimelineControls xScaled={xScaled} width={width} />
      </TimelineHeader>
      <TimelineContent>
        {shouldRenderTimeline && (
          <>
            {selectedDay && (
              <TimelineHeadPoint
                label={selectedCompareDay ? 'A' : undefined}
                domain={dataDomain}
                xScaled={xScaled}
                onDayChange={setSelectedDay}
                selectedDay={selectedDay}
                width={width}
              />
            )}
            {selectedCompareDay && (
              <TimelineHeadPoint
                label='B'
                domain={dataDomain}
                xScaled={xScaled}
                onDayChange={setSelectedCompareDay}
                selectedDay={selectedCompareDay}
                width={width}
              />
            )}
            {selectedInterval && (
              <>
                <TimelineHeadIn
                  domain={dataDomain}
                  xScaled={xScaled}
                  onDayChange={(d) => {
                    setSelectedInterval((interval) => {
                      const prevDay = sub(interval!.end, { days: 1 });
                      return {
                        end: interval!.end,
                        start: isAfter(d, prevDay) ? prevDay : d
                      };
                    });
                  }}
                  selectedDay={selectedInterval.start}
                  width={width}
                />
                <TimelineHeadOut
                  domain={dataDomain}
                  xScaled={xScaled}
                  onDayChange={(d) => {
                    setSelectedInterval((interval) => {
                      const nextDay = add(interval!.start, { days: 1 });
                      return {
                        start: interval!.start,
                        end: isBefore(d, nextDay) ? nextDay : d
                      };
                    });
                  }}
                  selectedDay={selectedInterval.end}
                  width={width}
                />
                <TimelineRangeTrack
                  range={selectedInterval}
                  xScaled={xScaled}
                  width={width}
                />
              </>
            )}

            <DateGrid width={width} xScaled={xScaled} />
          </>
        )}

        <TimelineContentInner ref={datasetsContainerRef}>
          <DatasetList width={width} xScaled={xScaled} />
        </TimelineContentInner>
      </TimelineContent>
    </TimelineWrapper>
  );
}
