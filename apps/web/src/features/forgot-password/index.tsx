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
          className="flex min-h-[400px] w-[628px] flex-col gap-8 rounded-[46px] p-14"
          style={{ marginTop: "36px" }}
        >
          <CardHeader className="p-0">
            <CardTitle className="mx-auto h-12 w-[305px] text-center text-[40px] leading-tight font-normal -tracking-wider text-gray-900">
              Reset Password
            </CardTitle>
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
                      className="text-black"
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
                    className="h-16 w-[456px] rounded-full border border-gray-200 px-5 py-2.5 text-base"
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
                    className="h-16 w-[456px] rounded-full border-none bg-purple-200 text-xl font-normal text-black"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4 p-0">
            <p className="text-base font-normal text-black">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="font-normal text-black underline underline-offset-2"
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
