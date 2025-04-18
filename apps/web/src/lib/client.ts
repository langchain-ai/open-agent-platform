import { Client } from "@langchain/langgraph-sdk";

export function createClient(deploymentId: string) {
  const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
  const client = new Client({
    apiUrl: `${baseApiUrl}/langgraph/${deploymentId}`,
  });
  return client;
}
