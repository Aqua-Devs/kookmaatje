// ... (bestaande imports blijven gelijk) 

app.post('/analyze', async (req, res) => {
    try {
        // Zorg voor fallback waarden (empty array) als data ontbreekt 
        const images = req.body.images || [];
        const only_ingredients = req.body.only_ingredients || false;
        const existing_ingredients = req.body.existing_ingredients || [];
        const allergieen = req.body.allergieen || []; 
        const naam = req.body.naam || "Chef";
        const gezinsgrootte = req.body.gezinsgrootte || 2;
        const dieet = req.body.dieet || "geen specifiek";
        const hongerStatus = req.body.hongerStatus || "normaal";

        let prompt = "";

        if (only_ingredients) {
            prompt = `GEBRUIK JE COMPUTER VISION: Analyseer deze foto's extreem nauwkeurig...`;
        } else {
            // De .join() werkt nu altijd omdat allergieen/ingredients nooit null zijn 
            const allergieTekst = allergieen.includes("Geen") ? "geen" : allergieen.join(', ');
            const ingredientenTekst = existing_ingredients.join(', ');

            prompt = `Jij bent KookMaatje, de persoonlijke chef van ${naam}. 
            STRIKTE VOORSCHRIFTEN:
            1. ALLERGIEËN: Gebruik ABSOLUUT GEEN: ${allergieTekst}.
            2. VOORRAAD: Gebruik deze lijst: ${ingredientenTekst}. 
            ...`;
        }
        
        // ... (rest van de OpenAI call) 
        
    } catch (error) {
        console.error("Fout bij AI analyse:", error);
        res.status(500).json({ error: "Er ging iets mis op de server." });
    }
});

// Zorg dat Render de poort kan toewijzen 
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 API live op poort ${PORT}`));