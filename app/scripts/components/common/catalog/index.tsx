import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { uniqBy } from 'lodash';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { themeVal } from '@devseed-ui/theme-provider';
import { DatasetData, Taxonomy, TaxonomyItem, DatasetDataWithEnhancedLayers } from '../../../types';
import prepareDatasets from '../../data-catalog/prepare-datasets';
import { useSlidingStickyHeaderProps } from '../layout-root/useSlidingStickyHeaderProps';
import FiltersControl from './filters-control';
import FilterTag from './filter-tag';
import {
  Actions,
  minSearchLength,
  useBrowserControls
} from '$components/common/browse-controls/use-browse-controls';

import {
  FoldHeader,
  FoldHeadline,
  FoldTitle
} from '$components/common/fold';
import { Card } from '$components/common/card';
import { CardList } from '$components/common/card/styles';
import EmptyHub from '$components/common/empty-hub';
import { DATASETS_PATH, getDatasetPath } from '$utils/routes';
import TextHighlight from '$components/common/text-highlight';
import { variableBaseType, variableGlsp } from '$styles/variable-utils';
import { OptionItem } from '$components/common/form/checkable-filter';
import { usePreviousValue } from '$utils/use-effect-previous';

/**
 * DATA CATALOG Feature component 
 * Allows you to browse through datasets using the filters sidebar control
 */

const CatalogWrapper = styled.div`
  width: 100%;
  max-width: ${themeVal('layout.max')};
  margin: 0 auto;
  margin-top: ${variableGlsp(2)};
  padding-left: ${variableGlsp()};
  padding-right: ${variableGlsp()};
  gap: ${variableGlsp()};
`;

const CatalogFoldHeader = styled(FoldHeader)`
  margin-bottom: 4rem;
`;

const Content = styled.div`
  display: flex;
  margin-bottom: 8rem;
  position: relative;
`;

const Catalog = styled.div`
  width: 100%;
`;

const Cards = styled(CardList)`
  padding: 0 0 0 2rem;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 0 0 2.4rem 2rem;
`;

const PlainTextButton = styled.button`
  background: none;
  border: none;
  outline: none;
  box-shadow: none;
  color: ${themeVal('color.primary-400')};
  text-decoration: underline;
  font-size: ${variableBaseType('0.6rem')};
  &:hover {
    color: ${themeVal('color.primary-800')};
  }
`;

const EmptyState = styled(EmptyHub)`
  margin-left: 2rem;
`;

export const sortOptions = [{ id: 'name', name: 'Name' }];

function enhanceDatasetLayers(dataset) {
  return {
      ...dataset,
      layers: dataset.layers.map(layer => ({
          ...layer,
          parentDataset: {
              id: dataset.id,
              name: dataset.name
          }
      }))
  };
}

export const getAllDatasetsWithEnhancedLayers = (dataset): DatasetDataWithEnhancedLayers[] => dataset.map(enhanceDatasetLayers);

function getAllTaxonomyValues(
  data: DatasetData | Taxonomy[]
) {
  const list = Array.isArray(data) ? data : data.taxonomy;
  const allValues = list.map((l) => l.values).flat();
  return allValues;
}

export function getTaxonomyByIds(group: string, ids: string | string[], taxonomies: Taxonomy[]) {
  const groupValues = taxonomies.find((t) => t.name == group)?.values;
  
  let taxonomyItems: any[] = [];

  if (ids instanceof Array) {
    const items = ids.map((id) => groupValues?.filter((value) => value.id == id)[0]);
    taxonomyItems = items.map((item) => ({...item, ...{taxonomy: group}}));
  } else {
    const taxonomy = groupValues?.filter((value) => value.id == ids)[0];
    /* eslint-disable-next-line fp/no-mutating-methods */
    if(taxonomy) taxonomyItems.push({...taxonomy, ...{taxonomy: group}});
  }
  return taxonomyItems;
}

export function generateTaxonomies(data: DatasetDataWithEnhancedLayers[] | DatasetData[]): Taxonomy[] {
  const concat = (arr, v) => (arr || []).concat(v);

  const taxonomyData = {};
  // for loops are faster than reduces.
  for (const { taxonomy } of data) {
    for (const { name, values } of taxonomy) {
      if (!name || !values?.length) continue;
      taxonomyData[name] = concat(taxonomyData[name], values);
    }
  }

  const taxonomiesUnique = Object.entries(taxonomyData).map(([key, tx]): Taxonomy => ({
    name: key,
    // eslint-disable-next-line fp/no-mutating-methods
    values: uniqBy(tx as TaxonomyItem[], (t) => t.id).sort((a, b) => a.name.localeCompare(b.name)) as TaxonomyItem[]
  }));
  return taxonomiesUnique;
}

export interface CatalogViewProps {
  datasets: DatasetData[];
}

function CatalogView({ 
  datasets,
}: CatalogViewProps) {
  const controlVars = useBrowserControls({
    sortOptions
  });

  const navigate = useNavigate();

  const { taxonomies, sortField, sortDir, onAction } = controlVars;
  const search = controlVars.search ?? '';

  const datasetTaxonomies = generateTaxonomies(datasets);

  const urlTaxonomyItems = taxonomies? Object.entries(taxonomies).map(([key, val]) => getTaxonomyByIds(key, val, datasetTaxonomies)).flat(): [];
  
  const allDatasetsWithEnhancedLayers = useMemo(() => getAllDatasetsWithEnhancedLayers(datasets), [datasets]);

  const [datasetsToDisplay, setDatasetsToDisplay] = useState<DatasetData[]>(
    prepareDatasets(allDatasetsWithEnhancedLayers, {
    search,
    taxonomies,
    sortField,
    sortDir,
    filterLayers: false
  }));

  const [allSelectedFilters, setAllSelectedFilters] = useState<OptionItem[]>(urlTaxonomyItems);
  const [clearedTagItem, setClearedTagItem] = useState<OptionItem>();

  const prevSelectedFilters = usePreviousValue(allSelectedFilters) || [];

  // Handlers
  const handleChangeAllSelectedFilters = useCallback((item: OptionItem, action: 'add' | 'remove') => {
    if(action == 'add') {
      setAllSelectedFilters([...allSelectedFilters, item]);
    } 
    
    if (action == 'remove') {
      setAllSelectedFilters(allSelectedFilters.filter((selected) => selected.id !== item.id));
    }
    onAction(Actions.TAXONOMY_MULTISELECT, { key: item.taxonomy, value: item.id });
  }, [setAllSelectedFilters, allSelectedFilters, onAction]);

  const handleClearTag = useCallback((item: OptionItem) => {
    setAllSelectedFilters(allSelectedFilters.filter((selected) => selected !== item));
    setClearedTagItem(item);

  }, [allSelectedFilters]);

  const handleClearTags = useCallback(() => {
    setAllSelectedFilters([]);
  }, [setAllSelectedFilters]);

  useEffect(() => {
    if (clearedTagItem && (allSelectedFilters.length == prevSelectedFilters.length-1)) {
      onAction(Actions.TAXONOMY_MULTISELECT, { key: clearedTagItem.taxonomy, value: clearedTagItem.id}); 
      setClearedTagItem(undefined);
    }
  }, [allSelectedFilters, clearedTagItem]);

  useEffect(() => {
    if(!allSelectedFilters.length) {
      onAction(Actions.CLEAR);
      navigate(DATASETS_PATH);
    }
  }, [allSelectedFilters]);

  useEffect(() => {
    const updated = prepareDatasets(allDatasetsWithEnhancedLayers, {
      search,
      taxonomies,
      sortField,
      sortDir,
      filterLayers: false
    });
    setDatasetsToDisplay(updated);
  }, [allSelectedFilters, taxonomies, search]);

  const { headerHeight } = useSlidingStickyHeaderProps();

  const renderTags = useMemo(() => {
    if (allSelectedFilters.length > 0 || urlTaxonomyItems.length > 0) {
      return (
        <Tags>
          {
            (allSelectedFilters.length > 0) ? (
              allSelectedFilters.map((filter) => <FilterTag key={`${filter.taxonomy}-${filter.id}`} item={filter} onClick={handleClearTag} />)
            ) : (
              urlTaxonomyItems.map((filter) => <FilterTag key={`${filter.taxonomy}-${filter.id}`} item={filter} onClick={handleClearTag} />)
            )
          }
          <PlainTextButton onClick={handleClearTags}>Clear all</PlainTextButton>
        </Tags>
      );
    }
    return null;
  }, [allSelectedFilters, handleClearTag, handleClearTags, urlTaxonomyItems]);

  const renderCard = (dataset: DatasetData) => {
    const allTaxonomyValues = getAllTaxonomyValues(dataset).map((v) => v.name);
    return (
      <Card
        cardType='horizontal-info'
        tagLabels={allTaxonomyValues}
        linkTo={getDatasetPath(dataset)}
        title={
          <TextHighlight
            value={search}
            disabled={search.length < minSearchLength}
          >
            {dataset.name}
          </TextHighlight>
        }
        description={
          <TextHighlight
            value={search}
            disabled={search.length < minSearchLength}
          >
            {dataset.description}
          </TextHighlight>
        }
        imgSrc={dataset.media?.src}
        imgAlt={dataset.media?.alt}
      />
    );
  };

  return (
    <CatalogWrapper>
      <CatalogFoldHeader
        style={{
          scrollMarginTop: `${headerHeight + 16}px`
        }}
      >
        <FoldHeadline>
          <FoldTitle>Search datasets</FoldTitle>
        </FoldHeadline>
      </CatalogFoldHeader>
      <Content>
        <FiltersControl
          {...controlVars}
          taxonomiesOptions={datasetTaxonomies}
          onChangeToFilters={handleChangeAllSelectedFilters}
          clearedTagItem={clearedTagItem}
          setClearedTagItem={setClearedTagItem}
          allSelected={allSelectedFilters}
        />
        <Catalog>
          {renderTags}
          {datasetsToDisplay.length ? (
            <Cards>
              {
                datasetsToDisplay.map((d) => {
                  return (
                    <li key={d.id}>
                      {renderCard(d)}
                    </li>
                  );
                })
              }
            </Cards>
          ) : (
            <EmptyState>
              There are no datasets to show with the selected filters.
            </EmptyState>
          )}
        </Catalog>
      </Content>
    </CatalogWrapper>
  );
}

export default CatalogView;
