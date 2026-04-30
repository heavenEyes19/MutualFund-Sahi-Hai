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


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});