import React from 'react';
import TransactionDetailPage from '@/components/TransactionDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return <TransactionDetailPage id={params.id} />;
}
