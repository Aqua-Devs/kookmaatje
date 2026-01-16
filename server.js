const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Verhoogd voor het versturen van meerdere foto's

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/analyze', async (req, res) => {
    try {
        const { 
            images, 
            only_ingredients, 
            existing_ingredients, 
            hongerStatus, 
            dieet, 
            allergieen, 
            naam, 
            gezinsgrootte 
        } = req.body;

        let prompt = "";

        if (only_ingredients) {
            // Fase 1: Alleen ingrediënten herkennen van de foto's
            prompt = `Analyseer de foto's en maak een lijst van alle eetbare ingrediënten die je ziet. 
            Reageer strikt in dit JSON formaat: { "ingredienten": ["item1", "item2"] }`;
        } else {
            // Fase 2: Recepten genereren op basis van het uitgebreide profiel
            prompt = `Jij bent KookMaatje, de persoonlijke chef van ${naam}.
            
            STRIKTE VOORWAARDEN VOOR DE RECEPTEN:
            1. Gebruikersnaam: ${naam}
            2. Huishouden: Kook voor EXACT ${gezinsgrootte} personen. Vermeld duidelijke hoeveelheden (gram, ml, stuks).
            3. Dieet: ${dieet}.
            4. Allergieën (STRIKT VERBODEN): ${allergieen && allergieen.length > 0 ? allergieen.join(', ') : 'Geen'}. Gebruik deze ingrediënten absoluut niet en stel ook geen vervangers voor die deze allergenen bevatten.
            5. Kookniveau/Hongerstatus: ${hongerStatus}.
            6. Voorraad: Gebruik zoveel mogelijk van deze ingrediënten: ${existing_ingredients.join(', ')}.

            GEEF EXACT 5 RECEPTEN TERUG IN DIT JSON FORMAAT:
            {
              "recepten": [
                {
                  "titel": "Creatieve Naam",
                  "tijd": "Bereidingstijd",
                  "heb_je_al": ["lijst van gebruikte ingrediënten uit de voorraad"],
                  "je_mist": ["lijst van ingrediënten die de gebruiker nog moet kopen"],
                  "instructies_stappen": ["Stap 1: ...", "Stap 2: ..."]
                }
              ]
            }`;
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        ...(images || []).map(img => ({
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${img}` }
                        }))
                    ]
                }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 55000 // Verlengd omdat 5 recepten genereren tijd kost
        });

        res.json(JSON.parse(response.data.choices[0].message.content));

    } catch (error) {
        console.error("Fout bij OpenAI API:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: "De chef heeft een probleem in de keuken. Probeer het later opnieuw.",
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 KookMaatje Backend live op poort ${PORT}`);
});