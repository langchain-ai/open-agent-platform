"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdkAgentRegistrationPayload } from '@/types/adk-agent';
import { useToast } from '@/components/ui/use-toast'; // Assuming a toast component exists

const formSchema = z.object({
  name: z.string().min(1, 'Agent alias is required'),
  a2aBaseUrl: z.string().url('Invalid URL format').min(1, 'A2A Base URL is required'),
  authType: z.enum(['none', 'apikey', 'bearer']).default('none'),
  authToken: z.string().optional(),
}).refine(data => {
  if (data.authType !== 'none' && !data.authToken) {
    return false;
  }
  return true;
}, {
  message: "Token is required if authentication type is API Key or Bearer Token",
  path: ["authToken"], // Path to the field that the error message applies to
});

type RegisterAdkAgentFormValues = z.infer<typeof formSchema>;

interface RegisterAdkAgentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void; // Callback on successful registration
}

export function RegisterAdkAgentDialog({ open, onOpenChange, onSuccess }: RegisterAdkAgentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast(); // Assuming a toast component exists

  const form = useForm<RegisterAdkAgentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      a2aBaseUrl: '',
      authType: 'none',
      authToken: '',
    },
  });

  const watchAuthType = form.watch('authType');

  const onSubmit: SubmitHandler<RegisterAdkAgentFormValues> = async (values) => {
    setIsLoading(true);

    const payload: AdkAgentRegistrationPayload = {
      name: values.name,
      a2aBaseUrl: values.a2aBaseUrl,
    };

    if (values.authType !== 'none' && values.authToken) {
      payload.authentication = {
        type: values.authType,
        token: values.authToken,
      };
    }

    try {
      const response = await fetch('/api/adk-agents', { // Corrected API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to register agent. Status: ${response.status}`);
      }

      toast({
        title: 'Success',
        description: result.message || 'ADK Agent registered successfully.',
      });
      form.reset();
      onOpenChange?.(false);
      onSuccess?.();
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {/* This button can be external if `open` and `onOpenChange` are controlled */}
        {/* <Button variant="outline">Register ADK Agent</Button> */}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register New ADK Agent</DialogTitle>
          <DialogDescription>
            Provide the details for the new ADK-compatible agent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Alias (OAP)</Label>
            <Input id="name" {...form.register('name')} placeholder="My Custom ADK Agent" />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="a2aBaseUrl">A2A Base URL</Label>
            <Input
              id="a2aBaseUrl"
              {...form.register('a2aBaseUrl')}
              placeholder="https://my-adk-agent.example.com"
            />
            {form.formState.errors.a2aBaseUrl && (
              <p className="text-sm text-red-500">{form.formState.errors.a2aBaseUrl.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="authType">Authentication Type</Label>
            <Select
              value={form.getValues('authType')}
              onValueChange={(value) => form.setValue('authType', value as 'none' | 'apikey' | 'bearer', { shouldValidate: true })}
            >
              <SelectTrigger id="authType">
                <SelectValue placeholder="Select authentication type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="apikey">API Key</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(watchAuthType === 'apikey' || watchAuthType === 'bearer') && (
            <div>
              <Label htmlFor="authToken">Authentication Token</Label>
              <Input
                id="authToken"
                type="password"
                {...form.register('authToken')}
                placeholder="Enter your token"
              />
              {form.formState.errors.authToken && (
                <p className="text-sm text-red-500">{form.formState.errors.authToken.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
