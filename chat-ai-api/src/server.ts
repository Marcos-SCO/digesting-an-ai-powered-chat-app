import express, {Request, Response} from "express";
import cors from "cors";
import dotenv from "dotenv";
import pingServer from "./pingServer";

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

// Register user with stream that
app.post('/register-user', async (req: Request, res: Response): Promise<any> => {
    const {name, email} = req.body;

    if (!name || !email) {
        return res.status(400).json({error: 'Name and Email are required'});
    }

    return res.status(200).json({message: 'Success'});
});

// Set up the interval to ping the server every 5 minutes (300,000 milliseconds)
const pingInterval = 7 * 60 * 1000; // 7 minutes in milliseconds
setInterval(pingServer, pingInterval);
