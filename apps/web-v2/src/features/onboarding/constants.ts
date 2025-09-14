export enum Roles {
  ANSWER_SUPPORT = "answer_support",
  ANALYSE_REPORTS = "analyse_reports",
  SUMMARIZE_TRANSFORM = "summarize_transform",
  AUTOMATE_WORKFLOWS = "automate_workflows",
  OTHER = "other",
}

export const roleToText: Record<Roles, string> = {
  [Roles.ANSWER_SUPPORT]: "Answer user questions or provide support",
  [Roles.ANALYSE_REPORTS]: "Analyse data or generate reports",
  [Roles.SUMMARIZE_TRANSFORM]: "Summarize or transform text",
  [Roles.AUTOMATE_WORKFLOWS]: "Automate internal workflows",
  [Roles.OTHER]: "Something else (please specify)",
};

export enum Audience {
  INTERNAL_TEAMMATES = "internal_teammates",
  EXTERNAL_USERS = "external_users",
  OTHER_AGENTS = "other_agents",
  JUST_ME = "just_me",
  NOT_SURE = "not_sure",
  OTHER = "other",
}

export const audienceToText: Record<Audience, string> = {
  [Audience.INTERNAL_TEAMMATES]: "Internal teammates",
  [Audience.EXTERNAL_USERS]: "External users or customers",
  [Audience.OTHER_AGENTS]: "Other agents or systems",
  [Audience.JUST_ME]: "Just me for now",
  [Audience.NOT_SURE]: "Not sure yet",
  [Audience.OTHER]: "Something else (please specify)",
};

export enum InputKind {
  TEXT_PROMPTS = "text_prompts",
  UPLOADED_FILES = "uploaded_files",
  STRUCTURED_DATA = "structured_data",
  API_EVENTS = "api_events",
  NOT_SURE = "not_sure",
  OTHER = "other",
}

export const inputKindToText: Record<InputKind, string> = {
  [InputKind.TEXT_PROMPTS]: "Text prompts or questions",
  [InputKind.UPLOADED_FILES]: "Uploaded files",
  [InputKind.STRUCTURED_DATA]: "Structured data (JSON, CSV, forms)",
  [InputKind.API_EVENTS]: "API events or webhooks",
  [InputKind.NOT_SURE]: "Not sure yet",
  [InputKind.OTHER]: "Something else (please specify)",
};

export enum AccessKind {
  INTERNAL_DOCS = "internal_docs",
  EXTERNAL_APIS = "external_apis",
  WEB_SEARCH = "web_search",
  NOTHING = "nothing",
  NOT_SURE = "not_sure",
  OTHER = "other",
}

export const accessKindToText: Record<AccessKind, string> = {
  [AccessKind.INTERNAL_DOCS]: "Internal docs or databases",
  [AccessKind.EXTERNAL_APIS]: "External APIs",
  [AccessKind.WEB_SEARCH]: "Real-time web search",
  [AccessKind.NOTHING]: "Nothing -  just reasoning and context",
  [AccessKind.NOT_SURE]: "Not sure yet",
  [AccessKind.OTHER]: "Something else (please specify)",
};

export enum MemoryKind {
  STORE_ACROSS_SESSIONS = "store_across_sessions",
  SINGLE_SESSION = "single_session",
  STATELESS = "stateless",
  NOT_SURE = "not_sure",
  OTHER = "other",
}

export const memoryKindToText: Record<MemoryKind, string> = {
  [MemoryKind.STORE_ACROSS_SESSIONS]: "Yes, store memory across sessions",
  [MemoryKind.SINGLE_SESSION]: "Only remember things during a single session",
  [MemoryKind.STATELESS]: "No, it should be stateless",
  [MemoryKind.NOT_SURE]: "Not sure yet",
  [MemoryKind.OTHER]: "Something else (please specify)",
};

export enum CapabilityKind {
  READ_ONLY = "read_only",
  WRITE_DATA = "write_data",
  SEND_MESSAGES = "send_messages",
  EXECUTE_FUNCTIONS = "execute_functions",
  EXPLORE = "explore",
  OTHER = "other",
}

export const capabilityKindToText: Record<CapabilityKind, string> = {
  [CapabilityKind.READ_ONLY]: "Read only",
  [CapabilityKind.WRITE_DATA]: "Write data",
  [CapabilityKind.SEND_MESSAGES]: "Send messages or notifications",
  [CapabilityKind.EXECUTE_FUNCTIONS]: "Execute functions or code",
  [CapabilityKind.EXPLORE]: "Just explore for now",
  [CapabilityKind.OTHER]: "Something else (please specify)",
};

export enum SubAgentsChoice {
  YES = "yes",
  NOT_RIGHT_NOW = "not_right_now",
  NOT_SURE_MEANS = "not_sure_means",
}

export const subAgentsChoiceToText: Record<SubAgentsChoice, string> = {
  [SubAgentsChoice.YES]: "Yes",
  [SubAgentsChoice.NOT_RIGHT_NOW]: "Not right now",
  [SubAgentsChoice.NOT_SURE_MEANS]: "I'm not sure what that means",
};

export enum ToneKind {
  PROFESSIONAL = "professional",
  FRIENDLY = "friendly",
  CASUAL = "casual",
  FORMAL = "formal",
  CUSTOM = "custom",
}

export const toneKindToText: Record<ToneKind, string> = {
  [ToneKind.PROFESSIONAL]: "Professional and concise",
  [ToneKind.FRIENDLY]: "Friendly and helpful",
  [ToneKind.CASUAL]: "Casual and informal",
  [ToneKind.FORMAL]: "Formal and structured",
  [ToneKind.CUSTOM]: "I'll write a custom tone",
};

export enum ReasoningKind {
  ALWAYS = "always",
  ON_REQUEST = "on_request",
  NO = "no",
}

export const reasoningKindToText: Record<ReasoningKind, string> = {
  [ReasoningKind.ALWAYS]: "Yes, always explain the steps",
  [ReasoningKind.ON_REQUEST]: "Only when I ask for it",
  [ReasoningKind.NO]: "No, just show me the result",
};

export enum GuardrailKind {
  NO_SENSITIVE = "no_sensitive",
  CONFIRM_BEFORE_ACTION = "confirm_before_action",
  NEVER_DELETE_MODIFY = "never_delete_modify",
  NO_CONSTRAINTS = "no_constraints",
  CUSTOM = "custom",
}

export const guardrailKindToText: Record<GuardrailKind, string> = {
  [GuardrailKind.NO_SENSITIVE]: "Don't store or share sensitive data",
  [GuardrailKind.CONFIRM_BEFORE_ACTION]: "Always confirm before taking action",
  [GuardrailKind.NEVER_DELETE_MODIFY]: "Never delete or modify data",
  [GuardrailKind.NO_CONSTRAINTS]: "No constraints",
  [GuardrailKind.CUSTOM]: "I'll define my own",
};

export enum RunLocationKind {
  WEB_APP_DASHBOARD = "web_app_dashboard",
  CHAT_INTERFACE = "chat_interface",
  EMBEDDED_PRODUCT = "embedded_product",
  NONE_EXPERIMENTING = "none_experimenting",
}

export const runLocationKindToText: Record<RunLocationKind, string> = {
  [RunLocationKind.WEB_APP_DASHBOARD]: "A web app or internal dashboard",
  [RunLocationKind.CHAT_INTERFACE]: "Chat interface",
  [RunLocationKind.EMBEDDED_PRODUCT]: "Embedded in a product",
  [RunLocationKind.NONE_EXPERIMENTING]: "Nowhere yet, I'm still experimenting",
};

export enum LoggingKind {
  LOG_EVERYTHING = "log_everything",
  LOG_MAJOR_DECISIONS = "log_major_decisions",
  NO_LOGGING = "no_logging",
}

export const loggingKindToText: Record<LoggingKind, string> = {
  [LoggingKind.LOG_EVERYTHING]: "Yes, log everything",
  [LoggingKind.LOG_MAJOR_DECISIONS]: "Only log major decisions",
  [LoggingKind.NO_LOGGING]: "No logging needed",
};
