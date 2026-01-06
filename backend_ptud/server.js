import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import i18next from "./config/i18n.js";
import { languageMiddleware } from "./middleware/languageMiddleware.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Middleware i18n
app.use(languageMiddleware);

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("Dormitory Management API is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
