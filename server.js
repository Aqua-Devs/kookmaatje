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
        const { images, only_ingredients, existing_ingredients, hongerStatus, dieetVoorkeuren, kookNiveau } = req.body;
        let prompt = "";

        if (only_ingredients) {
            prompt = `Analyseer deze foto's van ingrediënten. Geef een unieke lijst zonder duplicaten. 
            JSON format: { "ingredienten": ["item1", "item2"] }`;
        } else {
            // VERBETERDE PROMPT VOOR VOEDINGSWAARDEN EN VARIATIE
            prompt = `Jij bent KookMaatje, de ultieme keukenassistent. 
            Gebruik deze ingrediënten: ${existing_ingredients.join(', ')}. 
            Status: ${hongerStatus}. Dieet: ${dieetVoorkeuren || 'geen'}. Niveau: ${kookNiveau || 'gemiddeld'}.
            
            GEEF EXACT 5 RECEPTEN TERUG. Zorg voor variatie (gezond, snel, klassiek). 
            Markeer recepten die bijna verlopen producten gebruiken als 'resteredder'.
            
            JSON FORMAAT:
            {
              "recepten": [
                {
                  "titel": "Naam",
                  "tijd": "30 min",
                  "kcal": "ca. 500 kcal",
                  "is_resteredder": true,
                  "moeilijkheid": "Makkelijk",
                  "je_mist": ["item1"],
                  "instructies_stappen": ["Stap 1...", "Stap 2..."]
                }
              ]
            }`;
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...(images || []).map(img => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }))] }],
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            timeout: 55000 
        });

        res.json(JSON.parse(response.data.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "Fout bij de chef." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KookMaatje Backend live op ${PORT}`));