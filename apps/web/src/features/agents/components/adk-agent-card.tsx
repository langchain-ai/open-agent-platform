"use client";

import React from 'react';
import { AdkAgentStoredData, AgentCard as AgentCardType } from '@/types/adk-agent'; // Assuming AgentCard is also in adk-agent.ts
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface AdkAgentCardProps {
  agent: AdkAgentStoredData;
  onEdit?: (agentId: string) => void; // Placeholder for edit action
  onDelete?: (agentId: string) => void; // Placeholder for delete action
}

export function AdkAgentCard({ agent, onEdit, onDelete }: AdkAgentCardProps) {
  const { toast } = useToast();
  const agentCard = agent.agentCard as AgentCardType | undefined; // Type assertion

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete agent "${agent.name}"?`)) {
      return;
    }
    // Placeholder for API call
    console.log(`Attempting to delete agent ${agent.id}`);
    try {
      const response = await fetch(`/api/adk-agents/${agent.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete agent');
      }
      toast({
        title: 'Success',
        description: `Agent "${agent.name}" deleted successfully.`,
      });
      onDelete?.(agent.id); // Callback to update UI
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{agent.name}</CardTitle>
        {agentCard?.name && agentCard.name !== agent.name && (
          <CardDescription>ADK Name: {agentCard.name}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {agentCard ? (
          <>
            {agentCard.description && (
              <div>
                <h4 className="font-semibold">Description:</h4>
                <p className="text-sm">{agentCard.description}</p>
              </div>
            )}
            {agentCard.url && (
              <div>
                <h4 className="font-semibold">A2A Endpoint:</h4>
                <p className="text-sm break-all">{agentCard.url}</p>
              </div>
            )}
             {agent.a2aBaseUrl && agent.a2aBaseUrl !== agentCard.url && (
                <div>
                    <h4 className="font-semibold">Registered Base URL:</h4>
                    <p className="text-sm break-all">{agent.a2aBaseUrl}</p>
                </div>
            )}
            {agentCard.capabilities && (
              <div>
                <h4 className="font-semibold">Capabilities:</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {agentCard.capabilities.streaming !== undefined && (
                    <Badge variant={agentCard.capabilities.streaming ? 'default' : 'secondary'}>
                      Streaming: {agentCard.capabilities.streaming ? 'Yes' : 'No'}
                    </Badge>
                  )}
                  {agentCard.capabilities.pushNotifications !== undefined && (
                     <Badge variant={agentCard.capabilities.pushNotifications ? 'default' : 'secondary'}>
                      Push Notifications: {agentCard.capabilities.pushNotifications ? 'Yes' : 'No'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {agentCard.skills && agentCard.skills.length > 0 && (
              <div>
                <h4 className="font-semibold">Skills:</h4>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {agentCard.skills.map((skill) => (
                    <li key={skill.id} className="text-sm">
                      <strong>{skill.name}</strong>
                      {skill.description && `: ${skill.description}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!agentCard.description && !agentCard.capabilities && (!agentCard.skills || agentCard.skills.length === 0) && (
                 <p className="text-sm text-gray-500">No detailed information provided in Agent Card.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">Agent Card data not available or failed to load.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => onEdit?.(agent.id)} disabled>Edit (Not Implemented)</Button>
        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
      </CardFooter>
    </Card>
  );
}
