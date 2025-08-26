import { defineTriggers } from "@open-agent-platform/triggers-sdk";

export default defineTriggers({
  basePath: "/api/triggers",
  entries: [
    {
      id: "gmail.new.email",
      path: "/gmail", // -> POST /api/triggers/gmail
      module: () => import("./triggers/gmail/gmail-email-received.trigger.js"),
    },
  ],
});
