"use client";
import { ChatInterface } from "./components/ChatInterface";
import { ChatProvider } from "./providers/ChatProvider";
import { DeepAgentChatConfig } from "./types/config";
import { ClientProvider } from "./providers/ClientProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

function DeepAgentChatInterfaceInternal({
  assistant,
  deploymentUrl,
  accessToken,
  optimizerDeploymentUrl,
  optimizerAccessToken,
  onHistoryRevalidate,
  view,
  onInput,
  onViewChange,
  hideInternalToggle,
  controls,
  banner,
  thread,
  empty,
  skeleton,
  testMode,
}: DeepAgentChatConfig) {
  return (
    <ClientProvider
      deploymentUrl={deploymentUrl}
      accessToken={accessToken}
      optimizerUrl={optimizerDeploymentUrl}
      optimizerAccessToken={optimizerAccessToken}
    >
      <ChatProvider
        activeAssistant={assistant}
        onHistoryRevalidate={onHistoryRevalidate}
        thread={thread}
        testMode={testMode}
      >
        <div className="oap-deep-agent-chat flex h-full w-full gap-4 overflow-hidden">
          <ChatInterface
            assistant={assistant}
            view={view}
            onViewChange={onViewChange}
            onInput={onInput}
            hideInternalToggle={hideInternalToggle}
            empty={empty}
            skeleton={skeleton}
            controls={controls}
            banner={banner}
            testMode={Boolean(testMode)}
          />
        </div>
      </ChatProvider>
    </ClientProvider>
  );
}

export function DeepAgentChatInterface(props: DeepAgentChatConfig) {
  return (
    <NuqsAdapter>
      <DeepAgentChatInterfaceInternal {...props} />
    </NuqsAdapter>
  );
}
