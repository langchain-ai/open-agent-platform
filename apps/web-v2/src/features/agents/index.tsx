import { PageHeader } from "./components/page-header";
import { TemplatesList } from "./components/templates-list";
import type { Agent } from "@/types/agent";
import { AgentsProvider } from "@/providers/Agents";

type AgentsInterfaceProps = {
  initialAgents?: Agent[];
};

export default function AgentsInterfaceV2({
  initialAgents,
}: AgentsInterfaceProps) {
  return (
    <AgentsProvider initialAgents={initialAgents}>
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="Agents"
          description="Manage your agents across different templates"
        />
        <TemplatesList />
      </div>
    </AgentsProvider>
  );
}
