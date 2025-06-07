import { AdkAgentStoredData } from '../types/adk-agent';
import { v4 as uuidv4 } from 'uuid';

let adkAgentsStore: AdkAgentStoredData[] = [];

// Helper for deep copying to simulate immutability of a real DB
function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Retrieves all ADK agents from the in-memory store.
 * @returns A promise that resolves to an array of all ADK agents (deep copies).
 */
export async function getAllAdkAgents(): Promise<AdkAgentStoredData[]> {
  return Promise.resolve(deepCopy(adkAgentsStore));
}

/**
 * Retrieves a specific ADK agent by its ID.
 * @param id The ID of the agent to retrieve.
 * @returns A promise that resolves to the agent data (deep copy) or null if not found.
 */
export async function getAdkAgentById(id: string): Promise<AdkAgentStoredData | null> {
  const agent = adkAgentsStore.find(a => a.id === id);
  return Promise.resolve(agent ? deepCopy(agent) : null);
}

/**
 * Creates a new ADK agent and adds it to the store.
 * @param data The data for the new agent, excluding id, createdAt, and updatedAt.
 * @returns A promise that resolves to the newly created agent data (deep copy).
 */
export async function createAdkAgent(
  data: Omit<AdkAgentStoredData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AdkAgentStoredData> {
  const now = new Date().toISOString();
  const newAgent: AdkAgentStoredData = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  adkAgentsStore.push(newAgent);
  return Promise.resolve(deepCopy(newAgent));
}

/**
 * Updates an existing ADK agent by its ID.
 * @param id The ID of the agent to update.
 * @param updates Partial data to update the agent with.
 * @returns A promise that resolves to the updated agent data (deep copy) or null if not found.
 */
export async function updateAdkAgent(
  id: string,
  updates: Partial<Omit<AdkAgentStoredData, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<AdkAgentStoredData | null> {
  const agentIndex = adkAgentsStore.findIndex(a => a.id === id);
  if (agentIndex === -1) {
    return Promise.resolve(null);
  }

  const updatedAgent = {
    ...adkAgentsStore[agentIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  adkAgentsStore[agentIndex] = updatedAgent;
  return Promise.resolve(deepCopy(updatedAgent));
}

/**
 * Deletes an ADK agent by its ID.
 * @param id The ID of the agent to delete.
 * @returns A promise that resolves to true if deletion was successful, false otherwise.
 */
export async function deleteAdkAgent(id: string): Promise<boolean> {
  const initialLength = adkAgentsStore.length;
  adkAgentsStore = adkAgentsStore.filter(a => a.id !== id);
  return Promise.resolve(adkAgentsStore.length < initialLength);
}

/**
 * Clears all agents from the in-memory store. Useful for testing.
 * @returns A promise that resolves when the store is cleared.
 */
export async function clearAdkAgentsStore(): Promise<void> {
  adkAgentsStore = [];
  return Promise.resolve();
}

/**
 * Seeds the store with initial data. Useful for testing.
 * @param agents An array of AdkAgentStoredData to seed the store with.
 * @returns A promise that resolves when the store is seeded.
 */
export async function seedAdkAgentsStore(agents: AdkAgentStoredData[]): Promise<void> {
    adkAgentsStore = deepCopy(agents);
    return Promise.resolve();
}
