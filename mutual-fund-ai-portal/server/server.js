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
  socket.on("joinChat", (investorId) => {
    socket.join(String(investorId));
  });

  socket.on("leaveChat", (investorId) => {
    socket.leave(String(investorId));
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { investorId, senderId, senderRole, text } = data;
      const newMessage = new Message({ investorId, senderId, senderRole, text });
      
      // Emit instantly for real-time
      socket.to(String(investorId)).emit("receiveMessage", newMessage);
      
      // Save to DB in background
      await newMessage.save();
    } catch (err) {
      // Only log actual errors
      console.error("Error saving message", err);
    }
  });

  socket.on("disconnect", () => {
    // Clean up if needed
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});