import { Router } from "express";
import { env } from "../config/env.js";
import { parseIncomingMessage } from "../whatsapp/whatsappParser.js";
import { getOrCreateSessionContext } from "../session/sessionService.js";
import { pool } from "../db/pool.js";
import { sendTextMessage } from "../whatsapp/whatsappClient.js";
import { SESSION_STATES } from "../constants/sessionStates.js";
import { parseLanguageSelection } from "../services/languageService.js";
import { updateUserLanguage } from "../db/repositories/userRepository.js";
import { updateSessionState } from "../db/repositories/sessionRepository.js";

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

  if (context.session.state === SESSION_STATES.WAITING_FOR_LANGUAGE && dto.senderWaId) {
    
    const selectedLanguage = parseLanguageSelection(dto.text);

    try {
      if (!selectedLanguage) {
        await sendTextMessage(
          dto.botPhoneNumberId,
          dto.senderWaId,
          "Please choose your language:\n\n1. English\n2. मराठी\n3. हिंदी"
        );

        console.log("Language menu sent successfully.");
        return res.sendStatus(200);
      }

      await updateUserLanguage(pool, context.user.id, selectedLanguage);
      await updateSessionState(pool, context.session.id, SESSION_STATES.READY);

      await sendTextMessage(
        dto.botPhoneNumberId,
        dto.senderWaId,
        "Language saved. Main menu:\n\n1. File a complaint\n2. Check complaint status\n3. Find police station\n4. Find parking"
      );

      console.log("Language saved and main menu sent.");
      return res.sendStatus(200);

    } catch (error: any) {
      console.error("Failed during language selection flow.");

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response:", JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(error);
      }

      return res.sendStatus(200);
    }
  }

  return res.sendStatus(200);
});