# MedGemma Backend

Backend pour l'intégration de MedGemma avec Vertex AI de Google Cloud.

## Configuration

1. **Installer les dépendances**
   ```bash
   cd Backend
   npm install
   ```

2. **Configuration Vertex AI**
   - Créez un projet Google Cloud
   - Activez l'API Vertex AI
   - Créez une clé de service account
   - Téléchargez le fichier JSON de la clé

3. **Variables d'environnement**
   Copiez `.env.example` vers `.env` et configurez :
   ```
   GOOGLE_CLOUD_PROJECT_ID=votre-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/votre/service-account-key.json
   PORT=3001
   ```

4. **Démarrer le serveur**
   ```bash
   npm run dev  # Mode développement
   npm start    # Mode production
   ```

## API Endpoints

### POST /api/analyze
Analyse des images médicales avec MedGemma
- **Body**: FormData avec images + contexte clinique
- **Response**: Analyse structurée JSON

### GET /api/health
Vérification de l'état du serveur et de la configuration Vertex AI

### POST /api/test-analysis
Test de l'analyse sans images (pour développement)

## Structure de réponse

```json
{
  "success": true,
  "analysis": {
    "hypothesis": "Diagnostic principal",
    "confidence": 85,
    "observations": ["Observation 1", "Observation 2"],
    "severity": "medium",
    "recommendations": ["Recommandation 1"],
    "fullReport": "Rapport complet détaillé"
  }
}
```
