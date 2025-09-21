import dotenv from "dotenv";
dotenv.config();

const SERVER_BASE_URL = process.env.SERVER_BASE_URL;

const https = require('https');

function pingServer() {
    const url = SERVER_BASE_URL as string;

    if (!SERVER_BASE_URL) {
        throw new Error("SERVER_BASE_URL is not defined in environment variables");
    }

    https.get(url, (res: any) => {
        const { statusCode } = res;

        const requestOk = statusCode === 200;

        if (requestOk) {
            console.log(`Server pinged successfully at ${new Date()}`);
        }

        if (!requestOk) {
            console.error(`Failed to ping server. Status code: ${statusCode}`);
        }

    }).on('error', (err: any) => {
        console.error(`Error while pinging server: ${err.message}`);
    });
}

export default pingServer;