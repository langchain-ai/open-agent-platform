"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { OAPLogoGreen } from "../icons/oap-logo-green";
import { PanelLeftIcon, Plus } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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
            className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center justify-between"
          >
            <NextLink href="/chat">
              {/* Show only trigger icon when collapsed */}
              <PanelLeftIcon 
                className="!h-4 !w-4 flex-shrink-0 group-data-[collapsible=icon]:block hidden cursor-pointer" 
                onClick={(e) => {
                  e.preventDefault();
                  toggleSidebar();
                }}
              />
              
              {/* Show logo and trigger when expanded */}
              <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden">
                <OAPLogoGreen className="!h-4 !w-auto flex-shrink-0" />
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
