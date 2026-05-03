import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { publishPost, autoReplyProcessor, analyticsSync } from "@/lib/inngest/functions";

// Create an API that serves zero-to-many Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    publishPost,
    autoReplyProcessor,
    analyticsSync,
  ],
});
