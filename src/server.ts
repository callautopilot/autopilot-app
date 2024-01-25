import dotenv from "dotenv";

const envFilePath =
  process.env.NODE_ENV === "production" ? ".env" : ".env.local";
dotenv.config({ path: envFilePath });

import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import next from "next";
import { handleMessages } from "./messageHandler";

interface ExtendedApplication extends express.Application {
  io?: Server;
}

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app: ExtendedApplication = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  app.io = io;
  io.on("connection", (socket) => handleMessages(io, socket));

  app.all("*", (req: Request, res: Response) => {
    return handle(req, res);
  });

  const port = process.env.PORT || 3000;

  httpServer.listen(port, (err?: any) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
