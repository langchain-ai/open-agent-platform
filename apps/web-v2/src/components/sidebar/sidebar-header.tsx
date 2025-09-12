"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { OAPLogoBlue } from "@/components/icons/oap-logo-blue";
import { PanelLeftIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import NextLink from "next/link";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            asChild
            className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center"
          >
            <NextLink href="/chat">
              {/* Show only trigger icon when collapsed */}
              <PanelLeftIcon
                className="hidden !h-4 !w-4 flex-shrink-0 cursor-pointer group-data-[collapsible=icon]:block"
                onClick={(e) => {
                  e.preventDefault();
                  toggleSidebar();
                }}
              />

              {/* Show logo and trigger when expanded */}
              <div className="flex w-full items-center justify-between group-data-[collapsible=icon]:hidden">
                <OAPLogoBlue className="!h-4 !w-auto flex-shrink-0" />
                <PanelLeftIcon
                  className="!h-4 !w-4 flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSidebar();
                  }}
                />
              </div>
            </NextLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
