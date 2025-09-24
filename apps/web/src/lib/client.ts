import { Client } from "@langchain/langgraph-sdk";
import { getDeployments } from "./environment/deployments";

export function createClient(deploymentId: string, accessToken: string) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
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

export function getOptimizerClient(accessToken: string): Client {
  if (!process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL) {
    throw new Error(
      "Failed to create optimizer client: Optimization deployment URL not configured. Please set NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL",
    );
  }

  const client = new Client({
    apiUrl: process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL,
    defaultHeaders: {
      Authorization: `Bearer ${accessToken}`,
      "x-supabase-access-token": accessToken,
    },
  });
  return client;
}
