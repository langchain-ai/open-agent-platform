"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LangGraphLogoSVG } from "../icons/langgraph";
import NextLink from "next/link";

export function SiteHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            asChild
            className="flex items-center justify-center gap-0"
          >
            <NextLink href="/chat">
              <LangGraphLogoSVG className="!h-4 !w-auto flex-shrink-0" />
              <div className="grid flex-1 pl-2 text-left text-sm leading-tight transition-all group-data-[collapsible=icon]:pl-0 group-data-[collapsible=icon]:opacity-0">
                <span className="truncate font-semibold">
                  Open Agent Platform
                </span>
              </div>
            </NextLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
