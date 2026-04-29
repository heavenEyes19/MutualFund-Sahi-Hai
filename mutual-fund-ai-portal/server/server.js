import dotenv from "dotenv";
dotenv.config();

// console.log("CHECK:", process.env.MFAPI_BASE_URL);
import app from "./app.js";
import connectDB from "./config/db.js";

connectDB();


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});