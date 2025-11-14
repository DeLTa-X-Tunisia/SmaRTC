# Troubleshooting Archive

This document archives key issues encountered during the development and stabilization of the SmaRTC platform. It serves as a reference for future debugging and provides insight into the system's intricacies.

*Date of Archive: November 14, 2025*

---

### 1. Entity Framework Core: Migrations & Model Mismatches

-   **Symptom**: The `api` container would crash on startup. Logs showed a `Microsoft.EntityFrameworkCore.Migrations.PendingModelChangesWarning` fatal error.
-   **Problem**: The EF Core model classes (in `Models/Entities.cs`) were out of sync with the database schema. The application was configured to treat this as a fatal error in production environments.
-   **Resolution**:
    1.  **Tooling**: The `Microsoft.EntityFrameworkCore.Design` NuGet package was added to the `api.csproj` file to enable EF Core command-line tools.
    2.  **Migration Creation**: A new migration was created to align the database schema with the updated models:
        ```powershell
        dotnet ef migrations add <MigrationName> --project api
        ```
    3.  **Database Update**: The migrations were applied automatically on application startup. This process was configured in `Program.cs`.
-   **Key Takeaway**: Always generate and apply a new migration after any change to the EF Core model classes.

---

### 2. Docker Networking: Container Port Mismatch

-   **Symptom**: The `test-api.ps1` script failed with a "Connection Refused" error, even though all containers appeared to be running.
-   **Problem**: The `nginx` container was configured to proxy requests to the `api` service on port `8080`. However, the `api` service's Dockerfile only exposed ports `80` and `443` and was not configured to listen on `8080`.
-   **Resolution**:
    1.  **Dockerfile Update**: The `api/Dockerfile` was modified to expose the correct port:
        ```dockerfile
        EXPOSE 8080
        ```
    2.  **Environment Variable**: The `ASPNETCORE_URLS` environment variable was set in the Dockerfile to instruct the ASP.NET Core Kestrel server to listen on port `8080`:
        ```dockerfile
        ENV ASPNETCORE_URLS=http://+:8080
        ```
-   **Key Takeaway**: Ensure that the ports exposed in a service's Dockerfile match both the application's listening configuration and the port mappings in any upstream reverse proxies.

---

### 3. JWT Authentication: Incorrect Claim Mapping & User Identification

-   **Symptom**: Authenticated requests to the `SessionController` were failing with a `500 Internal Server Error`. Logs revealed a `System.FormatException` when trying to parse a username string as a numeric user ID.
-   **Problem**: This was a multi-layered issue:
    1.  **Incorrect Claim Generation**: In `AuthController`, the JWT's `sub` (subject) claim was being populated with the `user.Username` instead of the unique `user.Id`.
    2.  **Default Claim Mapping**: By default, the ASP.NET Core JWT handler maps the `sub` claim to the `NameIdentifier` property in the `ClaimsPrincipal`.
    3.  **Incorrect Claim Retrieval**: The `SessionController` was correctly trying to read `User.FindFirstValue(ClaimTypes.NameIdentifier)`, but due to the previous two issues, it was receiving the username string instead of the numeric ID, causing the parsing to fail.
-   **Resolution**:
    1.  **Disable Default Mapping**: In `Program.cs`, the default claim map was cleared. This is a critical step to ensure that the claims in the token are not unexpectedly transformed by the middleware.
        ```csharp
        using System.IdentityModel.Tokens.Jwt;
        // ...
        JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
        ```
    2.  **Correct Claim Generation**: In `AuthController.cs`, the token generation logic was fixed to use the correct claims: the `sub` claim for the user's unique ID and the `name` claim for the username.
        ```csharp
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            // ... other claims
        };
        ```
    3.  **Correct Claim Retrieval**: The `SessionController` was updated to use `User.FindFirstValue(ClaimTypes.NameIdentifier)` to retrieve the user's ID.
-   **Key Takeaway**: Be explicit about JWT claim generation and consumption. Disabling the default inbound claim mapping (`DefaultInboundClaimTypeMap.Clear()`) provides full control and prevents subtle, hard-to-debug authentication and authorization issues. Always use the user's immutable, unique ID for the `sub` claim.
