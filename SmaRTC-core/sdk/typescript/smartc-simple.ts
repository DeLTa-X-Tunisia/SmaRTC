/**
 * SmaRTC TypeScript SDK - Wrapper Simplifié avec types
 * 
 * @packageDocumentation
 * @module smartc-sdk
 */

// ==========================================
// 🔧 Configuration & Types
// ==========================================

export interface SmaRTCConfig {
  apiUrl?: string;
  signalServerUrl?: string;
  stunServers?: string[];
  turnServers?: TurnServer[];
  timeout?: number;
}

export interface TurnServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Session {
  id: number;
  name: string;
  description?: string;
  creatorId: number;
  createdAt: string;
}

export interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface LoginResponse {
  token: string;
  user?: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateSessionRequest {
  name: string;
  description?: string;
}

// ==========================================
// ❌ Custom Errors
// ==========================================

export class SmaRTCError extends Error {
  constructor(
    message: string,
    public readonly original?: Error
  ) {
    super(message);
    this.name = 'SmaRTCError';
  }
}

export class AuthenticationError extends SmaRTCError {
  constructor(message: string = 'Identifiants incorrects', original?: Error) {
    super(message, original);
    this.name = 'AuthenticationError';
  }
}

export class SessionNotFoundError extends SmaRTCError {
  constructor(message: string = 'Cet appel n\'existe pas', original?: Error) {
    super(message, original);
    this.name = 'SessionNotFoundError';
  }
}

export class NetworkError extends SmaRTCError {
  constructor(message: string = 'Problème de connexion', original?: Error) {
    super(message, original);
    this.name = 'NetworkError';
  }
}

// ==========================================
// 🚀 SmaRTC Client Simplifié
// ==========================================

export class SmaRTCSimple {
  private config: Required<SmaRTCConfig>;
  private token: string | null = null;
  private username: string | null = null;
  private currentSessionId: number | null = null;

  constructor(config: SmaRTCConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:8080',
      signalServerUrl: config.signalServerUrl || 'http://localhost:5001/signalhub',
      stunServers: config.stunServers || ['stun:stun.l.google.com:19302'],
      turnServers: config.turnServers || [],
      timeout: config.timeout || 30000,
    };
  }

  // ==========================================
  // 🔒 Private Helpers
  // ==========================================

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T = any>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 401) {
        throw new AuthenticationError();
      }

      if (response.status === 404) {
        throw new SessionNotFoundError();
      }

      if (response.status === 409) {
        throw new SmaRTCError('Ce nom d\'utilisateur existe déjà');
      }

      if (!response.ok) {
        const text = await response.text();
        throw new SmaRTCError(`Erreur HTTP ${response.status}: ${text}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof SmaRTCError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError('Timeout de connexion', error);
        }
        throw new NetworkError(`Problème de connexion: ${error.message}`, error);
      }

      throw new SmaRTCError('Erreur inconnue', error as Error);
    }
  }

  // ==========================================
  // 🔐 Authentification
  // ==========================================

  /**
   * Se connecter avec username et password
   * @param username - Nom d'utilisateur
   * @param password - Mot de passe
   * @returns Promise<true> si succès
   * @throws {AuthenticationError} Si identifiants incorrects
   * @throws {NetworkError} Si problème de connexion
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      const data = await this.request<LoginResponse>('POST', '/api/auth/login', {
        username,
        password,
      });

      this.token = data.token;
      this.username = username;

      return true;
    } catch (error) {
      if (error instanceof SmaRTCError) {
        throw error;
      }
      throw new SmaRTCError('Erreur de connexion', error as Error);
    }
  }

  /**
   * Créer un nouveau compte
   * @param username - Nom d'utilisateur
   * @param password - Mot de passe
   * @param role - Rôle (User ou Admin)
   * @returns Promise<true> si succès
   * @throws {SmaRTCError} Si le nom d'utilisateur existe déjà
   */
  async register(username: string, password: string, role: string = 'User'): Promise<boolean> {
    try {
      await this.request('POST', '/api/auth/register', {
        username,
        password,
        role,
      });

      return true;
    } catch (error) {
      if (error instanceof SmaRTCError) {
        throw error;
      }
      throw new SmaRTCError('Erreur d\'inscription', error as Error);
    }
  }

  /**
   * Se déconnecter et nettoyer la session
   */
  async logout(): Promise<void> {
    if (this.currentSessionId) {
      await this.endCall();
    }

    this.token = null;
    this.username = null;
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  get isLoggedIn(): boolean {
    return this.token !== null;
  }

  /**
   * Récupère le nom d'utilisateur actuel
   */
  get currentUsername(): string | null {
    return this.username;
  }

  // ==========================================
  // 📹 Appels vidéo
  // ==========================================

  /**
   * Démarre un appel vidéo (crée une session)
   * @param name - Nom de l'appel
   * @param description - Description optionnelle
   * @returns Promise<number> ID de la session créée
   * @throws {SmaRTCError} Si impossible de créer l'appel
   */
  async startCall(name: string, description?: string): Promise<number> {
    try {
      const session = await this.request<Session>('POST', '/api/session', {
        name,
        description,
      });

      this.currentSessionId = session.id;
      return session.id;
    } catch (error) {
      if (error instanceof SmaRTCError) {
        throw error;
      }
      throw new SmaRTCError('Impossible de créer l\'appel', error as Error);
    }
  }

  /**
   * Rejoindre un appel existant
   * @param sessionId - ID de la session à rejoindre
   * @throws {SessionNotFoundError} Si la session n'existe pas
   */
  async joinCall(sessionId: number): Promise<void> {
    try {
      await this.request('GET', `/api/session/${sessionId}`);
      this.currentSessionId = sessionId;
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      throw new SmaRTCError('Erreur lors de la connexion', error as Error);
    }
  }

  /**
   * Termine l'appel en cours
   */
  async endCall(): Promise<void> {
    if (!this.currentSessionId) {
      return;
    }

    try {
      // Optionnel: supprimer la session si créateur
      // await this.request('DELETE', `/api/session/${this.currentSessionId}`);
      this.currentSessionId = null;
    } catch {
      // Ignorer les erreurs lors de la fermeture
    }
  }

  // ==========================================
  // 📋 Sessions disponibles
  // ==========================================

  /**
   * Liste tous les appels disponibles
   * @returns Promise<Session[]> Liste des sessions
   */
  async getAvailableCalls(): Promise<Session[]> {
    try {
      return await this.request<Session[]>('GET', '/api/session');
    } catch (error) {
      if (error instanceof SmaRTCError) {
        throw error;
      }
      throw new SmaRTCError('Erreur lors de la récupération', error as Error);
    }
  }

  /**
   * Récupère les détails d'un appel
   * @param sessionId - ID de la session
   * @returns Promise<Session> Détails de la session
   */
  async getCallDetails(sessionId: number): Promise<Session> {
    try {
      return await this.request<Session>('GET', `/api/session/${sessionId}`);
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        throw new SmaRTCError('Appel introuvable');
      }
      if (error instanceof SmaRTCError) {
        throw error;
      }
      throw new SmaRTCError('Erreur', error as Error);
    }
  }

  // ==========================================
  // 🌐 Configuration réseau
  // ==========================================

  /**
   * Récupère les serveurs ICE (STUN/TURN)
   * @returns Promise<ICEServer[]> Liste des serveurs ICE avec fallback
   */
  async getIceServers(): Promise<ICEServer[]> {
    try {
      const data = await this.request<{ iceServers: ICEServer[] }>('GET', '/api/webrtc/ice');
      return data.iceServers || [];
    } catch {
      // Fallback sur Google STUN
      return this.config.stunServers.map(urls => ({ urls }));
    }
  }
}

// Export par défaut pour import facile
export default SmaRTCSimple;
