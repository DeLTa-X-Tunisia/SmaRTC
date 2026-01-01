# SmaRTC TypeScript Examples

Ce dossier contient les exemples TypeScript pour SmaRTC.

## 📁 Structure

```
TypeScript/
├── Exemple_TypeScript/     # Application web de chat
│   ├── src/                # Code source TypeScript
│   ├── public/             # Interface HTML
│   └── package.json        # Dépendances npm
│
└── Luncher_TypeScript/     # Launcher WPF C#
    └── *.cs                # Application de lancement
```

## 🚀 Démarrage rapide

### Option 1: Avec le Launcher

```bash
cd Luncher_TypeScript
dotnet run
```

### Option 2: Manuellement

```bash
cd Exemple_TypeScript
npm install
npm run build
npm start
```

Puis ouvrez http://localhost:3500

## ✅ Fonctionnalités testées

- ✅ Inscription/Connexion API
- ✅ Connexion SignalR
- ✅ Rejoindre une room
- ✅ Envoi de messages
- ✅ Réception en temps réel
- ✅ Notifications utilisateurs
