import { NextRequest } from 'next/server';
import { GET, POST } from './route'; // Actual route handlers
import { AdkAgentRegistrationPayload, AdkAgentStoredData } from '@/types/adk-agent';
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


describe('/api/adk-agents', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 200 OK with an empty list of agents', async () => {
      mockedAdkAgentService.getAllAdkAgents.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/adk-agents');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ agents: [] });
      expect(mockedAdkAgentService.getAllAdkAgents).toHaveBeenCalledTimes(1);
    });

    it('should return 200 OK with a list of agents if data exists', async () => {
      const mockAgents: AdkAgentStoredData[] = [
        { id: '1', name: 'Agent 1', a2aBaseUrl: 'http://agent1.com', agentCard: {} as AgentCard, createdAt: '', updatedAt: '' },
        { id: '2', name: 'Agent 2', a2aBaseUrl: 'http://agent2.com', agentCard: {} as AgentCard, createdAt: '', updatedAt: '' },
      ];
      mockedAdkAgentService.getAllAdkAgents.mockResolvedValue(mockAgents);

      const request = new NextRequest('http://localhost/api/adk-agents');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ agents: mockAgents });
    });

    it('should return 500 if adkAgentService.getAllAdkAgents throws an error', async () => {
      mockedAdkAgentService.getAllAdkAgents.mockRejectedValue(new Error('DB Error'));

      const request = new NextRequest('http://localhost/api/adk-agents');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ error: 'Failed to fetch ADK agents' });
    });
  });

  describe('POST', () => {
    const validPayload: AdkAgentRegistrationPayload = {
      name: 'New ADK Agent',
      a2aBaseUrl: 'http://new-agent.com',
      authentication: { type: 'bearer', token: 'secret-token' },
    };

    const mockAgentCard: AgentCard = {
      kind: 'agent-card',
      name: 'Fetched Card',
      url: 'http://new-agent.com/a2a',
      version: '1.0',
      capabilities: { streaming: true },
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['text/plain'],
      skills: [{id: 's1', name: 'Skill1'}],
    };

    const mockCreatedAgent: AdkAgentStoredData = {
      id: 'gen-uuid',
      name: validPayload.name,
      a2aBaseUrl: validPayload.a2aBaseUrl,
      authentication: { type: 'bearer', encryptedToken: 'mock-encrypted-secret-token' },
      agentCard: mockAgentCard,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
        mockedA2AClientService.fetchAgentCard.mockResolvedValue(mockAgentCard);
        mockedEncryptionService.encrypt.mockResolvedValue('mock-encrypted-secret-token');
        mockedAdkAgentService.createAdkAgent.mockResolvedValue(mockCreatedAgent);
    });

    it('should register an agent and return 201 on valid payload', async () => {
      const request = new NextRequest('http://localhost/api/adk-agents', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.message).toBe('ADK Agent registered successfully');
      expect(body.agent).toEqual(mockCreatedAgent);
      expect(mockedA2AClientService.fetchAgentCard).toHaveBeenCalledWith(validPayload.a2aBaseUrl);
      expect(mockedEncryptionService.encrypt).toHaveBeenCalledWith(validPayload.authentication?.token);
      expect(mockedAdkAgentService.createAdkAgent).toHaveBeenCalledWith({
        name: validPayload.name,
        a2aBaseUrl: validPayload.a2aBaseUrl,
        authentication: {
          type: validPayload.authentication?.type,
          encryptedToken: 'mock-encrypted-secret-token',
        },
        agentCard: mockAgentCard,
      });
    });

    it('should return 400 if name is missing', async () => {
      const invalidPayload = { ...validPayload, name: '' };
      const request = new NextRequest('http://localhost/api/adk-agents', {
        method: 'POST', body: JSON.stringify(invalidPayload), headers: { 'Content-Type': 'application/json' }
      });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toBe('Missing required fields: name and a2aBaseUrl');
    });

    it('should return 400 if a2aBaseUrl is invalid', async () => {
        const invalidPayload = { ...validPayload, a2aBaseUrl: 'not-a-valid-url' };
        const request = new NextRequest('http://localhost/api/adk-agents', {
          method: 'POST', body: JSON.stringify(invalidPayload), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request);
        const body = await response.json();
        expect(response.status).toBe(400);
        expect(body.error).toBe('Invalid a2aBaseUrl format');
      });

    it('should return 400 if fetchAgentCard fails', async () => {
      mockedA2AClientService.fetchAgentCard.mockRejectedValue(new Error('Fetch failed'));
      const request = new NextRequest('http://localhost/api/adk-agents', {
        method: 'POST', body: JSON.stringify(validPayload), headers: { 'Content-Type': 'application/json' }
      });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toContain('Failed to fetch or validate Agent Card');
      expect(body.error).toContain('Fetch failed');
    });

    it('should return 400 if fetched AgentCard is invalid (Zod parse error)', async () => {
        const malformedCard = { name: 'Only Name', url: null }; // Missing fields, url is not a string
        mockedA2AClientService.fetchAgentCard.mockResolvedValue(malformedCard as any); // Cast to any to bypass TS for test

        const request = new NextRequest('http://localhost/api/adk-agents', {
            method: 'POST', body: JSON.stringify(validPayload), headers: { 'Content-Type': 'application/json' }
        });
        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe('Fetched Agent Card is invalid.');
        expect(body.details).toBeDefined(); // Zod error details
      });

    it('should return 500 if encryption fails', async () => {
      mockedEncryptionService.encrypt.mockRejectedValue(new Error('Encryption error'));
      const request = new NextRequest('http://localhost/api/adk-agents', {
        method: 'POST', body: JSON.stringify(validPayload), headers: { 'Content-Type': 'application/json' }
      });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to process token (mock encryption).');
    });

    it('should handle registration without authentication details', async () => {
        const payloadWithoutAuth = { ...validPayload };
        delete payloadWithoutAuth.authentication; // Remove authentication

        const createdAgentWithoutAuth = { ...mockCreatedAgent };
        delete createdAgentWithoutAuth.authentication; // Adjust mock created agent

        mockedAdkAgentService.createAdkAgent.mockResolvedValue(createdAgentWithoutAuth);

        const request = new NextRequest('http://localhost/api/adk-agents', {
          method: 'POST',
          body: JSON.stringify(payloadWithoutAuth),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body.agent).toEqual(createdAgentWithoutAuth);
        expect(mockedEncryptionService.encrypt).not.toHaveBeenCalled();
        expect(mockedAdkAgentService.createAdkAgent).toHaveBeenCalledWith(expect.objectContaining({
          authentication: undefined,
        }));
      });

    it('should return 500 if createAdkAgent service fails', async () => {
      mockedAdkAgentService.createAdkAgent.mockRejectedValue(new Error('DB create error'));
      const request = new NextRequest('http://localhost/api/adk-agents', {
        method: 'POST', body: JSON.stringify(validPayload), headers: { 'Content-Type': 'application/json' }
      });
      const response = await POST(request);
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to register ADK agent'); // Generic error from catch block
    });
  });
});
