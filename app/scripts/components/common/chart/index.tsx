import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Label,
  Brush,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
  Curve,
  Customized
} from 'recharts';

import TooltipComponent from './tooltip';
import AltTitle from './alt-title';
import { LegendComponent, ReferenceLegendComponent } from './legend';
import {
  getColors,
  timeFormatter,
  convertToTime,
  getNumForChart,
  syncMethodFunction
} from './utils';
import {
  chartMinHeight,
  chartMaxHeight,
  chartAspectRatio,
  defaultMargin,
  highlightColor,
  legendWidth,
  brushRelatedConfigs,
  brushHeight,
} from './constant';
import { ChartWrapperRef } from './analysis/utils';
import BrushCustom from './analysis/brush';
import { useMediaQuery } from '$utils/use-media-query';

const LineChartWithFont = styled(LineChart)`
  font-size: 0.8rem;
`;

const ChartWrapper = styled.div`
  width: 100%;
  grid-column: 1/-1;
`;

const BrushContainer = styled.div`
  width: 100%;
  position: relative;
`;
export interface CommonLineChartProps {
  xKey: string;
  altTitle: string;
  altDesc: string;
  dateFormat: string;
  colors?: string[];
  colorScheme?: string;
  renderLegend?: boolean;
  renderBrush?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  highlightStart?: string;
  highlightEnd?: string;
  highlightLabel?: string;
  uniqueKeys: UniqueKeyUnit[];
  onBrushChange?: (idx: { startIndex: number; endIndex: number }) => void;
  availableDomain: [Date, Date];
  brushRange: [Date, Date];
  onBrushRangeChange: (range: [Date, Date]) => void;
}

export interface UniqueKeyUnit {
  label: string;
  value: string;
  active: boolean;
  color?: string;
}

interface RLineChartProps extends CommonLineChartProps {
  chartData: object[];
  syncId?: string;
}

function CustomCursor(props) {
  // work around to disable cursor line when there is no matching index found
  // eslint-disable-next-line react/prop-types
  if (props.payloadIndex < 0) return null;
  return <Curve {...props} />;
}

export default React.forwardRef<ChartWrapperRef, RLineChartProps>(
  function RLineChart(props, ref) {
    const {
      chartData,
      uniqueKeys,
      xKey,
      colors,
      colorScheme = 'viridis',
      dateFormat,
      altTitle,
      altDesc,
      renderLegend = false,
      renderBrush = false,
      syncId,
      highlightStart,
      highlightEnd,
      highlightLabel,
      xAxisLabel,
      yAxisLabel,
      onBrushChange,
      availableDomain,
      brushRange,
      onBrushRangeChange
    } = props;

    const [chartMargin, setChartMargin] = useState(defaultMargin);
    const [brushStartIndex, setBrushStartIndex] = useState(0);
    const [brushEndIndex, setBrushEndIndex] = useState(chartData.length - 1);

    const { isMediumUp } = useMediaQuery();

    const handleBrushChange = useCallback(
      (newIndex) => {
        const { startIndex, endIndex } = newIndex;
        setBrushStartIndex(startIndex);
        setBrushEndIndex(endIndex);
        onBrushChange?.(newIndex);
      },
      [onBrushChange]
    );

    useEffect(() => {
      // Fire brush callback on mount to have the correct starting values.
      onBrushChange?.({ startIndex: 0, endIndex: chartData.length - 1 });
    }, []);

    useEffect(() => {
      if (!isMediumUp) {
        setChartMargin({
          ...defaultMargin,
          left: 0
        });
      }
    }, [isMediumUp]);

    const lineColors = useMemo(() => {
      return colors
        ? colors
        : getColors({ steps: uniqueKeys.length, colorScheme });
    }, [uniqueKeys, colorScheme, colors]);

    const uniqueKeysWithColors = useMemo(() => {
      return uniqueKeys.map((e, idx) => ({
        ...e,
        color: lineColors[idx]
      }));
    }, [uniqueKeys, lineColors]);

    const renderHighlight = !!(highlightStart ?? highlightEnd);

    const xAxisDomain = useMemo(() => {
      // console.log(brushRange);
      return [+brushRange[0], +brushRange[1]];
    }, [brushRange]);

    const brushXAxisDomain = useMemo(() => {
      return [+availableDomain[0], +availableDomain[1]];
    }, [availableDomain]);

    return (
      <ChartWrapper>
        <ResponsiveContainer
          aspect={chartAspectRatio}
          debounce={500}
          height='auto'
          minHeight={chartMinHeight}
          maxHeight={chartMaxHeight}
        >
          <LineChartWithFont
            ref={ref as any}
            data={chartData}
            margin={chartMargin}
            syncId={syncId}
            syncMethod={(tick, data) => {
              const index = syncMethodFunction({
                data,
                chartData,
                xKey,
                dateFormat,
                startDate: chartData[brushStartIndex][xKey],
                endDate: chartData[brushStartIndex][xKey]
              });
              return index;
            }}
          >
            <AltTitle title={altTitle} desc={altDesc} />
            <CartesianGrid stroke='#efefef' vertical={false} />
            <XAxis
              type='number'
              scale='time'
              domain={xAxisDomain}
              dataKey={xKey}
              axisLine={false}
              tickFormatter={(t) => timeFormatter(t, dateFormat)}
              allowDataOverflow={true}
              height={
                renderBrush
                  ? brushRelatedConfigs.with.xAxisHeight
                  : brushRelatedConfigs.without.xAxisHeight
              }
            >
              <Label
                value={xAxisLabel}
                offset={
                  renderBrush
                    ? brushRelatedConfigs.with.labelOffset
                    : brushRelatedConfigs.without.labelOffset
                }
                position='bottom'
              />
            </XAxis>
            <YAxis axisLine={false} tickFormatter={(t) => getNumForChart(t)}>
              <Label value={yAxisLabel} angle={-90} position='insideLeft' />
            </YAxis>
            {renderHighlight && (
              <>
                <ReferenceArea
                  x1={convertToTime({
                    timeString: highlightStart,
                    dateFormat
                  })}
                  x2={convertToTime({
                    timeString: highlightEnd,
                    dateFormat
                  })}
                  fill={highlightColor}
                  isFront={true}
                />
                {!!highlightLabel && (
                  <Customized
                    component={
                      <ReferenceLegendComponent
                        highlightLabel={highlightLabel}
                      />
                    }
                  />
                )}
              </>
            )}
            {uniqueKeysWithColors.map((k) => {
              return (
                <Line
                  type='linear'
                  isAnimationActive={false}
                  dot={false}
                  activeDot={false}
                  key={`${k.value}-line`}
                  dataKey={k.label}
                  strokeWidth={2}
                  stroke={k.active ? k.color : 'transparent'}
                />
              );
            })}
            <Tooltip
              cursor={<CustomCursor />}
              content={
                <TooltipComponent
                  dateFormat={dateFormat}
                  uniqueKeys={uniqueKeysWithColors}
                />
              }
            />

            {renderLegend && uniqueKeysWithColors.length > 1 && (
              <Legend
                verticalAlign='bottom'
                width={legendWidth}
                wrapperStyle={{ width: '100%' }}
                content={<LegendComponent />}
              />
            )}

            {renderBrush && (
              <Brush
                data={chartData}
                dataKey={xKey}
                height={brushHeight}
                tickFormatter={(t) => timeFormatter(t, dateFormat)}
                onChange={handleBrushChange}
                startIndex={brushStartIndex}
                endIndex={brushEndIndex}
              >
                <LineChart data={chartData}>
                  {uniqueKeysWithColors.map((k) => {
                    return (
                      <Line
                        type='linear'
                        isAnimationActive={false}
                        dot={false}
                        activeDot={false}
                        key={`${k.value}-line-brush`}
                        dataKey={k.label}
                        strokeWidth={0.5}
                        stroke={k.active ? k.color : 'transparent'}
                      />
                    );
                  })}
                </LineChart>
              </Brush>
            )}
          </LineChartWithFont>
        </ResponsiveContainer>
        <BrushContainer>
          <ResponsiveContainer
            aspect={chartAspectRatio}
            maxHeight={brushHeight}
            width='100%'
          >
            <LineChart
              data={chartData}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis
                type='number'
                scale='time'
                domain={brushXAxisDomain}
                dataKey={xKey}
                hide={true}
              />
              {uniqueKeysWithColors.map((k) => {
                return (
                  <Line
                    type='linear'
                    isAnimationActive={false}
                    dot={false}
                    activeDot={false}
                    key={`${k.value}-line-brush_`}
                    dataKey={k.label}
                    strokeWidth={0.5}
                    stroke={k.active ? k.color : 'transparent'}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
          <BrushCustom
            availableDomain={availableDomain}
            brushRange={brushRange}
            onBrushRangeChange={onBrushRangeChange}
          />
        </BrushContainer>
      </ChartWrapper>
    );
  }
);
