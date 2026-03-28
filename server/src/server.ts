import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { registerSocketHandlers } from "./socket/socketHandlers.js";

dotenv.config();

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Socket.IO auth middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    // Allow anonymous connections (guest mode)
    (socket as any).user = null;
    return next();
  }

  try {
    const OAUTH_ISSUER = (process.env.OAUTH_ISSUER ?? "https://shelter.net.cn").replace(/\/+$/, "");
    const OAUTH_USERINFO_URL = process.env.OAUTH_USERINFO_URL ?? `${OAUTH_ISSUER}/api/oauth/userinfo/`;

    if (!OAUTH_USERINFO_URL) {
      (socket as any).user = null;
      return next();
    }

    const res = await fetch(OAUTH_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      (socket as any).user = null;
      return next();
    }

    const userData = await res.json() as {
      id: string | number;
      username?: string;
      nickname?: string;
      avatar?: string;
      email?: string;
    };

    (socket as any).user = {
      id: String(userData.id),
      username:
        userData.nickname ??
        userData.username ??
        userData.email?.split("@")[0] ??
        `User_${String(userData.id).slice(0, 6)}`,
      avatar: userData.avatar ?? "",
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    (socket as any).user = null;
    next();
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  registerSocketHandlers(io, socket);

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed for: ${CLIENT_URL}`);
});
