const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

// Laad instellingen uit .env (alleen voor lokaal gebruik)
dotenv.config();

const app = express();

// Beperk de grootte van de body omdat base64 foto's groot zijn (50mb)
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/analyze', async (req, res) => {
    try {
        const { images } = req.body;

        if (!images || images.length === 0) {
            return res.status(400).json({ error: "Geen afbeeldingen ontvangen" });
        }

        console.log(`Chef analyseert nu ${images.length} foto's...`);

        // De krachtige prompt voor een gestructureerd antwoord
        const content = [
            {
                type: "text",
                text: "Jij bent KookMaatje, een sterrenchef die mensen helpt koken met wat ze nog hebben. " +
                      "Analyseer de foto's en geef een antwoord in dit EXACTE formaat: " +
                      "1. Start met een lijstje: '**Gevonden ingrediënten**'. " +
                      "2. Geef daarna 3 recepten. Gebruik voor elk recept: " +
                      "### [Naam van het gerecht] \n" +
                      "* **Tijd**: [minuten] \n" +
                      "* **Ingrediënten**: [lijst] \n" +
                      "* **Instructies**: [stappenplannetje] \n\n" +
                      "Antwoord volledig in het Nederlands."
            }
        ];

        // Voeg de base64 afbeeldingen toe
        images.forEach(base64 => {
            content.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64}` }
            });
        });

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [{ role: "user", content: content }],
                max_tokens: 1500
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ result: response.data.choices[0].message.content });

    } catch (error) {
        console.error("OpenAI Error:", error.response?.data || error.message);
        res.status(500).json({ error: "De chef heeft een technisch probleem." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend live op poort ${PORT}`));