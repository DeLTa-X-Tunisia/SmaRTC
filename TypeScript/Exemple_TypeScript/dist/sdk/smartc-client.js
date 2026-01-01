"use strict";
// =============================================================================
// SmaRTC TypeScript SDK - Client simplifié pour l'exemple
// =============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmaRTCClient = void 0;
const signalR = __importStar(require("@microsoft/signalr"));
class SmaRTCClient {
    constructor(config) {
        this.hubConnection = null;
        this.currentUser = null;
        this.currentRoom = null;
        this.isConnected = false;
        this.config = config;
    }
    // Inscription
    async registerAsync(username, password) {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (response.ok || response.status === 409) {
                return [true, 'Inscription réussie'];
            }
            else if (response.status === 429) {
                return [false, 'Trop de tentatives. Attendez quelques secondes.'];
            }
            const text = await response.text();
            return [false, `Erreur ${response.status}: ${text}`];
        }
        catch (e) {
            return [false, `Exception: ${e}`];
        }
    }
    // Connexion
    async loginAsync(username, password) {
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
            }
            else if (response.status === 429) {
                return [false, 'Trop de tentatives. Attendez quelques secondes.'];
            }
            else if (response.status === 401) {
                return [false, 'Mot de passe incorrect'];
            }
            else if (response.status === 404) {
                return [false, 'Utilisateur non trouvé'];
            }
            return [false, `Erreur ${response.status}`];
        }
        catch (e) {
            return [false, `Exception: ${e}`];
        }
    }
    // Connexion au hub SignalR
    async connectToHubAsync() {
        try {
            this.hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(this.config.signalHubUrl)
                .withAutomaticReconnect()
                .build();
            // Handlers pour les événements (noms correspondant au serveur SignalHub.cs)
            this.hubConnection.on('SendSignal', (signal, user) => {
                this.handleReceiveSignal(signal, user);
            });
            this.hubConnection.on('NewUserArrived', (username) => {
                this.handleUserJoined(username);
            });
            this.hubConnection.on('UserLeft', (username) => {
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
        }
        catch (e) {
            this.onError?.(`Erreur de connexion au hub: ${e}`);
            return false;
        }
    }
    // Rejoindre une room
    async joinRoomAsync(roomName) {
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
        }
        catch (e) {
            this.onError?.(`Erreur pour rejoindre la room: ${e}`);
            return false;
        }
    }
    // Quitter la room
    async leaveRoomAsync() {
        if (!this.hubConnection || !this.currentRoom)
            return;
        const username = this.currentUser?.username || 'Anonymous';
        try {
            await this.hubConnection.invoke('LeaveSession', this.currentRoom, username);
            this.currentRoom = null;
        }
        catch (e) {
            this.onError?.(`Erreur pour quitter la room: ${e}`);
        }
    }
    // Envoyer un message
    async sendMessageAsync(message) {
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
        }
        catch (e) {
            this.onError?.(`Erreur d'envoi du message: ${e}`);
            return false;
        }
    }
    // Déconnexion
    async disconnectAsync() {
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
    get username() {
        return this.currentUser?.username;
    }
    get room() {
        return this.currentRoom;
    }
    get connected() {
        return this.isConnected;
    }
    // Handlers privés
    handleReceiveSignal(signal, user) {
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
        }
        catch (e) {
            // Ignorer les erreurs de parsing
        }
    }
    handleUserJoined(username) {
        this.onUserJoined?.(username);
        this.onMessageReceived?.({
            sender: 'Système',
            content: `${username} a rejoint la room`,
            timestamp: new Date(),
            isSystem: true,
        });
    }
    handleUserLeft(username) {
        this.onUserLeft?.(username);
        this.onMessageReceived?.({
            sender: 'Système',
            content: `${username} a quitté la room`,
            timestamp: new Date(),
            isSystem: true,
        });
    }
}
exports.SmaRTCClient = SmaRTCClient;
//# sourceMappingURL=smartc-client.js.map