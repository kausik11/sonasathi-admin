import ManagementPage from "../../../../src/components/dashboard/ManagementPage";

export default async function AdminDashboardSectionPage({ params }: PageProps<"/admin/dashboard/[section]">) {
  const { section } = await params;
  return <ManagementPage section={section} role="admin" />;
}
