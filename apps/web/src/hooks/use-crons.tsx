import { useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import { useAuthContext } from "@/providers/Auth";
import { Cron, CronInput, CreateCronFormData } from "@/types/cron";
import { toast } from "sonner";

/**
 * Custom hook for managing cron job operations
 * Provides functions to list, create, update, and delete cron jobs
 */
export function useCrons() {
  const { session, user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [crons, setCrons] = useState<Cron[]>([]);

  /**
   * List all crons for a specific assistant
   */
  const listCrons = useCallback(
    async (assistantId: string, deploymentId: string) => {
      if (!session?.access_token) {
        toast.error("Authentication required");
        return [];
      }

      setLoading(true);
      try {
        const client = createClient(deploymentId, session.access_token);
        
        // Get all crons and filter by assistant_id and owner
        const response = await client.crons.list();
        const userCrons = response.filter(
          (cron: Cron) =>
            cron.assistant_id === assistantId &&
            cron.metadata?.owner === user?.id
        );
        
        setCrons(userCrons);
        return userCrons;
      } catch (error) {
        console.error("Failed to list crons:", error);
        toast.error("Failed to load cron jobs");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [session, user]
  );

  /**
   * Create a new cron job
   */
  const createCron = useCallback(
    async (
      assistantId: string,
      deploymentId: string,
      formData: CreateCronFormData
    ) => {
      if (!session?.access_token || !user?.id) {
        toast.error("Authentication required");
        return null;
      }

      setLoading(true);
      try {
        const client = createClient(deploymentId, session.access_token);

        const cronInput: CronInput = {
          schedule: formData.schedule,
          input: {
            messages: [
              {
                role: "user",
                content: formData.inputMessage,
              },
            ],
          },
          metadata: {
            owner: user.id,
            name: formData.name,
          },
        };

        const newCron = await client.crons.create(assistantId, cronInput);
        
        toast.success("Cron job created successfully");
        
        // Refresh the crons list
        await listCrons(assistantId, deploymentId);
        
        return newCron;
      } catch (error) {
        console.error("Failed to create cron:", error);
        toast.error("Failed to create cron job");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session, user, listCrons]
  );

  /**
   * Update an existing cron job
   */
  const updateCron = useCallback(
    async (
      cronId: string,
      deploymentId: string,
      assistantId: string,
      formData: CreateCronFormData
    ) => {
      if (!session?.access_token || !user?.id) {
        toast.error("Authentication required");
        return null;
      }

      setLoading(true);
      try {
        const client = createClient(deploymentId, session.access_token);

        // LangGraph SDK update method expects the full cron input
        const updateInput: CronInput = {
          schedule: formData.schedule,
          input: {
            messages: [
              {
                role: "user",
                content: formData.inputMessage,
              },
            ],
          },
          metadata: {
            owner: user.id,
            name: formData.name,
          },
        };

        const updatedCron = await client.crons.update(cronId, updateInput);
        
        toast.success("Cron job updated successfully");
        
        // Refresh the crons list
        await listCrons(assistantId, deploymentId);
        
        return updatedCron;
      } catch (error) {
        console.error("Failed to update cron:", error);
        toast.error("Failed to update cron job");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session, user, listCrons]
  );

  /**
   * Delete a cron job
   */
  const deleteCron = useCallback(
    async (cronId: string, deploymentId: string, assistantId: string) => {
      if (!session?.access_token) {
        toast.error("Authentication required");
        return false;
      }

      setLoading(true);
      try {
        const client = createClient(deploymentId, session.access_token);
        
        await client.crons.delete(cronId);
        
        toast.success("Cron job deleted successfully");
        
        // Refresh the crons list
        await listCrons(assistantId, deploymentId);
        
        return true;
      } catch (error) {
        console.error("Failed to delete cron:", error);
        toast.error("Failed to delete cron job");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [session, listCrons]
  );

  return {
    crons,
    loading,
    listCrons,
    createCron,
    updateCron,
    deleteCron,
  };
}
