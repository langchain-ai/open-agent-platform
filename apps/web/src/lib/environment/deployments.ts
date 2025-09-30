import { Deployment } from "@/types/deployment";
import { useQueryState } from "nuqs";
import { useCallback } from "react";

/**
 * Loads the provided deployments from the environment variable.
 * @returns {Deployment[]} The list of deployments.
 */
export function getDeployments(): Deployment[] {
  let defaultExists = false;
  const deployments: Deployment[] = JSON.parse(
    process.env.NEXT_PUBLIC_DEPLOYMENTS || "[]",
  );

  for (const deployment of deployments) {
    if (deployment.isDefault && !defaultExists) {
      if (!deployment.graphs.find((g) => g.isDefault)) {
        throw new Error("Default deployment must have a default graph ID");
      }
      defaultExists = true;
    } else if (deployment.isDefault && defaultExists) {
      throw new Error("Multiple default deployments found");
    }
  }
  if (!defaultExists) {
    throw new Error("No default deployment found");
  }
  return deployments;
}

export function useDeployment() {
  const [query, setQuery] = useQueryState("deploymentId");
  const deployments = getDeployments();
  const defaultDeployment = deployments.find((d) => d.isDefault);

  const defaultDeploymentId = defaultDeployment?.id;
  const setDeploymentId = useCallback(
    (id: string | null) => setQuery(id === defaultDeploymentId ? null : id),
    [defaultDeploymentId, setQuery],
  );

  if (!defaultDeploymentId) throw new Error("No deployment ID found");
  return [query ?? defaultDeploymentId, setDeploymentId] as [
    string,
    typeof setDeploymentId,
  ];
}
