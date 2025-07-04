# IRMGemma - Interface d'Analyse Médicale avec MedGemma

Application complète d'analyse d'imagerie médicale utilisant **MedGemma** sur **Vertex AI** de Google Cloud Platform.

## 🏗️ Architecture

```
IRMGemma/
├── Frontend/          # Interface utilisateur Next.js + React
├── Backend/           # API Node.js + Express + Vertex AI
├── setup.sh          # Script d'installation Unix/Linux/macOS
├── setup.bat         # Script d'installation Windows
└── README.md         # Ce fichier
```

## ✨ Fonctionnalités

- **Upload d'images médicales** (JPG, PNG, DICOM)
- **Analyse par IA** avec MedGemma via Vertex AI
- **Interface intuitive** avec visualisation des résultats
- **Chat conversationnel** pour affiner l'analyse
- **Rapports détaillés** exportables

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Google Cloud Platform
- Clé de service Vertex AI

### Installation automatique

**Windows:**
```cmd
setup.bat
```

**Unix/Linux/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

### Installation manuelle

1. **Cloner le projet**
   ```bash
   git clone <votre-repo>
   cd IRMGemma
   ```

2. **Backend**
   ```bash
   cd Backend
   npm install
   cp .env.example .env
   # Configurer les variables dans .env
   npm run dev
   ```

3. **Frontend**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

## ⚙️ Configuration

### Backend (.env)
```bash
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/service-account-key.json
PORT=3001
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧠 Configuration Vertex AI

1. **Créer un projet Google Cloud**
2. **Activer l'API Vertex AI**
3. **Créer une clé de service account**
4. **Télécharger le fichier JSON de la clé**
5. **Configurer les variables d'environnement**

Consultez le [guide Vertex AI](https://cloud.google.com/vertex-ai/docs/start/introduction-unified-platform) pour plus de détails.

## 📊 Utilisation

1. **Démarrer les serveurs** (Backend sur :3001, Frontend sur :3000)
2. **Ouvrir** http://localhost:3000
3. **Uploader** vos images médicales
4. **Ajouter** le contexte clinique (optionnel)
5. **Cliquer** sur "Analyser"
6. **Consulter** les résultats et le rapport détaillé

## 🛠️ Développement

### Structure Frontend
- **Next.js 15** avec App Router
- **React 19** avec TypeScript
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants

### Structure Backend  
- **Node.js** avec Express
- **Google Cloud AI Platform** pour Vertex AI
- **Multer** pour l'upload de fichiers
- **CORS** pour les requêtes cross-origin

### API Endpoints

- `GET /api/health` - Vérification du serveur
- `POST /api/analyze` - Analyse d'images avec MedGemma
- `POST /api/test-analysis` - Test sans images

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev     # Démarrage en mode développement
npm start       # Démarrage en production
```

### Frontend
```bash
npm run dev     # Démarrage en mode développement
npm run build   # Build de production
npm start       # Démarrage du build
npm run lint    # Vérification du code
```

## 📋 Formats Supportés

- **Images**: JPG, PNG, GIF, BMP
- **Taille max**: 50MB par image
- **Multiple**: Oui, analyse de plusieurs images simultanément

## 🐛 Dépannage

### Erreur de connexion Backend
- Vérifier que le backend est démarré sur le port 3001
- Vérifier les variables d'environnement
- Consulter les logs du serveur

### Erreur Vertex AI
- Vérifier les credentials Google Cloud
- Vérifier les quotas et limitations
- Vérifier la configuration du projet

### Erreur d'upload
- Vérifier la taille des fichiers (< 50MB)
- Vérifier le format des images
- Vérifier les permissions de fichiers

## 📝 Logs

- **Backend**: Console du serveur Node.js
- **Frontend**: Console du navigateur et terminal Next.js
- **Vertex AI**: Logs Google Cloud Platform

## 🔐 Sécurité

- Variables d'environnement pour les secrets
- CORS configuré pour les domaines autorisés
- Validation des fichiers uploadés
- Limitation de taille des requêtes

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation Vertex AI
- Vérifier les logs d'erreur

---

**Développé avec ❤️ pour l'analyse d'imagerie médicale avec l'IA**
