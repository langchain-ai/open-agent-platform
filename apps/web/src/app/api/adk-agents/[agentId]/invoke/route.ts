import { NextRequest, NextResponse } from 'next/server';
import { AdkAgentStoredData } from '@/types/adk-agent';
import { Message, MessageSendParams, Task, AgentCard } from '@/types/a2a';
import { a2aClientService } from '@/lib/a2a-client';
import { decrypt } from '@/lib/encryption-service';

interface InvokeRouteParams {
  params: {
    agentId: string;
  };
}

interface InvokeRequestBody {
  userInput: string;
  acceptedOutputModes?: string[]; // e.g., ["text/plain", "application/json"]
  customConfig?: Record<string, any>; // Additional metadata for the message/send call
  contextId?: string; // Optional context ID for continuing conversations
  taskId?: string; // Optional task ID if this message is part of an existing task
}

/**
 * @swagger
 * /api/adk-agents/{agentId}/invoke:
 *   post:
 *     summary: Invoke an ADK agent by sending a message
 *     tags: [ADK Agents]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ADK agent to invoke
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userInput
 *             properties:
 *               userInput:
 *                 type: string
 *                 description: The text input from the user.
 *               acceptedOutputModes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred output modes (e.g., text/plain, application/json).
 *               customConfig:
 *                 type: object
 *                 description: Custom configuration or metadata for the agent.
 *               contextId:
 *                 type: string
 *                 description: Optional context ID for conversation continuity.
 *               taskId:
 *                 type: string
 *                 description: Optional task ID if this message pertains to an existing task.
 *     responses:
 *       200:
 *         description: Successful invocation, returns Task or Message from ADK agent
 *         content:
 *           application/json:
 *             schema:
 *               oneOf: # Indicates the response can be one of several types
 *                 - $ref: '#/components/schemas/Task'  # Assuming you have Task schema defined elsewhere
 *                 - $ref: '#/components/schemas/Message' # Assuming Message schema
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: ADK Agent not found
 *       500:
 *         description: Internal server error or error invoking ADK agent
 */
export async function POST(req: NextRequest, { params }: InvokeRouteParams) {
  const { agentId } = params;

  try {
    const body: InvokeRequestBody = await req.json();
    const { userInput, acceptedOutputModes, customConfig, contextId, taskId } = body;

    if (!userInput) {
      return NextResponse.json({ error: "userInput is required" }, { status: 400 });
    }

    // TODO: Replace with actual database call to fetch AdkAgentStoredData
    // const agentData: AdkAgentStoredData | null = await db.getAdkAgentById(agentId);
    let agentData: AdkAgentStoredData | null = null;
    if (agentId === "test-adk-agent") {
      // Mock data for testing, ensuring AgentCard has necessary fields
      const mockAgentCard: AgentCard = {
        kind: "agent-card",
        name: "Test ADK Agent Card",
        url: "http://localhost:8008/a2a", // This should be the A2A service endpoint
        version: "1.0",
        capabilities: { streaming: false },
        defaultInputModes: ["text/plain"],
        defaultOutputModes: ["text/plain"],
        skills: [{ id: "test-skill", name: "Test Skill" }],
      };
      agentData = {
        id: "test-adk-agent",
        name: "Test ADK Agent (OAP Alias)",
        a2aBaseUrl: "http://localhost:8008", // Base URL for the ADK service
        agentCard: mockAgentCard, // Store the fetched/mocked agent card
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // authentication: { type: "bearer", encryptedToken: "test-token" } // Example auth
      };
    }

    if (!agentData) {
      return NextResponse.json({ error: "ADK Agent not found (placeholder)" }, { status: 404 });
    }
    if (!agentData.agentCard || typeof agentData.agentCard !== 'object') {
        // Attempt to fetch agent card if missing - this might be better done during registration/update
        console.warn(`Agent card for ${agentId} is missing or invalid, attempting to fetch...`);
        try {
            const fetchedCard = await a2aClientService.fetchAgentCard(agentData.a2aBaseUrl);
            agentData.agentCard = fetchedCard;
            // TODO: Persist this fetched card to the database
        } catch (cardError) {
            console.error(`Failed to fetch agent card for ${agentId}:`, cardError);
            return NextResponse.json({ error: `Failed to fetch agent card for agent ${agentId}`}, { status: 500});
        }
    }

    const agentCard = agentData.agentCard as AgentCard; // Ensure it's treated as AgentCard
    // The A2A service URL is typically specified in the agent card's `url` field,
    // or could be constructed like `${agentData.a2aBaseUrl}/a2a` if following a convention.
    // For this example, let's assume agentCard.url is the correct A2A JSON-RPC endpoint.
    const a2aServiceEndpoint = agentCard.url;
    if (!a2aServiceEndpoint) {
        return NextResponse.json({ error: `A2A service endpoint (agentCard.url) not defined for agent ${agentId}` }, { status: 500 });
    }


    const messageToAgent: Message = {
      kind: "message",
      messageId: `oap-msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: "user",
      parts: [{ kind: "text", text: userInput }],
      contextId: contextId, // Pass along if provided
      taskId: taskId, // Pass along if provided
    };

    const sendParams: MessageSendParams = {
      message: messageToAgent,
      configuration: {
        acceptedOutputModes: acceptedOutputModes || agentCard.defaultOutputModes || ['text/plain'],
        // blocking: true, // Example: make it blocking if not streaming
      },
      metadata: customConfig,
    };

    let authTokenToUse: string | undefined = undefined;
    if (agentData.authentication?.encryptedToken && agentData.authentication.type !== 'none') {
        try {
            authTokenToUse = await decrypt(agentData.authentication.encryptedToken);
            console.log("Token decrypted (mock) for invoke API call");
        } catch (decError) {
            console.error("Mock decryption failed for invoke API call:", decError);
            return NextResponse.json({ error: "Failed to prepare authentication for ADK agent (mock decryption)." }, { status: 500 });
        }
    } else if (agentData.authentication?.type === 'none' && agentData.authentication?.encryptedToken) {
        // If type is 'none', the encryptedToken field holds the raw token
        authTokenToUse = agentData.authentication.encryptedToken;
        console.log("Using raw token for invoke API call as auth type is 'none'.");
    }

    const result: Task | Message = await a2aClientService.sendMessage(
      a2aServiceEndpoint,
      sendParams,
      authTokenToUse,
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`Error invoking ADK agent ${agentId}:`, error);
    if (error.message.includes("Failed to fetch Agent Card") || error.message.includes("A2A message/send failed")) {
      // Errors from A2AClientService
      return NextResponse.json({ error: error.message }, { status: 502 }); // Bad Gateway if ADK agent itself fails
    }
    if (error instanceof SyntaxError) { // From req.json()
        return NextResponse.json({ error: 'Invalid JSON payload in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: `Failed to invoke ADK agent: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
