import ManagementPage from "../../../../src/components/dashboard/ManagementPage";

export default async function JewellerDashboardSectionPage({ params }: PageProps<"/jeweller/dashboard/[section]">) {
  const { section } = await params;
  return <ManagementPage section={section} role="jeweller" />;
}
