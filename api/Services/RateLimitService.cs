using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace TunRTC.API.Services
{
    /// <summary>
    /// Enterprise-grade rate limiting service with per-user and per-endpoint limits.
    /// Prevents abuse and ensures fair resource allocation across all clients.
    /// </summary>
    public interface IRateLimitService
    {
        /// <summary>Checks if a request should be allowed based on rate limit rules.</summary>
        bool IsRequestAllowed(string identifier, string endpoint);
        
        /// <summary>Gets current rate limit status for a client.</summary>
        RateLimitStatus GetStatus(string identifier, string endpoint);
        
        /// <summary>Resets rate limit for a specific client.</summary>
        void ResetLimit(string identifier);
    }

    public class RateLimitStatus
    {
        /// <summary>Total requests allowed in the window</summary>
        public int Limit { get; set; }
        
        /// <summary>Remaining requests in current window</summary>
        public int Remaining { get; set; }
        
        /// <summary>Unix timestamp when the window resets</summary>
        public long ResetTime { get; set; }
        
        /// <summary>Is the client currently rate limited?</summary>
        public bool IsLimited { get; set; }
    }

    public class RateLimitService : IRateLimitService
    {
        private readonly IConfiguration _configuration;
        private readonly ConcurrentDictionary<string, ClientRateLimit> _rateLimits;
        private readonly Timer _cleanupTimer;

        // Default limits (per minute)
        private readonly Dictionary<string, int> _endpointLimits = new()
        {
            { "/api/auth/login", 5 },           // 5 login attempts per minute
            { "/api/auth/register", 3 },        // 3 registrations per minute
            { "/api/session", 30 },             // 30 session creates per minute
            { "/api/webrtc/ice", 100 },         // 100 ICE requests per minute
            { "/api/admin/users", 10 },         // 10 admin requests per minute
            { "default", 60 }                   // 60 default requests per minute
        };

        public RateLimitService(IConfiguration configuration)
        {
            _configuration = configuration;
            _rateLimits = new ConcurrentDictionary<string, ClientRateLimit>();
            
            // Cleanup expired entries every 5 minutes
            _cleanupTimer = new Timer(Cleanup, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
        }

        public bool IsRequestAllowed(string identifier, string endpoint)
        {
            if (string.IsNullOrEmpty(identifier))
                identifier = "anonymous";

            var key = $"{identifier}:{endpoint}";
            var limit = GetEndpointLimit(endpoint);
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            var clientLimit = _rateLimits.AddOrUpdate(key, 
                new ClientRateLimit { Limit = limit, WindowStart = now, Count = 1 },
                (k, existing) =>
                {
                    var windowElapsed = now - existing.WindowStart;
                    var windowDurationSeconds = 60; // 1 minute window

                    // Reset window if it has expired
                    if (windowElapsed >= windowDurationSeconds)
                    {
                        existing.WindowStart = now;
                        existing.Count = 1;
                    }
                    else
                    {
                        existing.Count++;
                    }

                    return existing;
                });

            var windowElapsedSeconds = now - clientLimit.WindowStart;
            var allowed = clientLimit.Count <= clientLimit.Limit;

            return allowed;
        }

        public RateLimitStatus GetStatus(string identifier, string endpoint)
        {
            if (string.IsNullOrEmpty(identifier))
                identifier = "anonymous";

            var key = $"{identifier}:{endpoint}";
            var limit = GetEndpointLimit(endpoint);
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            if (!_rateLimits.TryGetValue(key, out var clientLimit))
            {
                return new RateLimitStatus
                {
                    Limit = limit,
                    Remaining = limit,
                    ResetTime = now + 60,
                    IsLimited = false
                };
            }

            var windowElapsedSeconds = now - clientLimit.WindowStart;
            var windowDurationSeconds = 60;
            var remaining = Math.Max(0, clientLimit.Limit - clientLimit.Count);
            var resetTime = clientLimit.WindowStart + windowDurationSeconds;

            return new RateLimitStatus
            {
                Limit = clientLimit.Limit,
                Remaining = remaining,
                ResetTime = resetTime,
                IsLimited = clientLimit.Count > clientLimit.Limit
            };
        }

        public void ResetLimit(string identifier)
        {
            var keysToRemove = _rateLimits.Keys
                .Where(k => k.StartsWith($"{identifier}:"))
                .ToList();

            foreach (var key in keysToRemove)
            {
                _rateLimits.TryRemove(key, out _);
            }
        }

        private int GetEndpointLimit(string endpoint)
        {
            // Normalize endpoint
            var normalizedEndpoint = endpoint?.ToLower().Trim() ?? "default";

            // Check for exact match
            if (_endpointLimits.TryGetValue(normalizedEndpoint, out var limit))
                return limit;

            // Check for pattern match (e.g., "/api/session/*")
            var matchingPattern = _endpointLimits.Keys
                .FirstOrDefault(k => k.Contains("*") && PatternMatches(normalizedEndpoint, k));

            if (matchingPattern != null)
                return _endpointLimits[matchingPattern];

            return _endpointLimits["default"];
        }

        private bool PatternMatches(string endpoint, string pattern)
        {
            if (pattern == "default")
                return true;

            var patternParts = pattern.Split('*');
            var startsWith = endpoint.StartsWith(patternParts[0]);
            if (patternParts.Length > 1 && !string.IsNullOrEmpty(patternParts[1]))
            {
                return startsWith && endpoint.EndsWith(patternParts[1]);
            }
            return startsWith;
        }

        private void Cleanup(object? state)
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var expiredKeys = _rateLimits
                .Where(x => (now - x.Value.WindowStart) > 300) // Keep 5 minutes of history
                .Select(x => x.Key)
                .ToList();

            foreach (var key in expiredKeys)
            {
                _rateLimits.TryRemove(key, out _);
            }
        }

        private class ClientRateLimit
        {
            public int Limit { get; set; }
            public long WindowStart { get; set; }
            public int Count { get; set; }
        }
    }
}
