import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { initializeCronJobs } from "./cronJobs.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Dormitory Management API is running");
});

// Initialize cron jobs
initializeCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
