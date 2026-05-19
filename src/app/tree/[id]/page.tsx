'use client';

import { use } from 'react';
import { TreeViewer } from '@/components/tree/TreeViewer';

export default function TreePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  use(params);
  return <TreeViewer />;
}
