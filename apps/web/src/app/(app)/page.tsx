"use client";

import React, { useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

/**
 * The default page (/).
 * Contains the generic chat interface.
 */
export default function ChatPage(): React.ReactNode {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chat");
  }, []);

  return (
    <div>
      <p>
        Click <NextLink href="/chat">here</NextLink> to visit the chat page.
      </p>
    </div>
  );
}
