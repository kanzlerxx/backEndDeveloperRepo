import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

console.log("sendEmail util - RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to, subject, html) {
  try {
    console.log("sendEmail: sending to:", to);
    const response = await resend.emails.send({
      from: "onboarding@resend.dev", // gunakan onboarding@resend.dev untuk testing
      to,
      subject,
      html,
    });
    console.log("sendEmail: response from Resend:", response);
    return response;
  } catch (error) {
    console.error("sendEmail: caught error:", error);
    throw error;
  }
}
