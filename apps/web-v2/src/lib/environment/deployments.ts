import { Deployment } from "@/types/deployment";

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
      if (!deployment.defaultGraphId) {
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
