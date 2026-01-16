const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/analyze', async (req, res) => {
    try {
        const { 
            images, 
            only_ingredients, 
            existing_ingredients, 
            hongerStatus, 
            dieet, 
            allergieen, 
            naam, 
            gezinsgrootte 
        } = req.body;

        let prompt = "";

        if (only_ingredients) {
            prompt = `Identificeer alle ingrediënten op de foto's. Reageer in JSON: { "ingredienten": ["item1", "item2"] }`;
        } else {
            prompt = `Jij bent KookMaatje, de persoonlijke chef van ${naam}. 
            RECEPTEN MOETEN VOLDOEN AAN:
            - Huishouden: Kook voor EXACT ${gezinsgrootte} personen met kloppende hoeveelheden.
            - Dieet: ${dieet}.
            - Allergieën (VERBODEN): ${allergieen && allergieen.includes("Geen") ? "Geen" : allergieen.join(', ')}.
            - Kookniveau/Hongerstatus: ${hongerStatus}.
            - Voorraad: Gebruik zoveel mogelijk van: ${existing_ingredients.join(', ')}.

            GEEF EXACT 5 RECEPTEN TERUG IN JSON:
            {
              "recepten": [
                {
                  "titel": "Naam",
                  "tijd": "Bereidingstijd",
                  "heb_je_al": ["items uit voorraad"],
                  "je_mist": ["items om te kopen"],
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

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "Serverfout bij het genereren van recepten." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API live op ${PORT}`));