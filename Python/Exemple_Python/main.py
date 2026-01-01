"""
SmaRTC Python Example - Application de chat en temps réel
"""

import asyncio
import sys
from datetime import datetime

try:
    from colorama import init, Fore, Style
    init()
except ImportError:
    # Fallback si colorama n'est pas installé
    class Fore:
        GREEN = YELLOW = CYAN = RED = MAGENTA = WHITE = BLUE = ""
    class Style:
        RESET_ALL = BRIGHT = ""

from sdk.smartc_client import SmaRTCClient, SmaRTCConfig, ChatMessage


def print_banner():
    """Affiche la bannière"""
    print(f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════════════╗
║          {Fore.YELLOW}SmaRTC Python Chat Example{Fore.CYAN}                        ║
╠══════════════════════════════════════════════════════════════╣
║  {Fore.WHITE}📡 API: http://localhost:8080{Fore.CYAN}                             ║
║  {Fore.WHITE}🔌 SignalR: http://localhost:5001/signalhub{Fore.CYAN}               ║
╚══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
""")


def print_message(msg: ChatMessage):
    """Affiche un message de chat"""
    time_str = msg.timestamp.strftime("%H:%M")
    
    if msg.is_system:
        print(f"{Fore.YELLOW}[{time_str}] 📢 {msg.content}{Style.RESET_ALL}")
    elif msg.sender == client.username:
        print(f"{Fore.GREEN}[{time_str}] {msg.sender}: {msg.content}{Style.RESET_ALL}")
    else:
        print(f"{Fore.CYAN}[{time_str}] {msg.sender}: {msg.content}{Style.RESET_ALL}")


def on_error(error: str):
    """Callback d'erreur"""
    print(f"{Fore.RED}❌ Erreur: {error}{Style.RESET_ALL}")


# Client global
client = SmaRTCClient(SmaRTCConfig(
    api_base_url="http://localhost:8080",
    signal_hub_url="http://localhost:5001/signalhub"
))


async def main():
    """Point d'entrée principal"""
    print_banner()
    
    # Configuration des callbacks
    client.on_message_received = print_message
    client.on_error = on_error
    
    # Saisie des informations
    print(f"{Fore.WHITE}Entrez vos informations de connexion:{Style.RESET_ALL}")
    username = input(f"  {Fore.CYAN}Nom d'utilisateur: {Style.RESET_ALL}").strip()
    if not username:
        print(f"{Fore.RED}❌ Nom d'utilisateur requis{Style.RESET_ALL}")
        return
    
    password = input(f"  {Fore.CYAN}Mot de passe [{Fore.YELLOW}12345678{Fore.CYAN}]: {Style.RESET_ALL}").strip()
    if not password:
        password = "12345678"
    
    room = input(f"  {Fore.CYAN}Room [{Fore.YELLOW}Room_python{Fore.CYAN}]: {Style.RESET_ALL}").strip()
    if not room:
        room = "Room_python"
    
    print()
    
    # Inscription
    print(f"{Fore.YELLOW}📝 Inscription...{Style.RESET_ALL}")
    success, msg = await client.register_async(username, password)
    if success:
        print(f"{Fore.GREEN}✅ {msg}{Style.RESET_ALL}")
    else:
        print(f"{Fore.YELLOW}ℹ️ {msg} (peut-être déjà inscrit){Style.RESET_ALL}")
    
    # Connexion API
    print(f"{Fore.YELLOW}🔑 Connexion...{Style.RESET_ALL}")
    success, msg = await client.login_async(username, password)
    if not success:
        print(f"{Fore.RED}❌ {msg}{Style.RESET_ALL}")
        return
    print(f"{Fore.GREEN}✅ {msg}{Style.RESET_ALL}")
    
    # Connexion SignalR
    print(f"{Fore.YELLOW}🔌 Connexion au serveur SignalR...{Style.RESET_ALL}")
    if not await client.connect_to_hub_async():
        print(f"{Fore.RED}❌ Impossible de se connecter au hub{Style.RESET_ALL}")
        return
    print(f"{Fore.GREEN}✅ Connecté au hub SignalR{Style.RESET_ALL}")
    
    # Rejoindre la room
    print(f"{Fore.YELLOW}🚪 Connexion à la room {room}...{Style.RESET_ALL}")
    if not await client.join_room_async(room):
        print(f"{Fore.RED}❌ Impossible de rejoindre la room{Style.RESET_ALL}")
        return
    print(f"{Fore.GREEN}✅ Connecté à la room {room}{Style.RESET_ALL}")
    
    print()
    print(f"{Fore.MAGENTA}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.WHITE}💬 Chat actif ! Tapez vos messages (ou 'quit' pour quitter){Style.RESET_ALL}")
    print(f"{Fore.MAGENTA}{'='*60}{Style.RESET_ALL}")
    print()
    
    # Boucle de chat
    try:
        while True:
            try:
                # Lecture non-bloquante
                message = await asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: input(f"{Fore.GREEN}> {Style.RESET_ALL}")
                )
                
                if message.lower() in ('quit', 'exit', 'q'):
                    break
                
                if message.strip():
                    await client.send_message_async(message)
                    
            except EOFError:
                break
                
    except KeyboardInterrupt:
        print()
    
    # Déconnexion
    print(f"\n{Fore.YELLOW}👋 Déconnexion...{Style.RESET_ALL}")
    await client.disconnect_async()
    print(f"{Fore.GREEN}✅ Déconnecté. À bientôt !{Style.RESET_ALL}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Interrupted{Style.RESET_ALL}")
        sys.exit(0)
