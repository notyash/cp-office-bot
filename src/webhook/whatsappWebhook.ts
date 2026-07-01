import { Router } from "express";
import { env } from "../config/env.js";
import { parseIncomingMessage } from "../whatsapp/whatsappParser.js";

const verifyToken = env.metaVerifyToken;
const router = Router()

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

router.post('/webhook', (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  
  const dto = parseIncomingMessage(req.body)
  console.log(dto)
  res.status(200).end();
});

export default router