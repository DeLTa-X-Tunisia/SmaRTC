# SmaRTC TypeScript Example

Application de chat en temps réel utilisant le SDK SmaRTC avec TypeScript.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ installé
- Services SmaRTC Docker en cours d'exécution

### Installation

```bash
# Installer les dépendances
npm install

# Compiler TypeScript
npm run build

# Lancer le serveur
npm start
```

Ou utilisez le **Luncher_TypeScript** pour une interface graphique.

### Accès
- **Application** : http://localhost:3500
- **API SmaRTC** : http://localhost:8080
- **SignalR Hub** : http://localhost:5001/signalhub

## 📁 Structure

```
Exemple_TypeScript/
├── src/
│   ├── server.ts          # Serveur Express
│   └── sdk/
│       └── smartc-client.ts   # SDK TypeScript
├── public/
│   └── index.html         # Interface de chat
├── package.json
└── tsconfig.json
```

## 🔧 Configuration

Modifiez les URLs dans `public/index.html` si nécessaire :

```javascript
const API_URL = 'http://localhost:8080';
const SIGNAL_HUB_URL = 'http://localhost:5001/signalhub';
```

## ✨ Fonctionnalités

- ✅ Inscription/Connexion automatique
- ✅ Chat temps réel multi-clients
- ✅ Notifications d'arrivée/départ des utilisateurs
- ✅ Interface moderne et responsive
- ✅ SignalR avec reconnexion automatique
