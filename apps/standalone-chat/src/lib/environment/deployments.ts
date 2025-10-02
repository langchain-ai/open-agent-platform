// Stub file for standalone chat - deployments are configured via UI, not environment
export interface Deployment {
  id: string;
  name: string;
  deploymentUrl: string;
  tenantId?: string;
}

export function getDeployments(): Deployment[] {
  // In standalone mode, return empty array
  // Deployments are configured via UI localStorage
  return [];
}
