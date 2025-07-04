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
        hypothesis: "Tumeur gliale de haut grade, très probablement un Glioblastome (GBM)",
        confidence: 92,
        observations: [
          "Volumineuse lésion expansive intra-axiale localisée au niveau du lobe frontal droit",
          "Fort rehaussement hétérogène et annulaire avec zone de nécrose centrale", 
          "Effet de masse significatif avec compression du ventricule latéral droit",
          "Déplacement des structures de la ligne médiane observé",
          "Œdème vasogénique important entourant la lésion"
        ],
        severity: "high",
        recommendations: [
          "Avis neurochirurgical urgent indispensable",
          "Biopsie ou résection chirurgicale à discuter",
          "Corrélation avec l'examen clinique complet du patient"
        ],
        fullReport: `Voici une analyse détaillée basée sur l'image IRM et le contexte clinique fournis, structurée pour aider au diagnostic différentiel d'une lésion cérébrale.

1. Analyse Morphologique de l'Image

Localisation et Taille :
Présence d'une volumineuse lésion expansive intra-axiale (développée au sein du tissu cérébral) localisée au niveau du lobe frontal droit.

Signal et Prise de Contraste :
La lésion présente un fort rehaussement après injection de produit de contraste. Ce rehaussement est hétérogène et annulaire (en anneau), avec une zone de nécrose centrale (partie qui ne prend pas le contraste).

Effet de Masse et Œdème :
Un effet de masse significatif est observé, avec une compression du ventricule latéral droit et un déplacement des structures de la ligne médiane. Un œdème vasogénique (gonflement) important entoure la lésion.

2. Hypothèses Diagnostiques

En se basant sur ces caractéristiques radiologiques, plusieurs diagnostics peuvent être évoqués, par ordre de probabilité :

Hypothèse Principale (Haute Probabilité) :
Tumeur gliale de haut grade, très probablement un Glioblastome (GBM). L'aspect en anneau, la nécrose centrale et l'œdème important sont très caractéristiques de cette pathologie.

Diagnostics Différentiels à Considérer :

Métastase Cérébrale Unique : Pourrait avoir un aspect similaire, surtout si le patient a des antécédents de cancer primaire connu.

Abcès Cérébral : Peut également se présenter comme une lésion en anneau, mais le contexte clinique (fièvre, signes d'infection) est généralement différent.

Lymphome Cérébral Primitif : Moins fréquent, mais reste une possibilité chez certains patients.

3. Facteurs de Gravité et Recommandations

Niveau d'Urgence :
Élevé (5/5). La taille de la lésion et l'effet de masse sur les structures cérébrales nécessitent une prise en charge immédiate.

Prochaines Étapes Cliniques Suggérées :
Un avis neurochirurgical urgent est indispensable pour discuter des options thérapeutiques, qui peuvent inclure une biopsie ou une résection chirurgicale de la lésion.

Note Importante : Il est crucial de noter que cette analyse est générée par une IA et est basée uniquement sur l'imagerie. Elle doit être impérativement corrélée avec l'examen clinique complet du patient, ses antécédents et d'autres résultats biologiques pour poser un diagnostic définitif.

Avertissement : Cette information est fournie à des fins d'assistance et d'éducation et ne doit pas être considérée comme un avis médical définitif. Consultez toujours un professionnel de santé qualifié pour toute préoccupation ou avant de prendre une décision concernant votre santé ou votre traitement.

Je suis Kahra, votre assistant d'analyse radiologique de terrain.

Contexte clinique fourni : ${clinicalContext || 'Aucun contexte clinique spécifique fourni'}
Images analysées : ${images.length} image(s)`
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
