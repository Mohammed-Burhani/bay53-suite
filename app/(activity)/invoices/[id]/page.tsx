import { InvoiceDetailView } from "@/components/activity/InvoiceDetailView";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  return <InvoiceDetailView id={id} initialTab={tab === "activity" ? "activity" : "details"} />;
}
