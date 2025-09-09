import { PageHeader } from "./components/page-header";
import { TemplatesList } from "./components/templates-list";

export default function AgentsInterfaceV2() {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Agents"
        description="Manage your agents across different templates"
      />
      <TemplatesList />
    </div>
  );
}
