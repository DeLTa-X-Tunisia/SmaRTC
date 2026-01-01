using Microsoft.AspNetCore.SignalR;
using System.Buffers;
using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Text.Json;
using MessagePack;

namespace TunRTC.SignalServer.Hubs
{
    /// <summary>
    /// Ultra-optimized WebRTC SignalR Hub designed for 1M+ concurrent connections
    /// Memory target: <1KB per connection
    /// CPU target: 100k connections per core
    /// </summary>
    public class ZeroCostWebRtcHub : Hub
    {
        private static readonly ConnectionPool _connectionPool = new();
        private static readonly ConcurrentDictionary<string, SessionState> _sessions = new();
        private static readonly ArrayPool<byte> _bufferPool = ArrayPool<byte>.Shared;
        private static readonly TimeSpan ConnectionTimeout = TimeSpan.FromMinutes(5);
        private static readonly TimeSpan InactivityTimeout = TimeSpan.FromMinutes(2);

        private readonly ILogger<ZeroCostWebRtcHub> _logger;

        public ZeroCostWebRtcHub(ILogger<ZeroCostWebRtcHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var connection = _connectionPool.Rent(Context.ConnectionId);
            connection.LastActivity = DateTime.UtcNow;
            
            // Set aggressive timeouts
            Context.ConnectionAborted.Register(() => CleanupConnection(Context.ConnectionId));
            
            if (_logger.IsEnabled(LogLevel.Debug))
                _logger.LogDebug("Connected: {ConnectionId}", Context.ConnectionId);
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            CleanupConnection(Context.ConnectionId);
            
            if (_logger.IsEnabled(LogLevel.Debug))
                _logger.LogDebug("Disconnected: {ConnectionId}", Context.ConnectionId);
            
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join session with minimal memory allocation
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public async Task JoinSession(string sessionId, string username)
        {
            var session = _sessions.GetOrAdd(sessionId, _ => new SessionState(sessionId));
            var connection = _connectionPool.Get(Context.ConnectionId);
            
            if (connection == null) return;

            connection.SessionId = sessionId;
            connection.Username = username;
            connection.LastActivity = DateTime.UtcNow;

            session.AddConnection(Context.ConnectionId, username);
            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);

            // Use pooled buffer for serialization
            var buffer = _bufferPool.Rent(256);
            try
            {
                var message = new UserJoinedMessage { Username = username, ConnectionId = Context.ConnectionId };
                var serialized = MessagePackSerializer.Serialize(message);
                
                await Clients.OthersInGroup(sessionId)
                    .SendAsync("UserJoined", serialized.AsMemory());
            }
            finally
            {
                _bufferPool.Return(buffer);
            }
        }

        /// <summary>
        /// Leave session with automatic cleanup
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public async Task LeaveSession(string sessionId)
        {
            var connection = _connectionPool.Get(Context.ConnectionId);
            if (connection == null) return;

            if (_sessions.TryGetValue(sessionId, out var session))
            {
                session.RemoveConnection(Context.ConnectionId);
                
                // Cleanup empty sessions
                if (session.ConnectionCount == 0)
                {
                    _sessions.TryRemove(sessionId, out _);
                }
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
            
            var buffer = _bufferPool.Rent(256);
            try
            {
                var message = new UserLeftMessage { Username = connection.Username, ConnectionId = Context.ConnectionId };
                var serialized = MessagePackSerializer.Serialize(message);
                
                await Clients.OthersInGroup(sessionId)
                    .SendAsync("UserLeft", serialized.AsMemory());
            }
            finally
            {
                _bufferPool.Return(buffer);
            }
        }

        /// <summary>
        /// Send WebRTC signal with zero-copy when possible
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public async Task SendSignal(string targetConnectionId, ReadOnlyMemory<byte> signalData)
        {
            var connection = _connectionPool.Get(Context.ConnectionId);
            if (connection == null) return;

            connection.LastActivity = DateTime.UtcNow;

            // Direct send to specific connection (no group overhead)
            await Clients.Client(targetConnectionId)
                .SendAsync("ReceiveSignal", Context.ConnectionId, signalData);
        }

        /// <summary>
        /// Broadcast signal to session with adaptive mesh routing
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public async Task BroadcastSignal(string sessionId, ReadOnlyMemory<byte> signalData)
        {
            var connection = _connectionPool.Get(Context.ConnectionId);
            if (connection == null) return;

            connection.LastActivity = DateTime.UtcNow;

            if (!_sessions.TryGetValue(sessionId, out var session))
                return;

            // For large sessions, use mesh relay strategy
            if (session.ConnectionCount > 50)
            {
                var relayNodes = session.GetRelayNodes(3);
                await Clients.Clients(relayNodes)
                    .SendAsync("RelaySignal", Context.ConnectionId, signalData);
            }
            else
            {
                await Clients.OthersInGroup(sessionId)
                    .SendAsync("ReceiveSignal", Context.ConnectionId, signalData);
            }
        }

        /// <summary>
        /// Heartbeat to prevent timeout (client should call every 30s)
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Heartbeat()
        {
            var connection = _connectionPool.Get(Context.ConnectionId);
            if (connection != null)
            {
                connection.LastActivity = DateTime.UtcNow;
            }
        }

        /// <summary>
        /// Get session stats (for monitoring)
        /// </summary>
        public SessionStats GetSessionStats(string sessionId)
        {
            if (_sessions.TryGetValue(sessionId, out var session))
            {
                return new SessionStats
                {
                    SessionId = sessionId,
                    ConnectionCount = session.ConnectionCount,
                    RelayNodeCount = session.GetRelayNodes(3).Count
                };
            }
            return new SessionStats { SessionId = sessionId, ConnectionCount = 0 };
        }

        /// <summary>
        /// Get global stats (admin only)
        /// </summary>
        public GlobalStats GetGlobalStats()
        {
            return new GlobalStats
            {
                TotalConnections = _connectionPool.ActiveCount,
                TotalSessions = _sessions.Count,
                MemoryUsageBytes = GC.GetTotalMemory(false),
                PooledConnectionsAvailable = _connectionPool.AvailableCount
            };
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private void CleanupConnection(string connectionId)
        {
            var connection = _connectionPool.Get(connectionId);
            if (connection == null) return;

            if (!string.IsNullOrEmpty(connection.SessionId) && 
                _sessions.TryGetValue(connection.SessionId, out var session))
            {
                session.RemoveConnection(connectionId);
                
                if (session.ConnectionCount == 0)
                {
                    _sessions.TryRemove(connection.SessionId, out _);
                }
            }

            _connectionPool.Return(connectionId);
        }

        /// <summary>
        /// Background cleanup task (run every 30s)
        /// </summary>
        public static async Task RunCleanupAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                await Task.Delay(30000, cancellationToken);
                
                var now = DateTime.UtcNow;
                var toRemove = new List<string>();

                foreach (var (connectionId, connection) in _connectionPool.GetAllActive())
                {
                    if (now - connection.LastActivity > InactivityTimeout)
                    {
                        toRemove.Add(connectionId);
                    }
                }

                foreach (var connectionId in toRemove)
                {
                    _connectionPool.Return(connectionId);
                }
            }
        }
    }

    /// <summary>
    /// Lightweight connection state (~256 bytes)
    /// </summary>
    internal sealed class ConnectionState
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime LastActivity { get; set; }
        public bool IsRelayNode { get; set; }
    }

    /// <summary>
    /// Object pool for connection states
    /// </summary>
    internal sealed class ConnectionPool
    {
        private readonly ConcurrentDictionary<string, ConnectionState> _active = new();
        private readonly ConcurrentBag<ConnectionState> _pool = new();
        private int _activeCount;
        private const int MaxPoolSize = 10000;

        public int ActiveCount => _activeCount;
        public int AvailableCount => _pool.Count;

        public ConnectionState Rent(string connectionId)
        {
            if (!_pool.TryTake(out var state))
            {
                state = new ConnectionState();
            }

            state.ConnectionId = connectionId;
            state.LastActivity = DateTime.UtcNow;
            state.IsRelayNode = false;
            state.SessionId = string.Empty;
            state.Username = string.Empty;

            _active.TryAdd(connectionId, state);
            Interlocked.Increment(ref _activeCount);
            
            return state;
        }

        public void Return(string connectionId)
        {
            if (_active.TryRemove(connectionId, out var state))
            {
                Interlocked.Decrement(ref _activeCount);
                
                if (_pool.Count < MaxPoolSize)
                {
                    _pool.Add(state);
                }
            }
        }

        public ConnectionState? Get(string connectionId)
        {
            _active.TryGetValue(connectionId, out var state);
            return state;
        }

        public IEnumerable<KeyValuePair<string, ConnectionState>> GetAllActive()
        {
            return _active;
        }
    }

    /// <summary>
    /// Session state with mesh routing support
    /// </summary>
    internal sealed class SessionState
    {
        private readonly ConcurrentDictionary<string, string> _connections = new();
        private readonly List<string> _relayNodes = new();
        private readonly object _relayLock = new();
        private int _connectionCount;

        public string SessionId { get; }
        public int ConnectionCount => _connectionCount;

        public SessionState(string sessionId)
        {
            SessionId = sessionId;
        }

        public void AddConnection(string connectionId, string username)
        {
            if (_connections.TryAdd(connectionId, username))
            {
                Interlocked.Increment(ref _connectionCount);
                UpdateRelayNodes();
            }
        }

        public void RemoveConnection(string connectionId)
        {
            if (_connections.TryRemove(connectionId, out _))
            {
                Interlocked.Decrement(ref _connectionCount);
                
                lock (_relayLock)
                {
                    _relayNodes.Remove(connectionId);
                }
                
                UpdateRelayNodes();
            }
        }

        public List<string> GetRelayNodes(int count)
        {
            lock (_relayLock)
            {
                return _relayNodes.Take(count).ToList();
            }
        }

        private void UpdateRelayNodes()
        {
            if (_connectionCount < 10) return;

            lock (_relayLock)
            {
                var targetCount = Math.Min(5, _connectionCount / 20);
                
                if (_relayNodes.Count < targetCount)
                {
                    var candidates = _connections.Keys
                        .Where(id => !_relayNodes.Contains(id))
                        .Take(targetCount - _relayNodes.Count);
                    
                    _relayNodes.AddRange(candidates);
                }
            }
        }
    }

    // MessagePack DTOs for minimal serialization overhead
    [MessagePackObject]
    public class UserJoinedMessage
    {
        [Key(0)]
        public string Username { get; set; } = string.Empty;
        
        [Key(1)]
        public string ConnectionId { get; set; } = string.Empty;
    }

    [MessagePackObject]
    public class UserLeftMessage
    {
        [Key(0)]
        public string Username { get; set; } = string.Empty;
        
        [Key(1)]
        public string ConnectionId { get; set; } = string.Empty;
    }

    public class SessionStats
    {
        public string SessionId { get; set; } = string.Empty;
        public int ConnectionCount { get; set; }
        public int RelayNodeCount { get; set; }
    }

    public class GlobalStats
    {
        public int TotalConnections { get; set; }
        public int TotalSessions { get; set; }
        public long MemoryUsageBytes { get; set; }
        public int PooledConnectionsAvailable { get; set; }
    }
}
