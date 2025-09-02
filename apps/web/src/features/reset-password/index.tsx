"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthContext } from "@/providers/Auth";
import { z } from "zod";
import "../signin/signin.css";

// Form validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordInterface() {
  const { updatePassword } = useAuthContext();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateForm = () => {
    try {
      resetPasswordSchema.parse({ password, confirmPassword });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: { password?: string; confirmPassword?: string } =
          {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as "password" | "confirmPassword"] =
              err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setAuthError(error.message);
        return;
      }

      // Redirect to the sign-in page with a success message
      router.push(
        "/signin?message=Your password has been successfully reset. Please sign in with your new password.",
      );
    } catch (err) {
      console.error("Password reset error:", err);
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-10">
      <div className="flex flex-col items-center">
        <div className="platform-header">
          <Image
            src="/LangGraph-logo.svg"
            alt="LangGraph"
            width={66.667}
            height={34}
            className="platform-logo"
          />
          <span className="platform-text">Open Agent Platform</span>
        </div>
        <Card
          className="signin-card flex flex-col"
          style={{ marginTop: "36px" }}
        >
          <CardHeader className="p-0">
            <CardTitle className="signin-title">Reset Password</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-[456px]">
                  <Label
                    htmlFor="password"
                    className="input-label"
                  >
                    New Password
                  </Label>
                </div>
                <div style={{ width: "456px" }}>
                  <PasswordInput
                    id="password"
                    placeholder="Create a new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    className="signin-input"
                  />
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm">{errors.password}</p>
                )}
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="w-[456px]">
                  <Label
                    htmlFor="confirmPassword"
                    className="input-label"
                  >
                    Confirm Password
                  </Label>
                </div>
                <div style={{ width: "456px" }}>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-invalid={!!errors.confirmPassword}
                    className="signin-input"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {authError && (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="continue-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
