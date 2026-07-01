import { Router } from "express";
import { env } from "../config/env.js";
import { parseIncomingMessage } from "../whatsapp/whatsappParser.js";
import { getOrCreateSessionContext } from "../session/sessionService.js";
import { pool } from "../db/pool.js";
import { sendTextMessage } from "../whatsapp/whatsappClient.js";
import { SESSION_STATES } from "../constants/sessionStates.js";

const verifyToken = env.metaVerifyToken;
const router = Router()
export default router;

router.get('/webhook', (req, res) => {
  console.log("GET Webhook hit!");
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    console.log('VERIFICATION FAILED');
    res.status(403).end();
  }
});

router.post("/webhook", async (req, res) => {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);

  const dto = parseIncomingMessage(req.body);

  if (!dto) {
    return res.sendStatus(200);
  }

  const context = await getOrCreateSessionContext(pool, dto);

  console.log("Incoming message:", dto.text);
  console.log("User:", context.user);
  console.log("Session:", context.session);
  console.log("New session:", context.isNewSession);

  if (dto.botPhoneNumberId === "123456123") {
    console.log("Skipping reply for Meta dashboard test payload");
    return res.sendStatus(200);
  }

  if (
    context.session.state === SESSION_STATES.WAITING_FOR_LANGUAGE &&
    dto.senderWaId
  ) {
    try {
      await sendTextMessage(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Please choose your language:\n\n1. English\n2. मराठी\n3. हिंदी"
      );

      console.log("Language menu sent successfully.");
    } catch (error: any) {
      console.error("Failed to send WhatsApp message.");

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(error);
      }
    }
  }

  return res.sendStatus(200);
});