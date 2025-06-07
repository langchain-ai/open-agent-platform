import { NextRequest, NextResponse } from 'next/server';
import { AdkAgentRegistrationPayload, AdkAgentStoredData } from '@/types/adk-agent';
import { AgentCard, AgentCardSchema } from '@/types/a2a'; // Import A2A AgentCard type AND AgentCardSchema
import { getAllAdkAgents, createAdkAgent } from '@/lib/adk-agent-service';
import { a2aClientService } from '@/lib/a2a-client';
import { encrypt } from '@/lib/encryption-service';

/**
 * @swagger
 * /api/adk-agents:
 *   get:
 *     summary: List all registered ADK agents
 *     tags: [ADK Agents]
 *     responses:
 *       200:
 *         description: A list of ADK agents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdkAgentStoredData'
 */
export async function GET(req: NextRequest) {
  try {
    const agents = await getAllAdkAgents();
    return NextResponse.json({ agents }, { status: 200 });
  } catch (error) {
    console.error('Error fetching ADK agents:', error);
    return NextResponse.json({ error: 'Failed to fetch ADK agents' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/adk-agents:
 *   post:
 *     summary: Register a new ADK agent
 *     tags: [ADK Agents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdkAgentRegistrationPayload'
 *     responses:
 *       201:
 *         description: ADK Agent registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 agent:
 *                   $ref: '#/components/schemas/AdkAgentStoredData'
 *       400:
 *         description: Invalid payload or failed to fetch/validate Agent Card
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const payload: AdkAgentRegistrationPayload = await req.json();

    // Basic payload validation (can be expanded with Zod or similar)
    if (!payload.name || !payload.a2aBaseUrl) {
      return NextResponse.json({ error: 'Missing required fields: name and a2aBaseUrl' }, { status: 400 });
    }
    try {
      new URL(payload.a2aBaseUrl); // Validate URL format
    } catch (_) {
      return NextResponse.json({ error: 'Invalid a2aBaseUrl format' }, { status: 400 });
    }

    let fetchedRawAgentCard: any; // To store the raw JSON before parsing
    let agentCard: AgentCard; // To store the validated card data
    try {
        // The current fetchAgentCard in a2a-client.ts appends "/.well-known/agent.json" to the baseUrl.
        console.log(`Attempting to fetch Agent Card from base URL: ${payload.a2aBaseUrl}`);
        // fetchAgentCard is expected to return a parsed JSON object already.
        fetchedRawAgentCard = await a2aClientService.fetchAgentCard(payload.a2aBaseUrl);

        const parsedCard = AgentCardSchema.safeParse(fetchedRawAgentCard);

        if (!parsedCard.success) {
            console.error("Fetched Agent Card is invalid:", parsedCard.error.flatten());
            return NextResponse.json({ error: "Fetched Agent Card is invalid.", details: parsedCard.error.flatten() }, { status: 400 });
        }

        agentCard = parsedCard.data; // Use the validated data
        console.log("Successfully fetched and validated Agent Card:", agentCard.name);

    } catch (error: any) {
        console.error("Failed to fetch Agent Card (or initial JSON parsing failed in client):", error);
        let errorMessage = "Failed to fetch or validate Agent Card from the provided A2A Base URL.";
        if (error.message) {
            errorMessage += ` Details: ${error.message}`;
        }
        // Return a 400 if it's likely a client-provided bad URL or the remote server responded with an error related to the card itself.
        // A 502 might be more appropriate if our service (OAP) can't reach the remote agent's server due to network issues not directly tied to the URL being "bad".
        // The current a2aClientService.fetchAgentCard throws an error with status if response.ok is false,
        // or a generic error for network issues.
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }


    // Token encryption
    let finalEncryptedTokenValue: string | undefined = undefined;
    if (payload.authentication?.token && payload.authentication.type !== 'none') {
        try {
            finalEncryptedTokenValue = await encrypt(payload.authentication.token);
            console.log("Token encrypted (mock)");
        } catch (encError) {
            console.error("Mock encryption failed:", encError);
            return NextResponse.json({ error: "Failed to process token (mock encryption)." }, { status: 500 });
        }
    } else if (payload.authentication?.type === 'none' && payload.authentication?.token) {
        // If type is 'none', store the raw token directly in the 'encryptedToken' field for simplicity,
        // as no encryption is applied.
        finalEncryptedTokenValue = payload.authentication.token;
        console.log("Authentication type is 'none', storing raw token.");
    }


    const agentToCreate = {
        name: payload.name,
        a2aBaseUrl: payload.a2aBaseUrl,
        authentication: payload.authentication ? {
            type: payload.authentication.type,
            // Store raw token if type is 'none', otherwise the encrypted one
            encryptedToken: finalEncryptedTokenValue,
        } : undefined,
        agentCard: agentCard,
    };

    const newAgent = await createAdkAgent(agentToCreate);
    console.log("ADK Agent created with mock DB:", newAgent);

    return NextResponse.json({ message: "ADK Agent registered successfully", agent: newAgent }, { status: 201 });
  } catch (error) {
    console.error('Error registering ADK agent:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to register ADK agent' }, { status: 500 });
  }
}
