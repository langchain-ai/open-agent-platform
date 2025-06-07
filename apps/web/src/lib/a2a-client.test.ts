import { A2AClientService } from './a2a-client'; // Use default export if singleton, or named if class
import {
    AgentCard,
    MessageSendParams,
    Task,
    Message,
    JSONRPCSuccessResponse,
    JSONRPCErrorResponse,
    TextPart,
    TaskState
} from '@/types/a2a';

// Mocking global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('A2AClientService', () => {
  let client: A2AClientService;

  beforeEach(() => {
    client = new A2AClientService();
    mockFetch.mockClear(); // Clear fetch mock before each test
  });

  describe('fetchAgentCard', () => {
    const baseUrl = 'http://fake-agent.com';
    const agentCardUrl = `${baseUrl}/.well-known/agent.json`;
    const mockAgentCard: AgentCard = {
      kind: 'agent-card',
      name: 'Test Agent',
      version: '1.0',
      url: `${baseUrl}/a2a`, // Service endpoint
      capabilities: { streaming: false },
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['text/plain'],
      skills: [{ id: 'skill1', name: 'Test Skill', description: 'Does something cool' }],
    };

    it('should fetch and return an AgentCard on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgentCard,
        text: async () => JSON.stringify(mockAgentCard),
      } as Response);

      const card = await client.fetchAgentCard(baseUrl);
      expect(mockFetch).toHaveBeenCalledWith(agentCardUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      expect(card).toEqual(mockAgentCard);
    });

    it('should throw an error if the network response is not ok (e.g. 404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      } as Response);

      await expect(client.fetchAgentCard(baseUrl))
        .rejects
        .toThrow(`Failed to fetch Agent Card from ${agentCardUrl}. Status: 404`);
    });

    it('should throw an error if the network response is not ok (e.g. 500)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "Server Error",
        } as Response);

        await expect(client.fetchAgentCard(baseUrl))
          .rejects
          .toThrow(`Failed to fetch Agent Card from ${agentCardUrl}. Status: 500`);
      });

    it('should throw an error if the response is not valid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new SyntaxError("Unexpected token < in JSON"); },
        text: async () => "<invalid json>",
      } as Response);
      await expect(client.fetchAgentCard(baseUrl)).rejects.toThrow(SyntaxError);
    });

    it('should throw an error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
      await expect(client.fetchAgentCard(baseUrl)).rejects.toThrow(TypeError);
    });
  });

  describe('sendMessage', () => {
    const a2aServiceUrl = 'http://fake-agent.com/a2a';
    const textPart: TextPart = { kind: 'text', text: 'Hello' };
    const mockMessageSendParams: MessageSendParams = {
      message: {
        kind: 'message',
        messageId: 'msg1',
        role: 'user',
        parts: [textPart],
      },
    };

    const mockTaskResponse: Task = {
      kind: 'task',
      id: 'task1',
      contextId: 'ctx1',
      status: { state: TaskState.Completed, message: { kind: 'message', messageId: 'resp-msg', role: 'agent', parts: [textPart] } },
      history: [],
      artifacts: [],
    };

    const mockMessageResponse: Message = {
        kind: 'message',
        messageId: 'resp-msg-direct',
        role: 'agent',
        parts: [textPart],
    };

    it('should send a message and return a Task result on success', async () => {
      const mockRpcSuccessResponse: JSONRPCSuccessResponse = {
        jsonrpc: '2.0',
        id: expect.any(String), // ID is dynamically generated
        result: mockTaskResponse,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRpcSuccessResponse,
      } as Response);

      const result = await client.sendMessage(a2aServiceUrl, mockMessageSendParams);
      expect(mockFetch).toHaveBeenCalledWith(a2aServiceUrl, expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: expect.stringContaining(`"method":"message/send","params":${JSON.stringify(mockMessageSendParams)}`),
      }));
      expect(result).toEqual(mockTaskResponse);
    });

    it('should send a message and return a Message result on success', async () => {
        const mockRpcSuccessResponse: JSONRPCSuccessResponse = {
          jsonrpc: '2.0',
          id: expect.any(String),
          result: mockMessageResponse,
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockRpcSuccessResponse,
        } as Response);

        const result = await client.sendMessage(a2aServiceUrl, mockMessageSendParams);
        expect(result).toEqual(mockMessageResponse);
      });

    it('should include Authorization header if authToken is provided', async () => {
      const mockRpcSuccessResponse: JSONRPCSuccessResponse = {
        jsonrpc: '2.0',
        id: expect.any(String),
        result: mockTaskResponse,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRpcSuccessResponse,
      } as Response);
      const authToken = 'test-bearer-token';
      await client.sendMessage(a2aServiceUrl, mockMessageSendParams, authToken);

      expect(mockFetch).toHaveBeenCalledWith(a2aServiceUrl, expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }),
      }));
    });

    it('should throw an error if JSON-RPC response contains an error', async () => {
      const mockRpcErrorResponse: JSONRPCErrorResponse = {
        jsonrpc: '2.0',
        id: 'oap-a2a-error-id',
        error: { code: -32000, message: 'A2A Specific Server error' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRpcErrorResponse,
      } as Response);

      await expect(client.sendMessage(a2aServiceUrl, mockMessageSendParams))
        .rejects.toThrow('A2A message/send failed: A2A Specific Server error (Code: -32000)');
    });

    it('should throw an error if the network response for sendMessage is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as Response);

      await expect(client.sendMessage(a2aServiceUrl, mockMessageSendParams))
        .rejects.toThrow('A2A message/send request failed. Status: 500');
    });

    it('should throw an error on network failure for sendMessage', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed for send'));
      await expect(client.sendMessage(a2aServiceUrl, mockMessageSendParams))
        .rejects.toThrow('Network request failed for send');
    });

    it('should throw an error if sendMessage response is not valid JSON', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => { throw new SyntaxError("Bad JSON in sendMessage"); },
          text: async () => "<invalid json>",
        } as Response);
        await expect(client.sendMessage(a2aServiceUrl, mockMessageSendParams)).rejects.toThrow(SyntaxError);
      });
  });
});
