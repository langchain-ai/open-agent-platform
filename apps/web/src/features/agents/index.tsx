import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "./components/page-header";
import { TemplatesList } from "./components/templates-list";
import { AgentDashboard } from "./components/agent-dashboard";

export default function AgentsInterfaceV2() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Agents"
        description="Manage your agents across different templates"
      />

      <Tabs
        defaultValue="templates"
        className="mt-8"
      >
        <TabsList className="bg-muted/50 border-border/50 grid w-full max-w-md grid-cols-2 border">
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-background transition-all duration-200 data-[state=active]:shadow-sm"
          >
            Templates
          </TabsTrigger>
          <TabsTrigger
            value="all-agents"
            className="data-[state=active]:bg-background transition-all duration-200 data-[state=active]:shadow-sm"
          >
            All Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="templates"
          className="mt-8"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            }
          >
            <TemplatesList />
          </Suspense>
        </TabsContent>

        <TabsContent
          value="all-agents"
          className="mt-8"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            }
          >
            <AgentDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
