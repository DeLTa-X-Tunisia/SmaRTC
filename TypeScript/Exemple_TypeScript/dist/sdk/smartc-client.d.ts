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
export declare class SmaRTCClient {
    private config;
    private hubConnection;
    private currentUser;
    private currentRoom;
    private isConnected;
    onMessageReceived?: (message: ChatMessage) => void;
    onUserJoined?: (username: string) => void;
    onUserLeft?: (username: string) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: string) => void;
    constructor(config: SmaRTCConfig);
    registerAsync(username: string, password: string): Promise<[boolean, string]>;
    loginAsync(username: string, password: string): Promise<[boolean, string]>;
    connectToHubAsync(): Promise<boolean>;
    joinRoomAsync(roomName: string): Promise<boolean>;
    leaveRoomAsync(): Promise<void>;
    sendMessageAsync(message: string): Promise<boolean>;
    disconnectAsync(): Promise<void>;
    get username(): string | undefined;
    get room(): string | null;
    get connected(): boolean;
    private handleReceiveSignal;
    private handleUserJoined;
    private handleUserLeft;
}
//# sourceMappingURL=smartc-client.d.ts.map