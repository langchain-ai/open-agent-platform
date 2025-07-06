"use client";

import { useState } from "react";
import {
  ChevronsUpDown,
  LogOut,
  User,
  Loader2,
  TriangleAlert,
  Settings,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthContext } from "@/providers/Auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user: authUser, signOut, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { resetStore } = useConfigStore();

  // Use auth user if available, otherwise use default user
  const displayUser = authUser
    ? {
        name: authUser.displayName || authUser.email?.split("@")[0] || "User",
        email: authUser.email || "",
        avatar: authUser.avatarUrl || "",
        company: authUser.companyName || "",
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
      }
    : {
        name: "Guest",
        email: "Not signed in",
        avatar: "",
        company: "",
        firstName: "",
        lastName: "",
      };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const { error } = await signOut();

      if (error) {
        console.error("Error signing out:", error);
        toast.error("Error signing out", { richColors: true });
        return;
      }

      router.push("/signin");
    } catch (err) {
      console.error("Error during sign out:", err);
      toast.error("Error signing out", { richColors: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignIn = () => {
    router.push("/signin");
  };

  const handleClearLocalData = () => {
    resetStore();
    toast.success("Local data cleared. Please refresh the page.", {
      richColors: true,
    });
  };

  const isProdEnv = process.env.NODE_ENV === "production";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-16 group-data-[collapsible=icon]:p-0!">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={displayUser.avatar}
                  alt={displayUser.name}
                />
                <AvatarFallback className="rounded-lg">
                  {displayUser.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {displayUser.name}
                </span>
                <span className="truncate text-xs">{displayUser.email}</span>
                {"company" in displayUser && (
                  <span className="text-muted-foreground truncate text-xs">
                    {displayUser.company}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={displayUser.avatar}
                    alt={displayUser.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {displayUser.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {displayUser.name}
                  </span>
                  <span className="truncate text-xs">{displayUser.email}</span>
                  {"company" in displayUser && (
                    <span className="text-muted-foreground truncate text-xs">
                      {displayUser.company}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>

            {isAuthenticated ? (
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </>
                )}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleSignIn}>
                <User className="mr-2 h-4 w-4" />
                Sign in
              </DropdownMenuItem>
            )}
            {!isProdEnv && (
              <DropdownMenuItem onClick={handleClearLocalData}>
                <TriangleAlert className="mr-2 h-4 w-4 text-red-500" />
                Clear local data
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
