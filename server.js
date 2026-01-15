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

        // Check of de Resteredder-modus actief is
        const isResteredder = voorkeuren.includes("Focus op verspilling tegengaan");

        const content = [
            {
                type: "text",
                text: `Jij bent KookMaatje, de ultieme chef-kok. Analyseer de foto's en identificeer alle ingrediënten.
                
                GEBRUIKERSVOORKEUREN:
                - Honger Status: ${hongerStatus}
                - Extra filters: ${voorkeuren}
                ${isResteredder ? "- FOCUS: Je bent nu in 'Resteredder-modus'. Geef prioriteit aan recepten die verse producten gebruiken die snel kunnen bederven." : ""}

                STRICTE OPDRACHT:
                1. Identificeer alle ingrediënten op de foto's.
                2. Bedenk EXACT 5 recepten.
                3. Zorg dat de recepten passen bij de Honger Status (${hongerStatus}).
                
                GEEF ANTWOORD IN DIT JSON FORMAAT:
                {
                  "ingredienten": ["item1", "item2"],
                  "recepten": [
                    {
                      "titel": "Naam van gerecht",
                      "beschrijving": "Korte, smakelijke omschrijving",
                      "tijd": "bijv. 20 minuten",
                      "niveau": "bijv. Gemiddeld",
                      "heb_je_al": ["lijst"],
                      "je_mist": ["lijst"],
                      "instructies": "Stapsgewijze uitleg..."
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
        console.error("Fout:", error.message);
        res.status(500).json({ error: "De chef kon de recepten niet samenstellen." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KookMaatje API live op poort ${PORT}`));