import { env } from "@/utils/env";
import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import next from "next";
import { messageHandler } from "@/ws/messageHandler";

interface ExtendedApplication extends express.Application {
  io?: Server;
}

const nextApp = next({ dev: env.IS_DEV });
const requestHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app: ExtendedApplication = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  app.io = io;
  io.on("connection", (socket) => messageHandler(socket));

  app.all("*", (req: Request, res: Response) => {
    return requestHandler(req, res);
  });

  httpServer.listen(env.PORT, (err?: any) => {
    if (err) throw err;
    console.log(`> [${env.NODE_ENV}] Ready on http://localhost:${env.PORT}`);
  });
});
