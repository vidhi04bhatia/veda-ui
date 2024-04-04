import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { media } from '@devseed-ui/theme-provider';
import { Taxonomy, TaxonomyItem, datasetTaxonomies } from 'veda';
import {
  ModalHeadline
} from '@devseed-ui/modal';
import { Heading } from '@devseed-ui/typography';

import BrowseControls from '$components/common/browse-controls';
import {
  Actions,
  TaxonomyFilterOption,
  useBrowserControls
} from '$components/common/browse-controls/use-browse-controls';
import { sortOptions } from '$components/data-catalog';
import { DATASETS_PATH } from '$utils/routes';

const StyledModalHeadline = styled(ModalHeadline)``;
const ModalIntro = styled.div`
  ${media.largeUp`
    width: 66%;
  `}
`;

export default function RenderModalHeader ({defaultSelect}: {defaultSelect?: TaxonomyFilterOption}) {
  const controlVars = useBrowserControls({
    sortOptions
  });

  React.useEffect(() => {
    if(defaultSelect) {
      controlVars.onAction(Actions.TAXONOMY, { key: defaultSelect.taxonomyType, value: defaultSelect.value });
      console.log(`only ${defaultSelect.taxonomyType} ${defaultSelect.value} should be available now`)
    }
  }, [defaultSelect])

  return(
    <StyledModalHeadline>
      <Heading size='small'>Data layers</Heading>
      <ModalIntro>
          <p>This tool allows the exploration and analysis of time-series datasets in raster format. For a comprehensive list of available datasets, please visit the <Link to={DATASETS_PATH} target='_blank'>Data Catalog</Link>.
          </p>
      </ModalIntro>
      <BrowseControls
          {...controlVars}
          taxonomiesOptions={datasetTaxonomies}
          sortOptions={sortOptions}
          showMoreButtonOpt={true}
          defaultSelect={defaultSelect}
      />
    </StyledModalHeadline>
  );
}