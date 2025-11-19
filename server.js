// server.js
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import deviceRoutes from "./routes/device.js";
import { supabase } from "./config/supabase.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("St. Xaviers ERP Backend Running Successfully!"));

app.use("/auth", authRoutes);
app.use("/device", deviceRoutes);

// optional simple health route
app.get("/health", async (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
