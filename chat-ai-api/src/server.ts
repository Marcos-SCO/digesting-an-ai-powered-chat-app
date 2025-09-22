import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pingServer from "./pingServer";
import OpenAI from "openai";

import { StreamChat } from "stream-chat";
import { error } from "console";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on ${PORT}`));

// const routes = Router();
app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({
        message: `Pong`,
    });
});

// Set up the interval to ping the server every 5 minutes (300,000 milliseconds)
const pingInterval = 7 * 60 * 1000; // 7 minutes in milliseconds
setInterval(pingServer, pingInterval);


// Initialize stream client
const chatClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
);

// Initialize openai with openrouter
const openaiClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

// Register user with stream that
app.post('/register-user', async (req: Request, res: Response): Promise<any> => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and Email are required' });
    }

    try {
        const userId = email.replace(/[^a-zA-Z0-9_-]/g, '_');

        // Check if user exist
        const userResponse = await chatClient.queryUsers({ id: { $eq: userId } });

        if (!userResponse.users.length) {
            // add new user

            await chatClient.upsertUser({
                id: userId,
                name: name,
                email: email,
                role: 'user'
            } as any);
        }

        res.status(200).json({ userId, name, email });

    } catch (error) {

        res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(200).json({ message: 'Success' });
});

// Send message to AI
app.post('/chat', async (req: Request, res: Response): Promise<any> => {
    const { message, userid } = req.body;
    if (!message || !userid) {
        return res.status(400).json({ error: 'Message and user are required!' });
    }

    try {
        // verify user existence
        const userResponse = await chatClient.queryUsers({ id: userid });

        if (!userResponse.users.length) {
            return res.status(404).json({ error: 'user not found. Please register first' });
        }

        // Send message to open router model
        const response = await openaiClient.chat.completions.create({
            model: 'deepseek/deepseek-chat-v3.1:free',
            messages: [
                { role: 'user', content: message }
            ]
        } as any);


        const aiMessage: string = response.choices[0]?.message.content ?? 'No response from AI';

        // Create or get channel
        const channel = chatClient.channel('messaging', `chat-${userid}`, {
            name: 'Ai Chat',
            created_by_id: 'ai_bot',
        } as any);

        await channel.create();
        await channel.sendMessage({ text: aiMessage, user_id: 'ai_bot' });

        res.status(200).json({ reply: aiMessage });

    } catch (error) {
        console.log('Error generating AI response', error);

        return res.status(500).json({ error: 'Internal Server Error', message: error });
    }


});