'use client';

import React, { createContext, useContext, useState } from 'react';
import { DatasetData, VedaData } from '../types';

interface DataStore {
  state: any;
  actions: any;
}

const DataContext = createContext<DataStore | undefined>({state: {}, actions: {}});

export const useDataStore = () => useContext(DataContext);

export function DataProvider({ children }: {children: JSX.Element}) {
  const [datasets, setDatasets] = useState<VedaData<DatasetData>|undefined>();
  const value = {
    state: { datasets },
    actions: { setDatasets },
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
