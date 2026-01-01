# Development Guide

This guide provides essential information for developers working on the SmaRTC platform, covering project structure, testing, database management, and coding conventions.

## 1. Project Structure

The SmaRTC solution is organized into several projects, each with a specific responsibility:

-   `api/`: The main ASP.NET Core Web API project. It contains the controllers, business logic, data models, and authentication services.
-   `api.tests/`: A xUnit project containing unit and integration tests for the `api` project.
-   `database/`: Contains the raw SQL schema (`schema.sql`) for reference.
-   `deploy/`: Holds all Docker-related files, including the `docker-compose.yml` file and configurations for NGINX, Prometheus, and Janus.
-   `docs/`: Contains all project documentation.
-   `sdk/`: Client-side SDKs for various platforms (C#, JavaScript, Swift).
-   `signal-server/`: An ASP.NET Core project implementing the SignalR hub for real-time WebRTC signaling.
-   `stun-turn/`: Configuration for the Coturn STUN/TURN server.

## 2. Running Tests

The project includes a comprehensive suite of tests to ensure code quality and correctness.

### Running All Tests

To run all tests in the solution, execute the following command from the root directory:

```powershell
dotnet test SmaRTC.sln
```

### Test Project Structure

Tests in the `api.tests` project are organized by controller, making it easy to locate tests for specific functionality (e.g., `AuthControllerTests.cs`, `SessionControllerTests.cs`).

## 3. Database Migrations (Entity Framework Core)

Database schema changes are managed using EF Core migrations.

### When to Create a Migration

You must create a new migration whenever you make a change to the data models in `api/Models/Entities.cs`, such as:
- Adding or removing a property from a model.
- Changing a property's data type.
- Adding or removing a model class.

### How to Create a Migration

1.  Ensure the `Microsoft.EntityFrameworkCore.Design` package is installed in the `api` project.
2.  From the root directory, run the following command, replacing `<MigrationName>` with a descriptive name for your change (e.g., `AddUserAvatarUrl`).

    ```powershell
    dotnet ef migrations add <MigrationName> --project api
    ```

### Applying Migrations

Migrations are applied automatically when the `api` service starts up. This behavior is configured in `api/Program.cs`.

## 4. Coding Conventions

-   **C#**: Follow the standard Microsoft C# coding conventions.
-   **RESTful API**: Adhere to REST principles for API design. Use standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and status codes.
-   **Asynchronous Programming**: Use `async` and `await` for all I/O-bound operations, especially database and network calls, to ensure the application remains responsive and scalable.
-   **Dependency Injection**: Use constructor injection to provide services to controllers and other classes. Register services in `api/Program.cs`.

---

*This guide is current as of November 14, 2025.*
