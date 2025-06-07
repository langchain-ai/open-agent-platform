import { NextRequest, NextResponse } from 'next/server';
import { AdkAgentStoredData } from '@/types/adk-agent';
import { AgentCardSchema } from '@/types/a2a';
import { getAdkAgentById, updateAdkAgent, deleteAdkAgent } from '@/lib/adk-agent-service';
import { a2aClientService } from '@/lib/a2a-client';
import { encrypt } from '@/lib/encryption-service';

interface RouteParams {
  params: {
    agentId: string;
  };
}

/**
 * @swagger
 * /api/adk-agents/{agentId}:
 *   get:
 *     summary: Get a specific ADK agent by ID
 *     tags: [ADK Agents]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ADK agent
 *     responses:
 *       200:
 *         description: The ADK agent data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdkAgentStoredData'
 *       404:
 *         description: ADK Agent not found
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { agentId } = params;
    const agent = await getAdkAgentById(agentId);

    if (!agent) {
      return NextResponse.json({ error: "ADK Agent not found" }, { status: 404 });
    }
    return NextResponse.json({ agent }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching ADK agent ${params.agentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch ADK agent' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/adk-agents/{agentId}:
 *   put:
 *     summary: Update an existing ADK agent
 *     tags: [ADK Agents]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ADK agent to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object # Can be a partial AdkAgentRegistrationPayload or AdkAgentStoredData
 *             properties:
 *               name:
 *                 type: string
 *               a2aBaseUrl:
 *                 type: string
 *               authentication:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [apikey, bearer]
 *                   token:
 *                     type: string
 *     responses:
 *       200:
 *         description: ADK Agent updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 agent:
 *                   $ref: '#/components/schemas/AdkAgentStoredData' # Or a partial update response
 *       400:
 *         description: Invalid payload or failed to fetch/validate Agent Card if URL changed
 *       404:
 *         description: ADK Agent not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { agentId } = params;
    // Type assertion for the body, expect Partial updates relevant to AdkAgentStoredData fields
    // but not allowing 'id', 'createdAt', 'updatedAt' to be set directly via payload.
    const payload: Partial<Omit<AdkAgentStoredData, 'id' | 'createdAt' | 'updatedAt' | 'authentication'> & { authentication?: { type: 'apikey' | 'bearer'; token?: string; encryptedToken?: string } }> = await req.json();

    // TODO: If payload.a2aBaseUrl is different from stored, re-fetch and re-validate Agent Card
    // This would involve fetching the current agent data first.
    const currentAgent = await getAdkAgentById(agentId);
    if (!currentAgent) {
        return NextResponse.json({ error: "ADK Agent not found for update" }, { status: 404 });
    }

    if (payload.a2aBaseUrl && payload.a2aBaseUrl !== currentAgent.a2aBaseUrl) {
      try {
        console.log(`a2aBaseUrl changed, attempting to re-fetch Agent Card from: ${payload.a2aBaseUrl}`);
        const newRawAgentCard = await a2aClientService.fetchAgentCard(payload.a2aBaseUrl);
        const parsedCard = AgentCardSchema.safeParse(newRawAgentCard);
        if (!parsedCard.success) {
          console.error("Re-fetched Agent Card is invalid:", parsedCard.error.flatten());
          return NextResponse.json({ error: "Re-fetched Agent Card is invalid.", details: parsedCard.error.flatten() }, { status: 400 });
        }
        payload.agentCard = parsedCard.data; // Update the agentCard in the payload with validated data
        console.log("Agent card successfully re-fetched and validated due to a2aBaseUrl change.");
      } catch (cardError: any) {
        console.error("Failed to fetch or validate new Agent Card during update:", cardError);
        return NextResponse.json({ error: `Failed to fetch or validate new Agent Card: ${cardError.message}` }, { status: 400 });
      }
    } else if (payload.agentCard) {
        // If agentCard is directly provided in the payload (e.g., for admin override or testing)
        // It should also be validated.
        const parsedCard = AgentCardSchema.safeParse(payload.agentCard);
        if (!parsedCard.success) {
            console.error("Provided Agent Card in payload is invalid:", parsedCard.error.flatten());
            return NextResponse.json({ error: "Provided Agent Card in payload is invalid.", details: parsedCard.error.flatten() }, { status: 400 });
        }
        payload.agentCard = parsedCard.data; // Ensure we use the validated data
        console.log("Using agentCard from payload for update, successfully validated.");
    }

    // Handle authentication update and potential token re-encryption
    const updateDataForDb: Partial<Omit<AdkAgentStoredData, 'id' | 'createdAt' | 'updatedAt'>> = { ...payload };

    if (payload.hasOwnProperty('authentication')) { // Check if 'authentication' key itself is present in the payload
        if (payload.authentication === null) { // Case: explicitly remove authentication
            updateDataForDb.authentication = undefined;
            console.log("Authentication explicitly removed on update.");
        } else if (payload.authentication) { // Case: authentication object is provided
            const authPayload = payload.authentication;
            let newEncryptedTokenValue: string | undefined = undefined;

            if (authPayload.token && authPayload.type !== 'none') {
                try {
                    newEncryptedTokenValue = await encrypt(authPayload.token);
                    console.log("Token re-encrypted on update (mock)");
                } catch (encError) {
                    console.error("Mock re-encryption failed:", encError);
                    return NextResponse.json({ error: "Failed to process token on update (mock encryption)." }, { status: 500 });
                }
            } else if (authPayload.type === 'none' && authPayload.token) {
                newEncryptedTokenValue = authPayload.token; // Store raw token if type is 'none'
                console.log("Storing raw token on update as auth type is 'none'.");
            } else if (authPayload.encryptedToken) {
                 // If raw token is not provided, but encryptedToken is, keep it (e.g. if only type changed)
                newEncryptedTokenValue = authPayload.encryptedToken;
            }


            updateDataForDb.authentication = {
                type: authPayload.type,
                encryptedToken: newEncryptedTokenValue,
            };
            // Ensure raw token is not in updateDataForDb.authentication if it was processed
            if ((updateDataForDb.authentication as any)?.token) {
                 delete (updateDataForDb.authentication as any).token;
            }
        }
        // If payload.authentication is undefined, it means no change to auth, so currentAgent.authentication will be preserved by updateAdkAgent
    }


    const updatedAgent = await updateAdkAgent(agentId, updateDataForDb);

    if (!updatedAgent) {
      return NextResponse.json({ error: "ADK Agent not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "ADK Agent updated successfully", agent: updatedAgent }, { status: 200 });
  } catch (error) {
    console.error(`Error updating ADK agent ${params.agentId}:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update ADK agent' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/adk-agents/{agentId}:
 *   delete:
 *     summary: Delete an ADK agent by ID
 *     tags: [ADK Agents]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the ADK agent to delete
 *     responses:
 *       200:
 *         description: ADK Agent deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: ADK Agent not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { agentId } = params;
    const success = await deleteAdkAgent(agentId);

    if (!success) {
      return NextResponse.json({ error: "ADK Agent not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "ADK Agent deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting ADK agent ${params.agentId}:`, error);
    return NextResponse.json({ error: 'Failed to delete ADK agent' }, { status: 500 });
  }
}
