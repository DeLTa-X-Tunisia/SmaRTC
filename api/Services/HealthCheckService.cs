using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using TunRTC.API.Data;

namespace TunRTC.API.Services
{
    /// <summary>
    /// Comprehensive health check service for production monitoring.
    /// Checks database, cache, external services, and application state.
    /// </summary>
    public interface IHealthCheckService
    {
        Task<HealthCheckResult> GetOverallHealthAsync();
        Task<HealthCheckResult> GetLivenessAsync();
        Task<HealthCheckResult> GetReadinessAsync();
    }

    public class HealthCheckResult
    {
        public string Status { get; set; } = "unknown"; // healthy, degraded, unhealthy
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public Dictionary<string, ComponentHealth> Components { get; set; } = new();
        public string? Message { get; set; }
        public TimeSpan Uptime { get; set; }
    }

    public class ComponentHealth
    {
        public string Status { get; set; } = "unknown"; // healthy, degraded, unhealthy
        public string? Details { get; set; }
        public long? ResponseTimeMs { get; set; }
    }

    public class HealthCheckService : IHealthCheckService
    {
        private readonly TunRTCDBContext _dbContext;
        private readonly IConfiguration _configuration;
        private readonly ILogger<HealthCheckService> _logger;
        private readonly DateTime _startTime = DateTime.UtcNow;

        public HealthCheckService(
            TunRTCDBContext dbContext,
            IConfiguration configuration,
            ILogger<HealthCheckService> logger)
        {
            _dbContext = dbContext;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>Gets overall health including all components</summary>
        public async Task<HealthCheckResult> GetOverallHealthAsync()
        {
            var result = new HealthCheckResult
            {
                Uptime = DateTime.UtcNow - _startTime
            };

            // Check database
            result.Components["database"] = await CheckDatabaseAsync();

            // Check cache (Redis) if configured
            if (!string.IsNullOrEmpty(_configuration.GetConnectionString("Redis")))
            {
                result.Components["cache"] = await CheckCacheAsync();
            }

            // Check API responsiveness
            result.Components["api"] = new ComponentHealth { Status = "healthy", Details = "API is responsive" };

            // Determine overall status
            var allHealthy = result.Components.All(c => c.Value.Status == "healthy");
            var anyUnhealthy = result.Components.Any(c => c.Value.Status == "unhealthy");

            if (anyUnhealthy)
            {
                result.Status = "unhealthy";
                result.Message = "One or more critical components are unhealthy";
            }
            else if (!allHealthy)
            {
                result.Status = "degraded";
                result.Message = "Some components are degraded";
            }
            else
            {
                result.Status = "healthy";
                result.Message = "All systems operational";
            }

            return result;
        }

        /// <summary>Gets liveness status (is the app running?)</summary>
        public async Task<HealthCheckResult> GetLivenessAsync()
        {
            var result = new HealthCheckResult
            {
                Uptime = DateTime.UtcNow - _startTime
            };

            try
            {
                // Simple check - can we connect to the database?
                var canConnect = await _dbContext.Database.CanConnectAsync();
                
                if (canConnect)
                {
                    result.Status = "healthy";
                    result.Components["database"] = new ComponentHealth 
                    { 
                        Status = "healthy", 
                        Details = "Can connect to database" 
                    };
                }
                else
                {
                    result.Status = "unhealthy";
                    result.Components["database"] = new ComponentHealth 
                    { 
                        Status = "unhealthy", 
                        Details = "Cannot connect to database" 
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Liveness check failed");
                result.Status = "unhealthy";
                result.Components["error"] = new ComponentHealth 
                { 
                    Status = "unhealthy", 
                    Details = ex.Message 
                };
            }

            return result;
        }

        /// <summary>Gets readiness status (is the app ready to serve traffic?)</summary>
        public async Task<HealthCheckResult> GetReadinessAsync()
        {
            var result = new HealthCheckResult
            {
                Uptime = DateTime.UtcNow - _startTime
            };

            var sw = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                // Database check
                var dbHealth = await CheckDatabaseAsync();
                result.Components["database"] = dbHealth;

                // Cache check
                if (!string.IsNullOrEmpty(_configuration.GetConnectionString("Redis")))
                {
                    var cacheHealth = await CheckCacheAsync();
                    result.Components["cache"] = cacheHealth;
                }

                sw.Stop();

                var allReady = result.Components.All(c => c.Value.Status != "unhealthy");

                if (allReady)
                {
                    result.Status = "healthy";
                    result.Message = "Application is ready to serve traffic";
                }
                else
                {
                    result.Status = "unhealthy";
                    result.Message = "Application is not ready to serve traffic";
                }

                result.Components["check_time"] = new ComponentHealth
                {
                    Status = "healthy",
                    ResponseTimeMs = sw.ElapsedMilliseconds
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Readiness check failed");
                result.Status = "unhealthy";
                result.Message = ex.Message;
            }

            return result;
        }

        private async Task<ComponentHealth> CheckDatabaseAsync()
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                var result = await _dbContext.Database.ExecuteSqlRawAsync("SELECT 1");
                sw.Stop();

                return new ComponentHealth
                {
                    Status = "healthy",
                    Details = "Database connection successful",
                    ResponseTimeMs = sw.ElapsedMilliseconds
                };
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogWarning(ex, "Database health check failed");

                return new ComponentHealth
                {
                    Status = "unhealthy",
                    Details = $"Database connection failed: {ex.Message}",
                    ResponseTimeMs = sw.ElapsedMilliseconds
                };
            }
        }

        private async Task<ComponentHealth> CheckCacheAsync()
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                var redisConnection = _configuration.GetConnectionString("Redis");
                if (string.IsNullOrEmpty(redisConnection))
                {
                    return new ComponentHealth
                    {
                        Status = "degraded",
                        Details = "Redis not configured"
                    };
                }

                var connection = await ConnectionMultiplexer.ConnectAsync(redisConnection);
                var server = connection.GetServer(connection.GetEndPoints().First());
                
                await server.PingAsync();
                sw.Stop();

                await connection.CloseAsync();

                return new ComponentHealth
                {
                    Status = "healthy",
                    Details = "Cache connection successful",
                    ResponseTimeMs = sw.ElapsedMilliseconds
                };
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogWarning(ex, "Cache health check failed");

                return new ComponentHealth
                {
                    Status = "degraded",
                    Details = $"Cache connection failed: {ex.Message}",
                    ResponseTimeMs = sw.ElapsedMilliseconds
                };
            }
        }
    }
}
