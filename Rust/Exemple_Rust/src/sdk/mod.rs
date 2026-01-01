// SmaRTC Rust SDK Client
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Signal data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalData {
    pub user: String,
    pub message: String,
}

/// Connection state
#[derive(Debug, Clone, PartialEq)]
pub enum ConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

/// SmaRTC Client for Rust applications
pub struct SmaRTCClient {
    hub_url: String,
    username: Arc<Mutex<Option<String>>>,
    room_name: Arc<Mutex<Option<String>>>,
    state: Arc<Mutex<ConnectionState>>,
}

impl SmaRTCClient {
    /// Create a new SmaRTC client
    pub fn new(hub_url: &str) -> Self {
        Self {
            hub_url: hub_url.to_string(),
            username: Arc::new(Mutex::new(None)),
            room_name: Arc::new(Mutex::new(None)),
            state: Arc::new(Mutex::new(ConnectionState::Disconnected)),
        }
    }

    /// Get the hub URL
    pub fn hub_url(&self) -> &str {
        &self.hub_url
    }

    /// Get current username
    pub fn username(&self) -> Option<String> {
        self.username.lock().unwrap().clone()
    }

    /// Get current room name
    pub fn room_name(&self) -> Option<String> {
        self.room_name.lock().unwrap().clone()
    }

    /// Get connection state
    pub fn state(&self) -> ConnectionState {
        self.state.lock().unwrap().clone()
    }

    /// Set username
    pub fn set_username(&self, username: &str) {
        *self.username.lock().unwrap() = Some(username.to_string());
    }

    /// Set room name
    pub fn set_room_name(&self, room: &str) {
        *self.room_name.lock().unwrap() = Some(room.to_string());
    }

    /// Set connection state
    pub fn set_state(&self, state: ConnectionState) {
        *self.state.lock().unwrap() = state;
    }

    /// Check if connected
    pub fn is_connected(&self) -> bool {
        matches!(self.state(), ConnectionState::Connected)
    }
}

impl Clone for SmaRTCClient {
    fn clone(&self) -> Self {
        Self {
            hub_url: self.hub_url.clone(),
            username: Arc::clone(&self.username),
            room_name: Arc::clone(&self.room_name),
            state: Arc::clone(&self.state),
        }
    }
}
