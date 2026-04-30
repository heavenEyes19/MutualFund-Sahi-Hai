import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import mutualFundRoutes from "./routes/mutualFundRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";


const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes); 
app.use("/api/users", userRoutes);
app.use("/api/mutual-funds", mutualFundRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

export default app;
