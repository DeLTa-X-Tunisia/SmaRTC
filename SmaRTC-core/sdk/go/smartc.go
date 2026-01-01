// 🚀 SmaRTC Go SDK
// Wrapper minimaliste pour backend WebRTC en Go
package smartc

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// ============================================================================
// Configuration
// ============================================================================

// Config contient la configuration du client SmaRTC
type Config struct {
	APIBaseURL       string
	SignalServerURL  string
	Timeout          time.Duration
	EnableLogs       bool
}

// DefaultConfig retourne la configuration par défaut
func DefaultConfig() *Config {
	return &Config{
		APIBaseURL:      "http://localhost:8080",
		SignalServerURL: "http://localhost:5001",
		Timeout:         10 * time.Second,
		EnableLogs:      false,
	}
}

// ============================================================================
// Types de données
// ============================================================================

// User représente un utilisateur
type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

// Session représente une session d'appel
type Session struct {
	SessionID    string   `json:"sessionId"`
	RoomName     string   `json:"roomName"`
	HostUserID   string   `json:"hostUserId"`
	Participants []string `json:"participants"`
	CreatedAt    string   `json:"createdAt"`
	IsActive     bool     `json:"isActive"`
}

// ICEServer représente un serveur STUN/TURN
type ICEServer struct {
	URLs       []string `json:"urls"`
	Username   *string  `json:"username,omitempty"`
	Credential *string  `json:"credential,omitempty"`
}

// LoginRequest pour l'authentification
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse contient le token JWT
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// CreateSessionRequest pour créer un appel
type CreateSessionRequest struct {
	RoomName string `json:"roomName"`
}

// JoinSessionRequest pour rejoindre un appel
type JoinSessionRequest struct {
	SessionID string `json:"sessionId"`
}

// ============================================================================
// Erreurs personnalisées
// ============================================================================

// ErrorType définit les types d'erreurs
type ErrorType int

const (
	ErrorAuthentication ErrorType = iota
	ErrorSessionNotFound
	ErrorNetwork
	ErrorGeneric
)

// SmaRTCError représente une erreur SmaRTC
type SmaRTCError struct {
	Type    ErrorType
	Message string
}

func (e *SmaRTCError) Error() string {
	return e.Message
}

// NewAuthError crée une erreur d'authentification
func NewAuthError(message string) *SmaRTCError {
	if message == "" {
		message = "Identifiants incorrects"
	}
	return &SmaRTCError{Type: ErrorAuthentication, Message: message}
}

// NewSessionNotFoundError crée une erreur de session introuvable
func NewSessionNotFoundError(message string) *SmaRTCError {
	if message == "" {
		message = "Cet appel n'existe pas"
	}
	return &SmaRTCError{Type: ErrorSessionNotFound, Message: message}
}

// NewNetworkError crée une erreur réseau
func NewNetworkError(message string) *SmaRTCError {
	if message == "" {
		message = "Problème de connexion"
	}
	return &SmaRTCError{Type: ErrorNetwork, Message: message}
}

// NewGenericError crée une erreur générique
func NewGenericError(message string) *SmaRTCError {
	return &SmaRTCError{Type: ErrorGeneric, Message: message}
}

// ============================================================================
// Client SmaRTC
// ============================================================================

// Client est le client SmaRTC principal
type Client struct {
	config           *Config
	httpClient       *http.Client
	token            string
	currentUsername  string
	currentSessionID string
}

// NewClient crée un nouveau client SmaRTC
func NewClient(config *Config) *Client {
	if config == nil {
		config = DefaultConfig()
	}

	return &Client{
		config: config,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

// IsLoggedIn vérifie si l'utilisateur est connecté
func (c *Client) IsLoggedIn() bool {
	return c.token != ""
}

// CurrentUsername retourne le nom d'utilisateur actuel
func (c *Client) CurrentUsername() string {
	return c.currentUsername
}

// CurrentSessionID retourne l'ID de session actuel
func (c *Client) CurrentSessionID() string {
	return c.currentSessionID
}

// ============================================================================
// Méthodes privées
// ============================================================================

func (c *Client) request(method, path string, body interface{}, requireAuth bool) ([]byte, error) {
	url := c.config.APIBaseURL + path

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, NewGenericError(fmt.Sprintf("Erreur de sérialisation : %v", err))
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, NewNetworkError(fmt.Sprintf("Erreur de requête : %v", err))
	}

	req.Header.Set("Content-Type", "application/json")
	if requireAuth && c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	if c.config.EnableLogs {
		fmt.Printf("[SmaRTC] %s %s\n", method, url)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, NewNetworkError(fmt.Sprintf("Erreur réseau : %v", err))
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, NewNetworkError(fmt.Sprintf("Erreur de lecture : %v", err))
	}

	if resp.StatusCode >= 400 {
		switch resp.StatusCode {
		case 401:
			return nil, NewAuthError("Identifiants incorrects")
		case 404:
			return nil, NewSessionNotFoundError("Ressource introuvable")
		default:
			return nil, NewGenericError(fmt.Sprintf("Erreur HTTP %d : %s", resp.StatusCode, string(respBody)))
		}
	}

	return respBody, nil
}

// ============================================================================
// Méthodes publiques
// ============================================================================

// Login authentifie l'utilisateur
func (c *Client) Login(username, password string) error {
	reqBody := LoginRequest{
		Username: username,
		Password: password,
	}

	respData, err := c.request("POST", "/api/auth/login", reqBody, false)
	if err != nil {
		return err
	}

	var loginResp LoginResponse
	if err := json.Unmarshal(respData, &loginResp); err != nil {
		return NewGenericError(fmt.Sprintf("Erreur de parsing : %v", err))
	}

	c.token = loginResp.Token
	c.currentUsername = loginResp.User.Username

	if c.config.EnableLogs {
		fmt.Printf("[SmaRTC] Connecté en tant que %s\n", c.currentUsername)
	}

	return nil
}

// Register crée un nouveau compte utilisateur
func (c *Client) Register(username, password string) (*User, error) {
	reqBody := LoginRequest{
		Username: username,
		Password: password,
	}

	respData, err := c.request("POST", "/api/auth/register", reqBody, false)
	if err != nil {
		return nil, err
	}

	var user User
	if err := json.Unmarshal(respData, &user); err != nil {
		return nil, NewGenericError(fmt.Sprintf("Erreur de parsing : %v", err))
	}

	return &user, nil
}

// StartCall crée un nouvel appel
func (c *Client) StartCall(roomName string) (*Session, error) {
	reqBody := CreateSessionRequest{
		RoomName: roomName,
	}

	respData, err := c.request("POST", "/api/session", reqBody, true)
	if err != nil {
		return nil, err
	}

	var session Session
	if err := json.Unmarshal(respData, &session); err != nil {
		return nil, NewGenericError(fmt.Sprintf("Erreur de parsing : %v", err))
	}

	c.currentSessionID = session.SessionID

	if c.config.EnableLogs {
		fmt.Printf("[SmaRTC] Appel créé : %s\n", session.SessionID)
	}

	return &session, nil
}

// JoinCall rejoint un appel existant
func (c *Client) JoinCall(sessionID string) (*Session, error) {
	reqBody := JoinSessionRequest{
		SessionID: sessionID,
	}

	respData, err := c.request("POST", "/api/session/join", reqBody, true)
	if err != nil {
		return nil, err
	}

	var session Session
	if err := json.Unmarshal(respData, &session); err != nil {
		return nil, NewGenericError(fmt.Sprintf("Erreur de parsing : %v", err))
	}

	c.currentSessionID = session.SessionID

	if c.config.EnableLogs {
		fmt.Printf("[SmaRTC] Appel rejoint : %s\n", session.SessionID)
	}

	return &session, nil
}

// EndCall termine l'appel en cours
func (c *Client) EndCall() error {
	if c.currentSessionID == "" {
		return NewGenericError("Aucun appel en cours")
	}

	path := fmt.Sprintf("/api/session/%s", c.currentSessionID)
	_, err := c.request("DELETE", path, nil, true)
	if err != nil {
		return err
	}

	if c.config.EnableLogs {
		fmt.Printf("[SmaRTC] Appel terminé : %s\n", c.currentSessionID)
	}

	c.currentSessionID = ""
	return nil
}

// GetAvailableCalls liste tous les appels actifs
func (c *Client) GetAvailableCalls() ([]Session, error) {
	respData, err := c.request("GET", "/api/session", nil, true)
	if err != nil {
		return nil, err
	}

	var sessions []Session
	if err := json.Unmarshal(respData, &sessions); err != nil {
		return nil, NewGenericError(fmt.Sprintf("Erreur de parsing : %v", err))
	}

	return sessions, nil
}

// GetICEServers récupère la configuration STUN/TURN
func (c *Client) GetICEServers() ([]ICEServer, error) {
	respData, err := c.request("GET", "/api/webrtc/ice", nil, true)
	if err != nil {
		// Fallback vers Google STUN
		return []ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		}, nil
	}

	var iceServers []ICEServer
	if err := json.Unmarshal(respData, &iceServers); err != nil {
		return nil, NewGenericError(fmt.Sprintf("Erreur de parsing : %v", err))
	}

	return iceServers, nil
}

// Logout déconnecte l'utilisateur
func (c *Client) Logout() error {
	// Terminer l'appel en cours si existant
	if c.currentSessionID != "" {
		if err := c.EndCall(); err != nil {
			// Log l'erreur mais continue la déconnexion
			if c.config.EnableLogs {
				fmt.Printf("[SmaRTC] Erreur lors de la fin d'appel : %v\n", err)
			}
		}
	}

	c.token = ""
	c.currentUsername = ""
	c.currentSessionID = ""

	if c.config.EnableLogs {
		fmt.Println("[SmaRTC] Déconnecté")
	}

	return nil
}
