import express, {type Request, type Response } from 'express'
import whatsappWebhookRouter from "./webhook/whatsapp.webhook.js";

export const app = express();

app.use(express.json());
app.use(whatsappWebhookRouter);

app.get('/health', (req: Request, res: Response) => {
        res.send('Health OK!')
    }
)

