import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';
import "./workers/notification.worker.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "./models/user.model.js";

dotenv.config({
    path: './.env'
});

const PORT = process.env.PORT || 8000;

// Create HTTP server 
const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    },
});

app.set("io", io); // Make io accessible in routes and controllers

// Socket.io authentication middleware
io.use(async (socket, next) => {
    try {
        const token =
            socket.handshake.headers.cookie
                ?.split("; ")
                .find((cookie) => cookie.startsWith("accessToken="))
                ?.split("=")[1];

        if (!token) {
            return next(new Error("Unauthorized"));
        }

        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await User
            .findById(decodedToken?.id)
            .select("-password -refreshToken");

        if (!user) {
            return next(new Error("Invalid access token"));
        }

        socket.user = user;

        next();
    } catch (error) {
        next(new Error("Unauthorized"));
    }
});

// Handle Socket.io connections and join rooms
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    const room = `user:${socket.user._id}`;

    socket.join(room);

    console.log(`${socket.user.username} joined ${room}`);
});

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Server startup failed !!!", err);
  });