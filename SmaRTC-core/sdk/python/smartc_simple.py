"""
SmaRTC Python SDK - Wrapper Simplifié

API ultra-simple pour intégrer SmaRTC en quelques lignes.

Usage:
    from smartc_simple import SmaRTCSimple
    
    smartc = SmaRTCSimple()
    await smartc.login('demo', 'Demo123!')
    await smartc.start_call('Mon appel')
"""

import asyncio
import aiohttp
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from enum import Enum


@dataclass
class SmaRTCConfig:
    """Configuration du client SmaRTC"""
    api_url: str = "http://localhost:8080"
    signal_server_url: str = "http://localhost:5001/signalhub"
    stun_servers: List[str] = None
    turn_servers: List[Dict[str, str]] = None
    timeout: int = 30
    
    def __post_init__(self):
        if self.stun_servers is None:
            self.stun_servers = ["stun:stun.l.google.com:19302"]
        if self.turn_servers is None:
            self.turn_servers = []


@dataclass
class User:
    """Représente un utilisateur"""
    id: int
    username: str
    role: str


@dataclass
class Session:
    """Représente une session d'appel"""
    id: int
    name: str
    description: Optional[str]
    creator_id: int
    created_at: str


class SmaRTCError(Exception):
    """Erreur de base du SDK"""
    def __init__(self, message: str, original: Optional[Exception] = None):
        self.message = message
        self.original = original
        super().__init__(self.message)


class AuthenticationError(SmaRTCError):
    """Erreur d'authentification"""
    pass


class SessionNotFoundError(SmaRTCError):
    """Session introuvable"""
    pass


class NetworkError(SmaRTCError):
    """Erreur réseau"""
    pass


class SmaRTCSimple:
    """
    Wrapper simplifié du SDK SmaRTC pour Python.
    
    Exemple:
        >>> smartc = SmaRTCSimple()
        >>> await smartc.login('demo', 'Demo123!')
        >>> session_id = await smartc.start_call('Réunion')
        >>> await smartc.end_call()
    """
    
    def __init__(self, config: Optional[SmaRTCConfig] = None):
        self.config = config or SmaRTCConfig()
        self._token: Optional[str] = None
        self._username: Optional[str] = None
        self._user_id: Optional[int] = None
        self._current_session_id: Optional[int] = None
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Context manager entry"""
        self._session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self._session:
            await self._session.close()
    
    def _get_headers(self) -> Dict[str, str]:
        """Obtient les headers avec le token JWT"""
        headers = {"Content-Type": "application/json"}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        return headers
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Effectue une requête HTTP"""
        if not self._session:
            self._session = aiohttp.ClientSession()
        
        url = f"{self.config.api_url}{endpoint}"
        headers = self._get_headers()
        
        try:
            async with self._session.request(
                method, 
                url, 
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=self.config.timeout),
                **kwargs
            ) as response:
                if response.status == 401:
                    raise AuthenticationError("Identifiants incorrects")
                elif response.status == 404:
                    raise SessionNotFoundError("Ressource introuvable")
                elif response.status >= 400:
                    text = await response.text()
                    raise SmaRTCError(f"Erreur HTTP {response.status}: {text}")
                
                if response.status == 204:  # No content
                    return {}
                
                return await response.json()
        
        except aiohttp.ClientError as e:
            raise NetworkError(f"Problème de connexion: {str(e)}", e)
        except asyncio.TimeoutError as e:
            raise NetworkError("Timeout de connexion", e)
    
    # ==========================================
    # 🔐 Authentification
    # ==========================================
    
    async def login(self, username: str, password: str) -> bool:
        """
        Se connecter avec username et password.
        
        Args:
            username: Nom d'utilisateur
            password: Mot de passe
            
        Returns:
            True si succès
            
        Raises:
            AuthenticationError: Si identifiants incorrects
            NetworkError: Si problème de connexion
        """
        try:
            data = await self._request(
                "POST",
                "/api/auth/login",
                json={"username": username, "password": password}
            )
            
            self._token = data.get("token")
            self._username = username
            
            return True
        
        except Exception as e:
            if isinstance(e, SmaRTCError):
                raise
            raise SmaRTCError(f"Erreur de connexion: {str(e)}", e)
    
    async def register(self, username: str, password: str, role: str = "User") -> bool:
        """
        Créer un nouveau compte.
        
        Args:
            username: Nom d'utilisateur
            password: Mot de passe
            role: Rôle (User ou Admin)
            
        Returns:
            True si succès
            
        Raises:
            SmaRTCError: Si le nom d'utilisateur existe déjà
        """
        try:
            await self._request(
                "POST",
                "/api/auth/register",
                json={"username": username, "password": password, "role": role}
            )
            return True
        
        except SmaRTCError as e:
            if "409" in str(e) or "exist" in str(e).lower():
                raise SmaRTCError("Ce nom d'utilisateur existe déjà", e)
            raise
    
    async def logout(self) -> None:
        """Se déconnecter et nettoyer la session"""
        if self._current_session_id:
            await self.end_call()
        
        self._token = None
        self._username = None
        self._user_id = None
    
    @property
    def is_logged_in(self) -> bool:
        """Vérifie si l'utilisateur est connecté"""
        return self._token is not None
    
    @property
    def current_username(self) -> Optional[str]:
        """Récupère le nom d'utilisateur actuel"""
        return self._username
    
    # ==========================================
    # 📹 Appels vidéo
    # ==========================================
    
    async def start_call(self, name: str, description: Optional[str] = None) -> int:
        """
        Démarre un appel vidéo (crée une session).
        
        Args:
            name: Nom de l'appel
            description: Description optionnelle
            
        Returns:
            ID de la session créée
            
        Raises:
            SmaRTCError: Si impossible de créer l'appel
        """
        try:
            data = await self._request(
                "POST",
                "/api/session",
                json={"name": name, "description": description}
            )
            
            session = Session(**data)
            self._current_session_id = session.id
            
            return session.id
        
        except Exception as e:
            if isinstance(e, SmaRTCError):
                raise
            raise SmaRTCError(f"Impossible de créer l'appel: {str(e)}", e)
    
    async def join_call(self, session_id: int) -> None:
        """
        Rejoindre un appel existant.
        
        Args:
            session_id: ID de la session à rejoindre
            
        Raises:
            SessionNotFoundError: Si la session n'existe pas
        """
        try:
            await self._request("GET", f"/api/session/{session_id}")
            self._current_session_id = session_id
        
        except Exception as e:
            if isinstance(e, SessionNotFoundError):
                raise SmaRTCError("Cet appel n'existe pas", e)
            raise
    
    async def end_call(self) -> None:
        """Termine l'appel en cours"""
        if not self._current_session_id:
            return
        
        try:
            # Optionnel: supprimer la session si créateur
            # await self._request("DELETE", f"/api/session/{self._current_session_id}")
            self._current_session_id = None
        except Exception:
            pass  # Ignorer les erreurs lors de la fermeture
    
    # ==========================================
    # 📋 Sessions disponibles
    # ==========================================
    
    async def get_available_calls(self) -> List[Session]:
        """
        Liste tous les appels disponibles.
        
        Returns:
            Liste des sessions disponibles
        """
        try:
            data = await self._request("GET", "/api/session")
            return [Session(**s) for s in data]
        
        except Exception as e:
            if isinstance(e, SmaRTCError):
                raise
            raise SmaRTCError(f"Erreur lors de la récupération: {str(e)}", e)
    
    async def get_call_details(self, session_id: int) -> Session:
        """
        Récupère les détails d'un appel.
        
        Args:
            session_id: ID de la session
            
        Returns:
            Détails de la session
        """
        try:
            data = await self._request("GET", f"/api/session/{session_id}")
            return Session(**data)
        
        except SessionNotFoundError:
            raise SmaRTCError("Appel introuvable")
        except Exception as e:
            if isinstance(e, SmaRTCError):
                raise
            raise SmaRTCError(f"Erreur: {str(e)}", e)
    
    # ==========================================
    # 🌐 Configuration réseau
    # ==========================================
    
    async def get_ice_servers(self) -> List[Dict[str, Any]]:
        """
        Récupère les serveurs ICE (STUN/TURN).
        
        Returns:
            Liste des serveurs ICE avec fallback Google STUN
        """
        try:
            data = await self._request("GET", "/api/webrtc/ice")
            return data.get("iceServers", [])
        except Exception:
            # Fallback sur Google STUN
            return [{"urls": server} for server in self.config.stun_servers]


# ==========================================
# 🔧 Helper synchrone pour usage simple
# ==========================================

class SmaRTCSync:
    """
    Wrapper synchrone pour utilisation sans async/await.
    
    Exemple:
        >>> smartc = SmaRTCSync()
        >>> smartc.login('demo', 'Demo123!')
        >>> session_id = smartc.start_call('Mon appel')
    """
    
    def __init__(self, config: Optional[SmaRTCConfig] = None):
        self._client = SmaRTCSimple(config)
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
    
    def _run(self, coro):
        """Exécute une coroutine de manière synchrone"""
        return self._loop.run_until_complete(coro)
    
    def login(self, username: str, password: str) -> bool:
        """Se connecter (version synchrone)"""
        return self._run(self._client.login(username, password))
    
    def register(self, username: str, password: str, role: str = "User") -> bool:
        """S'inscrire (version synchrone)"""
        return self._run(self._client.register(username, password, role))
    
    def logout(self) -> None:
        """Se déconnecter (version synchrone)"""
        return self._run(self._client.logout())
    
    def start_call(self, name: str, description: Optional[str] = None) -> int:
        """Démarrer un appel (version synchrone)"""
        return self._run(self._client.start_call(name, description))
    
    def join_call(self, session_id: int) -> None:
        """Rejoindre un appel (version synchrone)"""
        return self._run(self._client.join_call(session_id))
    
    def end_call(self) -> None:
        """Terminer l'appel (version synchrone)"""
        return self._run(self._client.end_call())
    
    def get_available_calls(self) -> List[Session]:
        """Lister les appels (version synchrone)"""
        return self._run(self._client.get_available_calls())
    
    def get_call_details(self, session_id: int) -> Session:
        """Détails d'un appel (version synchrone)"""
        return self._run(self._client.get_call_details(session_id))
    
    def get_ice_servers(self) -> List[Dict[str, Any]]:
        """Serveurs ICE (version synchrone)"""
        return self._run(self._client.get_ice_servers())
    
    @property
    def is_logged_in(self) -> bool:
        return self._client.is_logged_in
    
    @property
    def current_username(self) -> Optional[str]:
        return self._client.current_username
    
    def __del__(self):
        """Nettoyage"""
        if hasattr(self, '_loop') and self._loop:
            self._loop.close()
