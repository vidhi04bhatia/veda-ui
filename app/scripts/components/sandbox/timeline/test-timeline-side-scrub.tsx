import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled, { css, useTheme } from 'styled-components';
import useDimensions from 'react-cool-dimensions';
import { glsp, listReset, themeVal } from '@devseed-ui/theme-provider';
import { datasets as srcDatasets } from './datasets';
import {
  ScaleTime,
  ZoomTransform,
  axisBottom,
  axisTop,
  create,
  drag,
  easeCubicIn,
  extent,
  scaleLinear,
  scalePow,
  scaleTime,
  select,
  zoom
} from 'd3';
import {
  clamp,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfYear
} from 'date-fns';
import { CollecticonPlusSmall } from '@devseed-ui/collecticons';
import { Button } from '@devseed-ui/button';

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

const InteractionRect = styled.div`
  position: absolute;
  inset: 0;
  left: 20rem;
  background-color: rgba(255, 0, 0, 0.08);
  z-index: 1000;
`;

const TimelineHeader = styled.header`
  display: flex;
  flex-shrink: 0;
  box-shadow: 0 1px 0 0 ${themeVal('color.base-200')};
`;

const TimelineDetails = styled.div`
  width: 20rem;
  flex-shrink: 0;
  box-shadow: 1px 0 0 0 ${themeVal('color.base-200')};
  padding: ${glsp(0.5)};
`;

const Headline = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TimelineControls = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column;

  .date-axis {
    margin-top: auto;
  }
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

const DatasetList = styled.ul`
  ${listReset()}
  width: 100%;
  ${({ gridBg }) =>
    gridBg &&
    css`
      background-image: url('${gridBg}');
      background-repeat: repeat-y;
      background-position-x: 20rem;
    `}

  li {
    display: flex;
    box-shadow: 0 1px 0 0 ${themeVal('color.base-200')};
  }
`;

const DatasetInfo = styled.div`
  width: 20rem;
  flex-shrink: 0;
  box-shadow: 1px 0 0 0 ${themeVal('color.base-200')};
  padding: ${glsp(0.5)};
`;

const DatasetData = styled.div`
  padding: ${glsp(0.25, 0)};
`;

const DatasetSvg = styled.svg``;

const GridSvg = styled.svg`
  position: absolute;
  right: 0;
  height: 100%;
  pointer-events: none;
`;

function Timeline() {
  const [datasets, setDatasets] = useState(srcDatasets);

  const { observe, width, height } = useDimensions();

  const interactionRef = useRef<HTMLDivElement>(null);
  const axisSvgRef = useRef<SVGSVGElement>(null);
  const datasetsContainerRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

  const [selectedDay, setSelectedDay] = useState<Date>();

  const [zoomTransform, setZoomTransform] = useState({
    x: 0,
    y: 0,
    k: 1
  });

  const dataDomain = useMemo(
    () => extent(datasets.flatMap((d) => d.domain)) as [Date, Date],
    [datasets]
  );

  const domainDays = useMemo(
    () => (dataDomain[1].getTime() - dataDomain[0].getTime()) / 86400000,
    [dataDomain]
  );

  const xMain = useMemo(() => {
    return scaleTime().domain(dataDomain).range([0, width]);
  }, [dataDomain, width]);

  const xScaled = useMemo(() => {
    return rescaleX(xMain, zoomTransform.x, zoomTransform.k);
  }, [xMain, zoomTransform.x, zoomTransform.k]);

  const xAxis = useMemo(() => {
    return xScaled ? axisBottom(xScaled) : undefined;
  }, [xScaled]);

  const zoomBehavior = useMemo(() => {
    return (
      zoom()
        // Make the maximum zoom level as such as each day has maximum of 100px.
        .scaleExtent([1, 100 / (width / domainDays)])
        .translateExtent([
          [0, 0],
          [width, height]
        ])
        .extent([
          [0, 0],
          [width, height]
        ])
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
        })
    );
  }, [width, height, domainDays]);

  useEffect(() => {
    if (!interactionRef.current) return;

    select(interactionRef.current)
      .call(zoomBehavior)
      .on('dblclick.zoom', null)
      .on('click', (event) => {
        const d = xScaled?.invert(event.layerX);
        d && setSelectedDay(startOfDay(d));
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
        // Apply the delta to the x axis and then constrains according to the
        // zoom definition.
        const updatedT = new ZoomTransform(
          currentT.k,
          currentT.x - event.deltaX,
          currentT.y
        );
        const constrainFn = zoomBehavior.constrain();
        // Constrain the transform according to the timeline bounds.
        const newTransform = constrainFn(
          updatedT,
          [
            [0, 0],
            [width, height]
          ],
          zoomBehavior.translateExtent()
        );

        // Apply transform which will cause the zoom event to be emitted without
        // a sourceEvent.
        zoomBehavior.transform(element, newTransform);
      });
  }, [width, height, xScaled, zoomBehavior]);

  useEffect(() => {
    if (!interactionRef.current) return;

    // Get the current zoom transform.
    const element = select(interactionRef.current);
    const currentT = element.property('__zoom');

    // Programmatically update if different, meaning that it came from setting
    // the state.
    if (!isEqualTransform(currentT, zoomTransform)) {
      const { x, y, k } = zoomTransform;
      zoomBehavior.transform(element, new ZoomTransform(k, x, y));
    }
  }, [zoomBehavior, zoomTransform]);

  useEffect(() => {
    if (!xAxis) return;
    select(axisSvgRef.current).select<SVGGElement>('.x.axis').call(xAxis);
  }, [xAxis]);

  return (
    <TimelineWrapper>
      <InteractionRect ref={interactionRef} />
      {selectedDay ? (
        <TimelineHead
          domain={dataDomain}
          xScaled={xScaled}
          setSelectedDay={setSelectedDay}
          selectedDay={selectedDay}
          height={height}
          width={width}
          onDistance={val => {
            // zoomBehavior.translateBy(select(interactionRef.current), val * -1, 0);
          }}
        />
      ) : (
        false
      )}
      <TimelineHeader>
        <TimelineDetails>
          <Headline>
            <h2>Datasets</h2>{' '}
            <Button variation='base-text' size='small'>
              <CollecticonPlusSmall /> Add
            </Button>
          </Headline>
          <p>X of Y</p>
        </TimelineDetails>
        <TimelineControls ref={observe}>
          <div>{selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null}</div>
          <svg className='date-axis' ref={axisSvgRef} width={width} height={32}>
            <g className='x axis' />
          </svg>
        </TimelineControls>
      </TimelineHeader>
      <TimelineContent>
        {xScaled ? (
          <GridSvg width={width}>
            {xScaled.ticks().map((tick) => (
              <line
                stroke={theme.color?.['base-200']}
                key={tick.getTime()}
                x1={xScaled(tick)}
                y1='0%'
                x2={xScaled(tick)}
                y2='100%'
              />
            ))}
          </GridSvg>
        ) : null}
        <TimelineContentInner ref={datasetsContainerRef}>
          <DatasetList>
            {datasets.map((dataset) => (
              <li key={dataset.title}>
                <DatasetInfo>{dataset.title}</DatasetInfo>
                <DatasetData>
                  <DatasetSvg width={width} height={16}>
                    {dataset.domain.map((date) => {
                      const [start, end] = getBlockBoundaries(
                        date,
                        dataset.timeDensity
                      );
                      const s = xScaled(start);
                      const e = xScaled(end);

                      const isSelected = selectedDay
                        ? isWithinInterval(selectedDay, { start, end })
                        : false;

                      const strokeWidth = 2;
                      return (
                        <React.Fragment key={date.getTime()}>
                          <rect
                            fill={isSelected ? 'red' : 'teal'}
                            y={0}
                            height={16}
                            x={s}
                            width={e - s}
                          />
                          <rect
                            fill={isSelected ? 'darkred' : 'cadetblue'}
                            y={strokeWidth}
                            height={16 - strokeWidth * 2}
                            x={s + strokeWidth}
                            width={e - s - strokeWidth * 2}
                          />
                        </React.Fragment>
                      );
                    })}
                  </DatasetSvg>
                </DatasetData>
              </li>
            ))}
          </DatasetList>
        </TimelineContentInner>
      </TimelineContent>
    </TimelineWrapper>
  );
}

export default Timeline;

const TimelineHeadSVG = styled.svg`
  position: absolute;
  right: 0;
  top: 2rem;
  height: 100%;
  pointer-events: none;
  z-index: 2000;
`;

function TimelineHead(props: any) {
  const {
    domain,
    xScaled,
    selectedDay,
    width,
    setSelectedDay,
    onDistance
  } = props;

  const rectRef = useRef<SVGRectElement>(null);
  const fnRef = useRef(onDistance);
  fnRef.current = onDistance;

  useEffect(() => {
    if (!rectRef.current) return;

    const anim = createAnimation(12);

    const dragger = drag()
      .on('start', function dragstarted() {
        document.body.style.cursor = 'grabbing';
        select(this).attr('cursor', 'grabbing');
      })
      .on('drag', function dragged(event) {
        if (event.x < 0 || event.x > width) {
          anim.run(() => {
            // How much is out of bounds?
            const excess = event.x > width ? event.x - width : event.x;
            const val = dragDistanceScaler(excess);
            console.log('x', event.x, 'excess', excess, 'val', val);
            fnRef.current(val);
          });
          return;
        }
        anim.stop();

        const dx = event.x - event.subject.x;
        const currPos = xScaled(selectedDay);
        const newPos = currPos + dx;

        const dateFromPos = startOfDay(xScaled.invert(newPos));

        const [start, end] = domain;
        const interval = { start, end };

        const newDate = clamp(dateFromPos, interval);

        if (selectedDay.getTime() !== newDate.getTime()) {
          setSelectedDay(newDate);
        }
      })
      .on('end', function dragended() {
        document.body.style.cursor = '';
        select(this).attr('cursor', 'grab');
        anim.stop();
      });

    select(rectRef.current).call(dragger);
  }, [width, domain, selectedDay, setSelectedDay, xScaled]);

  return (
    <TimelineHeadSVG width={width}>
      <line
        x1={xScaled(selectedDay)}
        x2={xScaled(selectedDay)}
        y1={0}
        y2='100%'
        stroke='black'
      />
      <rect
        ref={rectRef}
        fill='black'
        style={{ pointerEvents: 'all', cursor: 'grab' }}
        y={0}
        height={16}
        x={xScaled(selectedDay) - 8}
        width={16}
      />
    </TimelineHeadSVG>
  );
}

/**
 * Rescales the given scale according to the given factors.
 * @param scale Scale to rescale
 * @param x X factor
 * @param k Scale factor
 * @returns new scale
 */
function rescaleX(scale, x, k) {
  const range = scale.range();
  return scale.copy().domain(
    range.map((v) => {
      // New value after scaling
      const value = (v - x) / k;
      // Clamp value to the range
      const valueClamped = Math.max(range[0], Math.min(value, range[1]));
      return scale.invert(valueClamped);
    })
  );
}

function isEqualTransform(t1, t2) {
  return t1.x === t2.x && t1.y === t2.y && t1.k === t2.k;
}

function getBlockBoundaries(date, timeDensity) {
  switch (timeDensity) {
    case 'month':
      return [startOfMonth(date), endOfMonth(date)];
    case 'year':
      return [startOfYear(date), endOfYear(date)];
  }

  return [startOfDay(date), endOfDay(date)];
}

function createAnimation(fps) {
  let running = false;
  let lastRun;
  const frameTime = 1000 / fps;
  let rafId;
  let callback;

  return {
    run(fn) {
      callback = fn;
      running = true;
      function animate(timestamp) {
        if (!running) return;

        const elapsed = lastRun ? timestamp - lastRun : null;
        if (elapsed === null || elapsed >= frameTime) {
          lastRun = timestamp;
          callback?.();
        }
        rafId = requestAnimationFrame(animate);
      }
      rafId = requestAnimationFrame(animate);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }
  };
}

function dragDistanceScaler(value) {
  if (value === 0) return 0;

  const scale = scalePow()
    .domain([-200, 0, 0, 200])
    .range([-100, -10, 10, 100])
    .clamp(true)
    .exponent(2.5);

  return scale(value);
}
