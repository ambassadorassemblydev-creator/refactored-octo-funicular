import { supabase } from "../lib/supabase";

export async function sendEmail({ to, subject, message, html }: { to: string, subject: string, message: string, html?: string }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const baseUrl = import.meta.env.VITE_MAIN_APP_URL || 'https://theambassadorsassembly.org';
    const response = await fetch(`${baseUrl}/api/admin/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ to, subject, message, html })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to send email");
    return data;
  } catch (error: any) {
    console.error("Email Error:", error);
    throw error;
  }
}
