import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { getString } from 'veda';
import styled from 'styled-components';
import { getAllDatasetsProps } from '$utils/veda-data';
import CatalogView from '$components/common/catalog';
import { PageMainContent } from '$styles/page';
import { LayoutProps } from '$components/common/layout-root';
import PageHero from '$components/common/page-hero';
import { FeaturedDatasets } from '$components/common/featured-slider-section';
import { veda_faux_module_datasets } from '$data-layer/datasets';
import { useFiltersWithQS } from '$components/common/catalog/controls/hooks/use-filters-with-query';

/**
 * @VEDA2-REFACTOR-WORK
 *
 * @NOTE: This container component serves as a wrapper for the purpose of data management, this is ONLY to support current instances.
 * veda2 instances can just use the direct component, 'DataCatalog', and manage data directly in their page views
 */

const InteractiveLink = styled.a`
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: auto;
  font-size: 0;
  margin: 0;
`;

export default function DataCatalogContainer() {
  const allDatasets = getAllDatasetsProps(veda_faux_module_datasets);
  const pathName = useLocation();
  const navigate = useNavigate();
  const controlVars = useFiltersWithQS({navigate: navigate});

  return (
    <PageMainContent>
      <LayoutProps title='Data Catalog' description={getString('dataCatalogBanner').other} />
      <PageHero title='Data Catalog' description={getString('dataCatalogBanner').other} />
      <FeaturedDatasets />
      <CatalogView 
        datasets={allDatasets}
        onFilterChanges={() => controlVars}
        location={pathName}
        CardInteractiveElement={InteractiveLink}
      />
    </PageMainContent>
  );
}