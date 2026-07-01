import axios from "axios";
import { env } from "../config/env.js";

const WHATSAPP_API_VERSION = "v23.0";

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string
): Promise<void> {
    
  await axios.post(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: text,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${env.whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}