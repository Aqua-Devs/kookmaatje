const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Route voor analyse en recepten
app.post('/analyze', async (req, res) => {
    try {
        const { images, only_ingredients, existing_ingredients, hongerStatus, dieet, allergieen, naam, gezinsgrootte } = req.body;

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: "OpenAI API Key niet geconfigureerd op Render." });
        }

        let prompt = "";

        if (only_ingredients) {
            prompt = `GEBRUIK JE COMPUTER VISION: Analyseer deze foto's extreem nauwkeurig. 
            Identificeer ALLEEN de ingrediënten die je 100% zeker ziet. 
            Reageer in dit JSON formaat: { "ingredienten": ["item1", "item2"] }`;
        } else {
            prompt = `Jij bent KookMaatje, de persoonlijke chef van ${naam}. 
            STRIKTE VOORSCHRIFTEN:
            1. ALLERGIEËN: Gebruik ABSOLUUT GEEN: ${allergieen && allergieen.includes("Geen") ? "niets" : allergieen.join(', ')}.
            2. Porties: Bereken voor ${gezinsgrootte} personen.
            3. Beschikbare ingrediënten: ${existing_ingredients.join(', ')}.
            Reageer in JSON formaat: 
            { 
              "recepten": [
                {
                  "titel": "Naam",
                  "tijd": "X min",
                  "ingredienten_lijst": ["hoeveelheid item"],
                  "instructies_stappen": ["Stap 1...", "Stap 2..."]
                }
              ]
            }`;
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ 
                role: "user", 
                content: [
                    { type: "text", text: prompt },
                    ...(images || []).map(img => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }))
                ] 
            }],
            response_format: { type: "json_object" }
        }, { 
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            timeout: 55000 
        });

        const data = JSON.parse(response.data.choices[0].message.content);
        res.json(data);

    } catch (error) {
        console.error("Server Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Er ging iets mis bij de AI verwerking." });
    }
});

// CRUCIALE FIX VOOR RENDER:
// Render wijst zelf een PORT toe. We luisteren op 0.0.0.0 om bereikbaar te zijn.
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`KookMaatje Backend draait op poort ${PORT}`);
});