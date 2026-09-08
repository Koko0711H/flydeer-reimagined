import { products } from '@/lib/content';
import { ProductDetail } from '@/components/site/pages';
import { notFound } from 'next/navigation';
export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `${products.find((p) => p.id === id)?.name.zh ?? '产品'} | FRS POWER 福瑞斯`,
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!products.some((p) => p.id === id)) notFound();
  return <ProductDetail id={id} />;
}
