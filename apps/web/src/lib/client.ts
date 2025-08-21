import { Client } from "@langchain/langgraph-sdk";
import { getDeployments } from "./environment/deployments";

export function createClient(deploymentId: string, accessToken?: string) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  if (!accessToken || process.env.NEXT_PUBLIC_USE_LANGSMITH_AUTH === "true") {
    const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
    if (!baseApiUrl) {
      throw new Error(
        "Failed to create client: Base API URL not configured. Please set NEXT_PUBLIC_BASE_API_URL",
      );
    }
    const client = new Client({
      apiUrl: `${baseApiUrl}/langgraph/proxy/${deploymentId}`,
      defaultHeaders: {
        "x-auth-scheme": "langsmith",
      },
    });
    return client;
  }

  const client = new Client({
    apiUrl: deployment.deploymentUrl,
    defaultHeaders: {
      Authorization: `Bearer ${accessToken}`,
      "x-supabase-access-token": accessToken,
    },
  });
  return client;
}

export function getOptimizerClient(): Client | undefined {
  if (
    !process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL ||
    !process.env.NEXT_PUBLIC_LANGSMITH_API_KEY
  ) {
    return undefined;
  }
  return createClient(
    process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || "",
    process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || "",
  );
}
