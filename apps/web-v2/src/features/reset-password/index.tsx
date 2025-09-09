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
        <Image
          src="/oap-logo-dark.svg"
          alt="Open Agent Platform"
          width={400}
          height={100}
        />
        <Card
          className="flex h-[718px] w-[628px] flex-col gap-8 rounded-[46px] p-14"
          style={{ marginTop: "36px" }}
        >
          <CardHeader className="p-0">
            <CardTitle className="mx-auto h-12 w-[305px] text-center text-[40px] leading-tight font-normal -tracking-wider text-gray-900">
              Reset Password
            </CardTitle>
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
                    className="text-black"
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
                    className="h-16 w-[456px] rounded-full border border-gray-200 px-5 py-2.5 text-base"
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
                    className="text-black"
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
                    className="h-16 w-[456px] rounded-full border border-gray-200 px-5 py-2.5 text-base"
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
                  className="h-16 w-[456px] rounded-full border-none bg-purple-200 text-xl font-normal text-black"
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
