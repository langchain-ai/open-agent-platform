export interface Deployment {
  /**
   * The deployment's ID. This is obtained by calling the
   * `/info` endpoint of the deployment URL.
   */
  id: string;
  /**
   * The tenant ID of the deployment. This is obtained by calling
   * the `/info` endpoint of the deployment URL.
   */
  tenantId: string;
  /**
   * The API URL of the deployment.
   */
  deploymentUrl: string;
  /**
   * A custom name for the deployment. This is a custom field the user sets.
   */
  name: string;
  /**
   * Whether this deployment is the default deployment. Should only be set to true for one deployment.
   */
  isDefault?: boolean;
  /**
   * The agents to load for this deployment.
   */
  agents: Agent[];
}

export interface Agent {
  /**
   * The ID of the graph this agent is from.
   */
  graphId: string;
  /**
   * Whether or not this agent is the default agent for this deployment.
   * This should only be set to true for one agent per deployment.
   */
  isDefault?: boolean;
}
