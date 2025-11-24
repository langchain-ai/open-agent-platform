import { NextRequest, NextResponse } from "next/server";
import { generateAgentConfigFromOnboarding } from "@/features/onboarding/agent-config-generator";
import { OnboardingInputs } from "@/features/onboarding/types";

export async function POST(request: NextRequest) {
  try {
    const body: OnboardingInputs = await request.json();
    
    // Validate required fields
    if (!body.useCase || body.useCase.trim().length === 0) {
      return NextResponse.json(
        { error: "Use case is required" },
        { status: 400 }
      );
    }

    // Generate agent configuration
    const result = await generateAgentConfigFromOnboarding(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate agent configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agentConfig: result.agentConfig,
    });
  } catch (error) {
    console.error("Error in onboarding agent creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
