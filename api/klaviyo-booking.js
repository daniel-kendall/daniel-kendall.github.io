export default async function handler(req, res) {
    // ✅ Add CORS headers
    const allowedOrigins = [
        "https://daniel-kendall.github.io",
        "http://localhost:3000",
      ];
      
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      
      // ✅ Handle preflight (OPTIONS) requests
      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }
  
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;
    const LIST_ID = process.env.KLAVIYO_LIST_ID;
    const REVISION = "2025-01-15";
  
    try {
        console.log("Incoming request body:", req.body); // 👈 Add this

      const { name, email, mobile, checkin, checkout, location } = req.body;
  
      // 1️⃣ Create or update profile
      const profilePayload = {
        data: {
          type: "profile",
          attributes: {
            email,
            first_name: name,
            phone_number: mobile,
            properties: {
                checkin_date: checkin,
                checkout_date: checkout,
                hotel_location: location,
              },          
          },
        },
      };

      
  
      const profileRes = await fetch("https://a.klaviyo.com/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
          Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
          revision: REVISION,
        },
        body: JSON.stringify(profilePayload),
      });
  
      if (!profileRes.ok) {
        const err = await profileRes.text();
        throw new Error(`Error creating profile: ${err}`);
      }
  
      const profileJson = await profileRes.json();
      const profileId = profileJson.data.id;
  
      // 2️⃣ Add profile to list
      const relationPayload = {
        data: [{ type: "profile", id: profileId }],
      };
  
      const listRes = await fetch(
        `https://a.klaviyo.com/api/lists/${LIST_ID}/relationships/profiles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
            Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
            revision: REVISION,
          },
          body: JSON.stringify(relationPayload),
        }
      );
  
      if (!listRes.ok) {
        const err = await listRes.text();
        throw new Error(`Error adding to list: ${err}`);
      }
  
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Klaviyo integration error:", error);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
  