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
        const { images, voorkeuren, hongerStatus } = req.body; 
        const isResteredder = voorkeuren && voorkeuren.includes("Focus op verspilling tegengaan");

        const content = [
            {
                type: "text",
                text: `Jij bent KookMaatje. Analyseer de foto's en identificeer de ingrediënten.
                Houd rekening met de hongerstatus: ${hongerStatus} en extra voorkeuren: ${voorkeuren}.
                ${isResteredder ? "GEEF PRIORITEIT aan ingrediënten die snel bederven." : ""}
                
                GEEF ALTIJD EXACT 5 RECEPTEN TERUG IN DIT JSON FORMAAT:
                {
                  "ingredienten": ["item1", "item2"],
                  "recepten": [
                    {
                      "titel": "Naam",
                      "beschrijving": "Korte tekst",
                      "tijd": "30 min",
                      "niveau": "Makkelijk",
                      "heb_je_al": ["item1"],
                      "je_mist": ["item3"],
                      "instructies": "Stap 1. Stap 2. Stap 3."
                    }
                  ]
                }`
            }
        ];

        images.forEach(base64 => {
            content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } });
        });

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: content }],
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
            timeout: 55000 // Geef OpenAI de tijd
        });

        res.json(JSON.parse(response.data.choices[0].message.content));

    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ error: "De chef kon de recepten niet samenstellen." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KookMaatje API live op ${PORT}`));