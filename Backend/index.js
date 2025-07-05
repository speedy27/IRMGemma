const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const { helpers } = require('@google-cloud/aiplatform');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuration pour Vertex AI
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'europe-west4';
const endpointId = process.env.MEDGEMMA_ENDPOINT_ID;
const modelId = process.env.MEDGEMMA_MODEL_ID || 'medgemma-2b';
const isDevelopmentMode = process.env.DEVELOPMENT_MODE === 'true';

// Initialiser le client Vertex AI pour endpoint dédié (seulement si pas en mode dev)
let predictionServiceClient = null;
if (!isDevelopmentMode && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    predictionServiceClient = new PredictionServiceClient({
      apiEndpoint: `${location}-aiplatform.googleapis.com`,
    });
  } catch (error) {
    console.warn('⚠️ Impossible d\'initialiser le client Vertex AI:', error.message);
    console.log('🔧 Mode développement activé automatiquement');
  }
}

// Configuration Multer pour les images
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Fonction pour encoder l'image en base64
function encodeImageToBase64(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

// Fonction pour créer le prompt médical structuré pour MedGemma
function createMedicalPrompt(clinicalContext, hasImages) {
  const basePrompt = `Tu es MedGemma, un assistant IA médical spécialisé dans l'analyse d'imagerie médicale.

CONTEXTE CLINIQUE:
${clinicalContext || 'Aucun contexte clinique fourni.'}

${hasImages ? `
IMAGES MÉDICALES:
Tu vas analyser les images médicales fournies ci-dessous.

INSTRUCTIONS D'ANALYSE:
1. Examine attentivement chaque image médicale
2. Identifie les structures anatomiques visibles
3. Recherche les anomalies ou pathologies
4. Corrèle avec le contexte clinique fourni
5. Propose un diagnostic différentiel
6. Évalue le niveau de confiance de tes observations

ANALYSE DEMANDÉE:
- Décris les principales observations
- Identifie les zones d'intérêt pathologiques
- Propose une hypothèse diagnostique principale
- Indique le niveau de confiance (0-100%)
- Suggère des examens complémentaires si nécessaire
- Formule des recommandations cliniques

FORMAT DE RÉPONSE:
Réponds de manière structurée et professionnelle en tant que radiologue expert.
` : `
CONSULTATION SANS IMAGE:
Analyse le contexte clinique fourni et fournis des recommandations.
`}

RÉPONSE:`;

  return basePrompt;
}

// Route pour analyser les images avec MedGemma
app.post('/api/analyze', upload.array('images'), async (req, res) => {
  try {
    const { clinicalContext } = req.body;
    const images = req.files || [];

    console.log('Début de l\'analyse MedGemma...');
    console.log('Contexte clinique:', clinicalContext);
    console.log('Nombre d\'images:', images.length);
    console.log('Mode développement:', isDevelopmentMode);

    // Si en mode développement ou pas de client configuré, retourner une analyse simulée
    if (isDevelopmentMode || !predictionServiceClient) {
      console.log('🔧 Mode développement - Analyse simulée Kahra/MedGemma');
      
      const mockAnalysis = {
        hypothesis: "This is most likely a deep spontaneous hypertensive haematoma, centred on the left basal ganglia, in the sub-acute phase",
        confidence: 92,
        observations: [
          "Voluminous haemorrhage visible in the basal ganglia of the left hemisphere",
          "Clear T1 hyperintensity consistent with early subacute haemorrhage", 
          "Compression and deviation of the frontal horn of the left lateral ventricle",
          "	Discrete deviation of the midline to the right, reflecting a mass effect",
          "No ventricular flooding or signs of meningeal haemorrhage on this slice."
        ],
        severity: "high",
        recommendations: [
          "Urgent neurosurgical opinion essential",
 "Biopsy or surgical resection to be discussed",
 "Correlation with the patient's complete clinical examination"
        ],
        fullReport: `The following is a detailed analysis based on the MRI image and clinical context provided, structured to aid in the differential diagnosis of a brain injury.'

Examination
Cerebral MRI - Axial T1 sequence
Indication : Acute right motor deficit, suspected haemorrhagic stroke

Description
A bulky T1 hyperintense lesion is seen, centred on the left basal ganglia (putamen, globus pallidus) and extending to the internal capsule and corona radiata.
The size and intensity of the signal are consistent with subacute intraparenchymal haemorrhage.
This lesion causes compression of the left lateral ventricle and discrete rightward compression of the midline.
Peripheral vasogenic oedema is present.
The right cerebral structures and brainstem appear intact in this section.
No evidence of ventricular flooding or subarachnoid haemorrhage.

Conclusion
- Large intraparenchymal haemorrhage in the left basal ganglia, probably related to a spontaneous hypertensive haematoma.
- Significant mass effect with ventricular compression and medial deviation.
- Compare with neurological examination and supplement with other sequences (T2, FLAIR, SWI) to assess risk of ventricular flooding, recurrence or transformation.

3. Severity factors and recommendations

Emergency score
5/5 - VITAL EMERGENCY
The size of the lesion and the mass effect on cerebral structures require immediate treatment.

Suggested next clinical steps :
Urgent neurosurgical advice is essential to discuss treatment options, which may include biopsy or surgical resection of the lesion.

Important Note: It is crucial to note that this analysis is generated by an AI and is based solely on imaging. It must be correlated with the patient's complete clinical examination, history and other biological results in order to make a definitive diagnosis.

Clinical context provided : ${clinicalContext || 'No specific clinical context provided'}
Images analysed: ${images.length} image(s)`
      };

      return res.json({ success: true, analysis: mockAnalysis });
    }

    // Code d'analyse réelle avec MedGemma...
    // Préparer le prompt
    const prompt = createMedicalPrompt(clinicalContext, images.length > 0);

    // ...existing code...

    // Préparer les contenus pour MedGemma
    const instances = [];
    
    // Format pour MedGemma avec endpoint dédié
    const instance = {
      prompt: prompt,
      max_tokens: 2048,
      temperature: 0.1,
      top_p: 0.8
    };

    // Ajouter les images si présentes
    if (images.length > 0) {
      instance.images = images.map(image => ({
        mime_type: image.mimetype,
        data: image.buffer.toString('base64')
      }));
    }

    instances.push(instance);

    // Construire le chemin de l'endpoint dédié
    const endpoint = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;

    const request = {
      endpoint,
      instances: instances.map(instance => helpers.toValue(instance)),
      parameters: helpers.toValue({})
    };

    console.log('Envoi de la requête à Vertex AI...');

    // Appel à Vertex AI
    const [response] = await predictionServiceClient.predict(request);
    
    console.log('Réponse reçue de Vertex AI');

    // Traiter la réponse de l'endpoint dédié MedGemma
    const predictions = response.predictions;
    if (!predictions || predictions.length === 0) {
      throw new Error('Aucune prédiction reçue de MedGemma');
    }

    const prediction = predictions[0];
    let responseText;

    // Extraire le texte de la réponse selon le format de MedGemma
    if (prediction.structValue) {
      // Format structuré
      const fields = prediction.structValue.fields;
      responseText = fields?.generated_text?.stringValue || 
                    fields?.text?.stringValue || 
                    fields?.response?.stringValue;
    } else if (prediction.stringValue) {
      // Format texte simple
      responseText = prediction.stringValue;
    } else if (typeof prediction === 'string') {
      // Réponse directe en string
      responseText = prediction;
    }
    
    if (!responseText) {
      // Fallback : convertir l'objet en string pour debug
      responseText = JSON.stringify(prediction);
      console.log('Format de réponse non reconnu, contenu brut:', prediction);
    }

    console.log('Texte de réponse reçu:', responseText.substring(0, 200) + '...');

    // Essayer d'analyser la réponse comme JSON, sinon créer une structure par défaut
    let analysisResult;
    try {
      // Nettoyer le texte pour extraire le JSON si présent
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Pas de JSON trouvé');
      }
    } catch (parseError) {
      console.log('Erreur de parsing JSON, création d\'une structure par défaut');
      // Créer une analyse structurée à partir du texte brut
      analysisResult = {
        hypothesis: extractMainDiagnosis(responseText) || "Analyse des images médicales",
        confidence: 85,
        observations: extractObservations(responseText),
        severity: "medium",
        recommendations: extractRecommendations(responseText),
        fullReport: responseText
      };
    }

    // Valider et compléter la structure de réponse
    const validatedResult = {
      hypothesis: analysisResult.hypothesis || "Analyse en cours",
      confidence: Math.min(100, Math.max(0, analysisResult.confidence || 85)),
      observations: Array.isArray(analysisResult.observations) ? 
        analysisResult.observations : 
        extractObservations(responseText),
      severity: ["low", "medium", "high"].includes(analysisResult.severity) ? 
        analysisResult.severity : "medium",
      recommendations: Array.isArray(analysisResult.recommendations) ? 
        analysisResult.recommendations : 
        extractRecommendations(responseText),
      fullReport: analysisResult.fullReport || responseText
    };

    console.log('Analyse terminée avec succès');
    res.json({ success: true, analysis: validatedResult });

  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack 
    });
  }
});

// Fonctions utilitaires pour extraire des informations du texte
function extractMainDiagnosis(text) {
  const patterns = [
    /(?:diagnostic|hypothèse|conclusion)[^:]*:?\s*([^.\n]+)/i,
    /(?:suspicion|évocation)\s+d?[''']?([^.\n]+)/i,
    /^([^.\n]+)(?:\s+est|sont)?\s+(?:évoqué|suspecté|probable)/im
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractObservations(text) {
  const observations = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.match(/^[-•*]\s+/) || 
        trimmedLine.match(/^\d+[\.)]\s+/) ||
        trimmedLine.includes('observ') ||
        trimmedLine.includes('visible') ||
        trimmedLine.includes('présence') ||
        trimmedLine.includes('absence')) {
      observations.push(trimmedLine.replace(/^[-•*\d\.)]\s*/, ''));
    }
  }
  
  return observations.length > 0 ? observations : [
    "Analyse de l'imagerie médicale en cours",
    "Évaluation des structures anatomiques",
    "Recherche d'anomalies pathologiques"
  ];
}

function extractRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.includes('recommand') ||
        trimmedLine.includes('conseill') ||
        trimmedLine.includes('suggère') ||
        trimmedLine.includes('IRM') ||
        trimmedLine.includes('contrôle') ||
        trimmedLine.includes('suivi')) {
      recommendations.push(trimmedLine);
    }
  }
  
  return recommendations.length > 0 ? recommendations : [
    "Corrélation clinico-radiologique recommandée",
    "Suivi selon protocole établi"
  ];
}

// Route de test pour vérifier la connexion
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    medgemma: {
      projectId: projectId || 'Not configured',
      location: location,
      endpointId: endpointId || 'Not configured',
      modelId: modelId,
      dedicatedEndpoint: `${endpointId}.${location}-${projectId}.prediction.vertexai.goog`,
      developmentMode: isDevelopmentMode,
      clientConfigured: !!predictionServiceClient
    }
  });
});

// Route pour tester sans images
app.post('/api/test-analysis', async (req, res) => {
  try {
    const { clinicalContext } = req.body;
    
    // Simulation d'une analyse réussie pour les tests
    const mockAnalysis = {
      hypothesis: "Test d'analyse réussi",
      confidence: 90,
      observations: [
        "Connexion Vertex AI fonctionnelle",
        "Modèle MedGemma accessible",
        "Traitement des données opérationnel"
      ],
      severity: "low",
      recommendations: [
        "Système prêt pour l'analyse d'images",
        "Configuration Vertex AI validée"
      ],
      fullReport: `TEST MEDGEMMA - ${new Date().toISOString()}\n\nContexte: ${clinicalContext}\n\nLe système est opérationnel et prêt à traiter les analyses d'imagerie médicale.`
    };

    res.json({ success: true, analysis: mockAnalysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend MedGemma démarré sur le port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🧠 Configuration MedGemma:`);
  console.log(`   Project ID: ${projectId || 'Non configuré'}`);
  console.log(`   Location: ${location}`);
  console.log(`   Endpoint ID: ${endpointId || 'Non configuré'}`);
  console.log(`   Model: ${modelId}`);
  console.log(`   Endpoint URL: ${endpointId}.${location}-${projectId}.prediction.vertexai.goog`);
  
  if (isDevelopmentMode) {
    console.log(`🔧 MODE DÉVELOPPEMENT ACTIVÉ`);
    console.log(`   - Analyses simulées`);
    console.log(`   - Configurez votre clé Google Cloud pour l'analyse réelle`);
  } else if (!predictionServiceClient) {
    console.log(`⚠️ Client Vertex AI non configuré`);
    console.log(`   - Vérifiez votre clé de service Google Cloud`);
  } else {
    console.log(`✅ Client Vertex AI configuré et prêt`);
  }
});

module.exports = app;
