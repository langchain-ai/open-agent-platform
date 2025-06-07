import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from './route'; // Actual route handlers
import { AdkAgentStoredData } from '@/types/adk-agent';
import { AgentCard } from '@/types/a2a';

// Mock services
import * as adkAgentService from '@/lib/adk-agent-service';
import * as a2aClient from '@/lib/a2a-client';
import * as encryptionService from '@/lib/encryption-service';

jest.mock('@/lib/adk-agent-service');
jest.mock('@/lib/a2a-client');
jest.mock('@/lib/encryption-service');

const mockedAdkAgentService = adkAgentService as jest.Mocked<typeof adkAgentService>;
const mockedA2AClientService = a2aClient.a2aClientService as jest.Mocked<typeof a2aClient.a2aClientService>;
const mockedEncryptionService = encryptionService as jest.Mocked<typeof encryptionService>;

// Helper to simulate NextRequest with params
const createRequest = (method: string, body?: any, params?: Record<string, string>) => {
  const url = new URL(`http://localhost/api/adk-agents/${params?.agentId || ''}`);
  return new NextRequest(url.toString(), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  });
};


describe('/api/adk-agents/[agentId]', () => {
  const mockAgentId = 'existing-uuid-123';
  const unknownAgentId = 'unknown-uuid-404';

  const mockAgentData: AdkAgentStoredData = {
    id: mockAgentId,
    name: 'Test Agent',
    a2aBaseUrl: 'http://example.com',
    agentCard: { kind: 'agent-card', name: 'Test Card', url: 'http://example.com/a2a', version: '1.0', capabilities: {}, defaultInputModes:[], defaultOutputModes:[], skills:[] } as AgentCard,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/adk-agents/{agentId}', () => {
    it('should return 200 OK with agent data if agentId exists', async () => {
      mockedAdkAgentService.getAdkAgentById.mockResolvedValue(mockAgentData);

      const request = createRequest('GET', undefined, { agentId: mockAgentId });
      const response = await GET(request, { params: { agentId: mockAgentId } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ agent: mockAgentData });
      expect(mockedAdkAgentService.getAdkAgentById).toHaveBeenCalledWith(mockAgentId);
    });

    it('should return 404 Not Found if agentId does not exist', async () => {
      mockedAdkAgentService.getAdkAgentById.mockResolvedValue(null);

      const request = createRequest('GET', undefined, { agentId: unknownAgentId });
      const response = await GET(request, { params: { agentId: unknownAgentId } });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('ADK Agent not found');
    });

    it('should return 500 if service throws an error', async () => {
      mockedAdkAgentService.getAdkAgentById.mockRejectedValue(new Error('DB Error'));

      const request = createRequest('GET', undefined, { agentId: mockAgentId });
      const response = await GET(request, { params: { agentId: mockAgentId } });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch ADK agent');
    });
  });

  describe('PUT /api/adk-agents/{agentId}', () => {
    const updatePayload = { name: 'Updated Agent Name' };
    const updatedAgentData = { ...mockAgentData, ...updatePayload, updatedAt: new Date().toISOString() };

    beforeEach(() => {
        // Most tests assume the agent to be updated exists
        mockedAdkAgentService.getAdkAgentById.mockResolvedValue(mockAgentData);
    });

    it('should return 200 OK with updated agent data (no URL/auth change)', async () => {
      mockedAdkAgentService.updateAdkAgent.mockResolvedValue(updatedAgentData);

      const request = createRequest('PUT', updatePayload, { agentId: mockAgentId });
      const response = await PUT(request, { params: { agentId: mockAgentId } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.message).toBe('ADK Agent updated successfully');
      expect(body.agent).toEqual(updatedAgentData);
      expect(mockedAdkAgentService.updateAdkAgent).toHaveBeenCalledWith(mockAgentId, updatePayload);
      expect(mockedA2AClientService.fetchAgentCard).not.toHaveBeenCalled();
      expect(mockedEncryptionService.encrypt).not.toHaveBeenCalled();
    });

    it('should return 200 OK when a2aBaseUrl changes and new card is fetched', async () => {
        const newBaseUrl = 'http://new-example.com';
        const newAgentCard: AgentCard = { ...mockAgentData.agentCard, name: 'New Fetched Card', url: `${newBaseUrl}/a2a` };
        const payloadWithUrlChange = { ...updatePayload, a2aBaseUrl: newBaseUrl };
        const finalUpdatedAgent = { ...updatedAgentData, a2aBaseUrl: newBaseUrl, agentCard: newAgentCard };

        mockedA2AClientService.fetchAgentCard.mockResolvedValue(newAgentCard);
        mockedAdkAgentService.updateAdkAgent.mockResolvedValue(finalUpdatedAgent);

        const request = createRequest('PUT', payloadWithUrlChange, { agentId: mockAgentId });
        const response = await PUT(request, { params: { agentId: mockAgentId } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mockedA2AClientService.fetchAgentCard).toHaveBeenCalledWith(newBaseUrl);
        expect(mockedAdkAgentService.updateAdkAgent).toHaveBeenCalledWith(mockAgentId, expect.objectContaining({ agentCard: newAgentCard }));
        expect(body.agent).toEqual(finalUpdatedAgent);
    });

    it('should return 200 OK when authentication.token changes and token is encrypted', async () => {
        const newAuth = { type: 'bearer' as const, token: 'new-secret-token' };
        const payloadWithAuthChange = { ...updatePayload, authentication: newAuth };
        const encryptedToken = 'mock-encrypted-new-secret';
        const finalUpdatedAgent = { ...updatedAgentData, authentication: { type: newAuth.type, encryptedToken }};

        mockedEncryptionService.encrypt.mockResolvedValue(encryptedToken);
        mockedAdkAgentService.updateAdkAgent.mockResolvedValue(finalUpdatedAgent);

        const request = createRequest('PUT', payloadWithAuthChange, { agentId: mockAgentId });
        const response = await PUT(request, { params: { agentId: mockAgentId } });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mockedEncryptionService.encrypt).toHaveBeenCalledWith(newAuth.token);
        expect(mockedAdkAgentService.updateAdkAgent).toHaveBeenCalledWith(mockAgentId, expect.objectContaining({
            authentication: { type: newAuth.type, encryptedToken },
        }));
        expect(body.agent).toEqual(finalUpdatedAgent);
    });


    it('should return 404 Not Found if agent to update does not exist', async () => {
      // Mock getAdkAgentById for the initial check in PUT to return null
      mockedAdkAgentService.getAdkAgentById.mockResolvedValue(null);
      // updateAdkAgent itself would also return null if it can't find the agent
      mockedAdkAgentService.updateAdkAgent.mockResolvedValue(null);

      const request = createRequest('PUT', updatePayload, { agentId: unknownAgentId });
      const response = await PUT(request, { params: { agentId: unknownAgentId } });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('ADK Agent not found for update'); // Error from initial getAdkAgentById check
    });

    it('should return 400 if fetchAgentCard fails during update', async () => {
        const payloadWithUrlChange = { ...updatePayload, a2aBaseUrl: 'http://new-example.com' };
        mockedA2AClientService.fetchAgentCard.mockRejectedValue(new Error('Fetch Card Error'));

        const request = createRequest('PUT', payloadWithUrlChange, { agentId: mockAgentId });
        const response = await PUT(request, { params: { agentId: mockAgentId } });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain('Failed to fetch or validate new Agent Card: Fetch Card Error');
    });

    it('should return 400 if new AgentCard is invalid (Zod error) during update', async () => {
        const payloadWithUrlChange = { ...updatePayload, a2aBaseUrl: 'http://new-example.com' };
        const malformedCard = { name: null }; // Invalid card
        mockedA2AClientService.fetchAgentCard.mockResolvedValue(malformedCard as any);

        const request = createRequest('PUT', payloadWithUrlChange, { agentId: mockAgentId });
        const response = await PUT(request, { params: { agentId: mockAgentId } });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe('Re-fetched Agent Card is invalid.');
        expect(body.details).toBeDefined();
    });

    it('should return 500 if updateAdkAgent service fails', async () => {
        mockedAdkAgentService.updateAdkAgent.mockRejectedValue(new Error('DB Update Error'));
        const request = createRequest('PUT', updatePayload, { agentId: mockAgentId });
        const response = await PUT(request, { params: { agentId: mockAgentId } });
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toBe('Failed to update ADK agent');
    });
  });

  describe('DELETE /api/adk-agents/{agentId}', () => {
    it('should return 200 OK on successful deletion', async () => {
      mockedAdkAgentService.deleteAdkAgent.mockResolvedValue(true);

      const request = createRequest('DELETE', undefined, { agentId: mockAgentId });
      const response = await DELETE(request, { params: { agentId: mockAgentId } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.message).toBe('ADK Agent deleted successfully');
      expect(mockedAdkAgentService.deleteAdkAgent).toHaveBeenCalledWith(mockAgentId);
    });

    it('should return 404 Not Found if agent to delete does not exist', async () => {
      mockedAdkAgentService.deleteAdkAgent.mockResolvedValue(false);

      const request = createRequest('DELETE', undefined, { agentId: unknownAgentId });
      const response = await DELETE(request, { params: { agentId: unknownAgentId } });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('ADK Agent not found');
    });

    it('should return 500 if service throws an error during delete', async () => {
      mockedAdkAgentService.deleteAdkAgent.mockRejectedValue(new Error('DB Delete Error'));

      const request = createRequest('DELETE', undefined, { agentId: mockAgentId });
      const response = await DELETE(request, { params: { agentId: mockAgentId } });
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to delete ADK agent');
    });
  });
});
