/**
 * Wrapper Simplifié SmaRTC JavaScript
 * 
 * API ultra-simple pour intégrer SmaRTC en quelques lignes.
 * 
 * @example
 * const smartc = new SmaRTCSimple();
 * await smartc.login('demo', 'Demo123!');
 * await smartc.startCall('Mon appel');
 */

import { SmaRTCClient } from './tunrtc.js';

export class SmaRTCSimple {
  constructor() {
    this.client = new SmaRTCClient({
      apiUrl: 'http://localhost:8080',
      signalServerUrl: 'http://localhost:5001/signalhub'
    });
    this.currentSessionId = null;
  }

  // ==========================================
  // 🔐 Authentification simplifiée
  // ==========================================

  /**
   * Se connecter avec username et password
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<boolean>} true si succès
   * @throws {SmaRTCSimpleError}
   */
  async login(username, password) {
    try {
      await this.client.auth.login(username, password);
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new SmaRTCSimpleError('Identifiants incorrects', error);
      }
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        throw new SmaRTCSimpleError('Problème de connexion', error);
      }
      throw new SmaRTCSimpleError(`Erreur de connexion: ${error.message}`, error);
    }
  }

  /**
   * Créer un compte
   * @param {string} username 
   * @param {string} password 
   * @param {string} role - Par défaut 'User'
   * @returns {Promise<boolean>}
   * @throws {SmaRTCSimpleError}
   */
  async register(username, password, role = 'User') {
    try {
      await this.client.auth.register(username, password, role);
      return true;
    } catch (error) {
      if (error.response?.status === 409) {
        throw new SmaRTCSimpleError('Ce nom d\'utilisateur existe déjà', error);
      }
      throw new SmaRTCSimpleError(`Erreur d'inscription: ${error.message}`, error);
    }
  }

  /**
   * Se déconnecter (termine l'appel automatiquement)
   */
  async logout() {
    if (this.currentSessionId) {
      await this.endCall();
    }
    await this.client.auth.logout();
  }

  /**
   * Vérifie si l'utilisateur est connecté
   * @returns {boolean}
   */
  get isLoggedIn() {
    return this.client.auth.isAuthenticated;
  }

  /**
   * Récupère le nom d'utilisateur actuel
   * @returns {string|null}
   */
  get currentUsername() {
    return this.client.auth.currentUser?.username || null;
  }

  // ==========================================
  // 📹 Appels vidéo simplifiés
  // ==========================================

  /**
   * Démarre un appel vidéo (crée une session et rejoint automatiquement)
   * @param {string} name - Nom de l'appel
   * @param {string} description - Description optionnelle
   * @returns {Promise<number>} ID de la session créée
   * @throws {SmaRTCSimpleError}
   */
  async startCall(name, description = null) {
    try {
      // Créer la session
      const session = await this.client.sessions.create(name, description);
      this.currentSessionId = session.id;

      // Rejoindre automatiquement
      await this.client.webrtc.join(session.id);

      return session.id;
    } catch (error) {
      throw new SmaRTCSimpleError('Impossible de créer l\'appel', error);
    }
  }

  /**
   * Rejoindre un appel existant avec son ID
   * @param {number} sessionId 
   * @throws {SmaRTCSimpleError}
   */
  async joinCall(sessionId) {
    try {
      await this.client.webrtc.join(sessionId);
      this.currentSessionId = sessionId;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new SmaRTCSimpleError('Cet appel n\'existe pas', error);
      }
      throw new SmaRTCSimpleError('Erreur lors de la connexion', error);
    }
  }

  /**
   * Termine l'appel en cours
   */
  async endCall() {
    if (!this.currentSessionId) return;

    try {
      await this.client.webrtc.leave();
      this.currentSessionId = null;
    } catch (error) {
      throw new SmaRTCSimpleError('Erreur lors de la déconnexion', error);
    }
  }

  /**
   * Active/désactive le micro
   */
  async toggleMicrophone() {
    try {
      await this.client.webrtc.toggleMute();
    } catch (error) {
      throw new SmaRTCSimpleError('Erreur micro', error);
    }
  }

  /**
   * Active/désactive la caméra
   */
  async toggleCamera() {
    try {
      await this.client.webrtc.toggleCamera();
    } catch (error) {
      throw new SmaRTCSimpleError('Erreur caméra', error);
    }
  }

  // ==========================================
  // 📋 Sessions disponibles
  // ==========================================

  /**
   * Liste tous les appels disponibles
   * @returns {Promise<Array>}
   * @throws {SmaRTCSimpleError}
   */
  async getAvailableCalls() {
    try {
      return await this.client.sessions.getAll();
    } catch (error) {
      throw new SmaRTCSimpleError('Erreur lors de la récupération', error);
    }
  }

  /**
   * Récupère les détails d'un appel
   * @param {number} sessionId 
   * @returns {Promise<Object>}
   * @throws {SmaRTCSimpleError}
   */
  async getCallDetails(sessionId) {
    try {
      return await this.client.sessions.getById(sessionId);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new SmaRTCSimpleError('Appel introuvable', error);
      }
      throw new SmaRTCSimpleError('Erreur', error);
    }
  }

  // ==========================================
  // 🌐 Configuration réseau
  // ==========================================

  /**
   * Récupère les serveurs ICE (STUN/TURN) automatiquement
   * @returns {Promise<Array>}
   */
  async getIceServers() {
    try {
      return await this.client.webrtc.getIceServers();
    } catch (error) {
      // Fallback sur Google STUN
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }

  // ==========================================
  // 🎥 Événements vidéo
  // ==========================================

  /**
   * Écouter l'événement de flux local
   * @param {Function} callback - (stream) => void
   */
  onLocalStream(callback) {
    this.client.on('localStream', callback);
  }

  /**
   * Écouter l'événement de flux distant
   * @param {Function} callback - (userId, stream) => void
   */
  onRemoteStream(callback) {
    this.client.on('remoteStream', callback);
  }

  /**
   * Écouter l'événement d'utilisateur rejoint
   * @param {Function} callback - (userId) => void
   */
  onUserJoined(callback) {
    this.client.on('userJoined', callback);
  }

  /**
   * Écouter l'événement d'utilisateur parti
   * @param {Function} callback - (userId) => void
   */
  onUserLeft(callback) {
    this.client.on('userLeft', callback);
  }

  /**
   * Écouter les erreurs
   * @param {Function} callback - (error) => void
   */
  onError(callback) {
    this.client.on('error', callback);
  }
}

// ==========================================
// ❌ Erreurs simplifiées et explicites
// ==========================================

/**
 * Erreur générale du SDK simplifié
 */
export class SmaRTCSimpleError extends Error {
  constructor(message, original = null) {
    super(message);
    this.name = 'SmaRTCSimpleError';
    this.original = original;
  }

  toString() {
    return `SmaRTC: ${this.message}`;
  }
}

// Export default pour import direct
export default SmaRTCSimple;
