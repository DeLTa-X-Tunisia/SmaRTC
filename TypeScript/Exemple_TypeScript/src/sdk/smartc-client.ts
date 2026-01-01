// =============================================================================
// SmaRTC TypeScript SDK - Client simplifié pour l'exemple
// =============================================================================

import * as signalR from '@microsoft/signalr';

export interface SmaRTCConfig {
  apiBaseUrl: string;
  signalHubUrl: string;
}

export interface User {
  id: number;
  username: string;
  token: string;
}

export interface ChatMessage {
  sender: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
}

export class SmaRTCClient {
  private config: SmaRTCConfig;
  private hubConnection: signalR.HubConnection | null = null;
  private currentUser: User | null = null;
  private currentRoom: string | null = null;
  private isConnected: boolean = false;

  // Callbacks
  public onMessageReceived?: (message: ChatMessage) => void;
  public onUserJoined?: (username: string) => void;
  public onUserLeft?: (username: string) => void;
  public onConnected?: () => void;
  public onDisconnected?: () => void;
  public onError?: (error: string) => void;

  constructor(config: SmaRTCConfig) {
    this.config = config;
  }

  // Inscription
  async registerAsync(username: string, password: string): Promise<[boolean, string]> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok || response.status === 409) {
        return [true, 'Inscription réussie'];
      } else if (response.status === 429) {
        return [false, 'Trop de tentatives. Attendez quelques secondes.'];
      }
      const text = await response.text();
      return [false, `Erreur ${response.status}: ${text}`];
    } catch (e) {
      return [false, `Exception: ${e}`];
    }
  }

  // Connexion
  async loginAsync(username: string, password: string): Promise<[boolean, string]> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentUser = {
          id: data.userId || 0,
          username: username,
          token: data.token,
        };
        return [true, 'Connexion réussie'];
      } else if (response.status === 429) {
        return [false, 'Trop de tentatives. Attendez quelques secondes.'];
      } else if (response.status === 401) {
        return [false, 'Mot de passe incorrect'];
      } else if (response.status === 404) {
        return [false, 'Utilisateur non trouvé'];
      }
      return [false, `Erreur ${response.status}`];
    } catch (e) {
      return [false, `Exception: ${e}`];
    }
  }

  // Connexion au hub SignalR
  async connectToHubAsync(): Promise<boolean> {
    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.config.signalHubUrl)
        .withAutomaticReconnect()
        .build();

      // Handlers pour les événements (noms correspondant au serveur SignalHub.cs)
      this.hubConnection.on('SendSignal', (signal: string, user: string) => {
        this.handleReceiveSignal(signal, user);
      });

      this.hubConnection.on('NewUserArrived', (username: string) => {
        this.handleUserJoined(username);
      });

      this.hubConnection.on('UserLeft', (username: string) => {
        this.handleUserLeft(username);
      });

      this.hubConnection.onclose(() => {
        this.isConnected = false;
        this.onDisconnected?.();
      });

      this.hubConnection.onreconnected(() => {
        this.isConnected = true;
        if (this.currentRoom) {
          this.joinRoomAsync(this.currentRoom);
        }
      });

      await this.hubConnection.start();
      this.isConnected = true;
      this.onConnected?.();
      return true;
    } catch (e) {
      this.onError?.(`Erreur de connexion au hub: ${e}`);
      return false;
    }
  }

  // Rejoindre une room
  async joinRoomAsync(roomName: string): Promise<boolean> {
    if (!this.hubConnection || !this.isConnected) {
      this.onError?.('Non connecté au hub');
      return false;
    }

    const username = this.currentUser?.username || 'Anonymous';

    try {
      await this.hubConnection.invoke('JoinSession', roomName, username);
      this.currentRoom = roomName;

      this.onMessageReceived?.({
        sender: 'Système',
        content: `${username} a rejoint la room ${roomName}`,
        timestamp: new Date(),
        isSystem: true,
      });

      return true;
    } catch (e) {
      this.onError?.(`Erreur pour rejoindre la room: ${e}`);
      return false;
    }
  }

  // Quitter la room
  async leaveRoomAsync(): Promise<void> {
    if (!this.hubConnection || !this.currentRoom) return;

    const username = this.currentUser?.username || 'Anonymous';

    try {
      await this.hubConnection.invoke('LeaveSession', this.currentRoom, username);
      this.currentRoom = null;
    } catch (e) {
      this.onError?.(`Erreur pour quitter la room: ${e}`);
    }
  }

  // Envoyer un message
  async sendMessageAsync(message: string): Promise<boolean> {
    if (!this.hubConnection || !this.currentRoom || !this.isConnected) {
      this.onError?.('Non connecté ou pas dans une room');
      return false;
    }

    const username = this.currentUser?.username || 'Anonymous';

    try {
      const signalData = JSON.stringify({
        type: 'chat',
        sender: username,
        content: message,
        timestamp: new Date().toISOString(),
      });

      await this.hubConnection.invoke('SendSignalToSession', this.currentRoom, signalData, username);

      // Ajouter le message localement
      this.onMessageReceived?.({
        sender: username,
        content: message,
        timestamp: new Date(),
      });

      return true;
    } catch (e) {
      this.onError?.(`Erreur d'envoi du message: ${e}`);
      return false;
    }
  }

  // Déconnexion
  async disconnectAsync(): Promise<void> {
    if (this.currentRoom) {
      await this.leaveRoomAsync();
    }

    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }

    this.isConnected = false;
    this.currentUser = null;
  }

  // Getters
  get username(): string | undefined {
    return this.currentUser?.username;
  }

  get room(): string | null {
    return this.currentRoom;
  }

  get connected(): boolean {
    return this.isConnected;
  }

  // Handlers privés
  private handleReceiveSignal(signal: string, user: string): void {
    try {
      const data = JSON.parse(signal);
      if (data.type === 'chat') {
        const sender = data.sender || 'Unknown';
        if (sender !== this.currentUser?.username) {
          this.onMessageReceived?.({
            sender: sender,
            content: data.content || '',
            timestamp: new Date(data.timestamp) || new Date(),
          });
        }
      }
    } catch (e) {
      // Ignorer les erreurs de parsing
    }
  }

  private handleUserJoined(username: string): void {
    this.onUserJoined?.(username);
    this.onMessageReceived?.({
      sender: 'Système',
      content: `${username} a rejoint la room`,
      timestamp: new Date(),
      isSystem: true,
    });
  }

  private handleUserLeft(username: string): void {
    this.onUserLeft?.(username);
    this.onMessageReceived?.({
      sender: 'Système',
      content: `${username} a quitté la room`,
      timestamp: new Date(),
      isSystem: true,
    });
  }
}
