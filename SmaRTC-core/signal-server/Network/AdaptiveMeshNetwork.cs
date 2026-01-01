using System.Collections.Concurrent;
using System.Diagnostics;
using System.Runtime.CompilerServices;

namespace TunRTC.SignalServer.Network
{
    /// <summary>
    /// Adaptive P2P mesh network for zero-cost scaling
    /// Automatically designates relay nodes among clients for efficient routing
    /// Target: Support 1M+ connections through intelligent peer-to-peer architecture
    /// </summary>
    public class AdaptiveMeshNetwork
    {
        private readonly ConcurrentDictionary<string, PeerNode> _nodes = new();
        private readonly ConcurrentDictionary<string, MeshTopology> _topologies = new();
        private readonly ILogger<AdaptiveMeshNetwork> _logger;
        
        private const int MaxDirectPeers = 8; // Max direct P2P connections per client
        private const int RelayNodeThreshold = 50; // When to start using relay strategy
        private const int OptimalMeshSize = 20; // Optimal size for full mesh
        private const double RelayNodeRatio = 0.1; // 10% of nodes become relays in large sessions

        public AdaptiveMeshNetwork(ILogger<AdaptiveMeshNetwork> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Add peer to mesh network
        /// </summary>
        public void AddPeer(string peerId, string sessionId, PeerCapabilities capabilities)
        {
            var node = new PeerNode
            {
                PeerId = peerId,
                SessionId = sessionId,
                Capabilities = capabilities,
                JoinedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow,
                IsRelayNode = false
            };

            _nodes.TryAdd(peerId, node);

            var topology = _topologies.GetOrAdd(sessionId, _ => new MeshTopology(sessionId));
            topology.AddNode(node);

            // Recalculate topology if needed
            if (topology.NodeCount > RelayNodeThreshold)
            {
                RecalculateTopology(sessionId);
            }
        }

        /// <summary>
        /// Remove peer from mesh network
        /// </summary>
        public void RemovePeer(string peerId)
        {
            if (_nodes.TryRemove(peerId, out var node))
            {
                if (_topologies.TryGetValue(node.SessionId, out var topology))
                {
                    topology.RemoveNode(peerId);
                    
                    // If it was a relay node, recalculate topology
                    if (node.IsRelayNode)
                    {
                        RecalculateTopology(node.SessionId);
                    }

                    // Cleanup empty topologies
                    if (topology.NodeCount == 0)
                    {
                        _topologies.TryRemove(node.SessionId, out _);
                    }
                }
            }
        }

        /// <summary>
        /// Get optimal routing path for message delivery
        /// Returns direct peers or relay nodes based on topology
        /// </summary>
        public RoutingPath GetRoutingPath(string sourcePeerId, string? targetPeerId = null)
        {
            if (!_nodes.TryGetValue(sourcePeerId, out var sourceNode))
            {
                return RoutingPath.Empty;
            }

            if (!_topologies.TryGetValue(sourceNode.SessionId, out var topology))
            {
                return RoutingPath.Empty;
            }

            // Update last seen
            sourceNode.LastSeen = DateTime.UtcNow;

            // For small sessions, use full mesh (everyone connects to everyone)
            if (topology.NodeCount <= OptimalMeshSize)
            {
                return new RoutingPath
                {
                    RoutingStrategy = RoutingStrategy.FullMesh,
                    DirectPeers = topology.GetAllPeers(sourcePeerId).Take(MaxDirectPeers).ToList(),
                    RelayNodes = new List<string>()
                };
            }

            // For medium sessions, use hybrid approach
            if (topology.NodeCount <= RelayNodeThreshold)
            {
                return new RoutingPath
                {
                    RoutingStrategy = RoutingStrategy.Hybrid,
                    DirectPeers = topology.GetNearestPeers(sourcePeerId, MaxDirectPeers / 2).ToList(),
                    RelayNodes = topology.GetRelayNodes(2).ToList()
                };
            }

            // For large sessions, use relay-based routing
            return new RoutingPath
            {
                RoutingStrategy = RoutingStrategy.RelayBased,
                DirectPeers = topology.GetNearestPeers(sourcePeerId, 2).ToList(),
                RelayNodes = topology.GetRelayNodes(3).ToList()
            };
        }

        /// <summary>
        /// Update peer latency information for route optimization
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void UpdatePeerLatency(string peerId, string targetPeerId, int latencyMs)
        {
            if (_nodes.TryGetValue(peerId, out var node))
            {
                node.UpdateLatency(targetPeerId, latencyMs);
                node.LastSeen = DateTime.UtcNow;
            }
        }

        /// <summary>
        /// Mark peer as available for relay duties (client opt-in)
        /// </summary>
        public void SetRelayCapability(string peerId, bool canRelay)
        {
            if (_nodes.TryGetValue(peerId, out var node))
            {
                node.Capabilities.CanRelay = canRelay;
                
                if (node.SessionId != null)
                {
                    RecalculateTopology(node.SessionId);
                }
            }
        }

        /// <summary>
        /// Get session topology stats
        /// </summary>
        public TopologyStats GetTopologyStats(string sessionId)
        {
            if (!_topologies.TryGetValue(sessionId, out var topology))
            {
                return new TopologyStats { SessionId = sessionId };
            }

            return new TopologyStats
            {
                SessionId = sessionId,
                TotalNodes = topology.NodeCount,
                RelayNodes = topology.RelayNodeCount,
                AverageLatency = topology.CalculateAverageLatency(),
                RoutingStrategy = topology.CurrentStrategy
            };
        }

        /// <summary>
        /// Recalculate optimal topology for session
        /// </summary>
        private void RecalculateTopology(string sessionId)
        {
            if (!_topologies.TryGetValue(sessionId, out var topology))
                return;

            var nodeCount = topology.NodeCount;

            // Determine strategy based on size
            if (nodeCount <= OptimalMeshSize)
            {
                topology.CurrentStrategy = RoutingStrategy.FullMesh;
                topology.ClearRelayNodes();
            }
            else if (nodeCount <= RelayNodeThreshold)
            {
                topology.CurrentStrategy = RoutingStrategy.Hybrid;
                topology.SelectRelayNodes((int)(nodeCount * 0.05)); // 5% as relays
            }
            else
            {
                topology.CurrentStrategy = RoutingStrategy.RelayBased;
                var relayCount = (int)(nodeCount * RelayNodeRatio);
                topology.SelectRelayNodes(Math.Max(3, relayCount));
            }

            _logger.LogInformation(
                "Topology recalculated for session {SessionId}: {NodeCount} nodes, {RelayCount} relays, strategy: {Strategy}",
                sessionId, nodeCount, topology.RelayNodeCount, topology.CurrentStrategy);
        }

        /// <summary>
        /// Background maintenance task
        /// </summary>
        public async Task RunMaintenanceAsync(CancellationToken cancellationToken)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                await Task.Delay(60000, cancellationToken); // Run every minute

                var now = DateTime.UtcNow;
                var staleTimeout = TimeSpan.FromMinutes(5);
                var staleNodes = new List<string>();

                // Find stale nodes
                foreach (var (peerId, node) in _nodes)
                {
                    if (now - node.LastSeen > staleTimeout)
                    {
                        staleNodes.Add(peerId);
                    }
                }

                // Remove stale nodes
                foreach (var peerId in staleNodes)
                {
                    RemovePeer(peerId);
                }

                if (staleNodes.Count > 0)
                {
                    _logger.LogInformation("Removed {Count} stale nodes", staleNodes.Count);
                }
            }
        }
    }

    /// <summary>
    /// Represents a peer node in the mesh network
    /// </summary>
    public class PeerNode
    {
        public string PeerId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public PeerCapabilities Capabilities { get; set; } = new();
        public DateTime JoinedAt { get; set; }
        public DateTime LastSeen { get; set; }
        public bool IsRelayNode { get; set; }
        
        private readonly ConcurrentDictionary<string, int> _latencies = new();
        
        public void UpdateLatency(string targetPeerId, int latencyMs)
        {
            _latencies[targetPeerId] = latencyMs;
        }

        public int GetLatency(string targetPeerId)
        {
            return _latencies.TryGetValue(targetPeerId, out var latency) ? latency : int.MaxValue;
        }

        public double GetAverageLatency()
        {
            var values = _latencies.Values.ToList();
            return values.Count > 0 ? values.Average() : 0;
        }
    }

    /// <summary>
    /// Peer capabilities for relay selection
    /// </summary>
    public class PeerCapabilities
    {
        public bool CanRelay { get; set; }
        public bool HasStableConnection { get; set; } = true;
        public int BandwidthMbps { get; set; } = 10;
        public double CpuScore { get; set; } = 1.0; // 0-1 scale
    }

    /// <summary>
    /// Mesh topology for a session
    /// </summary>
    public class MeshTopology
    {
        private readonly ConcurrentDictionary<string, PeerNode> _nodes = new();
        private readonly List<string> _relayNodes = new();
        private readonly object _relayLock = new();

        public string SessionId { get; }
        public int NodeCount => _nodes.Count;
        public int RelayNodeCount => _relayNodes.Count;
        public RoutingStrategy CurrentStrategy { get; set; } = RoutingStrategy.FullMesh;

        public MeshTopology(string sessionId)
        {
            SessionId = sessionId;
        }

        public void AddNode(PeerNode node)
        {
            _nodes.TryAdd(node.PeerId, node);
        }

        public void RemoveNode(string peerId)
        {
            _nodes.TryRemove(peerId, out _);
            
            lock (_relayLock)
            {
                _relayNodes.Remove(peerId);
            }
        }

        public IEnumerable<string> GetAllPeers(string excludePeerId)
        {
            return _nodes.Keys.Where(id => id != excludePeerId);
        }

        public IEnumerable<string> GetNearestPeers(string sourcePeerId, int count)
        {
            if (!_nodes.TryGetValue(sourcePeerId, out var sourceNode))
            {
                return Enumerable.Empty<string>();
            }

            return _nodes.Values
                .Where(n => n.PeerId != sourcePeerId)
                .OrderBy(n => sourceNode.GetLatency(n.PeerId))
                .Take(count)
                .Select(n => n.PeerId);
        }

        public List<string> GetRelayNodes(int maxCount)
        {
            lock (_relayLock)
            {
                return _relayNodes.Take(maxCount).ToList();
            }
        }

        public void SelectRelayNodes(int targetCount)
        {
            lock (_relayLock)
            {
                _relayNodes.Clear();

                // Select nodes with best capabilities and lowest average latency
                var candidates = _nodes.Values
                    .Where(n => n.Capabilities.CanRelay)
                    .OrderByDescending(n => n.Capabilities.BandwidthMbps)
                    .ThenBy(n => n.GetAverageLatency())
                    .Take(targetCount)
                    .ToList();

                foreach (var node in candidates)
                {
                    node.IsRelayNode = true;
                    _relayNodes.Add(node.PeerId);
                }
            }
        }

        public void ClearRelayNodes()
        {
            lock (_relayLock)
            {
                foreach (var peerId in _relayNodes)
                {
                    if (_nodes.TryGetValue(peerId, out var node))
                    {
                        node.IsRelayNode = false;
                    }
                }
                _relayNodes.Clear();
            }
        }

        public double CalculateAverageLatency()
        {
            var latencies = _nodes.Values
                .Select(n => n.GetAverageLatency())
                .Where(l => l > 0)
                .ToList();

            return latencies.Count > 0 ? latencies.Average() : 0;
        }
    }

    /// <summary>
    /// Routing strategy for mesh network
    /// </summary>
    public enum RoutingStrategy
    {
        FullMesh,      // Everyone connects to everyone (< 20 peers)
        Hybrid,        // Mix of direct + relay (20-50 peers)
        RelayBased     // Primarily relay routing (50+ peers)
    }

    /// <summary>
    /// Routing path information
    /// </summary>
    public class RoutingPath
    {
        public static readonly RoutingPath Empty = new()
        {
            RoutingStrategy = RoutingStrategy.FullMesh,
            DirectPeers = new List<string>(),
            RelayNodes = new List<string>()
        };

        public RoutingStrategy RoutingStrategy { get; set; }
        public List<string> DirectPeers { get; set; } = new();
        public List<string> RelayNodes { get; set; } = new();
    }

    /// <summary>
    /// Topology statistics
    /// </summary>
    public class TopologyStats
    {
        public string SessionId { get; set; } = string.Empty;
        public int TotalNodes { get; set; }
        public int RelayNodes { get; set; }
        public double AverageLatency { get; set; }
        public RoutingStrategy RoutingStrategy { get; set; }
    }
}
