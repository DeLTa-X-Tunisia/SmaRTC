# SmaRTC Python Example

Application de chat en temps réel utilisant le SDK SmaRTC avec Python.

## 🚀 Démarrage rapide

### Prérequis
- Python 3.10+ installé
- Services SmaRTC Docker en cours d'exécution

### Installation

```bash
# Créer un environnement virtuel (recommandé)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Installer les dépendances
pip install -r requirements.txt

# Lancer l'application
python main.py
```

Ou utilisez le **Luncher_Python** pour une interface graphique.

## 📁 Structure

```
Exemple_Python/
├── main.py              # Application principale
├── sdk/
│   └── smartc_client.py # SDK Python avec SignalR
├── requirements.txt     # Dépendances Python
└── README.md
```

## ✨ Fonctionnalités

- ✅ Inscription/Connexion API
- ✅ Connexion SignalR temps réel
- ✅ Chat multi-clients dans une room
- ✅ Notifications d'arrivée/départ
- ✅ Interface console colorée
