"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LoaderCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { OnboardingInputs } from "../types";

interface OnboardingFormProps {
  onComplete: (agentConfig: any) => void;
  onCancel: () => void;
}

const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "E-commerce",
  "Manufacturing",
  "Consulting",
  "Other"
];

const COMPANY_SIZE_OPTIONS = [
  "1-10 employees",
  "11-50 employees", 
  "51-200 employees",
  "201-1000 employees",
  "1000+ employees"
];

const MODEL_OPTIONS = [
  "gpt-4o-mini",
  "gpt-4o",
  "claude-3-5-sonnet",
  "claude-3-haiku"
];

const COMMON_TOOLS = [
  "Email Management",
  "Calendar Scheduling",
  "Web Search",
  "Document Analysis",
  "Code Execution",
  "Image Generation",
  "Data Analysis",
  "File Management"
];

export function OnboardingForm({ onComplete, onCancel }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<OnboardingInputs>({
    useCase: "",
    industry: "",
    companySize: "",
    primaryTasks: [],
    preferredModel: "gpt-4o-mini",
    toolsNeeded: [],
    ragNeeded: false,
    teamSize: "",
    budget: ""
  });

  const updateFormData = (field: keyof OnboardingInputs, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateAgent = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/onboarding/create-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success && result.agentConfig) {
        onComplete(result.agentConfig);
      } else {
        console.error("Failed to generate agent config:", result.error);
        // Handle error - could show a toast or error message
      }
    } catch (error) {
      console.error("Error generating agent:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.useCase.trim().length > 0;
      case 2:
        return formData.primaryTasks && formData.primaryTasks.length > 0;
      case 3:
        return true; // Optional fields
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Your First Agent</CardTitle>
          <CardDescription>
            Let's build a custom AI agent tailored to your needs. This will only take a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="useCase">What will your agent help you with? *</Label>
                <Textarea
                  id="useCase"
                  placeholder="e.g., Help me manage emails, analyze research papers, create marketing content..."
                  value={formData.useCase}
                  onChange={(e) => updateFormData("useCase", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry (optional)</Label>
                  <Select value={formData.industry} onValueChange={(value: string) => updateFormData("industry", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="companySize">Company Size (optional)</Label>
                  <Select value={formData.companySize} onValueChange={(value: string) => updateFormData("companySize", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tasks and Capabilities */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label>What specific tasks will your agent handle? *</Label>
                <div className="mt-2 space-y-2">
                  {["Email Management", "Content Creation", "Data Analysis", "Research", "Code Review", "Customer Support", "Scheduling", "Document Processing"].map((task) => (
                    <div key={task} className="flex items-center space-x-2">
                      <Checkbox
                        id={task}
                        checked={formData.primaryTasks?.includes(task) || false}
                        onCheckedChange={(checked) => {
                          const tasks = formData.primaryTasks || [];
                          if (checked) {
                            updateFormData("primaryTasks", [...tasks, task]);
                          } else {
                            updateFormData("primaryTasks", tasks.filter(t => t !== task));
                          }
                        }}
                      />
                      <Label htmlFor={task} className="text-sm font-normal">
                        {task}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>What tools might your agent need?</Label>
                <div className="mt-2 space-y-2">
                  {COMMON_TOOLS.map((tool) => (
                    <div key={tool} className="flex items-center space-x-2">
                      <Checkbox
                        id={tool}
                        checked={formData.toolsNeeded?.includes(tool) || false}
                        onCheckedChange={(checked) => {
                          const tools = formData.toolsNeeded || [];
                          if (checked) {
                            updateFormData("toolsNeeded", [...tools, tool]);
                          } else {
                            updateFormData("toolsNeeded", tools.filter(t => t !== tool));
                          }
                        }}
                      />
                      <Label htmlFor={tool} className="text-sm font-normal">
                        {tool}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Advanced Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="preferredModel">Preferred AI Model</Label>
                <Select value={formData.preferredModel} onValueChange={(value: string) => updateFormData("preferredModel", value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ragNeeded"
                  checked={formData.ragNeeded}
                  onCheckedChange={(checked) => updateFormData("ragNeeded", checked)}
                />
                <Label htmlFor="ragNeeded" className="text-sm">
                  Enable knowledge base integration (RAG)
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teamSize">Team Size (optional)</Label>
                  <Input
                    id="teamSize"
                    placeholder="e.g., 5 people"
                    value={formData.teamSize}
                    onChange={(e) => updateFormData("teamSize", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Budget Range (optional)</Label>
                  <Select value={formData.budget} onValueChange={(value: string) => updateFormData("budget", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free tier</SelectItem>
                      <SelectItem value="low">$1-50/month</SelectItem>
                      <SelectItem value="medium">$51-200/month</SelectItem>
                      <SelectItem value="high">$200+/month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : handlePrevious}
              disabled={isGenerating}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid() || isGenerating}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerateAgent}
                disabled={!isStepValid() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  "Create My Agent"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
