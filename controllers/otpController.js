// controllers/otpController.js
import { supabase } from "../config/supabase.js";
import admin from "../firebase.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
}

async function sendPush(fcmToken, title, body) {
  if (!fcmToken) throw new Error("No FCM token");
  const message = {
    token: fcmToken,
    notification: { title, body },
    android: { priority: "high" },
    apns: { payload: { aps: { sound: "default" } } }
  };
  return admin.messaging().send(message);
}

export async function sendOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "phone required" });

    // find user to get fcm token
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select("id,phone,role,fcm_token")
      .eq("phone", phone)
      .limit(1);

    if (userErr) throw userErr;

    const user = users && users[0];

    // generate OTP and expiry (2 minutes)
    const otp = generateOtp();
    const hashed = await bcrypt.hash(otp, 10);
    const expires_at = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // store OTP row (remove older OTPs for phone)
    await supabase.from("otps").insert([{ phone, otp_hash: hashed, expires_at }]);

    // send via FCM if token available
    if (user && user.fcm_token) {
      const title = "ST. XAVIER'S SCHOOL";
      const body = `Your login OTP is ${otp}. Valid for 2 minutes.`;
      await sendPush(user.fcm_token, title, body);
      return res.json({ ok: true, method: "fcm", msg: "OTP sent via app notification" });
    }

    // fallback: return message so client can show fallback (e.g., email)
    return res.json({ ok: true, method: "none", msg: "No device token found — use fallback (email/sms) in app." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Server error" });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "phone and otp required" });

    // fetch latest OTP for phone
    const { data, error } = await supabase
      .from("otps")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    const record = data && data[0];
    if (!record) return res.status(400).json({ error: "No OTP found" });

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const match = await bcrypt.compare(otp, record.otp_hash);
    if (!match) {
      // increment attempts
      await supabase.from("otps").update({ attempts: record.attempts + 1 }).eq("id", record.id);
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // OTP valid → get/create user
    const { data: users } = await supabase.from("users").select("*").eq("phone", phone).limit(1);
    let user = users && users[0];

    if (!user) {
      const insert = await supabase.from("users").insert([{ phone, role: "student" }]).select().single();
      user = insert.data;
    }

    // create simple token (you can replace with JWT)
    const sessionToken = uuidv4();

    // Optionally store session token in DB or return with user
    res.json({ ok: true, user: { id: user.id, phone: user.phone, role: user.role }, token: sessionToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Server error" });
  }
}
