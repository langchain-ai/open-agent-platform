"use client";

import React, { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const sections = [
  {
    id: 1,
    title: "Configure",
    pageTitle: "Configure your agent",
    description: "Basic agent settings and configuration",
    completed: false,
  },
  {
    id: 2,
    title: "Tools",
    description: "Select the tools your agent should have access to",
    completed: false,
  },
  {
    id: 3,
    title: "Triggers",
    description: "Set up triggers for your agent",
    completed: false,
  },
  {
    id: 4,
    title: "System Prompt",
    description: "Define the system prompt and sub-agents",
    completed: false,
  },
];

export default function CreateAgentPage(): React.ReactNode {
  const [currentSection, setCurrentSection] = useState(1);

  return (
    <div className="flex flex-col h-screen">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-md">Create new agent</h1>
          <div className="ml-[12px] p-1 border border-gray-300 rounded">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Create</Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Sidebar with sections */}
        <div className="w-80 border-r bg-muted/50">
          {/* Section List */}
          <div className="p-6">
            <div>
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`cursor-pointer transition-colors hover:opacity-70 p-4 rounded ${
                    currentSection === section.id
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onClick={() => setCurrentSection(section.id)}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`text-base font-light ${
                        currentSection === section.id
                          ? "text-gray-500"
                          : "text-gray-300"
                      }`}
                    >
                      {section.id}
                    </div>
                    <div>
                      <h3 className={`text-base font-normal ${
                        currentSection === section.id
                          ? "text-black"
                          : "text-black"
                      }`}>{section.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="mx-auto">
              <div className="mb-6">
                <h2 className="text-md font-medium mb-2">
                  {sections.find((s) => s.id === currentSection)?.pageTitle || sections.find((s) => s.id === currentSection)?.title}
                </h2>
                <p className="text-muted-foreground">
                  {sections.find((s) => s.id === currentSection)?.description}
                </p>
              </div>

              {/* Content based on selected section */}
              <div className="space-y-8">
                {currentSection === 1 && (
                  <div className="space-y-6">
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="agent-name" className="text-sm font-medium">
                          Name
                        </Label>
                        <Input
                          id="agent-name"
                          className="mt-1"
                          placeholder=""
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="agent-description" className="text-sm font-medium">
                          Description
                        </Label>
                        <Textarea
                          id="agent-description"
                          className="mt-1 min-h-[197px]"
                          placeholder="e.g. Handles common customer questions, provides troubleshooting steps, and escalates complex issues to a human."
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      The clearer you are, the better your agent will match your needs.
                    </p>
                  </div>
                )}
              
                {currentSection === 2 && (
                  <div>
                    <h3 className="font-semibold mb-4">Tools Selection</h3>
                    <p className="text-muted-foreground">
                      Choose which tools your agent should have access to.
                    </p>
                  </div>
                )}
                
                {currentSection === 3 && (
                  <div>
                    <h3 className="font-semibold mb-4">Agent Triggers</h3>
                    <p className="text-muted-foreground">
                      Set up triggers that will activate your agent.
                    </p>
                  </div>
                )}
                
                {currentSection === 4 && (
                  <div className="space-y-6">                    
                    <div>
                      <Textarea
                        className="min-h-[678px] text-gray-400"
                        placeholder="e.g. placeholder prompt"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Fixed bottom buttons */}
          <div className= "p-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline">Back</Button>
              <Button>Configure tools →</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}