/**
 * Error Boundary for Prompt Template Features.
 *
 * Catches errors in prompt template loading, compilation, and display,
 * showing user-friendly error messages and recovery options.
 */

"use client";

import { Component, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PromptErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Prompt template error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Agent Prompt Error</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Failed to load or display agent prompt templates.
            </p>
            <p className="text-muted-foreground mb-3 text-xs">
              {this.state.error?.message || "An unknown error occurred"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RotateCcw className="size-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
