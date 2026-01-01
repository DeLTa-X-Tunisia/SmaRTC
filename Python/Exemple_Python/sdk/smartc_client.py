"""
SmaRTC Python SDK - Client SignalR pour chat temps réel
"""

import asyncio
import json
from dataclasses import dataclass
from typing import Optional, Callable, Any
from datetime import datetime

import aiohttp
from signalrcore.hub_connection_builder import HubConnectionBuilder


@dataclass
class SmaRTCConfig:
    """Configuration du client SmaRTC"""
    api_base_url: str = "http://localhost:8080"
    signal_hub_url: str = "http://localhost:5001/signalhub"


@dataclass
class User:
    """Utilisateur connecté"""
    id: int
    username: str
    token: str


@dataclass
class ChatMessage:
    """Message de chat"""
    sender: str
    content: str
    timestamp: datetime
    is_system: bool = False


class SmaRTCClient:
    """
    Client SmaRTC pour Python avec support SignalR.
    
    Exemple:
        client = SmaRTCClient()
        await client.register_async("user", "password")
        await client.login_async("user", "password")
        await client.connect_to_hub_async()
        await client.join_room_async("my_room")
        await client.send_message_async("Hello!")
    """
    
    def __init__(self, config: Optional[SmaRTCConfig] = None):
        self.config = config or SmaRTCConfig()
        self._hub_connection = None
        self._current_user: Optional[User] = None
        self._current_room: Optional[str] = None
        self._is_connected: bool = False
        
        # Callbacks
        self.on_message_received: Optional[Callable[[ChatMessage], None]] = None
        self.on_user_joined: Optional[Callable[[str], None]] = None
        self.on_user_left: Optional[Callable[[str], None]] = None
        self.on_connected: Optional[Callable[[], None]] = None
        self.on_disconnected: Optional[Callable[[], None]] = None
        self.on_error: Optional[Callable[[str], None]] = None

    async def register_async(self, username: str, password: str) -> tuple[bool, str]:
        """Inscription d'un nouvel utilisateur"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.config.api_base_url}/api/auth/register",
                    json={"username": username, "password": password},
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status in (200, 201, 409):  # 409 = déjà existant
                        return True, "Inscription réussie"
                    elif response.status == 429:
                        return False, "Trop de tentatives. Attendez quelques secondes."
                    text = await response.text()
                    return False, f"Erreur {response.status}: {text}"
        except Exception as e:
            return False, f"Exception: {e}"

    async def login_async(self, username: str, password: str) -> tuple[bool, str]:
        """Connexion d'un utilisateur"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.config.api_base_url}/api/auth/login",
                    json={"username": username, "password": password},
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self._current_user = User(
                            id=data.get("userId", 0),
                            username=username,
                            token=data.get("token", "")
                        )
                        return True, "Connexion réussie"
                    elif response.status == 429:
                        return False, "Trop de tentatives. Attendez quelques secondes."
                    elif response.status == 401:
                        return False, "Mot de passe incorrect"
                    elif response.status == 404:
                        return False, "Utilisateur non trouvé"
                    return False, f"Erreur {response.status}"
        except Exception as e:
            return False, f"Exception: {e}"

    async def connect_to_hub_async(self) -> bool:
        """Connexion au hub SignalR"""
        try:
            self._hub_connection = HubConnectionBuilder()\
                .with_url(self.config.signal_hub_url)\
                .with_automatic_reconnect({
                    "type": "raw",
                    "keep_alive_interval": 10,
                    "reconnect_interval": 5,
                })\
                .build()

            # Handlers pour les événements
            self._hub_connection.on("SendSignal", self._handle_receive_signal)
            self._hub_connection.on("NewUserArrived", self._handle_user_joined)
            self._hub_connection.on("UserLeft", self._handle_user_left)

            self._hub_connection.on_open(self._on_hub_connected)
            self._hub_connection.on_close(self._on_hub_disconnected)
            self._hub_connection.on_error(self._on_hub_error)

            self._hub_connection.start()
            
            # Attendre la connexion
            await asyncio.sleep(1)
            self._is_connected = True
            
            if self.on_connected:
                self.on_connected()
            
            return True
        except Exception as e:
            if self.on_error:
                self.on_error(f"Erreur de connexion au hub: {e}")
            return False

    def _on_hub_connected(self):
        """Callback quand connecté au hub"""
        self._is_connected = True

    def _on_hub_disconnected(self):
        """Callback quand déconnecté du hub"""
        self._is_connected = False
        if self.on_disconnected:
            self.on_disconnected()

    def _on_hub_error(self, error):
        """Callback sur erreur hub"""
        if self.on_error:
            self.on_error(str(error))

    def _handle_receive_signal(self, args):
        """Traitement des signaux reçus"""
        if not args:
            return
        try:
            signal_data = args[0] if isinstance(args, list) else args
            data = json.loads(signal_data) if isinstance(signal_data, str) else signal_data
            
            if data.get("type") == "chat":
                sender = data.get("sender", "Unknown")
                if sender != (self._current_user.username if self._current_user else ""):
                    if self.on_message_received:
                        self.on_message_received(ChatMessage(
                            sender=sender,
                            content=data.get("content", ""),
                            timestamp=datetime.fromisoformat(data.get("timestamp", datetime.now().isoformat()).replace("Z", "+00:00")),
                        ))
        except Exception:
            pass

    def _handle_user_joined(self, args):
        """Traitement arrivée utilisateur"""
        if args:
            username = args[0] if isinstance(args, list) else args
            if self.on_user_joined:
                self.on_user_joined(username)
            if self.on_message_received:
                self.on_message_received(ChatMessage(
                    sender="Système",
                    content=f"{username} a rejoint la room",
                    timestamp=datetime.now(),
                    is_system=True
                ))

    def _handle_user_left(self, args):
        """Traitement départ utilisateur"""
        if args:
            username = args[0] if isinstance(args, list) else args
            if self.on_user_left:
                self.on_user_left(username)
            if self.on_message_received:
                self.on_message_received(ChatMessage(
                    sender="Système",
                    content=f"{username} a quitté la room",
                    timestamp=datetime.now(),
                    is_system=True
                ))

    async def join_room_async(self, room_name: str) -> bool:
        """Rejoindre une room"""
        if not self._hub_connection or not self._is_connected:
            if self.on_error:
                self.on_error("Non connecté au hub")
            return False

        username = self._current_user.username if self._current_user else "Anonymous"

        try:
            self._hub_connection.send("JoinSession", [room_name, username])
            self._current_room = room_name
            
            if self.on_message_received:
                self.on_message_received(ChatMessage(
                    sender="Système",
                    content=f"{username} a rejoint la room {room_name}",
                    timestamp=datetime.now(),
                    is_system=True
                ))
            
            return True
        except Exception as e:
            if self.on_error:
                self.on_error(f"Erreur pour rejoindre la room: {e}")
            return False

    async def leave_room_async(self):
        """Quitter la room"""
        if not self._hub_connection or not self._current_room:
            return

        username = self._current_user.username if self._current_user else "Anonymous"

        try:
            self._hub_connection.send("LeaveSession", [self._current_room, username])
            self._current_room = None
        except Exception as e:
            if self.on_error:
                self.on_error(f"Erreur pour quitter la room: {e}")

    async def send_message_async(self, message: str) -> bool:
        """Envoyer un message"""
        if not self._hub_connection or not self._current_room or not self._is_connected:
            if self.on_error:
                self.on_error("Non connecté ou pas dans une room")
            return False

        username = self._current_user.username if self._current_user else "Anonymous"

        try:
            signal_data = json.dumps({
                "type": "chat",
                "sender": username,
                "content": message,
                "timestamp": datetime.now().isoformat()
            })

            self._hub_connection.send("SendSignalToSession", [self._current_room, signal_data, username])

            # Ajouter le message localement
            if self.on_message_received:
                self.on_message_received(ChatMessage(
                    sender=username,
                    content=message,
                    timestamp=datetime.now()
                ))

            return True
        except Exception as e:
            if self.on_error:
                self.on_error(f"Erreur d'envoi du message: {e}")
            return False

    async def disconnect_async(self):
        """Déconnexion"""
        if self._current_room:
            await self.leave_room_async()

        if self._hub_connection:
            self._hub_connection.stop()
            self._hub_connection = None

        self._is_connected = False
        self._current_user = None

    @property
    def username(self) -> Optional[str]:
        return self._current_user.username if self._current_user else None

    @property
    def room(self) -> Optional[str]:
        return self._current_room

    @property
    def connected(self) -> bool:
        return self._is_connected
