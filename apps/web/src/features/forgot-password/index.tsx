"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthContext } from "@/providers/Auth";
import "../signin/signin.css";

export default function ForgotPasswordInterface() {
  const { resetPassword } = useAuthContext();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An unexpected error occurred. Please try again.");
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
          className="forgot-password-card flex flex-col"
          style={{ marginTop: "36px" }}
        >
          <CardHeader className="p-0">
            <CardTitle className="signin-title">Reset Password</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {success ? (
              <Alert className="mb-4">
                <AlertDescription>
                  If your email address is associated with an account, you will
                  receive an email with instructions to reset your password
                  shortly.
                </AlertDescription>
              </Alert>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
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
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="signin-input"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className="continue-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4 p-0">
            <p className="account-link-text">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="terms-link"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
