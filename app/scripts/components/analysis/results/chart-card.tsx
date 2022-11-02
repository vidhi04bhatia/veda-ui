import React, { useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { reverse } from 'd3';
import {
  Toolbar,
  ToolbarIconButton,
  VerticalDivider
} from '@devseed-ui/toolbar';
import {
  CollecticonCircleInformation,
  CollecticonDownload2
} from '@devseed-ui/collecticons';

import { TimeseriesData } from './timeseries-data';
import { ChartCardAlert, ChartCardNoData } from './chart-card-message';
import {
  CardSelf,
  CardHeader,
  CardHeadline,
  CardTitle,
  CardActions,
  CardBody
} from '$components/common/card';
import { ChartLoading } from '$components/common/loading-skeleton';
import Chart, { AnalysisChartRef } from '$components/common/chart/analysis';
import { dateFormatter } from '$components/common/chart/utils';
import { Tip } from '$components/common/tip';
import { composeVisuallyDisabled } from '$utils/utils';

interface ChartCardProps {
  title: React.ReactNode;
  chartData: TimeseriesData;
}

const ChartDownloadButton = composeVisuallyDisabled(ToolbarIconButton);

const getNoDownloadReason = ({ status, data }: TimeseriesData) => {
  if (status === 'errored') {
    return 'Data loading errored. Download is not available.';
  }
  if (status === 'loading') {
    return 'Download will be available once the data finishes loading.';
  }
  if (status === 'succeeded' && !data.timeseries.length) {
    return 'There is no data to download.';
  }
  return '';
};

export default function ChartCard(props: ChartCardProps) {
  const { title, chartData } = props;
  const { status, meta, data, error, name, id } = chartData;

  const chartRef = useRef<AnalysisChartRef>(null);

  const noDownloadReason = getNoDownloadReason(chartData);

  const onExportClick = useCallback(() => {
    if (
      !chartRef.current?.instanceRef.current ||
      !chartData.data?.timeseries.length
    ) {
      return;
    }

    // Get start and end dates from chart instance.
    const { dataStartIndex, dataEndIndex } = chartRef.current.instanceRef
      .current.state as any;
    // The indexes expect the data to be ascending, so we have to reverse the
    // data.
    const data = reverse(chartData.data.timeseries);
    const dFormat = 'yyyy-MM-dd';
    const startDate = format(new Date(data[dataStartIndex].date), dFormat);
    const endDate = format(new Date(data[dataEndIndex].date), dFormat);

    const filename = `chart.${id}.${startDate}-${endDate}`;
    chartRef.current?.saveAsImage(filename);
  }, [id, chartData.data]);

  return (
    <CardSelf>
      <CardHeader>
        <CardHeadline>
          <CardTitle>{title}</CardTitle>
        </CardHeadline>
        <CardActions>
          <Toolbar size='small'>
            <Tip
              content={noDownloadReason}
              disabled={!noDownloadReason}
              hideOnClick={false}
            >
              <ChartDownloadButton
                variation='base-text'
                onClick={onExportClick}
                visuallyDisabled={!!noDownloadReason}
              >
                <CollecticonDownload2 title='Download' meaningful />
              </ChartDownloadButton>
            </Tip>
            <VerticalDivider variation='dark' />
            <ToolbarIconButton variation='base-text'>
              <CollecticonCircleInformation title='More info' meaningful />
            </ToolbarIconButton>
          </Toolbar>
        </CardActions>
      </CardHeader>
      <CardBody>
        {status === 'errored' && <ChartCardAlert message={error.message} />}

        {status === 'loading' ? (
          meta.total ? (
            <ChartLoading message={`${meta.loaded} of ${meta.total} loaded.`} />
          ) : (
            <ChartLoading message='Loading...' />
          )
        ) : null}

        {status === 'succeeded' ? (
          data.timeseries.length ? (
            <Chart
              ref={chartRef}
              timeSeriesData={data.timeseries}
              uniqueKeys={[
                { label: 'Min', value: 'min', active: true },
                { label: 'Max', value: 'max', active: true },
                { label: 'STD', value: 'std', active: true }
              ]}
              xKey='date'
              dates={data.timeseries.map((e) =>
                dateFormatter(new Date(e.date), '%Y/%m')
              )}
              dateFormat='%Y/%m'
              altTitle={`Amount of ${name} over time`}
              altDesc={`Amount of ${name} over time`}
              xAxisLabel='Time'
              yAxisLabel='Amount'
            />
          ) : (
            <ChartCardNoData />
          )
        ) : null}
      </CardBody>
    </CardSelf>
  );
}
