# 🧪 Guide de Test Manuel - SmaRTC Flutter App

**Date**: 18 Novembre 2025  
**Application**: En cours d'exécution sur http://localhost:8888  
**Backend**: Services Docker actifs

---

## ✅ État Actuel

L'application Flutter est maintenant **accessible et fonctionnelle** !

- ✅ Backend Docker opérationnel (tous les services actifs)
- ✅ Application compilée en mode release
- ✅ Serveur HTTP actif sur port 8888
- ✅ SDK initialisé avec succès
- ✅ Interface utilisateur affichée

---

## 🔍 Tests à Effectuer Manuellement

### 📱 Interface Visible

Dans votre navigateur à http://localhost:8888, vous devriez voir :

- **Page de connexion** avec champs username/password
- **Titre**: "SmaRTC Example"
- **Boutons**: Login, Register

---

### ✅ Test 1: Créer un Compte

**Étapes**:
1. Ouvrir http://localhost:8888 dans votre navigateur
2. Cliquer sur l'onglet **"Inscription"** (si disponible) ou utiliser le formulaire
3. Entrer:
   - Username: `testuser`
   - Password: `Test123!`
4. Cliquer sur **"S'inscrire"** ou **"Register"**

**Résultat attendu**:
- ✅ Message de succès
- ✅ Redirection vers la liste des sessions
- ✅ Token JWT stocké

**Vérification dans la console navigateur** (F12):
```
🔐 [HOME] Checking authentication...
✅ Login successful
📋 [HOME] Loading sessions...
```

---

### ✅ Test 2: Se Connecter

**Étapes**:
1. Si déjà inscrit, utiliser le formulaire de connexion
2. Entrer:
   - Username: `testuser`
   - Password: `Test123!`
3. Cliquer sur **"Se connecter"** ou **"Login"**

**Résultat attendu**:
- ✅ Connexion réussie
- ✅ Liste des sessions affichée
- ✅ Boutons "Logout" et "Refresh" visibles

**Logs attendus**:
```
🔐 [HOME] Session restored: true
📋 [HOME] Got X sessions
```

---

### ✅ Test 3: Créer une Session

**Étapes**:
1. Une fois connecté, chercher le bouton **"+"** ou **"Créer une session"**
2. Entrer:
   - Nom: `test-room`
   - Description: `Salle de test WebRTC`
3. Cliquer sur **"Créer"**

**Résultat attendu**:
- ✅ Session créée
- ✅ Apparaît dans la liste
- ✅ Possibilité de la rejoindre

**Vérification API**:
```powershell
# Dans un autre terminal PowerShell
curl http://localhost:8080/api/session -H "Authorization: Bearer YOUR_TOKEN"
```

---

### ✅ Test 4: Rejoindre une Session (Connexion SignalR)

**Étapes**:
1. Cliquer sur une session dans la liste
2. Ou cliquer sur **"Rejoindre"** à côté d'une session
3. Autoriser l'accès à la caméra et au microphone quand demandé

**Résultat attendu**:
- ✅ Permissions caméra/micro accordées
- ✅ Prévisualisation vidéo locale visible
- ✅ Connexion SignalR établie
- ✅ Écran d'appel affiché

**Logs attendus dans la console (F12)**:
```javascript
🔌 SignalR connecting...
✅ SignalR connected successfully
📹 Local stream started
🎥 Joining session: test-room
```

**Vérification dans les logs backend**:
```powershell
docker logs deploy-signal-server-1 -f
# Devrait afficher:
# New connection: [connection-id]
# User joined room: test-room
```

---

### ✅ Test 5: Flux Vidéo/Audio (WebRTC)

**Étapes**:
1. Ouvrir un **deuxième onglet** ou une **fenêtre de navigation privée**
2. Se connecter avec un autre utilisateur (ou le même)
3. Rejoindre la **même session** (`test-room`)

**Résultat attendu**:
- ✅ Les deux utilisateurs se voient mutuellement
- ✅ Grille de participants affiche 2 vidéos
- ✅ Audio bidirectionnel fonctionnel
- ✅ Vidéo en temps réel sans latence significative

**Logs attendus**:
```javascript
👤 New user arrived: user2
🤝 Creating peer connection for: user2
📤 Sending offer to: user2
📥 Received answer from: user2
🧊 ICE candidate received
✅ Peer connection established
```

---

### ✅ Test 6: Contrôles d'Appel

**Boutons à tester**:

#### 🎤 Bouton Microphone (Mute/Unmute)
- Cliquer sur l'icône micro
- ✅ Micro désactivé (icône barrée)
- Cliquer à nouveau
- ✅ Micro réactivé

#### 📹 Bouton Caméra (On/Off)
- Cliquer sur l'icône caméra
- ✅ Vidéo désactivée (écran noir)
- Cliquer à nouveau
- ✅ Vidéo réactivée

#### 🔄 Bouton Switch Camera (si mobile)
- Cliquer sur l'icône switch
- ✅ Bascule entre caméra avant/arrière

#### ❌ Bouton Raccrocher
- Cliquer sur l'icône raccrocher (rouge)
- ✅ Appel terminé
- ✅ Retour à la liste des sessions
- ✅ Connexions fermées proprement

**Logs attendus**:
```javascript
🔇 Microphone muted
🔊 Microphone unmuted
📹 Camera off
📹 Camera on
🔌 Disconnecting from session...
✅ Disconnected cleanly
```

---

### ✅ Test 7: Rôles et Permissions

**À vérifier**:
- Badges de rôles affichés sur les participants
- Couleurs différentes selon le rôle:
  - 🔴 **Admin**: Badge rouge
  - 🟡 **Modérateur**: Badge jaune/orange
  - 🟢 **Utilisateur**: Badge vert/bleu

**Création d'utilisateurs avec rôles**:
```powershell
# Créer un admin via l'API
curl http://localhost:8080/api/auth/register `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"Admin123!","role":"admin"}'
```

---

### ✅ Test 8: Déconnexion Propre

**Scénarios à tester**:

#### Scénario 1: Fermer l'onglet pendant un appel
- Rejoindre une session
- Fermer l'onglet brusquement
- Vérifier dans l'autre onglet que l'utilisateur disparaît

#### Scénario 2: Déconnexion normale
- Cliquer sur le bouton "Logout"
- ✅ Retour à l'écran de connexion
- ✅ Token supprimé
- ✅ Sessions nettoyées

#### Scénario 3: Perte de connexion réseau
- Couper le Wi-Fi pendant un appel
- ✅ Message d'erreur de connexion
- ✅ Tentative de reconnexion automatique (si implémenté)

**Vérification backend**:
```powershell
docker logs deploy-signal-server-1 --tail 20
# Devrait afficher:
# Connection closed: [connection-id]
# User left room: test-room
```

---

## 🐛 Problèmes Courants et Solutions

### Problème 1: "Failed to get user media"

**Cause**: Permissions caméra/micro refusées

**Solution**:
1. Cliquer sur l'icône de cadenas dans la barre d'adresse
2. Autoriser caméra et microphone
3. Recharger la page (F5)

### Problème 2: "SignalR connection failed"

**Cause**: Backend SignalR non accessible

**Vérification**:
```powershell
curl http://localhost:5001/signalhub
# Devrait retourner une page HTML ou 200 OK
```

**Solution**:
```powershell
# Redémarrer le service
docker-compose restart signal-server
```

### Problème 3: "Failed to load sessions"

**Cause**: API REST non accessible ou non authentifié

**Vérification**:
```powershell
curl http://localhost:8080/api/session
# Devrait retourner 401 Unauthorized (normal sans token)
```

**Solution**:
1. Vérifier que l'API tourne: `docker ps | findstr api`
2. Se reconnecter si le token a expiré

### Problème 4: Pas de vidéo de l'autre participant

**Cause**: ICE candidates ne passent pas (firewall/NAT)

**Vérification dans la console**:
```javascript
// Rechercher les erreurs ICE
failed
gathering
```

**Solution**:
1. Vérifier que STUN/TURN est actif:
```powershell
docker ps | findstr coturn
```

2. Tester sur le même réseau local d'abord

### Problème 5: Audio fonctionne mais pas la vidéo

**Cause**: Bande passante insuffisante ou codec non supporté

**Solution**:
1. Vérifier la console pour les erreurs de codec
2. Essayer de baisser la résolution (si option disponible)
3. Tester avec 2 utilisateurs seulement d'abord

---

## 📊 Checklist de Validation Complète

### Phase 1: Configuration
- [x] Backend Docker démarré
- [x] Application Flutter compilée
- [x] Serveur HTTP actif sur 8888
- [x] Application accessible dans le navigateur

### Phase 2: Authentification
- [ ] Inscription d'un nouveau compte
- [ ] Connexion avec username/password
- [ ] Token JWT stocké correctement
- [ ] Session restaurée au rechargement

### Phase 3: Gestion des Sessions
- [ ] Liste des sessions affichée
- [ ] Création d'une nouvelle session
- [ ] Session apparaît dans la liste
- [ ] Possibilité de rejoindre

### Phase 4: WebRTC et Média
- [ ] Permissions caméra/micro accordées
- [ ] Prévisualisation locale visible
- [ ] Connexion SignalR établie
- [ ] Deuxième utilisateur peut rejoindre
- [ ] Vidéo bidirectionnelle fonctionnelle
- [ ] Audio bidirectionnel fonctionnel

### Phase 5: UI et Contrôles
- [ ] Bouton Mute/Unmute fonctionne
- [ ] Bouton Camera On/Off fonctionne
- [ ] Bouton Switch Camera fonctionne (mobile)
- [ ] Bouton Raccrocher fonctionne
- [ ] Grille de participants responsive
- [ ] Labels des utilisateurs affichés

### Phase 6: Rôles et Permissions
- [ ] Badges de rôles visibles
- [ ] Couleurs différentes par rôle
- [ ] Admin peut gérer la session
- [ ] Modérateur a permissions appropriées

### Phase 7: Robustesse
- [ ] Déconnexion propre
- [ ] Gestion des erreurs affichée
- [ ] Reconnexion automatique (si implémenté)
- [ ] Pas de memory leaks
- [ ] Performance stable à 3+ utilisateurs

---

## 📝 Rapport de Bugs

Si vous trouvez des bugs pendant vos tests, notez:

1. **Étape qui a échoué**: Ex: "Test 4 - Connexion SignalR"
2. **Comportement attendu**: Ex: "Connexion devrait s'établir"
3. **Comportement observé**: Ex: "Erreur 'Connection refused'"
4. **Logs de la console**: Copier les 10 dernières lignes
5. **Logs du serveur**: `docker logs deploy-signal-server-1 --tail 20`
6. **Screenshot**: Si problème visuel

---

## 🎯 Prochaines Étapes Après Validation

Une fois tous les tests passés:

1. **Documenter les résultats** dans `TEST_REPORT.md`
2. **Mettre à jour** `VALIDATION.md` avec les résultats
3. **Créer des tests automatisés** pour les fonctionnalités validées
4. **Optimiser les performances** si nécessaire
5. **Préparer la v1.0.0** pour la release

---

## 🔧 Commandes Utiles

### Voir les logs en temps réel

```powershell
# Logs de l'API
docker logs deploy-api-1 -f

# Logs SignalR
docker logs deploy-signal-server-1 -f

# Logs PostgreSQL
docker logs deploy-postgres-1 -f

# Tous les logs
docker-compose logs -f
```

### Redémarrer un service

```powershell
docker-compose restart api
docker-compose restart signal-server
```

### Nettoyer et redémarrer

```powershell
docker-compose down
docker-compose up -d
```

### Reconstruire l'app Flutter

```powershell
cd sdk/flutter/example
flutter clean
flutter pub get
flutter build web
.\serve.ps1
```

---

<div align="center">

**Bon test ! 🚀**

*L'application est maintenant prête à être testée fonctionnellement.*

</div>
