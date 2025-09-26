import { PageHeader } from "./components/page-header";
import { TemplatesList } from "./components/templates-list";

interface AgentsInterfaceV2Props {
  agentIdsWithTriggers?: Set<string>;
  hideHeader?: boolean;
  noContainer?: boolean;
}

export default function AgentsInterfaceV2({
  agentIdsWithTriggers,
  hideHeader = false,
  noContainer = false,
}: AgentsInterfaceV2Props) {
  return (
    <div className={noContainer ? "px-0 py-2" : "container mx-auto px-4 py-6"}>
      {!hideHeader && (
        <PageHeader
          title="Agents"
          description="Manage your agents across different templates"
        />
      )}
      <TemplatesList agentIdsWithTriggers={agentIdsWithTriggers} />
    </div>
  );
}
