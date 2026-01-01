// Package sdk provides a SmaRTC client for Go applications
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
package sdk

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/philippseith/signalr"
)

// SignalHandler handles incoming signals
type SignalHandler func(user, message string)

// UserHandler handles user events
type UserHandler func(username string)

// SmaRTCClient represents a client for the SmaRTC platform
type SmaRTCClient struct {
	hubURL      string
	username    string
	roomName    string
	client      signalr.Client
	ctx         context.Context
	cancel      context.CancelFunc
	isConnected bool
	mutex       sync.RWMutex

	// Event handlers
	OnSignalReceived SignalHandler
	OnUserJoined     UserHandler
	OnUserLeft       UserHandler
	OnConnected      func()
	OnDisconnected   func()
	OnError          func(error)
}

// Receiver implements the SignalR receiver interface
type Receiver struct {
	client *SmaRTCClient
}

// SendSignal handles incoming signals from the hub
func (r *Receiver) SendSignal(user, message string) {
	if r.client.OnSignalReceived != nil {
		r.client.OnSignalReceived(user, message)
	}
}

// NewUserArrived handles new user joining
func (r *Receiver) NewUserArrived(username string) {
	if r.client.OnUserJoined != nil {
		r.client.OnUserJoined(username)
	}
}

// UserLeft handles user leaving
func (r *Receiver) UserLeft(username string) {
	if r.client.OnUserLeft != nil {
		r.client.OnUserLeft(username)
	}
}

// NewSmaRTCClient creates a new SmaRTC client instance
func NewSmaRTCClient(hubURL string) *SmaRTCClient {
	ctx, cancel := context.WithCancel(context.Background())
	return &SmaRTCClient{
		hubURL:      hubURL,
		ctx:         ctx,
		cancel:      cancel,
		isConnected: false,
	}
}

// Connect establishes connection to the SignalR hub
func (c *SmaRTCClient) Connect() error {
	receiver := &Receiver{client: c}

	// Create the SignalR client
	client, err := signalr.NewClient(c.ctx,
		signalr.WithReceiver(receiver),
		signalr.WithConnector(func() (signalr.Connection, error) {
			return signalr.NewHTTPConnection(c.ctx, c.hubURL)
		}),
	)

	if err != nil {
		if c.OnError != nil {
			c.OnError(fmt.Errorf("failed to create client: %w", err))
		}
		return err
	}

	c.client = client

	// Start the client
	c.client.Start()

	// Wait a moment for connection
	time.Sleep(500 * time.Millisecond)

	c.mutex.Lock()
	c.isConnected = true
	c.mutex.Unlock()

	if c.OnConnected != nil {
		c.OnConnected()
	}

	return nil
}

// JoinRoom joins a chat room with the given username
func (c *SmaRTCClient) JoinRoom(roomName, username string) error {
	c.mutex.Lock()
	c.roomName = roomName
	c.username = username
	c.mutex.Unlock()

	// Call JoinSession on the hub
	c.client.Invoke("JoinSession", roomName, username)
	return nil
}

// LeaveRoom leaves the current room
func (c *SmaRTCClient) LeaveRoom() error {
	c.mutex.RLock()
	roomName := c.roomName
	username := c.username
	c.mutex.RUnlock()

	if roomName != "" && username != "" {
		c.client.Invoke("LeaveSession", roomName, username)
	}
	return nil
}

// SendMessage sends a message to the current room
func (c *SmaRTCClient) SendMessage(message string) error {
	c.mutex.RLock()
	roomName := c.roomName
	username := c.username
	c.mutex.RUnlock()

	if roomName == "" {
		return fmt.Errorf("not in a room")
	}

	// Call SendSignalToSession on the hub
	c.client.Invoke("SendSignalToSession", roomName, message, username)
	return nil
}

// Disconnect closes the connection
func (c *SmaRTCClient) Disconnect() {
	c.LeaveRoom()
	c.cancel()

	c.mutex.Lock()
	c.isConnected = false
	c.mutex.Unlock()

	if c.OnDisconnected != nil {
		c.OnDisconnected()
	}
}

// IsConnected returns the connection status
func (c *SmaRTCClient) IsConnected() bool {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return c.isConnected
}

// GetUsername returns the current username
func (c *SmaRTCClient) GetUsername() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return c.username
}

// GetRoomName returns the current room name
func (c *SmaRTCClient) GetRoomName() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return c.roomName
}
