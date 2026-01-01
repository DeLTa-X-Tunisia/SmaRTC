// SmaRTC Rust SDK Client with real SignalR connection
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{connect_async, tungstenite::Message};

const RECORD_SEPARATOR: char = '\u{1e}';

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalRMessage {
    #[serde(rename = "type")]
    pub msg_type: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arguments: Option<Vec<Value>>,
    #[serde(rename = "invocationId", skip_serializing_if = "Option::is_none")]
    pub invocation_id: Option<String>,
}

pub type MessageCallback = Arc<dyn Fn(String, String) + Send + Sync>;
pub type UserCallback = Arc<dyn Fn(String) + Send + Sync>;

pub struct SmaRTCClient {
    hub_url: String,
    username: Arc<Mutex<String>>,
    room_name: Arc<Mutex<String>>,
    sender: Arc<Mutex<Option<mpsc::Sender<String>>>>,
    pub on_signal: Option<MessageCallback>,
    pub on_user_joined: Option<UserCallback>,
    pub on_user_left: Option<UserCallback>,
}

impl SmaRTCClient {
    pub fn new(hub_url: &str) -> Self {
        Self {
            hub_url: hub_url.to_string(),
            username: Arc::new(Mutex::new(String::new())),
            room_name: Arc::new(Mutex::new(String::new())),
            sender: Arc::new(Mutex::new(None)),
            on_signal: None,
            on_user_joined: None,
            on_user_left: None,
        }
    }

    pub async fn connect(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        // Convert HTTP URL to WebSocket URL
        let ws_url = self.hub_url
            .replace("http://", "ws://")
            .replace("https://", "wss://");
        
        let url = url::Url::parse(&ws_url)?;
        let (ws_stream, _) = connect_async(url).await?;
        let (mut write, mut read) = ws_stream.split();

        // Send handshake
        let handshake = format!("{{\"protocol\":\"json\",\"version\":1}}{}", RECORD_SEPARATOR);
        write.send(Message::Text(handshake)).await?;

        // Wait for handshake response
        if let Some(Ok(msg)) = read.next().await {
            if let Message::Text(text) = msg {
                if text.contains("error") && !text.contains("\"error\":\"\"") {
                    return Err("Handshake failed".into());
                }
            }
        }

        // Create channel for sending messages
        let (tx, mut rx) = mpsc::channel::<String>(100);
        {
            let mut sender = self.sender.lock().await;
            *sender = Some(tx);
        }

        // Clone for the receive task
        let on_signal = self.on_signal.clone();
        let on_user_joined = self.on_user_joined.clone();
        let on_user_left = self.on_user_left.clone();
        let username = self.username.clone();

        // Spawn task to handle incoming messages
        let write = Arc::new(Mutex::new(write));
        let write_clone = write.clone();

        tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                if let Ok(Message::Text(text)) = msg {
                    for part in text.split(RECORD_SEPARATOR) {
                        if part.is_empty() {
                            continue;
                        }
                        if let Ok(message) = serde_json::from_str::<SignalRMessage>(part) {
                            match message.msg_type {
                                1 => {
                                    // Invocation
                                    if let Some(target) = &message.target {
                                        if let Some(args) = &message.arguments {
                                            match target.as_str() {
                                                "SendSignal" => {
                                                    if args.len() >= 2 {
                                                        let user = args[0].as_str().unwrap_or("").trim_matches('"').to_string();
                                                        let msg = args[1].as_str().unwrap_or("").trim_matches('"').to_string();
                                                        let current_user = username.lock().await.clone();
                                                        if user != current_user {
                                                            if let Some(cb) = &on_signal {
                                                                cb(user, msg);
                                                            }
                                                        }
                                                    }
                                                }
                                                "NewUserArrived" => {
                                                    if !args.is_empty() {
                                                        let user = args[0].as_str().unwrap_or("").trim_matches('"').to_string();
                                                        if let Some(cb) = &on_user_joined {
                                                            cb(user);
                                                        }
                                                    }
                                                }
                                                "UserLeft" => {
                                                    if !args.is_empty() {
                                                        let user = args[0].as_str().unwrap_or("").trim_matches('"').to_string();
                                                        if let Some(cb) = &on_user_left {
                                                            cb(user);
                                                        }
                                                    }
                                                }
                                                _ => {}
                                            }
                                        }
                                    }
                                }
                                6 => {
                                    // Ping - respond with pong
                                    let pong = format!("{{\"type\":6}}{}", RECORD_SEPARATOR);
                                    let mut w = write_clone.lock().await;
                                    let _ = w.send(Message::Text(pong)).await;
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        });

        // Spawn task to handle outgoing messages
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                let mut w = write.lock().await;
                let _ = w.send(Message::Text(msg)).await;
            }
        });

        Ok(())
    }

    pub async fn join_room(&self, room: &str, user: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        {
            let mut username = self.username.lock().await;
            *username = user.to_string();
        }
        {
            let mut room_name = self.room_name.lock().await;
            *room_name = room.to_string();
        }

        let msg = json!({
            "type": 1,
            "target": "JoinSession",
            "arguments": [room, user],
            "invocationId": "1"
        });

        self.send_raw(&format!("{}{}", msg, RECORD_SEPARATOR)).await
    }

    pub async fn send_message(&self, message: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let room = self.room_name.lock().await.clone();
        let user = self.username.lock().await.clone();

        let msg = json!({
            "type": 1,
            "target": "SendSignalToSession",
            "arguments": [room, message, user],
            "invocationId": "2"
        });

        self.send_raw(&format!("{}{}", msg, RECORD_SEPARATOR)).await
    }

    pub async fn leave_room(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let room = self.room_name.lock().await.clone();
        let user = self.username.lock().await.clone();

        let msg = json!({
            "type": 1,
            "target": "LeaveSession",
            "arguments": [room, user],
            "invocationId": "3"
        });

        self.send_raw(&format!("{}{}", msg, RECORD_SEPARATOR)).await
    }

    async fn send_raw(&self, message: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let sender = self.sender.lock().await;
        if let Some(tx) = &*sender {
            tx.send(message.to_string()).await?;
        }
        Ok(())
    }

    pub async fn get_username(&self) -> String {
        self.username.lock().await.clone()
    }

    pub async fn get_room(&self) -> String {
        self.room_name.lock().await.clone()
    }
}
