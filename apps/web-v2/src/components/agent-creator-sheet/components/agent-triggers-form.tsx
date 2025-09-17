import { useForm, UseFormReturn } from "react-hook-form";

export interface AgentTriggersFormData {
  triggerIds: string[];
}

export interface UseAgentTriggersFormProps {
  triggerIds?: string[];
}

export function useAgentTriggersForm(props: UseAgentTriggersFormProps = {}) {
  const form = useForm<AgentTriggersFormData>({
    defaultValues: {
      triggerIds: props.triggerIds ?? [],
    },
  });

  return form;
}

export interface AgentTriggersFormProps {
  form: UseFormReturn<AgentTriggersFormData>;
  children: React.ReactNode;
}

export function AgentTriggersForm({ form, children }: AgentTriggersFormProps) {
  return <form>{children}</form>;
}
