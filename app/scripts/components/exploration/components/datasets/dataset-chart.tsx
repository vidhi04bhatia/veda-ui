import React, { useMemo } from 'react';
import { useTheme } from 'styled-components';
import { extent, scaleLinear, ScaleTime, line, area, ScaleLinear } from 'd3';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import {
  CollecticonChartLine,
} from '@devseed-ui/collecticons';
import { RIGHT_AXIS_SPACE, AXIS_BG_COLOR } from '../../constants';
import { DatasetTrackMessage } from './dataset-track-message';
import { DataMetric } from './analysis-metrics';
import LayerChartAnalysisMenu from './layer-chart-analysis-menu';
import { getNumForChart } from '$components/common/chart/utils';
import {
  TimelineDatasetAnalysisSuccess,
  TimelineDatasetSuccess
} from '$components/exploration/types.d.ts';

const CHART_MARGIN = 8;

interface DatasetChartProps {
  width: number;
  xScaled: ScaleTime<number, number>;
  isVisible: boolean;
  dataset: TimelineDatasetSuccess;
  activeMetrics: DataMetric[];
  highlightDate?: Date;
  onUpdateSettings: (type: string, m: DataMetric[]) => void;
}

const ChartAnalysisMenu = styled.div<{axisWidth: number}>`
  width: inherit;
  position: relative;
  display: flex;
  justify-content: end;
  margin-right: calc(${props=> props.axisWidth}px + 0.5rem);
  z-index: 3000;
`;
const AxisBackground = styled.div<{axisWidth: number}>`
  position: absolute;
  right: 0;
  top: 0;
  width: ${props=> props.axisWidth}px;
  height: 100%;
  background-color: ${AXIS_BG_COLOR};
  z-index: -1;
`;

export function DatasetChart(props: DatasetChartProps) {
  const { xScaled, width, isVisible, dataset, activeMetrics, highlightDate, onUpdateSettings } = props;
  const analysisData = dataset.analysis as TimelineDatasetAnalysisSuccess;
  const timeseries = analysisData.data.timeseries;
  const theme = useTheme();
  const areaDataKey = 'stdArea';
  const height = 180;

  // Simplifying the enhancedTimeseries mapping
  const enhancedTimeseries = timeseries.map(e => ({
    ...e,
    [areaDataKey]: [e.mean - e.std, e.mean + e.std],
  }));

  // Filter line and area metrics once, avoiding separate filter calls
  const { lineMetrics, areaMetrics } = activeMetrics.reduce<{lineMetrics: DataMetric[], areaMetrics: DataMetric[]}>((acc, metric:DataMetric) => {
    metric.id === 'std' ? acc.areaMetrics.push(metric) : acc.lineMetrics.push(metric);
    return acc;
  }, { lineMetrics: [], areaMetrics: [] });


  const yExtent = useMemo(() => {
    const extents = [
      ...enhancedTimeseries.flatMap(d => extent(lineMetrics.map(m => d[m.id]))),
      ...(areaMetrics.length ? enhancedTimeseries.flatMap(d => extent([d[areaDataKey]].flat())) : [])
    ].filter(Boolean); // Filter out falsey values 
    return extent(extents.flat()) as [undefined, undefined] | [number, number];
  }, [enhancedTimeseries, lineMetrics, areaMetrics]);

  const y = useMemo(() => {
    const [min = 0, max = 0] = yExtent;
    return scaleLinear()
      .domain([(min * 0.95 > 0) ? 0 : min * 0.95, max * 1.05])
      .range([height - CHART_MARGIN * 2, 0]);
  }, [yExtent, height]);


  const chartAnalysisIconTrigger: JSX.Element = <CollecticonChartLine meaningful title='View layer options' />;
  
  return (
    <div>
      {!activeMetrics.length && (
        <DatasetTrackMessage>
          There are no active metrics to visualize.
        </DatasetTrackMessage>
      )}
      <ChartAnalysisMenu axisWidth={RIGHT_AXIS_SPACE}>
        <LayerChartAnalysisMenu activeMetrics={activeMetrics} onChange={onUpdateSettings} triggerIcon={chartAnalysisIconTrigger} />
      </ChartAnalysisMenu>
      <AxisBackground axisWidth={RIGHT_AXIS_SPACE} />
      <svg width={width + RIGHT_AXIS_SPACE} height={height}>
        <clipPath id='data-clip'>
          <rect width={width} height={height} />
        </clipPath>

        <g transform={`translate(0, ${CHART_MARGIN})`}>
          <AxisGrid
            yLabel={dataset.data.legend?.unit?.label}
            y={y}
            width={width}
            height={height}
            isVisible={isVisible}
          />
        </g>
        {/* This is where the line is drawn */}
        <g clipPath='url(#data-clip)'>
          <g transform={`translate(0, ${CHART_MARGIN})`}>
          {areaMetrics.map(
              (metric) =>
              enhancedTimeseries.some((d) => !isNaN(d[metric.id])) && (
                  <DataArea
                    key={metric.id}
                    x={xScaled}
                    y={y}
                    prop={areaDataKey}
                    data={enhancedTimeseries}
                    color={theme.color?.[metric.themeColor]}
                    isVisible={isVisible}
                  />
                )
            )}
            {lineMetrics.map(
              (metric) =>
              enhancedTimeseries.some((d) => !isNaN(d[metric.id])) && (
                  <DataLine
                    key={metric.id}
                    x={xScaled}
                    y={y}
                    prop={metric.id}
                    data={timeseries}
                    style={metric.style}
                    color={theme.color?.[metric.themeColor]}
                    isVisible={isVisible}
                    highlightDate={highlightDate}
                  />
                )
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}


interface DataAreaProps {
  x: ScaleTime<number, number>;
  y: ScaleLinear<number, number>;
  prop: string;
  data: any[];
  color: string;
  isVisible: boolean;
}
interface DateLineProps extends DataAreaProps {
  highlightDate?: Date;
  style?: any;
}

interface DataItem {
  date: Date;
  [key: string]: [number, number] | Date;
}

function DataArea(props: DataAreaProps) {
  const { x, y, prop, data, color, isVisible } = props;
  
  const path = useMemo(() => {
    const areaGenerator = area<DataItem>()
    .defined((d) => d[prop] !== null)
    .x((d) => x(d.date ?? 0)) 
    .y0((d) => y(d[prop] ? d[prop][0] : 0)) 
    .y1((d) => y(d[prop] ? d[prop][1] : 0));

    return areaGenerator(data);
  }, [x, y, data]);  // Ensure all variables used are listed in the dependencies

  const maxOpacity = isVisible ? 1 : 0.25;

  if (!path) return null;

  return (
    <g>
      <motion.path
        initial={{ opacity: 0 }}
        animate={{ opacity: maxOpacity }}
        transition={{ duration: 0.16 }}
        d={path}
        fill={color}
        fillOpacity={0.5}
        stroke={color}
      />
    </g>
  );
}

function DataLine(props: DateLineProps) {
  const { x, y, prop, data, color, style, isVisible, highlightDate } =
    props;

  const path = useMemo(
    () =>
      line<Record<string, Date | number | null>>()
        .defined((d) => d[prop] !== null)
        .x((d) => x(d.date ?? 0))
        .y((d) => y(d[prop] as number))(data),
    [x, y, prop, data]
  );

  const maxOpacity = isVisible ? 1 : 0.25;

  if (!path) return null;

  return (
    <g>
      <motion.path
        id={prop}
        initial={{ opacity: 0 }}
        animate={{ opacity: maxOpacity }}
        transition={{ duration: 0.16 }}
        d={path}
        fill='none'
        stroke={color}
        {...style}
      />
      {data.map((d) => {
        if (typeof d[prop] !== 'number') return false;

        const highlight =
          isVisible && highlightDate?.getTime() === d.date.getTime();

        return highlight? (
          <motion.circle
            initial={{ opacity: 0 }}
            animate={{ opacity: maxOpacity }}
            transition={{ duration: 0.16 }}
            key={d.date}
            cx={x(d.date)}
            cy={y(d[prop])}
            r={2}
            fill={color}
            stroke='#fff'
          />
        ): false;
      })}
    </g>
  );
}

interface AxisGridProps {
  y: ScaleLinear<number, number>;
  width: number;
  height: number;
  yLabel?: string;
  isVisible: boolean;
}

function AxisGrid(props: AxisGridProps) {
  const { y, width, height, isVisible, yLabel } = props;

  const theme = useTheme();
  const ticks = y.ticks(5);
  return (
    <AnimatePresence>
      <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
      >
          {yLabel && (
            <text
              y={width + RIGHT_AXIS_SPACE - 20}
              x={-height / 2}
              transform='rotate(-90)'
              textAnchor='middle'
              fontSize='0.75rem'
              fill={theme.color?.base}
              margin-right='2rem'
            >
              {yLabel}
            </text>
          )}
          {ticks.map((tick) => (
            <React.Fragment key={tick}>
              <line
                key={tick}
                x1={0}
                x2={width + 6}
                y1={y(tick)}
                y2={y(tick)}
                stroke={theme.color?.['base-100']}
                strokeOpacity={isVisible ? 1 : 0.5}
              />
              <text
                x={width + 8}
                y={y(tick)}
                fontSize='0.75rem'
                dy='0.25em'
                fill={theme.color?.base}
                fillOpacity={isVisible ? 1 : 0.5}
              >
                {getNumForChart(tick)}
              </text>
            </React.Fragment>
          ))}
      </motion.g>
    </AnimatePresence>
  );
}
