'use client';

import { createContext, useContext } from 'react';

export type TreeContextValue = {
  isAdmin: boolean;
  onSelectPerson: (personId: string) => void;
  onAddSpouse: (personId: string) => void;
  onAddChildOfPerson: (personId: string) => void;
  onAddChildOfUnion: (unionId: string, parentIds: [string, string]) => void;
  onToggleCollapse: (unionId: string) => void;
};

export const TreeContext = createContext<TreeContextValue | null>(null);

export function useTree() {
  const ctx = useContext(TreeContext);
  if (!ctx) {
    throw new Error('useTree must be used inside a TreeContext.Provider');
  }
  return ctx;
}
