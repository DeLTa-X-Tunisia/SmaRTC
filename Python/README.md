# SmaRTC Python Examples

Ce dossier contient les exemples Python pour SmaRTC.

## 📁 Structure

```
Python/
├── Exemple_Python/         # Application console de chat
│   ├── main.py             # Point d'entrée
│   ├── sdk/                # SDK Python
│   └── requirements.txt    # Dépendances
│
└── Luncher_Python/         # Launcher WPF C#
    └── *.cs                # Application de lancement
```

## 🚀 Démarrage rapide

### Option 1: Avec le Launcher

```bash
cd Luncher_Python
dotnet run
```

### Option 2: Manuellement

```bash
cd Exemple_Python
pip install -r requirements.txt
python main.py
```

## ✅ Fonctionnalités

- ✅ Inscription/Connexion API
- ✅ Connexion SignalR temps réel
- ✅ Chat multi-clients dans une room
- ✅ Interface console colorée
- ✅ Notifications utilisateurs
