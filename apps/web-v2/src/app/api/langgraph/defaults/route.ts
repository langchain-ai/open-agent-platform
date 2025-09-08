import { NextRequest } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { getDeployments } from "@/lib/environment/deployments";

/**
 * Creates a client for a specific deployment, using either LangSmith auth or user auth
 */
function createServerClient(deploymentId: string, accessToken?: string) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  if (!accessToken) {
    // Use LangSmith auth
    const client = new Client({
      apiUrl: deployment.deploymentUrl,
      apiKey: process.env.LANGSMITH_API_KEY,
      defaultHeaders: {
        "x-auth-scheme": "langsmith",
      },
    });
    return client;
  }

  // Use user auth
  const client = new Client({
    apiUrl: deployment.deploymentUrl,
    defaultHeaders: {
      Authorization: `Bearer ${accessToken}`,
      "x-supabase-access-token": accessToken,
    },
  });
  return client;
}

/**
 * Gets or creates default assistants for a deployment
 */
async function getOrCreateDefaultAssistants(
  deploymentId: string,
  accessToken?: string,
) {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  // Do NOT pass in an access token here. We want to use LangSmith auth.
  const lsAuthClient = createServerClient(deploymentId);
  const userAuthClient = createServerClient(deploymentId, accessToken);

  const [systemDefaultAssistants, userDefaultAssistants] = await Promise.all([
    lsAuthClient.assistants.search({
      limit: 100,
      metadata: {
        created_by: "system",
      },
    }),
    userAuthClient.assistants.search({
      limit: 100,
      metadata: {
        _x_oap_is_default: true,
      },
    }),
  ]);

  if (!systemDefaultAssistants.length) {
    throw new Error("Failed to find default system assistants.");
  }

  if (systemDefaultAssistants.length === userDefaultAssistants.length) {
    // User has already created all default assistants.
    return userDefaultAssistants;
  }

  // Find all assistants which are created by the system, but do not have a corresponding user defined default assistant.
  const missingDefaultAssistants = systemDefaultAssistants.filter(
    (assistant) =>
      !userDefaultAssistants.some((a) => a.graph_id === assistant.graph_id),
  );

  // Create a new client, passing in the access token to use user scoped auth.
  const newUserDefaultAssistantsPromise = missingDefaultAssistants.map(
    async (assistant) => {
      const isDefaultDeploymentAndGraph =
        deployment.isDefault &&
        deployment.defaultGraphId === assistant.graph_id;
      return await userAuthClient.assistants.create({
        graphId: assistant.graph_id,
        name: `${isDefaultDeploymentAndGraph ? "Default" : "Primary"} Assistant`,
        metadata: {
          _x_oap_is_default: true,
          description: `${isDefaultDeploymentAndGraph ? "Default" : "Primary"}  Assistant`,
          ...(isDefaultDeploymentAndGraph && { _x_oap_is_primary: true }),
        },
      });
    },
  );

  const newUserDefaultAssistants = [
    ...userDefaultAssistants,
    ...(await Promise.all(newUserDefaultAssistantsPromise)),
  ];

  if (systemDefaultAssistants.length === newUserDefaultAssistants.length) {
    // We've successfully created all the default assistants, for every graph.
    return newUserDefaultAssistants;
  }

  throw new Error(
    `Failed to create default assistants for deployment ${deploymentId}. Expected ${systemDefaultAssistants.length} default assistants, but found/created ${newUserDefaultAssistants.length}.`,
  );
}

/**
 * GET handler for the /api/langgraph/defaults endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const deploymentId = url.searchParams.get("deploymentId");
    const accessToken = req.headers
      .get("Authorization")
      ?.replace("Bearer ", "");

    if (!deploymentId) {
      return new Response(
        JSON.stringify({ error: "Missing deploymentId parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const defaultAssistants = await getOrCreateDefaultAssistants(
      deploymentId,
      accessToken || undefined,
    );

    return new Response(JSON.stringify(defaultAssistants), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting default assistants:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
