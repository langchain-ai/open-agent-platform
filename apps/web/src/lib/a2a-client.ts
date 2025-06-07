import {
  AgentCard,
  MessageSendParams,
  Task,
  Message,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCSuccessResponse,
  JSONRPCErrorResponse
} from '@/types/a2a'; // Imports from the newly created A2A types directory

export class A2AClientService {
  /**
   * Fetches the Agent Card from the ADK Agent's well-known endpoint.
   * @param baseUrl The base URL of the ADK Agent.
   * @returns A Promise resolving to the AgentCard.
   * @throws Error if the request fails or the response is not ok.
   */
  async fetchAgentCard(baseUrl: string): Promise<AgentCard> {
    const agentCardUrl = `${baseUrl.replace(/\/$/, "")}/.well-known/agent.json`;
    console.log(`A2AClientService: Fetching Agent Card from ${agentCardUrl}`);

    try {
      const response = await fetch(agentCardUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`A2AClientService: Failed to fetch Agent Card. Status: ${response.status}, Body: ${errorBody}`);
        throw new Error(`Failed to fetch Agent Card from ${agentCardUrl}. Status: ${response.status}`);
      }

      const agentCard: AgentCard = await response.json();
      // TODO: Add validation against AgentCard schema if necessary
      return agentCard;
    } catch (error) {
      console.error(`A2AClientService: Error fetching Agent Card from ${agentCardUrl}:`, error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  /**
   * Sends a message to an ADK Agent using the A2A message/send RPC method.
   * @param a2aServiceUrl The full URL to the A2A service endpoint (e.g., http://localhost:8008/a2a).
   * @param params The parameters for the message/send method.
   * @param authToken Optional authentication token (Bearer).
   * @returns A Promise resolving to the Task or Message result from the agent.
   * @throws Error if the request fails, the response is not ok, or the JSON-RPC response contains an error.
   */
  async sendMessage(
    a2aServiceUrl: string,
    params: MessageSendParams,
    authToken?: string,
  ): Promise<Task | Message> {
    const rpcRequestId = `oap-a2a-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const rpcRequest: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'message/send',
      params: params,
      id: rpcRequestId,
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (authToken) {
      // Assuming Bearer token for simplicity. ADK Agent's AgentCard should specify the scheme.
      // If it's an API key, it might be a different header like 'X-API-Key'.
      // For now, this client is simplified.
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log(`A2AClientService: Sending message to ${a2aServiceUrl} with ID ${rpcRequestId}`, params.message.parts[0]);

    try {
      const response = await fetch(a2aServiceUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(rpcRequest),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`A2AClientService: message/send request failed. Status: ${response.status}, Body: ${errorBody}`);
        throw new Error(`A2A message/send request failed. Status: ${response.status}`);
      }

      const rpcResponse: JSONRPCResponse = await response.json();

      if ((rpcResponse as JSONRPCErrorResponse).error) {
        const errorPayload = (rpcResponse as JSONRPCErrorResponse).error;
        console.error('A2AClientService: JSON-RPC error in message/send response:', errorPayload);
        throw new Error(`A2A message/send failed: ${errorPayload.message} (Code: ${errorPayload.code})`);
      }

      return (rpcResponse as JSONRPCSuccessResponse).result as Task | Message;
    } catch (error) {
      console.error(`A2AClientService: Error in sendMessage to ${a2aServiceUrl}:`, error);
      throw error; // Re-throw the error
    }
  }

  // Placeholder for other A2A methods like task/get, task/cancel, etc.
  // async getTaskStatus(a2aServiceUrl: string, taskId: string, authToken?: string): Promise<Task> { ... }
  // async cancelTask(a2aServiceUrl: string, taskId: string, authToken?: string): Promise<Task> { ... }
}

// Export a singleton instance or allow consumers to instantiate
export const a2aClientService = new A2AClientService();
