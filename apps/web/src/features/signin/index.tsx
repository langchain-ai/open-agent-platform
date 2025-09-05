"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

export default function SigninInterface() {
  const { signIn, signInWithGoogle, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showManualRedirect, setShowManualRedirect] = useState<boolean>(false);

  // Handle URL parameters
  useEffect(() => {
    // Check for message parameter
    const urlMessage = searchParams.get("message");
    if (urlMessage) {
      setMessage(urlMessage);
    }

    // Check for error parameter
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsSuccess(true);
      // Delay to show success state before redirect
      setTimeout(() => {
        router.push("/");
      }, 1500);

      // Show manual redirect option after 3 seconds
      setTimeout(() => {
        setShowManualRedirect(true);
      }, 3000);
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await signInWithGoogle();
    if (error) {
      setIsLoading(false);
      setError(error.message);

      return;
    }

    // keep isLoading: true, as we're doing a redirect
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
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {message && !isSuccess && (
              <Alert className="mb-4 bg-blue-50 text-blue-800">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {isSuccess && (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                <AlertDescription className="flex flex-col gap-2">
                  <span>
                    Success! We're redirecting you to the dashboard...
                  </span>
                  {showManualRedirect && (
                    <Button
                      onClick={() => router.push("/")}
                      variant="outline"
                      className="mt-2 border-green-300 text-green-700 hover:bg-green-100"
                    >
                      Go to Dashboard Now
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!googleAuthDisabled() && (
              <div className="mb-6 flex justify-center">
                <Button
                  variant="outline"
                  type="button"
                  className="flex h-16 w-36 items-center justify-center rounded-2xl border border-gray-200"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isSuccess}
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
                <div className="h-px w-[196px] bg-gray-500"></div>
                <span className="text-muted-foreground text-xs uppercase">
                  or
                </span>
                <div className="h-px w-[196px] bg-gray-500"></div>
              </div>
            </div>

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

              <div className="flex flex-col items-center space-y-2">
                <div className="flex w-[456px] items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-black"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div style={{ width: "456px" }}>
                  <PasswordInput
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-16 w-[456px] rounded-full border border-gray-200 px-5 py-2.5 text-base"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="h-16 w-[456px] rounded-full border-none bg-purple-200 text-xl font-normal text-black hover:bg-purple-200/80"
                  disabled={isLoading || isSuccess}
                >
                  {isLoading
                    ? "Signing in..."
                    : isSuccess
                      ? "Signed In Successfully"
                      : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4 p-0">
            <p className="text-base font-normal text-black">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-normal text-black underline underline-offset-2"
              >
                Sign up
              </Link>
            </p>
            {/* TODO: Add back once we have a terms of service/data security policy */}
            {/* <div className="text-center text-base font-normal text-black">
              <p>
                By continuing, you agree to our{" "}
                <Link
                  href="https://www.langchain.com/terms-of-service"
                  className="font-normal text-black underline underline-offset-2"
                >
                  Terms of Service.
                </Link>{" "}
                Data security is important to us. Please read our{" "}
                <Link
                  href="https://smith.langchain.com/data-security-policy.pdf"
                  className="font-normal text-black underline underline-offset-2"
                >
                  Data Security Policy
                </Link>
              </p>
            </div> */}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
