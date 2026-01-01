// ☕ SmaRTC Java SDK
// Wrapper enterprise pour backend Java et Android legacy
package tn.deltax.smartc;

import okhttp3.*;
import com.google.gson.*;
import com.google.gson.annotations.SerializedName;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Client SmaRTC pour applications Java (backend et Android)
 * 
 * Exemple d'utilisation :
 * <pre>
 * SmaRTCClient client = new SmaRTCClient();
 * client.login("alice", "password123").join();
 * Session session = client.startCall("Réunion Java").join();
 * System.out.println("Session : " + session.sessionId);
 * </pre>
 */
public class SmaRTCClient {

    // ========================================================================
    // Configuration
    // ========================================================================

    public static class Config {
        private String apiBaseUrl = "http://localhost:8080";
        private String signalServerUrl = "http://localhost:5001";
        private long timeout = 10;
        private boolean enableLogs = false;

        public Config() {}

        public Config apiBaseUrl(String url) {
            this.apiBaseUrl = url;
            return this;
        }

        public Config signalServerUrl(String url) {
            this.signalServerUrl = url;
            return this;
        }

        public Config timeout(long seconds) {
            this.timeout = seconds;
            return this;
        }

        public Config enableLogs(boolean enable) {
            this.enableLogs = enable;
            return this;
        }

        public String getApiBaseUrl() { return apiBaseUrl; }
        public String getSignalServerUrl() { return signalServerUrl; }
        public long getTimeout() { return timeout; }
        public boolean isEnableLogsEnabled() { return enableLogs; }
    }

    // ========================================================================
    // Types de données
    // ========================================================================

    public static class User {
        @SerializedName("id")
        public String id;

        @SerializedName("username")
        public String username;

        @Override
        public String toString() {
            return "User{id='" + id + "', username='" + username + "'}";
        }
    }

    public static class Session {
        @SerializedName("sessionId")
        public String sessionId;

        @SerializedName("roomName")
        public String roomName;

        @SerializedName("hostUserId")
        public String hostUserId;

        @SerializedName("participants")
        public List<String> participants;

        @SerializedName("createdAt")
        public String createdAt;

        @SerializedName("isActive")
        public boolean isActive;

        @Override
        public String toString() {
            return "Session{sessionId='" + sessionId + "', roomName='" + roomName + 
                   "', participants=" + participants.size() + "}";
        }
    }

    public static class ICEServer {
        @SerializedName("urls")
        public List<String> urls;

        @SerializedName("username")
        public String username;

        @SerializedName("credential")
        public String credential;

        @Override
        public String toString() {
            return "ICEServer{urls=" + urls + "}";
        }
    }

    private static class LoginRequest {
        String username;
        String password;

        LoginRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }
    }

    private static class LoginResponse {
        String token;
        User user;
    }

    private static class CreateSessionRequest {
        String roomName;

        CreateSessionRequest(String roomName) {
            this.roomName = roomName;
        }
    }

    private static class JoinSessionRequest {
        String sessionId;

        JoinSessionRequest(String sessionId) {
            this.sessionId = sessionId;
        }
    }

    // ========================================================================
    // Erreurs personnalisées
    // ========================================================================

    public static class SmaRTCException extends Exception {
        public SmaRTCException(String message) {
            super(message);
        }

        public SmaRTCException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class AuthenticationException extends SmaRTCException {
        public AuthenticationException() {
            super("Identifiants incorrects");
        }
    }

    public static class SessionNotFoundException extends SmaRTCException {
        public SessionNotFoundException() {
            super("Cet appel n'existe pas");
        }
    }

    public static class NetworkException extends SmaRTCException {
        public NetworkException(String message) {
            super("Problème de connexion : " + message);
        }

        public NetworkException(Throwable cause) {
            super("Problème de connexion", cause);
        }
    }

    // ========================================================================
    // Client principal
    // ========================================================================

    private final Config config;
    private final OkHttpClient httpClient;
    private final Gson gson;
    private String token;
    private String currentUsername;
    private String currentSessionId;

    public SmaRTCClient() {
        this(new Config());
    }

    public SmaRTCClient(Config config) {
        this.config = config;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(config.timeout, TimeUnit.SECONDS)
                .readTimeout(config.timeout, TimeUnit.SECONDS)
                .writeTimeout(config.timeout, TimeUnit.SECONDS)
                .build();
        this.gson = new Gson();
    }

    // ========================================================================
    // Getters
    // ========================================================================

    public boolean isLoggedIn() {
        return token != null && !token.isEmpty();
    }

    public String getCurrentUsername() {
        return currentUsername;
    }

    public String getCurrentSessionId() {
        return currentSessionId;
    }

    // ========================================================================
    // Méthodes privées
    // ========================================================================

    private <T> CompletableFuture<T> request(
            String method,
            String path,
            Object body,
            Class<T> responseClass,
            boolean requireAuth
    ) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String url = config.apiBaseUrl + path;

                Request.Builder requestBuilder = new Request.Builder().url(url);

                // Body
                if (body != null) {
                    String json = gson.toJson(body);
                    RequestBody requestBody = RequestBody.create(
                            json,
                            MediaType.parse("application/json")
                    );
                    requestBuilder.method(method, requestBody);
                } else {
                    if (method.equals("DELETE")) {
                        requestBuilder.delete();
                    } else if (method.equals("GET")) {
                        requestBuilder.get();
                    }
                }

                // Authorization header
                if (requireAuth && token != null) {
                    requestBuilder.addHeader("Authorization", "Bearer " + token);
                }

                if (config.enableLogs) {
                    System.out.println("[SmaRTC] " + method + " " + url);
                }

                Request request = requestBuilder.build();
                Response response = httpClient.newCall(request).execute();

                if (!response.isSuccessful()) {
                    int code = response.code();
                    String errorBody = response.body() != null ? response.body().string() : "";

                    switch (code) {
                        case 401:
                            throw new AuthenticationException();
                        case 404:
                            throw new SessionNotFoundException();
                        default:
                            throw new SmaRTCException("Erreur HTTP " + code + " : " + errorBody);
                    }
                }

                String responseBody = response.body().string();
                return gson.fromJson(responseBody, responseClass);

            } catch (IOException e) {
                throw new RuntimeException(new NetworkException(e));
            } catch (SmaRTCException e) {
                throw new RuntimeException(e);
            }
        });
    }

    // ========================================================================
    // Méthodes publiques
    // ========================================================================

    /**
     * Authentifie l'utilisateur
     * @param username Nom d'utilisateur
     * @param password Mot de passe
     * @return CompletableFuture<Void>
     */
    public CompletableFuture<Void> login(String username, String password) {
        LoginRequest reqBody = new LoginRequest(username, password);

        return request("POST", "/api/auth/login", reqBody, LoginResponse.class, false)
                .thenAccept(loginResp -> {
                    this.token = loginResp.token;
                    this.currentUsername = loginResp.user.username;

                    if (config.enableLogs) {
                        System.out.println("[SmaRTC] Connecté en tant que " + currentUsername);
                    }
                });
    }

    /**
     * Crée un nouveau compte utilisateur
     * @param username Nom d'utilisateur
     * @param password Mot de passe
     * @return CompletableFuture<User>
     */
    public CompletableFuture<User> register(String username, String password) {
        LoginRequest reqBody = new LoginRequest(username, password);
        return request("POST", "/api/auth/register", reqBody, User.class, false);
    }

    /**
     * Crée un nouvel appel
     * @param roomName Nom de la salle
     * @return CompletableFuture<Session>
     */
    public CompletableFuture<Session> startCall(String roomName) {
        CreateSessionRequest reqBody = new CreateSessionRequest(roomName);

        return request("POST", "/api/session", reqBody, Session.class, true)
                .thenApply(session -> {
                    this.currentSessionId = session.sessionId;

                    if (config.enableLogs) {
                        System.out.println("[SmaRTC] Appel créé : " + session.sessionId);
                    }

                    return session;
                });
    }

    /**
     * Rejoint un appel existant
     * @param sessionId ID de la session
     * @return CompletableFuture<Session>
     */
    public CompletableFuture<Session> joinCall(String sessionId) {
        JoinSessionRequest reqBody = new JoinSessionRequest(sessionId);

        return request("POST", "/api/session/join", reqBody, Session.class, true)
                .thenApply(session -> {
                    this.currentSessionId = session.sessionId;

                    if (config.enableLogs) {
                        System.out.println("[SmaRTC] Appel rejoint : " + session.sessionId);
                    }

                    return session;
                });
    }

    /**
     * Termine l'appel en cours
     * @return CompletableFuture<Void>
     */
    public CompletableFuture<Void> endCall() {
        if (currentSessionId == null || currentSessionId.isEmpty()) {
            return CompletableFuture.failedFuture(
                    new SmaRTCException("Aucun appel en cours")
            );
        }

        String path = "/api/session/" + currentSessionId;

        return request("DELETE", path, null, JsonObject.class, true)
                .thenAccept(response -> {
                    if (config.enableLogs) {
                        System.out.println("[SmaRTC] Appel terminé : " + currentSessionId);
                    }
                    currentSessionId = null;
                });
    }

    /**
     * Liste tous les appels actifs
     * @return CompletableFuture<List<Session>>
     */
    public CompletableFuture<List<Session>> getAvailableCalls() {
        return request("GET", "/api/session", null, Session[].class, true)
                .thenApply(sessions -> List.of(sessions));
    }

    /**
     * Récupère la configuration STUN/TURN
     * @return CompletableFuture<List<ICEServer>>
     */
    public CompletableFuture<List<ICEServer>> getICEServers() {
        return request("GET", "/api/webrtc/ice", null, ICEServer[].class, true)
                .thenApply(servers -> List.of(servers))
                .exceptionally(throwable -> {
                    // Fallback vers Google STUN
                    ICEServer googleStun = new ICEServer();
                    googleStun.urls = List.of("stun:stun.l.google.com:19302");
                    return List.of(googleStun);
                });
    }

    /**
     * Déconnecte l'utilisateur
     * @return CompletableFuture<Void>
     */
    public CompletableFuture<Void> logout() {
        // Terminer l'appel en cours si existant
        CompletableFuture<Void> endCallFuture = CompletableFuture.completedFuture(null);

        if (currentSessionId != null && !currentSessionId.isEmpty()) {
            endCallFuture = endCall().exceptionally(throwable -> {
                if (config.enableLogs) {
                    System.err.println("[SmaRTC] Erreur lors de la fin d'appel : " + throwable.getMessage());
                }
                return null;
            });
        }

        return endCallFuture.thenAccept(v -> {
            this.token = null;
            this.currentUsername = null;
            this.currentSessionId = null;

            if (config.enableLogs) {
                System.out.println("[SmaRTC] Déconnecté");
            }
        });
    }

    /**
     * Ferme le client HTTP (nettoyage des ressources)
     */
    public void close() {
        httpClient.dispatcher().executorService().shutdown();
        httpClient.connectionPool().evictAll();
    }
}
