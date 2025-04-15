import TransactionDetailPage from '@/components/TransactionDetailPage';

export default async function Page({ params }) {
  // asynchronous access of `params.id`.
  const { id } = await params
  return <TransactionDetailPage id={id} />;
}
