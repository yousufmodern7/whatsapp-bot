// WhatsApp Cloud API webhook (Vercel Serverless Function)

const GRAPH_URL = "https://graph.facebook.com/v21.0";

// বটের উত্তর এখানে ঠিক করুন
function getReply(text) {
  const msg = text.trim().toLowerCase();

  if (["hi", "hello", "hey", "হাই", "হ্যালো", "সালাম"].includes(msg)) {
    return "হ্যালো! 👋 আমি একটি WhatsApp বট। 'help' লিখে কমান্ড দেখুন।";
  }
  if (msg === "help") {
    return "কমান্ড তালিকা:\n• hi - শুভেচ্ছা\n• help - সাহায্য\n• time - বর্তমান সময়\n• ping - বট চালু আছে কিনা";
  }
  if (msg === "time") {
    return new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
  }
  if (msg === "ping") {
    return "pong 🏓";
  }
  return "দুঃখিত, বুঝতে পারিনি। 'help' লিখে কমান্ড দেখুন।";
}

async function sendMessage(to, body) {
  const url = `${GRAPH_URL}/${process.env.PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!response.ok) {
    console.error("Send failed:", response.status, await response.text());
  }
}

module.exports = async (req, res) => {
  // ১) Meta webhook যাচাই (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // ২) মেসেজ গ্রহণ (POST)
  if (req.method === "POST") {
    try {
      const value = req.body?.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];

      if (message && message.type === "text") {
        const from = message.from;
        const text = message.text.body;
        await sendMessage(from, getReply(text));
      }
    } catch (err) {
      console.error("Webhook error:", err);
    }
    // সবসময় 200 দিতে হবে, নইলে Meta বারবার পাঠাবে
    return res.status(200).send("OK");
  }

  return res.status(405).send("Method Not Allowed");
};
