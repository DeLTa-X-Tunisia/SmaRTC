# Docker Startup Guide

This guide provides detailed instructions for setting up, running, and managing the SmaRTC application stack using Docker Compose.

## Prerequisites

-   **Docker**: Ensure Docker is installed and running on your system.
-   **Docker Compose**: Ensure Docker Compose is installed.

## 1. Environment Configuration

All service configurations are managed via environment variables set in the `deploy/docker-compose.yml` file. Before the first launch, you must configure the following critical variables:

-   **`POSTGRES_PASSWORD`**: The password for the PostgreSQL database.
-   **`Jwt:Key`**: A long, random, and secret string for signing JWT tokens.
-   **`Jwt:Issuer`**: The issuer for the JWT tokens (e.g., `SmaRTC`).
-   **`Jwt:Audience`**: The audience for the JWT tokens (e.g., `SmaRTC.Users`).
-   **`TURN_STATIC_AUTH_SECRET`**: The static authentication secret for the Coturn (STUN/TURN) server.

## 2. Building and Running the Stack

The entire SmaRTC platform can be launched with a single command.

1.  **Navigate to the `deploy` directory**:
    ```powershell
    cd c:\Users\User\Desktop\SmaRTC\deploy
    ```

2.  **Build and start all services**:
    ```powershell
    docker compose up --build -d
    ```
    -   `--build`: This flag forces Docker to build the images for the `.NET` services (`api`, `signal-server`) before starting the containers.
    -   `-d`: This flag runs the containers in detached mode, allowing them to run in the background.

    The first launch may take several minutes as Docker downloads base images and builds the application containers.

## 3. Verifying the Services

To check the status of all running containers, use the following command:

```powershell
docker compose ps
```

You should see all 12 services running. The `postgres` container will show a `(healthy)` status once its initial health check completes.

## 4. Accessing the Services

Once the stack is running, the services are accessible via the NGINX reverse proxy at `http://localhost`:

-   **API**: `http://localhost/api/...`
-   **Signal Server**: `http://localhost/signalhub`
-   **API Documentation (Swagger)**: `http://localhost/swagger`
-   **Grafana Dashboard**: `http://localhost:3000`
-   **Prometheus UI**: `http://localhost:9090`

## 5. Viewing Logs

To view the logs for a specific service, use the `docker compose logs` command.

-   **View logs for the API service**:
    ```powershell
    docker compose logs api
    ```

-   **Follow logs in real-time**:
    ```powershell
    docker compose logs -f api
    ```

## 6. Stopping the Stack

To stop all running services, use the `docker compose down` command:

```powershell
docker compose down
```

-   This command stops and removes the containers and the network created by `docker compose up`.
-   To remove the volumes (and delete all data, including the database), add the `-v` flag: `docker compose down -v`.

---

*This guide is current as of November 14, 2025.*
