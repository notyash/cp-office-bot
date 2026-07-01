import express, {type Request, type Response } from 'express'
import router from "./webhook/whatsappWebhook.js";

export const app = express();

app.use(express.json());
app.use(router);

app.get('/health', (req: Request, res: Response) => {
        res.send('Health OK!')
    }
)

