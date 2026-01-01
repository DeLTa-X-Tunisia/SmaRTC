using TunRTC.API.Services;

namespace TunRTC.API.Middleware
{
    /// <summary>
    /// Middleware for applying rate limiting to all HTTP requests.
    /// Protects the API from abuse and ensures fair resource allocation.
    /// </summary>
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;

        public RateLimitingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IRateLimitService rateLimitService, ILogger<RateLimitingMiddleware> logger)
        {
            logger.LogInformation("Processing request");
            var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
            var endpoint = context.Request.Path.ToString().ToLower();

            // Skip health checks and ping endpoints from rate limiting
            if (endpoint.Contains("/health") || endpoint.Contains("/ping"))
            {
                await _next(context);
                return;
            }

            var isAllowed = rateLimitService.IsRequestAllowed(userId, endpoint);
            var status = rateLimitService.GetStatus(userId, endpoint);

            // Add rate limit headers to response
            context.Response.Headers.Append("X-RateLimit-Limit", status.Limit.ToString());
            context.Response.Headers.Append("X-RateLimit-Remaining", Math.Max(0, status.Remaining).ToString());
            context.Response.Headers.Append("X-RateLimit-Reset", status.ResetTime.ToString());

            if (!isAllowed)
            {
                logger.LogWarning($"Rate limit exceeded for user {userId} on endpoint {endpoint}");
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Too Many Requests",
                    message = "Rate limit exceeded. Please try again later.",
                    retryAfter = Math.Max(1, status.ResetTime - DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
                    rateLimit = new
                    {
                        limit = status.Limit,
                        remaining = status.Remaining,
                        resetTime = status.ResetTime
                    }
                });
                return;
            }

            await _next(context);
        }
    }

    public static class RateLimitingMiddlewareExtensions
    {
        public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RateLimitingMiddleware>();
        }
    }
}
