# 🐍 SmaRTC Python SDK

SDK Python pour intégrer la visioconférence SmaRTC dans vos applications backend, bots, dashboards, et projets IA.

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)](https://python.org)
[![asyncio](https://img.shields.io/badge/asyncio-Ready-green)](https://docs.python.org/3/library/asyncio.html)
[![aiohttp](https://img.shields.io/badge/aiohttp-3.8%2B-orange)](https://docs.aiohttp.org)

## ⚡ Installation

```bash
pip install aiohttp
```

## 🚀 Quick Start (3 lignes !)

### Version Async (Recommandée)

```python
import asyncio
from smartc_simple import SmaRTCSimple

async def main():
    smartc = SmaRTCSimple()
    await smartc.login('demo', 'Demo123!')
    session_id = await smartc.start_call('Mon appel Python')
    print(f"✅ Appel créé : {session_id}")
    await smartc.end_call()

asyncio.run(main())
```

### Version Synchrone (Pour scripts simples)

```python
from smartc_simple import SmaRTCSync

smartc = SmaRTCSync()
smartc.login('demo', 'Demo123!')
session_id = smartc.start_call('Mon appel')
print(f"✅ Appel créé : {session_id}")
```

## 📖 Guide Complet

### Configuration

```python
from smartc_simple import SmaRTCSimple, SmaRTCConfig

config = SmaRTCConfig(
    api_url="https://api.votre-domaine.com",
    signal_server_url="https://signal.votre-domaine.com/signalhub",
    stun_servers=["stun:stun.custom.com:3478"],
    timeout=30
)

smartc = SmaRTCSimple(config)
```

### Authentification

```python
# Inscription
await smartc.register('username', 'Password123!', role='User')

# Connexion
await smartc.login('username', 'Password123!')

# Vérifier si connecté
if smartc.is_logged_in:
    print(f"Connecté en tant que: {smartc.current_username}")

# Déconnexion
await smartc.logout()
```

### Gestion des appels

```python
# Créer et démarrer un appel
session_id = await smartc.start_call(
    name='Réunion d\'équipe',
    description='Daily standup'
)

# Rejoindre un appel existant
await smartc.join_call(session_id=123)

# Lister les appels disponibles
calls = await smartc.get_available_calls()
for call in calls:
    print(f"{call.id}: {call.name} - {call.description}")

# Détails d'un appel
details = await smartc.get_call_details(session_id)
print(f"Appel: {details.name}, Créateur: {details.creator_id}")

# Terminer l'appel
await smartc.end_call()
```

### Serveurs ICE (STUN/TURN)

```python
# Récupérer les serveurs ICE (avec fallback Google STUN)
ice_servers = await smartc.get_ice_servers()
print(ice_servers)
# [{'urls': 'stun:stun.l.google.com:19302'}, ...]
```

## 🎯 Exemples d'Usage

### 1. Bot de Conférence

```python
import asyncio
from smartc_simple import SmaRTCSimple

async def conference_bot():
    """Bot qui crée des salles de conférence automatiquement"""
    smartc = SmaRTCSimple()
    
    # Connexion
    await smartc.login('bot_conference', 'SecurePassword123!')
    
    # Créer une salle
    session_id = await smartc.start_call(
        name='Salle Auto-générée',
        description=f'Créée par bot à {datetime.now()}'
    )
    
    print(f"🤖 Salle créée: #{session_id}")
    print(f"📍 Lien: https://app.smartc.tn/join/{session_id}")
    
    # Attendre 1 heure puis fermer
    await asyncio.sleep(3600)
    await smartc.end_call()

asyncio.run(conference_bot())
```

### 2. Dashboard Monitoring

```python
import asyncio
from smartc_simple import SmaRTCSimple

async def monitor_sessions():
    """Monitore les sessions actives"""
    smartc = SmaRTCSimple()
    await smartc.login('admin', 'AdminPass123!')
    
    while True:
        calls = await smartc.get_available_calls()
        
        print(f"\n📊 Sessions actives: {len(calls)}")
        for call in calls:
            print(f"  - {call.name} (ID: {call.id})")
        
        await asyncio.sleep(10)  # Rafraîchir toutes les 10s

asyncio.run(monitor_sessions())
```

### 3. Backend API avec FastAPI

```python
from fastapi import FastAPI, HTTPException
from smartc_simple import SmaRTCSimple
from pydantic import BaseModel

app = FastAPI()
smartc = SmaRTCSimple()

class CallCreate(BaseModel):
    name: str
    description: str = None

@app.post("/calls")
async def create_call(call: CallCreate):
    """Crée un nouvel appel"""
    try:
        # Login (utiliser token persistant en prod)
        await smartc.login('api_user', 'ApiPass123!')
        
        session_id = await smartc.start_call(call.name, call.description)
        
        return {
            "success": True,
            "session_id": session_id,
            "join_url": f"https://app.smartc.tn/join/{session_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/calls")
async def list_calls():
    """Liste tous les appels"""
    calls = await smartc.get_available_calls()
    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "created_at": c.created_at
        }
        for c in calls
    ]
```

### 4. Script de Test Automatisé

```python
import asyncio
from smartc_simple import SmaRTCSimple, AuthenticationError

async def test_sdk():
    """Test automatisé du SDK"""
    smartc = SmaRTCSimple()
    
    print("🧪 Test 1: Inscription")
    try:
        await smartc.register('test_user', 'TestPass123!')
        print("✅ Inscription réussie")
    except Exception as e:
        print(f"⚠️ {e}")
    
    print("\n🧪 Test 2: Connexion")
    await smartc.login('demo', 'Demo123!')
    print(f"✅ Connecté: {smartc.current_username}")
    
    print("\n🧪 Test 3: Créer appel")
    session_id = await smartc.start_call('Test Call')
    print(f"✅ Session créée: {session_id}")
    
    print("\n🧪 Test 4: Lister appels")
    calls = await smartc.get_available_calls()
    print(f"✅ {len(calls)} appels trouvés")
    
    print("\n🧪 Test 5: Terminer appel")
    await smartc.end_call()
    print("✅ Appel terminé")
    
    print("\n🎉 Tous les tests passés!")

asyncio.run(test_sdk())
```

### 5. Integration avec Flask

```python
from flask import Flask, jsonify, request
from smartc_simple import SmaRTCSync  # Version synchrone

app = Flask(__name__)
smartc = SmaRTCSync()

@app.before_first_request
def init():
    """Initialisation au démarrage"""
    smartc.login('flask_app', 'FlaskPass123!')

@app.route('/api/calls', methods=['POST'])
def create_call():
    data = request.json
    session_id = smartc.start_call(data['name'], data.get('description'))
    
    return jsonify({
        'session_id': session_id,
        'status': 'created'
    })

@app.route('/api/calls', methods=['GET'])
def list_calls():
    calls = smartc.get_available_calls()
    return jsonify([
        {'id': c.id, 'name': c.name}
        for c in calls
    ])

if __name__ == '__main__':
    app.run(debug=True)
```

## ❌ Gestion des Erreurs

```python
from smartc_simple import (
    SmaRTCError,
    AuthenticationError,
    SessionNotFoundError,
    NetworkError
)

try:
    await smartc.login('user', 'wrongpass')
except AuthenticationError:
    print("❌ Identifiants incorrects")
except NetworkError:
    print("❌ Problème de connexion au serveur")
except SmaRTCError as e:
    print(f"❌ Erreur: {e.message}")
    if e.original:
        print(f"   Cause: {e.original}")
```

**Messages d'erreur disponibles :**

| Exception | Message | Cause |
|-----------|---------|-------|
| `AuthenticationError` | "Identifiants incorrects" | Login/password invalide |
| `SessionNotFoundError` | "Cet appel n'existe pas" | Session ID invalide |
| `NetworkError` | "Problème de connexion" | Serveur inaccessible |
| `SmaRTCError` | "Ce nom d'utilisateur existe déjà" | Username pris |

## 🔧 Context Manager (Recommandé)

```python
async with SmaRTCSimple() as smartc:
    await smartc.login('demo', 'Demo123!')
    session_id = await smartc.start_call('Mon appel')
    # Les ressources sont automatiquement libérées
```

## 📦 API Reference

### SmaRTCSimple

| Méthode | Description | Retour |
|---------|-------------|--------|
| `login(username, password)` | Se connecter | `bool` |
| `register(username, password, role)` | S'inscrire | `bool` |
| `logout()` | Se déconnecter | `None` |
| `start_call(name, description)` | Créer un appel | `int` (session_id) |
| `join_call(session_id)` | Rejoindre un appel | `None` |
| `end_call()` | Terminer l'appel | `None` |
| `get_available_calls()` | Lister les appels | `List[Session]` |
| `get_call_details(session_id)` | Détails d'un appel | `Session` |
| `get_ice_servers()` | Serveurs STUN/TURN | `List[Dict]` |

### Propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `is_logged_in` | `bool` | Utilisateur connecté ? |
| `current_username` | `str` | Username actuel |

## 🐛 Troubleshooting

### Erreur: "ModuleNotFoundError: No module named 'aiohttp'"

```bash
pip install aiohttp
```

### Erreur: "Problème de connexion"

Vérifiez que l'API SmaRTC est accessible :

```bash
curl http://localhost:8080/api/health
```

### Utiliser avec Jupyter Notebook

```python
# Dans Jupyter, utiliser nest_asyncio pour éviter les conflits
import nest_asyncio
nest_asyncio.apply()

import asyncio
from smartc_simple import SmaRTCSimple

smartc = SmaRTCSimple()
await smartc.login('demo', 'Demo123!')
```

### Version synchrone ne fonctionne pas

La version synchrone (`SmaRTCSync`) peut avoir des conflits avec d'autres event loops. Préférez la version async si possible.

## 📚 Ressources

- [Documentation complète](https://docs.smartc.tn)
- [API Reference](https://docs.smartc.tn/api/python)
- [Exemples](./examples/)
- [GitHub](https://github.com/DeLTa-X-Tunisia/SmaRTC)

## 📄 Licence

MIT License - voir [LICENSE](../../LICENSE)

---

**Made with ❤️ by DeLTa-X Tunisia 🇹🇳**
