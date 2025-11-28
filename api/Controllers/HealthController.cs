using Microsoft.AspNetCore.Mvc;
using TunRTC.API.Services;

namespace TunRTC.API.Controllers
{
    /// <summary>
    /// Health check endpoints for production monitoring.
    /// Used by orchestration systems (Kubernetes, Docker Swarm) and monitoring tools.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IHealthCheckService _healthCheckService;
        private readonly ILogger<HealthController> _logger;

        public HealthController(IHealthCheckService healthCheckService, ILogger<HealthController> logger)
        {
            _healthCheckService = healthCheckService;
            _logger = logger;
        }

        /// <summary>
        /// Overall health check - comprehensive status of all components.
        /// HTTP 200 = healthy, 503 = unhealthy or degraded
        /// </summary>
        /// <remarks>
        /// This endpoint checks:
        /// - Database connectivity
        /// - Cache (Redis) connectivity
        /// - API responsiveness
        /// 
        /// Suitable for general monitoring and dashboards.
        /// </remarks>
        /// <returns>Complete health status with component details</returns>
        [HttpGet("")]
        [HttpGet("health")]
        [ProduceResponseType(StatusCodes.Status200OK)]
        [ProduceResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<ActionResult<object>> GetHealthAsync()
        {
            var result = await _healthCheckService.GetOverallHealthAsync();
            
            if (result.Status == "unhealthy")
                return StatusCode(503, result);

            return Ok(result);
        }

        /// <summary>
        /// Liveness probe - is the application running?
        /// Used by container orchestration to determine if the pod should be restarted.
        /// HTTP 200 = alive, 503 = dead
        /// </summary>
        /// <remarks>
        /// This is a fast check that indicates whether the application process is running.
        /// If this fails, Kubernetes will restart the pod.
        /// Suitable for: Kubernetes liveness probes
        /// </remarks>
        /// <returns>Liveness status</returns>
        [HttpGet("live")]
        [ProduceResponseType(StatusCodes.Status200OK)]
        [ProduceResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<ActionResult<object>> GetLivenessAsync()
        {
            var result = await _healthCheckService.GetLivenessAsync();

            if (result.Status == "unhealthy")
                return StatusCode(503, result);

            return Ok(result);
        }

        /// <summary>
        /// Readiness probe - is the application ready to serve traffic?
        /// Used by load balancers to determine if traffic should be routed to this instance.
        /// HTTP 200 = ready, 503 = not ready
        /// </summary>
        /// <remarks>
        /// This is a more thorough check that verifies all dependencies are operational.
        /// If this fails, load balancers will NOT route traffic to this instance.
        /// Uses a startup delay before marking as ready.
        /// Suitable for: Kubernetes readiness probes, load balancer health checks
        /// </remarks>
        /// <returns>Readiness status</returns>
        [HttpGet("ready")]
        [ProduceResponseType(StatusCodes.Status200OK)]
        [ProduceResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<ActionResult<object>> GetReadinessAsync()
        {
            var result = await _healthCheckService.GetReadinessAsync();

            if (result.Status == "unhealthy")
                return StatusCode(503, result);

            return Ok(result);
        }

        /// <summary>
        /// Simple ping endpoint - is the API responding?
        /// Minimal overhead, suitable for frequent checks (every 5 seconds).
        /// </summary>
        /// <returns>Pong response</returns>
        [HttpGet("ping")]
        [ProduceResponseType(StatusCodes.Status200OK)]
        public ActionResult<object> Ping()
        {
            return Ok(new
            {
                status = "pong",
                timestamp = DateTime.UtcNow,
                version = "2.0"
            });
        }
    }
}
