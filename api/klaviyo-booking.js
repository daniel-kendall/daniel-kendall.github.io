export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;
    const LIST_ID = process.env.KLAVIYO_LIST_ID;
  
    const { name, email, mobile, checkin, checkout, location } = req.body;
  
    try {
      // ① Create or update profile
      const profilePayload = {
        data: {
          type: "profile",
          attributes: {
            email,
            first_name: name,
            phone_number: mobile,
            properties: {
              checkin,
              checkout,
              location
            }
          }
        }
      };
  
      let profileRes = await fetch(
        `https://a.klaviyo.com/api/profiles`,
        {
          method: 'POST',
          headers: {
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json",
            "Authorization": `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
            "revision": REVISION
          },
          body: JSON.stringify(profilePayload)
        }
      );
  
      if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(`Error creating profile: ${JSON.stringify(err)}`);
      }
  
      const profileJson = await profileRes.json();
      const profileId = profileJson.data.id;
  
  
      const relationPayload = {
        data: [
          {
            type: "profile",
            id: profileId
          }
        ]
      };
  
      let listRes = await fetch(
        `https://a.klaviyo.com/api/lists/${LIST_ID}/relationships/profiles`,
        {
          method: 'POST',
          headers: {
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json",
            "Authorization": `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
            "revision": REVISION
          },
          body: JSON.stringify(relationPayload)
        }
      );
  
      if (!listRes.ok) {
        const err = await listRes.json();
        throw new Error(`Error adding to list: ${JSON.stringify(err)}`);
      }
  
      return res.status(200).json({ success: true });
  
    } catch (error) {
      console.error('Klaviyo integration error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  