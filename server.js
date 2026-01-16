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
        const { images, only_ingredients, existing_ingredients, hongerStatus, dieet, allergieen, naam, gezinsgrootte } = req.body;

        let prompt = "";

        if (only_ingredients) {
            prompt = `GEBRUIK JE COMPUTER VISION: Analyseer deze foto's extreem nauwkeurig. 
            Identificeer ALLEEN de ingrediënten die je 100% zeker ziet. 
            Gok niet. Als je twijfelt, negeer het.
            Reageer in dit JSON formaat: { "ingredienten": ["item1", "item2"] }`;
        } else {
            prompt = `Jij bent KookMaatje, de persoonlijke chef van ${naam}. 
            STRIKTE VOORSCHRIFTEN:
            1. ALLERGIEËN (DIT IS LEVENSGEVAARLIJK): Gebruik ABSOLUUT GEEN: ${allergieen && allergieen.includes("Geen") ? "niets" : allergieen.join(', ')}. Controleer elk ingrediënt in je recepten op deze allergieën.
            2. VOORRAAD: Gebruik ALLEEN ingrediënten die vermeld staan in deze lijst: ${existing_ingredients.join(', ')}. 
            3. MISSENDE ITEMS: Je mag maximaal 3 kleine extra ingrediënten toevoegen die de gebruiker moet kopen, maar geef de voorkeur aan recepten die 100% met de huidige voorraad kunnen.
            4. PORTIES: Bereken alle hoeveelheden voor EXACT ${gezinsgrootte} personen.
            5. DIEET: Houd je aan het ${dieet} dieet.
            6. KOOKNIVEAU: Pas de complexiteit aan op "${hongerStatus}".

            GEEF EXACT 5 RECEPTEN TERUG IN JSON:
            {
              "recepten": [
                {
                  "titel": "Naam",
                  "tijd": "Bereidingstijd",
                  "moeilijkheid": "Makkelijk/Gemiddeld/Uitdagend",
                  "image_search_term": "English food photography term for this dish",
                  "heb_je_al": ["items die daadwerkelijk in de lijst stonden"],
                  "je_missen": ["items die NIET in de lijst stonden"],
                  "instructies_stappen": ["Stap 1...", "Stap 2..."]
                }
              ]
            }`;
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o", // We gebruiken het krachtigste model voor beste visuele analyse
            messages: [{ 
                role: "user", 
                content: [
                    { type: "text", text: prompt },
                    ...(images || []).map(img => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }))
                ] 
            }],
            response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }, timeout: 55000 });

        let data = JSON.parse(response.data.choices[0].message.content);
        
        if (data.recepten) {
            data.recepten = data.recepten.map(r => ({
                ...r,
                image_url: `https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1000&sig=${Math.random()}&${encodeURIComponent(r.image_search_term || 'food')}`
            }));
        }

        res.json(data);
    } catch (error) {
        console.error("Fout bij AI analyse:", error);
        res.status(500).json({ error: "De AI kon de foto's niet scherp genoeg analyseren." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API live op ${PORT}`));