# 📘 SmaRTC TypeScript SDK

SDK TypeScript avec typage complet pour intégrer SmaRTC dans vos applications web modernes (React, Angular, Vue, Node.js).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Type Safe](https://img.shields.io/badge/Type-Safe-green)](https://www.typescriptlang.org/)
[![Tree Shakeable](https://img.shields.io/badge/Tree-Shakeable-orange)](https://webpack.js.org/guides/tree-shaking/)

## ⚡ Installation

```bash
npm install @smartc/sdk
# ou
yarn add @smartc/sdk
# ou
pnpm add @smartc/sdk
```

## 🚀 Quick Start (3 lignes !)

```typescript
import { SmaRTCSimple } from '@smartc/sdk';

const smartc = new SmaRTCSimple();
await smartc.login('demo', 'Demo123!');
await smartc.startCall('Mon appel TypeScript');
```

## 📖 Guide Complet

### Configuration

```typescript
import { SmaRTCSimple, SmaRTCConfig } from '@smartc/sdk';

const config: SmaRTCConfig = {
  apiUrl: 'https://api.votre-domaine.com',
  signalServerUrl: 'https://signal.votre-domaine.com/signalhub',
  stunServers: ['stun:stun.custom.com:3478'],
  turnServers: [
    {
      urls: 'turn:turn.custom.com:3478',
      username: 'user',
      credential: 'pass',
    },
  ],
  timeout: 30000,
};

const smartc = new SmaRTCSimple(config);
```

### Authentification

```typescript
// Inscription
await smartc.register('username', 'Password123!', 'User');

// Connexion
await smartc.login('username', 'Password123!');

// Vérifier si connecté
if (smartc.isLoggedIn) {
  console.log(`Connecté: ${smartc.currentUsername}`);
}

// Déconnexion
await smartc.logout();
```

### Gestion des appels

```typescript
// Créer et démarrer un appel
const sessionId = await smartc.startCall('Réunion d\'équipe', 'Daily standup');

// Rejoindre un appel existant
await smartc.joinCall(123);

// Lister les appels disponibles
const calls = await smartc.getAvailableCalls();
calls.forEach(call => {
  console.log(`${call.id}: ${call.name} - ${call.description}`);
});

// Détails d'un appel
const details = await smartc.getCallDetails(sessionId);
console.log(`Appel: ${details.name}, Créateur: ${details.creatorId}`);

// Terminer l'appel
await smartc.endCall();
```

## 🎯 Exemples d'Usage

### 1. React avec Hooks

```tsx
import React, { useState, useEffect } from 'react';
import { SmaRTCSimple, Session } from '@smartc/sdk';

const smartc = new SmaRTCSimple();

export function VideoCallApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [calls, setCalls] = useState<Session[]>([]);

  useEffect(() => {
    loadCalls();
  }, []);

  async function loadCalls() {
    try {
      const availableCalls = await smartc.getAvailableCalls();
      setCalls(availableCalls);
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  }

  async function handleLogin() {
    try {
      await smartc.login('demo', 'Demo123!');
      setIsLoggedIn(true);
    } catch (error) {
      alert('Erreur de connexion');
    }
  }

  async function handleStartCall() {
    try {
      const id = await smartc.startCall('Nouvel appel React');
      setSessionId(id);
    } catch (error) {
      alert('Erreur création appel');
    }
  }

  async function handleEndCall() {
    await smartc.endCall();
    setSessionId(null);
  }

  return (
    <div>
      {!isLoggedIn ? (
        <button onClick={handleLogin}>Se connecter</button>
      ) : (
        <>
          {!sessionId ? (
            <>
              <button onClick={handleStartCall}>Démarrer un appel</button>
              <h3>Appels disponibles:</h3>
              <ul>
                {calls.map(call => (
                  <li key={call.id}>
                    {call.name}
                    <button onClick={() => smartc.joinCall(call.id)}>
                      Rejoindre
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2>En appel #{sessionId}</h2>
              <button onClick={handleEndCall}>Terminer</button>
            </>
          )}
        </>
      )}
    </div>
  );
}
```

### 2. Vue 3 Composition API

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { SmaRTCSimple, Session } from '@smartc/sdk';

const smartc = new SmaRTCSimple();
const isLoggedIn = ref(false);
const sessionId = ref<number | null>(null);
const calls = ref<Session[]>([]);

onMounted(async () => {
  await loadCalls();
});

async function loadCalls() {
  try {
    calls.value = await smartc.getAvailableCalls();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function login() {
  try {
    await smartc.login('demo', 'Demo123!');
    isLoggedIn.value = true;
  } catch (error) {
    alert('Erreur de connexion');
  }
}

async function startCall() {
  try {
    sessionId.value = await smartc.startCall('Appel Vue 3');
  } catch (error) {
    alert('Erreur création appel');
  }
}

async function endCall() {
  await smartc.endCall();
  sessionId.value = null;
}
</script>

<template>
  <div>
    <button v-if="!isLoggedIn" @click="login">
      Se connecter
    </button>
    
    <div v-else>
      <button v-if="!sessionId" @click="startCall">
        Démarrer un appel
      </button>
      
      <div v-else>
        <h2>En appel #{{ sessionId }}</h2>
        <button @click="endCall">Terminer</button>
      </div>
      
      <h3>Appels disponibles:</h3>
      <ul>
        <li v-for="call in calls" :key="call.id">
          {{ call.name }}
          <button @click="smartc.joinCall(call.id)">Rejoindre</button>
        </li>
      </ul>
    </div>
  </div>
</template>
```

### 3. Angular Service

```typescript
import { Injectable } from '@angular/core';
import { SmaRTCSimple, Session } from '@smartc/sdk';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SmaRTCService {
  private smartc = new SmaRTCSimple();
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private currentSessionSubject = new BehaviorSubject<number | null>(null);

  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();
  currentSession$: Observable<number | null> = this.currentSessionSubject.asObservable();

  async login(username: string, password: string): Promise<void> {
    await this.smartc.login(username, password);
    this.isLoggedInSubject.next(true);
  }

  async logout(): Promise<void> {
    await this.smartc.logout();
    this.isLoggedInSubject.next(false);
    this.currentSessionSubject.next(null);
  }

  async startCall(name: string, description?: string): Promise<number> {
    const sessionId = await this.smartc.startCall(name, description);
    this.currentSessionSubject.next(sessionId);
    return sessionId;
  }

  async endCall(): Promise<void> {
    await this.smartc.endCall();
    this.currentSessionSubject.next(null);
  }

  async getAvailableCalls(): Promise<Session[]> {
    return await this.smartc.getAvailableCalls();
  }

  async joinCall(sessionId: number): Promise<void> {
    await this.smartc.joinCall(sessionId);
    this.currentSessionSubject.next(sessionId);
  }
}
```

### 4. Node.js Backend (Express)

```typescript
import express, { Request, Response } from 'express';
import { SmaRTCSimple } from '@smartc/sdk';

const app = express();
const smartc = new SmaRTCSimple();

app.use(express.json());

// Initialisation
app.listen(3000, async () => {
  await smartc.login('backend_api', 'SecurePass123!');
  console.log('🚀 API démarrée sur port 3000');
});

// Créer un appel
app.post('/api/calls', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const sessionId = await smartc.startCall(name, description);
    
    res.json({
      success: true,
      sessionId,
      joinUrl: `https://app.smartc.tn/join/${sessionId}`
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Lister les appels
app.get('/api/calls', async (req: Request, res: Response) => {
  try {
    const calls = await smartc.getAvailableCalls();
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
```

### 5. Next.js App Router

```typescript
// app/actions.ts (Server Actions)
'use server';

import { SmaRTCSimple } from '@smartc/sdk';

const smartc = new SmaRTCSimple();

export async function createCall(name: string, description?: string) {
  await smartc.login('nextjs_app', 'NextPass123!');
  const sessionId = await smartc.startCall(name, description);
  return { sessionId };
}

export async function getCalls() {
  await smartc.login('nextjs_app', 'NextPass123!');
  return await smartc.getAvailableCalls();
}

// app/page.tsx (Client Component)
'use client';

import { useState } from 'react';
import { createCall, getCalls } from './actions';

export default function CallPage() {
  const [sessionId, setSessionId] = useState<number | null>(null);

  async function handleCreateCall() {
    const result = await createCall('Next.js Call');
    setSessionId(result.sessionId);
  }

  return (
    <div>
      <button onClick={handleCreateCall}>Créer un appel</button>
      {sessionId && <p>Session créée: #{sessionId}</p>}
    </div>
  );
}
```

## ❌ Gestion des Erreurs

```typescript
import {
  SmaRTCError,
  AuthenticationError,
  SessionNotFoundError,
  NetworkError
} from '@smartc/sdk';

try {
  await smartc.login('user', 'wrongpass');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('❌ Identifiants incorrects');
  } else if (error instanceof SessionNotFoundError) {
    console.error('❌ Session introuvable');
  } else if (error instanceof NetworkError) {
    console.error('❌ Problème de connexion');
  } else if (error instanceof SmaRTCError) {
    console.error(`❌ Erreur: ${error.message}`);
  }
}
```

## 📦 API Reference

### Types principaux

```typescript
interface SmaRTCConfig {
  apiUrl?: string;
  signalServerUrl?: string;
  stunServers?: string[];
  turnServers?: TurnServer[];
  timeout?: number;
}

interface Session {
  id: number;
  name: string;
  description?: string;
  creatorId: number;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}
```

### Méthodes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `login` | `(username: string, password: string) => Promise<boolean>` | Se connecter |
| `register` | `(username: string, password: string, role?: string) => Promise<boolean>` | S'inscrire |
| `logout` | `() => Promise<void>` | Se déconnecter |
| `startCall` | `(name: string, description?: string) => Promise<number>` | Créer un appel |
| `joinCall` | `(sessionId: number) => Promise<void>` | Rejoindre |
| `endCall` | `() => Promise<void>` | Terminer |
| `getAvailableCalls` | `() => Promise<Session[]>` | Lister |
| `getCallDetails` | `(sessionId: number) => Promise<Session>` | Détails |
| `getIceServers` | `() => Promise<ICEServer[]>` | Serveurs ICE |

### Propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `isLoggedIn` | `boolean` | Connecté ? |
| `currentUsername` | `string \| null` | Username actuel |

## 🔧 Configuration TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  }
}
```

## 📚 Ressources

- [Documentation complète](https://docs.smartc.tn)
- [API Reference](https://docs.smartc.tn/api/typescript)
- [Exemples](./examples/)
- [GitHub](https://github.com/DeLTa-X-Tunisia/SmaRTC)

## 📄 Licence

MIT License - voir [LICENSE](../../LICENSE)

---

**Made with ❤️ by DeLTa-X Tunisia 🇹🇳**
