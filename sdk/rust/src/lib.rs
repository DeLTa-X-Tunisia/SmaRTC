// 🦀 SmaRTC Rust SDK
// Wrapper performant et sécurisé pour WebRTC
use reqwest::{Client as HttpClient, Response};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use thiserror::Error;

// ============================================================================
// Configuration
// ============================================================================

#[derive(Debug, Clone)]
pub struct Config {
    pub api_base_url: String,
    pub signal_server_url: String,
    pub timeout: Duration,
    pub enable_logs: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            api_base_url: "http://localhost:8080".to_string(),
            signal_server_url: "http://localhost:5001".to_string(),
            timeout: Duration::from_secs(10),
            enable_logs: false,
        }
    }
}

// ============================================================================
// Types de données
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub session_id: String,
    pub room_name: String,
    pub host_user_id: String,
    #[serde(default)]
    pub participants: Vec<String>,
    pub created_at: String,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ICEServer {
    pub urls: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credential: Option<String>,
}

#[derive(Debug, Serialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Deserialize)]
struct LoginResponse {
    token: String,
    user: User,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CreateSessionRequest {
    room_name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct JoinSessionRequest {
    session_id: String,
}

// ============================================================================
// Erreurs personnalisées avec thiserror
// ============================================================================

#[derive(Error, Debug)]
pub enum SmaRTCError {
    #[error("Identifiants incorrects")]
    Authentication,

    #[error("Cet appel n'existe pas")]
    SessionNotFound,

    #[error("Problème de connexion : {0}")]
    Network(String),

    #[error("Erreur : {0}")]
    Generic(String),
}

impl From<reqwest::Error> for SmaRTCError {
    fn from(err: reqwest::Error) -> Self {
        SmaRTCError::Network(err.to_string())
    }
}

// ============================================================================
// Client SmaRTC
// ============================================================================

pub struct SmaRTCClient {
    config: Config,
    http_client: HttpClient,
    token: Option<String>,
    current_username: Option<String>,
    current_session_id: Option<String>,
}

impl SmaRTCClient {
    /// Crée un nouveau client SmaRTC
    pub fn new(config: Option<Config>) -> Self {
        let config = config.unwrap_or_default();
        let http_client = HttpClient::builder()
            .timeout(config.timeout)
            .build()
            .expect("Failed to create HTTP client");

        Self {
            config,
            http_client,
            token: None,
            current_username: None,
            current_session_id: None,
        }
    }

    /// Vérifie si l'utilisateur est connecté
    pub fn is_logged_in(&self) -> bool {
        self.token.is_some()
    }

    /// Retourne le nom d'utilisateur actuel
    pub fn current_username(&self) -> Option<&str> {
        self.current_username.as_deref()
    }

    /// Retourne l'ID de session actuel
    pub fn current_session_id(&self) -> Option<&str> {
        self.current_session_id.as_deref()
    }

    // ========================================================================
    // Méthodes privées
    // ========================================================================

    async fn request<T: for<'de> Deserialize<'de>>(
        &self,
        method: reqwest::Method,
        path: &str,
        body: Option<impl Serialize>,
        require_auth: bool,
    ) -> Result<T, SmaRTCError> {
        let url = format!("{}{}", self.config.api_base_url, path);

        let mut request = self.http_client.request(method.clone(), &url);

        if let Some(body) = body {
            request = request.json(&body);
        }

        if require_auth {
            if let Some(token) = &self.token {
                request = request.bearer_auth(token);
            }
        }

        if self.config.enable_logs {
            println!("[SmaRTC] {} {}", method, url);
        }

        let response = request.send().await?;
        let status = response.status();

        if !status.is_success() {
            return Err(match status.as_u16() {
                401 => SmaRTCError::Authentication,
                404 => SmaRTCError::SessionNotFound,
                _ => {
                    let error_text = response.text().await.unwrap_or_default();
                    SmaRTCError::Generic(format!("HTTP {} : {}", status, error_text))
                }
            });
        }

        let data = response.json::<T>().await?;
        Ok(data)
    }

    // ========================================================================
    // Méthodes publiques
    // ========================================================================

    /// Authentifie l'utilisateur
    pub async fn login(&mut self, username: &str, password: &str) -> Result<(), SmaRTCError> {
        let req_body = LoginRequest {
            username: username.to_string(),
            password: password.to_string(),
        };

        let login_resp: LoginResponse = self
            .request(reqwest::Method::POST, "/api/auth/login", Some(req_body), false)
            .await?;

        self.token = Some(login_resp.token);
        self.current_username = Some(login_resp.user.username);

        if self.config.enable_logs {
            println!(
                "[SmaRTC] Connecté en tant que {}",
                self.current_username.as_ref().unwrap()
            );
        }

        Ok(())
    }

    /// Crée un nouveau compte utilisateur
    pub async fn register(&self, username: &str, password: &str) -> Result<User, SmaRTCError> {
        let req_body = LoginRequest {
            username: username.to_string(),
            password: password.to_string(),
        };

        let user: User = self
            .request(
                reqwest::Method::POST,
                "/api/auth/register",
                Some(req_body),
                false,
            )
            .await?;

        Ok(user)
    }

    /// Crée un nouvel appel
    pub async fn start_call(&mut self, room_name: &str) -> Result<Session, SmaRTCError> {
        let req_body = CreateSessionRequest {
            room_name: room_name.to_string(),
        };

        let session: Session = self
            .request(
                reqwest::Method::POST,
                "/api/session",
                Some(req_body),
                true,
            )
            .await?;

        self.current_session_id = Some(session.session_id.clone());

        if self.config.enable_logs {
            println!("[SmaRTC] Appel créé : {}", session.session_id);
        }

        Ok(session)
    }

    /// Rejoint un appel existant
    pub async fn join_call(&mut self, session_id: &str) -> Result<Session, SmaRTCError> {
        let req_body = JoinSessionRequest {
            session_id: session_id.to_string(),
        };

        let session: Session = self
            .request(
                reqwest::Method::POST,
                "/api/session/join",
                Some(req_body),
                true,
            )
            .await?;

        self.current_session_id = Some(session.session_id.clone());

        if self.config.enable_logs {
            println!("[SmaRTC] Appel rejoint : {}", session.session_id);
        }

        Ok(session)
    }

    /// Termine l'appel en cours
    pub async fn end_call(&mut self) -> Result<(), SmaRTCError> {
        let session_id = self
            .current_session_id
            .as_ref()
            .ok_or_else(|| SmaRTCError::Generic("Aucun appel en cours".to_string()))?;

        let path = format!("/api/session/{}", session_id);
        self.request::<serde_json::Value>(reqwest::Method::DELETE, &path, None::<()>, true)
            .await?;

        if self.config.enable_logs {
            println!("[SmaRTC] Appel terminé : {}", session_id);
        }

        self.current_session_id = None;
        Ok(())
    }

    /// Liste tous les appels actifs
    pub async fn get_available_calls(&self) -> Result<Vec<Session>, SmaRTCError> {
        let sessions: Vec<Session> = self
            .request(reqwest::Method::GET, "/api/session", None::<()>, true)
            .await?;

        Ok(sessions)
    }

    /// Récupère la configuration STUN/TURN
    pub async fn get_ice_servers(&self) -> Result<Vec<ICEServer>, SmaRTCError> {
        match self
            .request::<Vec<ICEServer>>(reqwest::Method::GET, "/api/webrtc/ice", None::<()>, true)
            .await
        {
            Ok(servers) => Ok(servers),
            Err(_) => {
                // Fallback vers Google STUN
                Ok(vec![ICEServer {
                    urls: vec!["stun:stun.l.google.com:19302".to_string()],
                    username: None,
                    credential: None,
                }])
            }
        }
    }

    /// Déconnecte l'utilisateur
    pub async fn logout(&mut self) -> Result<(), SmaRTCError> {
        // Terminer l'appel en cours si existant
        if self.current_session_id.is_some() {
            if let Err(e) = self.end_call().await {
                if self.config.enable_logs {
                    eprintln!("[SmaRTC] Erreur lors de la fin d'appel : {}", e);
                }
            }
        }

        self.token = None;
        self.current_username = None;
        self.current_session_id = None;

        if self.config.enable_logs {
            println!("[SmaRTC] Déconnecté");
        }

        Ok(())
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_client_creation() {
        let client = SmaRTCClient::new(None);
        assert!(!client.is_logged_in());
        assert_eq!(client.current_username(), None);
    }

    #[test]
    fn test_config_default() {
        let config = Config::default();
        assert_eq!(config.api_base_url, "http://localhost:8080");
        assert_eq!(config.timeout, Duration::from_secs(10));
    }
}
