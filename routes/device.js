// routes/device.js
import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Register/Update device token for a phone number
router.post("/register-token", async (req, res) => {
  try {
    const { phone, fcm_token } = req.body;
    if (!phone || !fcm_token) return res.status(400).json({ error: "phone and fcm_token required" });

    // upsert user with token
    const { data, error } = await supabase
      .from("users")
      .upsert({ phone, fcm_token }, { onConflict: "phone" })
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, user: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Server error" });
  }
});

export default router;
