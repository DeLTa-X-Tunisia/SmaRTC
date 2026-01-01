// SmaRTC Kotlin SDK Client
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
// This project is for demonstration purposes only.

package com.smartc.sdk

import com.microsoft.signalr.HubConnection
import com.microsoft.signalr.HubConnectionBuilder
import com.microsoft.signalr.HubConnectionState
import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicBoolean

typealias MessageCallback = (user: String, message: String) -> Unit
typealias UserCallback = (username: String) -> Unit

class SmaRTCClient(private val hubUrl: String) {
    
    private var hubConnection: HubConnection? = null
    private var username: String = ""
    private var roomName: String = ""
    private val isConnected = AtomicBoolean(false)
    
    var onSignalReceived: MessageCallback? = null
    var onUserJoined: UserCallback? = null
    var onUserLeft: UserCallback? = null
    var onConnected: (() -> Unit)? = null
    var onDisconnected: (() -> Unit)? = null
    var onError: ((Throwable) -> Unit)? = null
    
    fun connect(): Boolean {
        return try {
            hubConnection = HubConnectionBuilder.create(hubUrl)
                .build()
            
            // Set up event handlers
            hubConnection?.on("SendSignal", { user: String, message: String ->
                if (user != username) {
                    onSignalReceived?.invoke(user.trim('"'), message.trim('"'))
                }
            }, String::class.java, String::class.java)
            
            hubConnection?.on("NewUserArrived", { user: String ->
                onUserJoined?.invoke(user.trim('"'))
            }, String::class.java)
            
            hubConnection?.on("UserLeft", { user: String ->
                onUserLeft?.invoke(user.trim('"'))
            }, String::class.java)
            
            hubConnection?.onClosed { error ->
                isConnected.set(false)
                if (error != null) {
                    onError?.invoke(error)
                }
                onDisconnected?.invoke()
            }
            
            // Start connection
            hubConnection?.start()?.blockingAwait()
            isConnected.set(true)
            onConnected?.invoke()
            true
        } catch (e: Exception) {
            onError?.invoke(e)
            false
        }
    }
    
    fun joinRoom(room: String, user: String) {
        this.roomName = room
        this.username = user
        
        try {
            hubConnection?.invoke("JoinSession", roomName, username)
        } catch (e: Exception) {
            onError?.invoke(e)
        }
    }
    
    fun leaveRoom() {
        try {
            if (roomName.isNotEmpty() && username.isNotEmpty()) {
                hubConnection?.invoke("LeaveSession", roomName, username)
            }
        } catch (e: Exception) {
            onError?.invoke(e)
        }
    }
    
    fun sendMessage(message: String) {
        try {
            hubConnection?.invoke("SendSignalToSession", roomName, message, username)
        } catch (e: Exception) {
            onError?.invoke(e)
        }
    }
    
    fun disconnect() {
        leaveRoom()
        hubConnection?.stop()
        isConnected.set(false)
        onDisconnected?.invoke()
    }
    
    fun isConnected(): Boolean = isConnected.get() && 
        hubConnection?.connectionState == HubConnectionState.CONNECTED
    
    fun getUsername(): String = username
    fun getRoomName(): String = roomName
}
