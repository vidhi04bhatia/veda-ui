import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import useQsStateCreator from 'qs-state-hook';
import { set, omit } from 'lodash';

export enum Actions {
  CLEAR = 'clear',
  SEARCH = 'search',
  SORT_FIELD = 'sfield',
  SORT_DIR = 'sdir',
  TAXONOMY = 'taxonomy'
}

export type BrowserControlsAction = (action: Actions, value?: any) => void;

export interface FilterOption {
  id: string;
  name: string;
}

export interface TaxonomyFilterOption {
  taxonomyType: string;
  value: string;
  exclusion?: string;
}

interface BrowseControlsHookParams {
  sortOptions: FilterOption[];
}

export const sortDirOptions: FilterOption[] = [
  {
    id: 'asc',
    name: 'Ascending'
  },
  {
    id: 'desc',
    name: 'Descending'
  }
];

export const optionAll = {
  id: 'all',
  name: 'All'
};

export const minSearchLength = 3;

// This hook is only used for the Stories Hub to manage browsing controls
// such as search, sort, and taxonomy filters.
export function useBrowserControls({ sortOptions }: BrowseControlsHookParams) {
  // Setup Qs State to store data in the url's query string
  // react-router function to get the navigation.
  const navigate = useNavigate();
  const useQsState = useQsStateCreator({
    commit: navigate
  });

  const [sortField, setSortField] = useQsState.memo(
    {
      key: Actions.SORT_FIELD,
      // If pubDate exists, default sorting to this
      default:
        sortOptions.find((o) => o.id === 'pubDate')?.id || sortOptions[0]?.id,
      validator: sortOptions.map((d) => d.id)
    },
    [sortOptions]
  );

  const [sortDir, setSortDir] = useQsState.memo(
    {
      key: Actions.SORT_DIR,
      default: sortDirOptions[0].id,
      validator: sortDirOptions.map((d) => d.id)
    },
    []
  );

  const [search, setSearch] = useQsState.memo(
    {
      key: Actions.SEARCH,
      default: ''
    },
    []
  );

  const [taxonomies, setTaxonomies] = useQsState.memo<
    Record<string, string | string[]>
  >(
    {
      key: Actions.TAXONOMY,
      default: {},
      dehydrator: (v) => JSON.stringify(v), // dehydrator defines how a value is stored in the url
      hydrator: (v) => (v ? JSON.parse(v) : {}) // hydrator defines how a value is read from the url
    },
    []
  );

  const onAction = useCallback<BrowserControlsAction>(
    (action, value) => {
      switch (action) {
        case Actions.CLEAR:
          setSearch('');
          setTaxonomies({});
          break;
        case Actions.SEARCH:
          setSearch(value);
          break;
        case Actions.SORT_FIELD:
          setSortField(value);
          break;
        case Actions.SORT_DIR:
          setSortDir(value);
          break;
        case Actions.TAXONOMY:
          {
            const { key, value: val } = value;
            if (val === optionAll.id) {
              setTaxonomies(omit(taxonomies, key));
            } else {
              setTaxonomies(set({ ...taxonomies }, key, val));
            }
          }
          break;
      }
    },
    [setSortField, setSortDir, taxonomies, setTaxonomies, setSearch]
  );

  return {
    search,
    sortField,
    sortDir,
    taxonomies,
    onAction
  };
}
