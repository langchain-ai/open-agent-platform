import { PageHeader } from "./components/page-header";
import { TemplatesList } from "./components/templates-list";

interface AgentsInterfaceV2Props {
  agentIdsWithTriggers?: Set<string>;
}

export default function AgentsInterfaceV2({
  agentIdsWithTriggers,
}: AgentsInterfaceV2Props) {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Agents"
        description="Manage your agents across different templates"
      />
      <TemplatesList agentIdsWithTriggers={agentIdsWithTriggers} />
    </div>
  );
}
