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
        const { images, only_ingredients, existing_ingredients, naam, allergieen, gezinsgrootte } = req.body;

        if (!OPENAI_API_KEY) {
            console.error("CRITICAL: OPENAI_API_KEY is missing!");
            return res.status(500).json({ error: "Server configuratie fout: API key mist." });
        }

        let prompt = only_ingredients 
            ? `Identificeer ingrediënten in JSON: { "ingredienten": [] }`
            : `Jij bent chef van ${naam} voor ${gezinsgrootte} pers. Geen ${allergieen}. Recept in JSON: { "recepten": [] }`;

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
        console.error("Error details:", error.message);
        res.status(500).json({ error: "AI verwerkingsfout" });
    }
});

// DEZE REGELS FIXEN DE RENDER CRASH:
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend actief op poort ${PORT} en host 0.0.0.0`);
});