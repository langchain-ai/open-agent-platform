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
   * The graphs (agents) to load for this deployment.
   */
  graphs: Graph[];
}

export interface Graph {
  /**
   * The ID of the graph.
   */
  graphId: string;
  /**
   * Whether or not this graph is the default graph for this deployment.
   * This should only be set to true for one graph per deployment.
   */
  isDefault?: boolean;
}
