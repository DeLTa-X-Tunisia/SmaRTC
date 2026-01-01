# 🌐 SmaRTC JavaScript SDK

SDK JavaScript/TypeScript pour intégrer la visioconférence SmaRTC dans vos applications web.

## ⚡ Installation

### Via npm (recommandé)

```bash
npm install @smartc/sdk
# ou
yarn add @smartc/sdk
```

### Via CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@smartc/sdk@latest/dist/smartc.min.js"></script>
```

## 🚀 Quick Start (5 minutes)

### 1. Initialiser le SDK

```javascript
import { SmaRTCClient } from '@smartc/sdk';

const client = new SmaRTCClient({
  apiUrl: 'https://api.votre-domaine.com',
  signalServerUrl: 'https://signal.votre-domaine.com/signalhub',
  stunServers: ['stun:stun.l.google.com:19302'],
});
```

### 2. Se connecter

```javascript
try {
  await client.auth.login('user@example.com', 'motdepasse');
  console.log('✅ Connecté avec succès');
} catch (error) {
  console.error('❌ Erreur de connexion:', error);
}
```

### 3. Créer et rejoindre une session

```javascript
// Créer une session
const session = await client.sessions.create({
  name: 'Réunion d\'équipe',
  description: 'Daily standup',
});

// Rejoindre la session
await client.webrtc.join(session.id, {
  audio: true,
  video: true,
  onLocalStream: (stream) => {
    document.getElementById('localVideo').srcObject = stream;
  },
  onRemoteStream: (userId, stream) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    document.getElementById('remoteVideos').appendChild(video);
  },
});
```

## 📱 Exemple complet (React)

```jsx
import React, { useEffect, useState } from 'react';
import { SmaRTCClient } from '@smartc/sdk';

function VideoCall() {
  const [client] = useState(() => new SmaRTCClient({
    apiUrl: 'http://localhost:8080',
    signalServerUrl: 'http://localhost:5001/signalhub',
  }));
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  useEffect(() => {
    // Connexion automatique
    async function init() {
      await client.auth.login('demo', 'Demo123!');
      
      // Créer et rejoindre une session
      const session = await client.sessions.create({
        name: 'Quick Start Session',
      });

      await client.webrtc.join(session.id, {
        audio: true,
        video: true,
        onLocalStream: setLocalStream,
        onRemoteStream: (userId, stream) => {
          setRemoteStreams(prev => ({ ...prev, [userId]: stream }));
        },
        onUserLeft: (userId) => {
          setRemoteStreams(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
        },
      });
    }

    init();

    return () => {
      client.webrtc.leave();
    };
  }, [client]);

  return (
    <div>
      <h1>SmaRTC Video Call</h1>
      
      {/* Vidéo locale */}
      <div>
        <h3>Vous</h3>
        <video
          ref={(el) => el && (el.srcObject = localStream)}
          autoPlay
          muted
          style={{ width: '320px', height: '240px' }}
        />
      </div>

      {/* Vidéos distantes */}
      <div>
        <h3>Participants</h3>
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <video
            key={userId}
            ref={(el) => el && (el.srcObject = stream)}
            autoPlay
            style={{ width: '320px', height: '240px' }}
          />
        ))}
      </div>

      {/* Contrôles */}
      <div>
        <button onClick={() => client.webrtc.toggleMute()}>
          🎤 Mute/Unmute
        </button>
        <button onClick={() => client.webrtc.toggleCamera()}>
          📹 Camera On/Off
        </button>
        <button onClick={() => client.webrtc.leave()}>
          📞 Raccrocher
        </button>
      </div>
    </div>
  );
}

export default VideoCall;
```

## 🎨 Avec Vue 3

```vue
<template>
  <div class="video-call">
    <h1>SmaRTC Video Call</h1>
    
    <!-- Vidéo locale -->
    <video ref="localVideo" autoplay muted></video>
    
    <!-- Vidéos distantes -->
    <div v-for="(stream, userId) in remoteStreams" :key="userId">
      <video :ref="el => setRemoteVideo(userId, el)" autoplay></video>
    </div>

    <!-- Contrôles -->
    <button @click="toggleMute">🎤 Mute</button>
    <button @click="toggleCamera">📹 Camera</button>
    <button @click="leave">📞 Leave</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { SmaRTCClient } from '@smartc/sdk';

const localVideo = ref(null);
const remoteStreams = ref({});

const client = new SmaRTCClient({
  apiUrl: 'http://localhost:8080',
  signalServerUrl: 'http://localhost:5001/signalhub',
});

onMounted(async () => {
  await client.auth.login('demo', 'Demo123!');
  
  const session = await client.sessions.create({
    name: 'Vue Session',
  });

  await client.webrtc.join(session.id, {
    audio: true,
    video: true,
    onLocalStream: (stream) => {
      localVideo.value.srcObject = stream;
    },
    onRemoteStream: (userId, stream) => {
      remoteStreams.value[userId] = stream;
    },
  });
});

onUnmounted(() => {
  client.webrtc.leave();
});

function setRemoteVideo(userId, el) {
  if (el && remoteStreams.value[userId]) {
    el.srcObject = remoteStreams.value[userId];
  }
}

const toggleMute = () => client.webrtc.toggleMute();
const toggleCamera = () => client.webrtc.toggleCamera();
const leave = () => client.webrtc.leave();
</script>
```

## 📦 API Reference

### Client

```javascript
const client = new SmaRTCClient(config);
```

**Config:**
- `apiUrl` (string) - URL de l'API backend
- `signalServerUrl` (string) - URL du serveur SignalR
- `stunServers` (string[]) - Liste des serveurs STUN
- `turnServers` (object[]) - Liste des serveurs TURN (optionnel)
- `autoReconnect` (boolean) - Reconnexion automatique (défaut: true)

### Auth

```javascript
// Login
await client.auth.login(username, password);

// Register
await client.auth.register(username, password, role);

// Logout
await client.auth.logout();

// Check if authenticated
const isAuth = client.auth.isAuthenticated();

// Get current user
const user = client.auth.getCurrentUser();
```

### Sessions

```javascript
// Get all sessions
const sessions = await client.sessions.getAll();

// Get session by ID
const session = await client.sessions.getById(sessionId);

// Create session
const session = await client.sessions.create({
  name: 'Session name',
  description: 'Optional description',
});

// Delete session
await client.sessions.delete(sessionId);
```

### WebRTC

```javascript
// Join session
await client.webrtc.join(sessionId, {
  audio: true,
  video: true,
  onLocalStream: (stream) => {},
  onRemoteStream: (userId, stream) => {},
  onUserJoined: (userId) => {},
  onUserLeft: (userId) => {},
  onError: (error) => {},
});

// Leave session
await client.webrtc.leave();

// Toggle microphone
await client.webrtc.toggleMute();

// Toggle camera
await client.webrtc.toggleCamera();

// Switch camera (mobile)
await client.webrtc.switchCamera();

// Get stats
const stats = await client.webrtc.getStats();
```

## 🔧 Configuration avancée

### Avec TURN servers

```javascript
const client = new SmaRTCClient({
  apiUrl: 'https://api.example.com',
  signalServerUrl: 'https://signal.example.com/signalhub',
  stunServers: ['stun:stun.l.google.com:19302'],
  turnServers: [
    {
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'password',
    },
  ],
});
```

### Gestion des erreurs

```javascript
try {
  await client.auth.login('user', 'password');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Identifiants invalides');
  } else if (error instanceof NetworkError) {
    console.error('Problème de connexion');
  } else {
    console.error('Erreur inconnue:', error);
  }
}
```

### Events

```javascript
// Listen to connection events
client.on('connected', () => console.log('Connecté'));
client.on('disconnected', () => console.log('Déconnecté'));
client.on('reconnecting', () => console.log('Reconnexion...'));

// Listen to session events
client.on('sessionCreated', (session) => {});
client.on('sessionUpdated', (session) => {});
client.on('sessionDeleted', (sessionId) => {});

// Listen to participant events
client.on('participantJoined', (userId, sessionId) => {});
client.on('participantLeft', (userId, sessionId) => {});
```

## 🐛 Troubleshooting

### Problème de caméra/micro

```javascript
// Vérifier les permissions
const permissions = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
});

console.log('Permissions OK:', permissions);
```

### CORS issues

Assurez-vous que votre serveur autorise les requêtes CORS :

```javascript
// Backend (Express.js)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

### Problèmes WebRTC

```javascript
// Activer les logs détaillés
const client = new SmaRTCClient({
  apiUrl: '...',
  signalServerUrl: '...',
  debug: true, // Active les logs
});
```

## 📚 Ressources

- [Documentation complète](https://docs.smartc.tn)
- [Exemples](./examples/)
- [API Reference](https://docs.smartc.tn/api)
- [GitHub Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues)

## 📄 Licence

MIT License - voir [LICENSE](../../LICENSE)

---

**Made with ❤️ by DeLTa-X Tunisia**
