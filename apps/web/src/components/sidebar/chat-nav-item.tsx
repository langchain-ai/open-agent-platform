"use client";

import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

export function ChatNavItem({
  item,
  className,
  size = "default",
}: {
  item: { title: string; url: string; icon?: LucideIcon };
  className?: string;
  size?: "default" | "sm" | "lg" | "md";
}) {
  const pathname = usePathname();

  return (
    <NextLink href={item.url}>
      <SidebarMenuItem
        className={cn(
          pathname === item.url &&
            "bg-sidebar-accent text-sidebar-accent-foreground",
          className,
        )}
      >
        <SidebarMenuButton
          tooltip={item.title}
          size={size}
        >
          {item.icon && (
            <span className="flex size-6 flex-shrink-0 items-center justify-center">
              <item.icon className="size-4" />
            </span>
          )}
          <span className={cn(pathname === item.url && "font-semibold")}>
            {item.title}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </NextLink>
  );
}
