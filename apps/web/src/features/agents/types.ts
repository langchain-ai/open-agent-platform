import { Agent } from "@/types/agent";
import { Deployment } from "@/types/deployment";

export interface GraphGroup {
  agents: Agent[];
  deployment: Deployment;
  graphId: string;
}
