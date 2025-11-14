/**
 * TunRTC JavaScript SDK
 * 
 * This SDK provides a high-level API for interacting with the TunRTC platform,
 * simplifying the integration of real-time audio/video features into web applications.
 */
class TunRTC {
    /**
     * @param {string} apiUrl - The base URL of the TunRTC API.
     * @param {string} signalUrl - The URL of the SignalR hub.
     */
    constructor(apiUrl, signalUrl) {
        this.apiUrl = apiUrl;
        this.signalUrl = signalUrl;
        this.token = null;
        this.connection = null;
        this.peerConnection = null;
    }

    /**
     * Authenticates the user and initializes the SignalR connection.
     * @param {string} username 
     * @param {string} password 
     */
    async login(username, password) {
        const response = await fetch(`${this.apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }

        const data = await response.json();
        this.token = data.token;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(this.signalUrl, { accessTokenFactory: () => this.token })
            .build();

        await this.connection.start();
    }

    /**
     * Creates a new WebRTC session.
     * @returns {Promise<string>} The session ID.
     */
    async createSession() {
        const response = await fetch(`${this.apiUrl}/api/session/create`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await response.json();
        return data.sessionId;
    }

    /**
     * Joins an existing WebRTC session.
     * @param {string} sessionId 
     */
    async joinSession(sessionId) {
        await fetch(`${this.apiUrl}/api/session/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ sessionId })
        });
    }

    // ... other methods for handling media streams, etc.
}
