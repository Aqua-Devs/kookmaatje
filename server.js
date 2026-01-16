const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express(); // Deze regel lost de "app is not defined" fout op

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/analyze', async (req, res) => {
    try {
        const { images, only_ingredients, existing_ingredients, naam, allergieen, gezinsgrootte, hongerStatus } = req.body;

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: "OpenAI API Key mist op de server." });
        }

        let prompt = "";
        if (only_ingredients) {
            prompt = `GEBRUIK JE COMPUTER VISION: Identificeer alleen de ingrediënten die je ziet. 
            Reageer in JSON: { "ingredienten": ["item1", "item2"] }`;
        } else {
            const allergieTekst = (allergieen && allergieen.length > 0) ? allergieen.join(', ') : "geen";
            const ingredientenTekst = (existing_ingredients && existing_ingredients.length > 0) ? existing_ingredients.join(', ') : "geen";

            prompt = `Jij bent KookMaatje, de persoonlijke chef van ${naam || 'Chef'}. 
            Hongerstatus: ${hongerStatus}. Personen: ${gezinsgrootte || 2}. 
            Ingrediënten: ${ingredientenTekst}. Allergieën: ${allergieTekst}.
            Reageer in JSON: { "recepten": [{ "titel": "Naam", "tijd": "X min", "je_mist": ["item"], "instructies_stappen": ["stap 1"] }] }`;
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
        console.error("Fout:", error.message);
        res.status(500).json({ error: "Interne serverfout" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server live op poort ${PORT}`);
});