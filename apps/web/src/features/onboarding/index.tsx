"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { OnboardingForm } from "./components/onboarding-form";
import { GeneratedAgentConfig } from "./types";
import { useAgents } from "@/hooks/use-agents";
import { useAgentsContext } from "@/providers/Agents";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function OnboardingInterface() {
  const [step, setStep] = useState<"welcome" | "form" | "success">("welcome");
  const [generatedAgent, setGeneratedAgent] = useState<GeneratedAgentConfig | null>(null);
  const { createAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const router = useRouter();

  const handleStartOnboarding = () => {
    setStep("form");
  };

  const handleAgentGenerated = (agentConfig: GeneratedAgentConfig) => {
    setGeneratedAgent(agentConfig);
    setStep("success");
  };

  const handleCreateAgent = async () => {
    if (!generatedAgent) return;

    try {
      // For now, we'll use a default deployment and graph
      // In a real implementation, you'd want to select these based on user preferences
      const defaultDeploymentId = "default"; // This would come from your deployment configuration
      const defaultGraphId = "default"; // This would come from your graph configuration

      const newAgent = await createAgent(
        defaultDeploymentId,
        defaultGraphId,
        {
          name: generatedAgent.name,
          description: generatedAgent.description,
          config: generatedAgent.config,
        }
      );

      if (newAgent) {
        toast.success("Agent created successfully!", {
          description: "Your custom agent is ready to use.",
          richColors: true,
        });
        
        // Refresh the agents list
        await refreshAgents();
        
        // Navigate to the agents page
        router.push("/agents");
      } else {
        throw new Error("Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent", {
        description: "Please try again or contact support.",
        richColors: true,
      });
    }
  };

  const handleSkipOnboarding = () => {
    router.push("/agents");
  };

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Open Agent Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Let's create your first AI agent tailored to your specific needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  Tell us your needs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Describe what you want your agent to help you with, your industry, and your specific use cases.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  We generate your agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our AI analyzes your requirements and creates a customized agent configuration with the right tools and settings.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">3</span>
                  </div>
                  Start using your agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your agent is ready to use! You can start chatting with it right away and fine-tune it as needed.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" onClick={handleStartOnboarding} className="mr-4">
              Create My First Agent
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg" onClick={handleSkipOnboarding}>
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <OnboardingForm
          onComplete={handleAgentGenerated}
          onCancel={handleSkipOnboarding}
        />
      </div>
    );
  }

  if (step === "success" && generatedAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Your Agent is Ready!</CardTitle>
              <CardDescription>
                We've created a custom agent based on your requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{generatedAgent.name}</h3>
                <p className="text-gray-600 mb-4">{generatedAgent.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Model:</span>
                    <Badge variant="secondary">{generatedAgent.config.model || "gpt-4o-mini"}</Badge>
                  </div>
                  
                  {generatedAgent.config.tools && generatedAgent.config.tools.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Tools:</span>
                      <div className="flex flex-wrap gap-1">
                        {generatedAgent.config.tools.slice(0, 3).map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                        {generatedAgent.config.tools.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{generatedAgent.config.tools.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {generatedAgent.config.rag_config && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Knowledge Base:</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleCreateAgent} className="flex-1">
                  Create Agent & Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={handleSkipOnboarding}>
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
