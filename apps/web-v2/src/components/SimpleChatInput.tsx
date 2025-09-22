"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface SimpleChatInputProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SimpleChatInput({
  onSendMessage,
  placeholder = "Send a message here to test your agent",
  disabled = false
}: SimpleChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && onSendMessage && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main content area - empty for now */}
      <div className="flex-1 p-4">
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            {placeholder}
          </p>
        </div>
      </div>

      {/* Message input at bottom */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your message..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={disabled}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="sm"
            className="h-11 px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}