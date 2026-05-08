import dotenv from "dotenv";
import chatbotRoutes from "./routes/chatbotRoutes.js";

dotenv.config();

// console.log("CHECK:", process.env.MFAPI_BASE_URL);
import app from "./app.js";
import connectDB from "./config/db.js";
app.use("/api", chatbotRoutes);
connectDB();

app.get("/test", (req, res) => {
  res.send("Server working ✅");
});


import http from "http";
import { Server } from "socket.io";
import Message from "./models/Message.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow all or specify frontend url
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinChat", (investorId) => {
    socket.join(investorId);
    console.log(`User joined room: ${investorId}`);
  });

  socket.on("leaveChat", (investorId) => {
    socket.leave(investorId);
    console.log(`User left room: ${investorId}`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { investorId, senderId, senderRole, text } = data;
      const newMessage = new Message({ investorId, senderId, senderRole, text });
      await newMessage.save();
      
      socket.to(investorId).emit("receiveMessage", newMessage);
    } catch (err) {
      console.error("Error saving message", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});