import { Client } from "@langchain/langgraph-sdk";

export function createClient(deploymentId: string, deploymentUrl: string, accessToken?: string) {
    console.log("Creating client for deploymentId", deploymentId, "with deploymentUrl", deploymentUrl, "and accessToken", accessToken);
    // For locally running deployments
    if (!accessToken) {
        return new Client({
            apiUrl: `${deploymentUrl}/langgraph/proxy/${deploymentId}`,
            defaultHeaders: {
                "x-auth-scheme": "langsmith",
            },
        })
    }
    // TODO: Add support for LangSmith authenticated deployments
    // For OAP deployments which require supabase access tokens
    return new Client({
        apiUrl: deploymentUrl,
        defaultHeaders: {
            Authorization: `Bearer ${accessToken}`,
            "x-supabase-access-token": accessToken,
        },
    });
}