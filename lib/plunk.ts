export async function sendEmail({
  to,
  subject,
  body,
  from = "notifications@postguru.com",
}: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}) {
  // Feature disabled for now as no verified domain is available
  // Logging to console so logic can still be verified in development/logs
  console.log("📧 [Email Simulation] To:", to);
  console.log("📧 [Email Simulation] Subject:", subject);
  
  // Return success true so the background jobs don't fail or retry infinitely
  return { success: true };
}
