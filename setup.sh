#!/bin/bash

echo "🚀 Installation et démarrage de MedGemma IRMGemma"
echo "=================================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "Frontend" ] || [ ! -d "Backend" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet IRMGemma"
    exit 1
fi

# Installation des dépendances Backend
echo "📦 Installation des dépendances Backend..."
cd Backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances Backend"
    exit 1
fi

# Installation des dépendances Frontend
echo "📦 Installation des dépendances Frontend..."
cd ../Frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances Frontend"
    exit 1
fi

cd ..

echo "✅ Installation terminée!"
echo ""
echo "📋 Instructions pour démarrer l'application:"
echo "1. Configurez vos variables d'environnement dans Backend/.env"
echo "2. Ouvrez 2 terminaux:"
echo "   Terminal 1 (Backend): cd Backend && npm run dev"
echo "   Terminal 2 (Frontend): cd Frontend && npm run dev"
echo ""
echo "🌐 L'application sera accessible sur:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo ""
echo "📚 Consultez les README.md pour plus d'informations."
