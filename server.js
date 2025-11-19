import express from "express";
import { supabase } from "./config/supabase.js";

const app = express();

app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase.from("students").select("*").limit(1);

  if (error) return res.send("DB ERROR: " + error.message);
  res.send("DB CONNECTED: " + JSON.stringify(data));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
