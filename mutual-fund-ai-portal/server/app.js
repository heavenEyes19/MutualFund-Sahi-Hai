import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";



const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes); 
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

export default app;