"""
Quick Start Example - SmaRTC Python SDK

Exemple minimal montrant comment utiliser le SDK en 10 lignes.
"""

import asyncio
from smartc_simple import SmaRTCSimple

async def main():
    # 1. Créer le client
    smartc = SmaRTCSimple()
    
    # 2. Se connecter
    await smartc.login('demo', 'Demo123!')
    print(f"✅ Connecté: {smartc.current_username}")
    
    # 3. Créer un appel
    session_id = await smartc.start_call('Quick Start Python')
    print(f"📞 Appel créé: #{session_id}")
    
    # 4. Lister les appels disponibles
    calls = await smartc.get_available_calls()
    print(f"📋 {len(calls)} appels actifs")
    
    # 5. Terminer
    await smartc.end_call()
    await smartc.logout()
    print("👋 Déconnecté")

if __name__ == '__main__':
    asyncio.run(main())
