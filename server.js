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
        const { images, voorkeuren } = req.body; 

        if (!images || images.length === 0) {
            return res.status(400).json({ error: "Geen afbeeldingen ontvangen" });
        }

        console.log(`Chef analyseert ${images.length} foto's met voorkeuren: ${voorkeuren}`);

        const content = [
            {
                type: "text",
                text: `Jij bent KookMaatje. Analyseer de foto's en identificeer alle ingrediënten. 
                Houd bij het bedenken van recepten strikt rekening met deze gebruikersvoorkeuren: ${voorkeuren}.
                
                GEEF JE ANTWOORD UITSLUITEND IN DIT JSON FORMAAT:
                {
                  "ingredienten": ["item1", "item2"],
                  "recepten": [
                    {
                      "titel": "Naam van gerecht",
                      "beschrijving": "Korte smakelijke omschrijving",
                      "tijd": "bijv. 30 minuten",
                      "niveau": "bijv. Makkelijk",
                      "heb_je_al": ["lijst van aanwezige ingrediënten"],
                      "je_mist": ["lijst van ontbrekende ingrediënten"],
                      "instructies": "Stappenplan..."
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

        // Stuur de JSON direct terug naar Flutter
        res.json(JSON.parse(response.data.choices[0].message.content));

    } catch (error) {
        console.error("Server Error:", error.message);
        res.status(500).json({ error: "De chef kon de ingrediënten niet verwerken." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KookMaatje Backend live op poort ${PORT}`));