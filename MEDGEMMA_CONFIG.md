# Configuration MedGemma avec Endpoint Dédié

## 📋 Informations de Configuration

Votre endpoint MedGemma est maintenant configuré avec les paramètres suivants :

### Détails de l'Endpoint
- **Project ID:** `744112801898`
- **Region:** `europe-west4`
- **Endpoint ID:** `7577009504911360000`
- **Endpoint URL:** `7577009504911360000.europe-west4-744112801898.prediction.vertexai.goog`

### Variables d'Environnement Configurées

```bash
# Backend/.env
GOOGLE_CLOUD_PROJECT_ID=744112801898
GOOGLE_CLOUD_LOCATION=europe-west4
MEDGEMMA_ENDPOINT_ID=7577009504911360000
MEDGEMMA_MODEL_ID=medgemma-2b
```

## 🔑 Configuration Manquante

Pour que l'application fonctionne, vous devez encore :

### 1. Clé de Service Google Cloud

Téléchargez votre clé de service account JSON et mettez à jour le chemin dans `.env` :

```bash
GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/votre/service-account-key.json
```

**Étapes pour obtenir la clé :**

1. Allez dans [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez le projet `744112801898`
3. Menu > IAM & Admin > Service Accounts
4. Créez ou sélectionnez un compte de service
5. Générez une nouvelle clé JSON
6. Téléchargez le fichier et placez-le dans votre projet
7. Mettez à jour le chemin dans `.env`

### 2. Permissions Requises

Assurez-vous que votre compte de service a les permissions :
- `aiplatform.endpoints.predict`
- `aiplatform.models.predict`
- `ml.models.predict`

## 🚀 Test de Configuration

Une fois la clé configurée, testez la connexion :

```bash
# Démarrer le backend
cd Backend
npm run dev

# Dans un autre terminal, tester
curl http://localhost:3001/api/health
```

Vous devriez voir :
```json
{
  "status": "OK",
  "timestamp": "2025-07-04T...",
  "medgemma": {
    "projectId": "744112801898",
    "location": "europe-west4",
    "endpointId": "7577009504911360000",
    "modelId": "medgemma-2b",
    "dedicatedEndpoint": "7577009504911360000.europe-west4-744112801898.prediction.vertexai.goog"
  }
}
```

## 🧪 Test d'Analyse

Test avec contexte clinique uniquement :
```bash
curl -X POST http://localhost:3001/api/test-analysis \
  -H "Content-Type: application/json" \
  -d '{"clinicalContext":"Patient de 65 ans avec douleurs thoraciques"}'
```

## 📊 Format des Requêtes MedGemma

L'endpoint dédié utilise un format spécifique :

```json
{
  "instances": [
    {
      "prompt": "Prompt médical structuré...",
      "max_tokens": 2048,
      "temperature": 0.1,
      "top_p": 0.8,
      "images": [
        {
          "mime_type": "image/jpeg",
          "data": "base64_encoded_image..."
        }
      ]
    }
  ]
}
```

## 🔧 Adaptations Spécifiques

Le code a été adapté pour :

1. **Endpoint Dédié** au lieu de l'API standard Gemini
2. **Format de requête** spécifique à MedGemma
3. **Traitement des réponses** adapté au format de sortie
4. **Prompts optimisés** pour l'analyse médicale
5. **Gestion des images** en base64

## 🐛 Dépannage

### Erreur d'Authentification
- Vérifiez le chemin vers le fichier de clé JSON
- Vérifiez les permissions du compte de service

### Erreur d'Endpoint
- Vérifiez que l'endpoint ID est correct
- Vérifiez que l'endpoint est déployé et actif

### Erreur de Région
- Vérifiez que la région `europe-west4` est correcte
- Vérifiez que votre quota est suffisant dans cette région

## 📝 Logs Utiles

Les logs du backend montreront :
- Configuration de l'endpoint
- Requêtes envoyées à MedGemma
- Réponses reçues
- Erreurs détaillées

Activez le mode debug pour plus d'informations :
```bash
DEBUG=* npm run dev
```

---

**Prochaine étape :** Configurez votre clé de service Google Cloud et testez l'analyse avec de vraies images médicales !
