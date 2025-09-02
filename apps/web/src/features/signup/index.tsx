"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import "../signin/signin.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/providers/Auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { googleAuthDisabled } from "@/lib/utils";

// Form validation schema
const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    companyName: z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
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

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupInterface() {
  const { signUp, signInWithGoogle } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formValues, setFormValues] = useState<Partial<SignupFormValues>>({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormValues, string>>
  >({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Pre-fill email from URL parameters
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setFormValues((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  const validateForm = () => {
    try {
      signupSchema.parse(formValues);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof SignupFormValues, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof SignupFormValues] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error } = await signUp({
        email: formValues.email!,
        password: formValues.password!,
        metadata: {
          first_name: formValues.firstName,
          last_name: formValues.lastName,
          company_name: formValues.companyName || null,
          name: `${formValues.firstName} ${formValues.lastName}`.trim(),
        },
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      // On success, redirect to a confirmation page or dashboard
      router.push(
        "/signin?message=Please check your email to confirm your account",
      );
    } catch (error) {
      console.error("Signup error:", error);
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setAuthError(error.message);
      }
      // The redirect will be handled by the OAuth provider
    } catch (error) {
      console.error("Google signup error:", error);
      setAuthError("An error occurred while signing up with Google.");
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
          className="signup-card flex flex-col"
          style={{ marginTop: "36px" }}
        >
          <CardHeader className="p-0">
            <CardTitle className="signin-title">Create an Account</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!googleAuthDisabled() && (
              <div className="mb-6 flex justify-center">
                <Button
                  variant="outline"
                  type="button"
                  className="google-signin-btn flex items-center justify-center gap-2"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                >
                  <Image
                    src="/google-logo.svg"
                    alt="Google"
                    width={27.44}
                    height={28}
                  />
                </Button>
              </div>
            )}

            <div className="relative my-6 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <div className="divider-line"></div>
                <span className="text-muted-foreground text-xs uppercase">
                  or
                </span>
                <div className="divider-line"></div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-[456px]">
                    <Label
                      htmlFor="firstName"
                      className="input-label"
                    >
                      First Name
                    </Label>
                  </div>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formValues.firstName || ""}
                    onChange={handleInputChange}
                    aria-invalid={!!errors.firstName}
                    className="signin-input"
                  />
                  {errors.firstName && (
                    <p className="text-destructive text-sm">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <div className="w-[456px]">
                    <Label
                      htmlFor="lastName"
                      className="input-label"
                    >
                      Last Name
                    </Label>
                  </div>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formValues.lastName || ""}
                    onChange={handleInputChange}
                    aria-invalid={!!errors.lastName}
                    className="signin-input"
                  />
                  {errors.lastName && (
                    <p className="text-destructive text-sm">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="w-[456px]">
                  <Label
                    htmlFor="companyName"
                    className="input-label"
                  >
                    Company Name{" "}
                    <span className="text-muted-foreground text-xs">
                      (Optional)
                    </span>
                  </Label>
                </div>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Your Company Inc."
                  value={formValues.companyName || ""}
                  onChange={handleInputChange}
                  aria-invalid={!!errors.companyName}
                  className="signin-input"
                />
                {errors.companyName && (
                  <p className="text-destructive text-sm">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="w-[456px]">
                  <Label
                    htmlFor="email"
                    className="input-label"
                  >
                    Email
                  </Label>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formValues.email || ""}
                  onChange={handleInputChange}
                  aria-invalid={!!errors.email}
                  className="signin-input"
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="w-[456px]">
                  <Label
                    htmlFor="password"
                    className="input-label"
                  >
                    Password
                  </Label>
                </div>
                <div style={{ width: "456px" }}>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Create a password"
                    value={formValues.password || ""}
                    onChange={handleInputChange}
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
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formValues.confirmPassword || ""}
                    onChange={handleInputChange}
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
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center">
            <p className="account-link-text">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="terms-link"
              >
                Sign in
              </Link>
            </p>
            <div className="terms-text">
              <p>
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="terms-link"
                >
                  Terms of Service.
                </Link>{" "}
                Data security is important to us. Please read our{" "}
                <Link
                  href="/data-policy"
                  className="terms-link"
                >
                  Data Security Policy
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
