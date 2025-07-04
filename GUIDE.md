# Guide d'Utilisation - IRMGemma

## 🚀 Démarrage de l'Application

### 1. Installation Initiale

**Option A: Script automatique (Windows)**
```cmd
setup.bat
```

**Option B: Script automatique (Unix/Linux/macOS)**
```bash
chmod +x setup.sh
./setup.sh
```

**Option C: Installation manuelle**
```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install --legacy-peer-deps
```

### 2. Configuration

**Backend (.env):**
```bash
# Copiez et configurez vos variables
cp Backend/.env.example Backend/.env

# Editez Backend/.env avec vos informations Google Cloud:
GOOGLE_CLOUD_PROJECT_ID=votre-project-id-gcp
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/votre/service-account-key.json
```

**Frontend (.env.local):**
```bash
# Déjà configuré pour pointer vers localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Démarrage des Serveurs

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```
✅ Serveur disponible sur: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```
✅ Interface disponible sur: http://localhost:3000

## 🎯 Utilisation de l'Interface

### 1. Chargement des Images

1. **Glissez-déposez** vos images médicales dans la zone centrale
2. **Ou cliquez** sur "Sélectionner des fichiers"
3. **Formats supportés:** JPG, PNG, GIF, BMP
4. **Taille max:** 50MB par image

### 2. Configuration de l'Analyse

1. **Ajoutez le contexte clinique** dans la zone de texte (optionnel mais recommandé)
   - Symptômes du patient
   - Antécédents médicaux
   - Signes cliniques observés

2. **Cliquez sur "Analyser"** pour lancer l'analyse MedGemma

### 3. Visualisation des Résultats

L'interface affiche :
- **Hypothèse principale** avec niveau de confiance
- **Observations clés** détectées
- **Rapport complet** exportable
- **Zones suspectes** marquées sur l'image

### 4. Interaction avec l'IA

- **Chat intégré** pour poser des questions sur l'analyse
- **Affinage** des résultats par dialogue
- **Explications** supplémentaires disponibles

## 🔧 Fonctionnalités Avancées

### Modes d'Affichage

- **Vue unique:** Une image en plein écran
- **Vue grille:** Jusqu'à 4 images simultanément

### Export des Résultats

- **PDF:** Rapport complet exportable
- **Copie:** Texte copiable dans le presse-papier

### Gestion Multiple d'Images

- **Navigation** entre les images uploadées
- **Suppression** d'images individuelles
- **Analyse groupée** de plusieurs examens

## 🛠️ Configuration Vertex AI

### Prérequis Google Cloud

1. **Créer un projet Google Cloud Platform**
2. **Activer l'API Vertex AI**
3. **Créer un compte de service**
4. **Télécharger la clé JSON**

### Détails Techniques

**Modèle utilisé:** `gemini-1.5-pro-002`
**Région:** `us-central1` (configurable)
**Format prompts:** Structuré pour l'analyse médicale

### Limites et Quotas

- **Taille max image:** 50MB
- **Timeout:** 5 minutes par analyse
- **Quotas:** Selon votre configuration GCP

## 🐛 Dépannage

### Erreurs Communes

**"Impossible de se connecter au backend"**
- Vérifiez que le backend est démarré sur le port 3001
- Vérifiez l'URL dans `.env.local`

**"Erreur d'analyse Vertex AI"**
- Vérifiez votre configuration Google Cloud
- Vérifiez les quotas et permissions
- Consultez les logs du backend

**"Erreur d'upload d'image"**
- Vérifiez la taille du fichier (< 50MB)
- Vérifiez le format d'image
- Rechargez la page si nécessaire

### Tests de Fonctionnement

**Test Backend:**
```bash
curl http://localhost:3001/api/health
```

**Test d'analyse sans image:**
```bash
curl -X POST http://localhost:3001/api/test-analysis \
  -H "Content-Type: application/json" \
  -d '{"clinicalContext":"Test de fonctionnement"}'
```

### Logs et Debugging

**Backend logs:** Console du terminal backend
**Frontend logs:** Console du navigateur (F12)
**Vertex AI logs:** Google Cloud Console

## 📊 Exemples d'Utilisation

### Cas d'Usage Typiques

1. **Scanner cérébral avec AVC suspecté**
   - Upload de l'image DICOM convertie
   - Contexte: "Patient 68 ans, hémiplégie droite brutale"
   - Analyse automatique des zones hypodenses

2. **IRM avec lésions multiples**
   - Upload de plusieurs coupes
   - Vue grille pour comparaison
   - Analyse globale des patterns

3. **Radiographie thoracique**
   - Image haute résolution
   - Contexte: symptômes respiratoires
   - Détection d'anomalies pulmonaires

### Bonnes Pratiques

- **Contexte détaillé** améliore la précision
- **Images de qualité** pour de meilleurs résultats
- **Vérification croisée** avec expertise clinique
- **Sauvegarde** des rapports importants

## 🔐 Sécurité et Conformité

### Protection des Données

- **Traitement local** des images uploadées
- **Transmission sécurisée** vers Vertex AI
- **Pas de stockage permanent** des données patient

### Recommandations

- **Anonymisation** des images avant upload
- **Respect RGPD** selon votre contexte
- **Backup** des configurations importantes

---

**Support:** Consultez le README.md principal ou ouvrez une issue GitHub
