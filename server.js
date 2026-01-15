const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

// Instellingen laden
dotenv.config();
const app = express();

// Middleware
app.use(cors()); // Zorgt dat je app mag praten met de server
app.use(express.json({ limit: '50mb' })); // Nodig voor het ontvangen van meerdere foto's

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// De 'Analyze' route
app.post('/analyze', async (req, res) => {
    try {
        const { images } = req.body; // De lijst met base64 foto's uit Flutter

        if (!images || images.length === 0) {
            return res.status(400).json({ error: "Geen afbeeldingen ontvangen" });
        }

        console.log(`Ontvangen: ${images.length} foto's. Analyseren via OpenAI...`);

        // Bouw het bericht voor OpenAI
        const content = [
            {
                type: "text",
                text: "Jij bent een sterrenchef. Kijk naar deze foto's van mijn koelkast en voorraad. " +
                      "1. Identificeer de ingrediënten. " +
                      "2. Bedenk 3 creatieve, haalbare recepten. " +
                      "3. Geef een lijstje van wat ik eventueel nog mis. " +
                      "Antwoord in duidelijke Nederlandse Markdown."
            }
        ];

        // Voeg elke foto toe aan het bericht
        images.forEach(base64 => {
            content.push({
                type: "image_url",
                image_url: {
                    url: `data:image/jpeg;base64,${base64}`
                }
            });
        });

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: content
                    }
                ],
                max_tokens: 1500
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                }
            }
        );

        const aiResultaat = response.data.choices[0].message.content;
        res.json({ result: aiResultaat });

    } catch (error) {
        console.error("OpenAI Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "De chef heeft een foutje gemaakt bij het analyseren." });
    }
});

// Start de server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Kookmaatje server draait op poort ${PORT}`);
});