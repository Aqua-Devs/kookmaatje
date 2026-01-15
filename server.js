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
        const { images, only_ingredients, existing_ingredients, hongerStatus, filters } = req.body;
        let prompt = "";

        if (only_ingredients) {
            prompt = `Lijst alleen de ingrediënten op van deze foto's. JSON: { "ingredienten": ["item1", "item2"] }`;
        } else {
            prompt = `KookMaatje: Gebruik ${existing_ingredients.join(', ')}. Status: ${hongerStatus}. GEEF EXACT 5 RECEPTEN: { "recepten": [ { "titel": "Naam", "tijd": "30 min", "je_mist": ["item3"], "instructies": "Bereiding..." } ] }`;
        }

        const content = [{ type: "text", text: prompt }];
        if (images && images.length > 0) {
            images.forEach(base64 => content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }));
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{ role: "user", content: content }],
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
app.listen(PORT, () => console.log(`API live op ${PORT}`));