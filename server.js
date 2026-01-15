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

        const content = [
            {
                type: "text",
                text: `Jij bent KookMaatje. Analyseer de foto's. 
                Houd rekening met de hongerstatus: ${hongerStatus} en voorkeuren: ${voorkeuren}.
                
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
                      "instructies": "Stappen..."
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
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
        });

        res.json(JSON.parse(response.data.choices[0].message.content));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KookMaatje API live op ${PORT}`));