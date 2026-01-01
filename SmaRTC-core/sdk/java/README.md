# ☕ SmaRTC Java SDK

**SDK Enterprise pour SmaRTC en Java** – Client robuste pour backend Spring Boot, Android legacy et applications entreprise.

[![Java](https://img.shields.io/badge/Java-11+-orange?logo=openjdk)](https://www.oracle.com/java/)
[![Maven](https://img.shields.io/badge/Maven-Central-blue?logo=apachemaven)](https://maven.apache.org/)
[![Gradle](https://img.shields.io/badge/Gradle-Compatible-green?logo=gradle)](https://gradle.org/)

---

## 📦 Installation

### Maven

Ajoutez dans `pom.xml` :

```xml
<dependencies>
    <!-- OkHttp -->
    <dependency>
        <groupId>com.squareup.okhttp3</groupId>
        <artifactId>okhttp</artifactId>
        <version>4.12.0</version>
    </dependency>
    
    <!-- Gson -->
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10.1</version>
    </dependency>
</dependencies>
```

### Gradle

Ajoutez dans `build.gradle` :

```gradle
dependencies {
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

### Android

Ajoutez dans `build.gradle` (app) :

```gradle
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}

dependencies {
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

---

## 🚀 Quick Start (3 lignes)

```java
SmaRTCClient client = new SmaRTCClient();
client.login("alice", "password123").join();
Session session = client.startCall("Réunion Java").join();
```

---

## 📖 Exemples d'utilisation

### 1️⃣ Workflow complet avec CompletableFuture

```java
import tn.deltax.smartc.SmaRTCClient;
import tn.deltax.smartc.SmaRTCClient.*;

public class QuickStart {
    public static void main(String[] args) {
        SmaRTCClient client = new SmaRTCClient();

        try {
            // 1. Login
            System.out.println("🔐 Connexion...");
            client.login("alice", "password123").join();
            System.out.println("✅ Connecté en tant que : " + client.getCurrentUsername());

            // 2. Créer un appel
            System.out.println("\n📞 Création d'un appel...");
            Session session = client.startCall("Réunion Backend").join();
            System.out.println("✅ Appel créé :");
            System.out.println("   - Session ID : " + session.sessionId);
            System.out.println("   - Room Name  : " + session.roomName);

            // 3. Lister les appels
            System.out.println("\n📋 Appels en cours...");
            List<Session> calls = client.getAvailableCalls().join();
            System.out.println("✅ " + calls.size() + " appel(s) actif(s)");

            // 4. Simuler un appel de 3 secondes
            System.out.println("\n⏳ Appel en cours (3s)...");
            Thread.sleep(3000);

            // 5. Terminer l'appel
            System.out.println("\n🔴 Fin de l'appel...");
            client.endCall().join();
            System.out.println("✅ Appel terminé");

            // 6. Logout
            System.out.println("\n👋 Déconnexion...");
            client.logout().join();
            System.out.println("✅ Session fermée");

        } catch (Exception e) {
            System.err.println("❌ Erreur : " + e.getMessage());
            e.printStackTrace();
        } finally {
            client.close();
        }
    }
}
```

---

### 2️⃣ Configuration personnalisée

```java
Config config = new Config()
    .apiBaseUrl("https://api.mondomaine.com")
    .signalServerUrl("https://signal.mondomaine.com")
    .timeout(15)
    .enableLogs(true);

SmaRTCClient client = new SmaRTCClient(config);
```

---

### 3️⃣ Gestion d'erreurs

```java
client.login("alice", "wrongpass")
    .thenAccept(v -> System.out.println("✅ Connecté"))
    .exceptionally(throwable -> {
        Throwable cause = throwable.getCause();
        
        if (cause instanceof AuthenticationException) {
            System.err.println("❌ Identifiants incorrects");
        } else if (cause instanceof NetworkException) {
            System.err.println("❌ Problème réseau : " + cause.getMessage());
        } else if (cause instanceof SessionNotFoundException) {
            System.err.println("❌ Session introuvable");
        } else {
            System.err.println("❌ Erreur : " + cause.getMessage());
        }
        
        return null;
    })
    .join();
```

---

### 4️⃣ Spring Boot REST API

```java
import org.springframework.web.bind.annotation.*;
import tn.deltax.smartc.SmaRTCClient;
import tn.deltax.smartc.SmaRTCClient.*;

@RestController
@RequestMapping("/api/calls")
public class CallController {

    private final SmaRTCClient smartcClient;

    public CallController() {
        this.smartcClient = new SmaRTCClient();
    }

    @PostMapping("/create")
    public CompletableFuture<Session> createCall(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String roomName
    ) {
        return smartcClient.login(username, password)
                .thenCompose(v -> smartcClient.startCall(roomName))
                .whenComplete((session, throwable) -> {
                    if (throwable != null) {
                        smartcClient.logout();
                    }
                });
    }

    @GetMapping("/list")
    public CompletableFuture<List<Session>> listCalls() {
        return smartcClient.getAvailableCalls();
    }

    @DeleteMapping("/{sessionId}")
    public CompletableFuture<Void> endCall(@PathVariable String sessionId) {
        return smartcClient.endCall();
    }

    @PreDestroy
    public void cleanup() {
        smartcClient.close();
    }
}
```

---

### 5️⃣ Activity Android

```java
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import tn.deltax.smartc.SmaRTCClient;
import tn.deltax.smartc.SmaRTCClient.*;

public class CallActivity extends AppCompatActivity {

    private SmaRTCClient client;
    private TextView statusText;
    private Button startButton;
    private Button endButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_call);

        // Configuration pour Android (émulateur)
        Config config = new Config()
            .apiBaseUrl("http://10.0.2.2:8080")
            .enableLogs(true);

        client = new SmaRTCClient(config);
        
        statusText = findViewById(R.id.statusText);
        startButton = findViewById(R.id.startButton);
        endButton = findViewById(R.id.endButton);

        // Login au démarrage
        client.login("alice", "password123")
            .thenAccept(v -> runOnUiThread(() -> {
                statusText.setText("✅ Connecté : " + client.getCurrentUsername());
                startButton.setEnabled(true);
            }))
            .exceptionally(throwable -> {
                runOnUiThread(() -> {
                    statusText.setText("❌ Erreur login : " + throwable.getMessage());
                });
                return null;
            });

        // Créer un appel
        startButton.setOnClickListener(v -> {
            startButton.setEnabled(false);
            
            client.startCall("Mobile Call")
                .thenAccept(session -> runOnUiThread(() -> {
                    statusText.setText("📞 Appel : " + session.sessionId);
                    endButton.setEnabled(true);
                }))
                .exceptionally(throwable -> {
                    runOnUiThread(() -> {
                        statusText.setText("❌ Erreur : " + throwable.getMessage());
                        startButton.setEnabled(true);
                    });
                    return null;
                });
        });

        // Terminer l'appel
        endButton.setOnClickListener(v -> {
            endButton.setEnabled(false);
            
            client.endCall()
                .thenAccept(aVoid -> runOnUiThread(() -> {
                    statusText.setText("✅ Appel terminé");
                    startButton.setEnabled(true);
                }))
                .exceptionally(throwable -> {
                    runOnUiThread(() -> {
                        statusText.setText("❌ Erreur : " + throwable.getMessage());
                        endButton.setEnabled(true);
                    });
                    return null;
                });
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        client.logout().join();
        client.close();
    }
}
```

---

### 6️⃣ Serveur WebSocket (Netty)

```java
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.*;
import io.netty.handler.codec.http.websocketx.*;
import tn.deltax.smartc.SmaRTCClient;

public class WebSocketServer {
    
    private final int port;
    private final SmaRTCClient smartcClient;

    public WebSocketServer(int port) {
        this.port = port;
        this.smartcClient = new SmaRTCClient();
    }

    public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();

        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
                .channel(NioServerSocketChannel.class)
                .childHandler(new ChannelInitializer<>() {
                    @Override
                    protected void initChannel(Channel ch) {
                        ChannelPipeline pipeline = ch.pipeline();
                        pipeline.addLast(new HttpServerCodec());
                        pipeline.addLast(new HttpObjectAggregator(65536));
                        pipeline.addLast(new WebSocketServerHandler(smartcClient));
                    }
                });

            Channel ch = b.bind(port).sync().channel();
            System.out.println("🚀 WebSocket serveur démarré sur port " + port);
            
            ch.closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
            smartcClient.close();
        }
    }

    public static void main(String[] args) throws Exception {
        new WebSocketServer(8080).run();
    }
}
```

---

## 🔧 API Reference

### Classe `SmaRTCClient`

| Méthode | Description | Retour |
|---------|-------------|--------|
| `SmaRTCClient()` | Constructeur par défaut | - |
| `SmaRTCClient(Config config)` | Constructeur avec configuration | - |
| `CompletableFuture<Void> login(String username, String password)` | Authentification | `CompletableFuture<Void>` |
| `CompletableFuture<User> register(String username, String password)` | Créer un compte | `CompletableFuture<User>` |
| `CompletableFuture<Session> startCall(String roomName)` | Créer un appel | `CompletableFuture<Session>` |
| `CompletableFuture<Session> joinCall(String sessionId)` | Rejoindre un appel | `CompletableFuture<Session>` |
| `CompletableFuture<Void> endCall()` | Terminer l'appel | `CompletableFuture<Void>` |
| `CompletableFuture<List<Session>> getAvailableCalls()` | Liste des appels | `CompletableFuture<List<Session>>` |
| `CompletableFuture<List<ICEServer>> getICEServers()` | Config STUN/TURN | `CompletableFuture<List<ICEServer>>` |
| `CompletableFuture<Void> logout()` | Déconnexion | `CompletableFuture<Void>` |
| `void close()` | Fermer les ressources | `void` |

### Getters

```java
public boolean isLoggedIn()
public String getCurrentUsername()
public String getCurrentSessionId()
```

---

## 🎨 Types de données

### `Config`

```java
Config config = new Config()
    .apiBaseUrl("http://localhost:8080")
    .signalServerUrl("http://localhost:5001")
    .timeout(10)  // secondes
    .enableLogs(false);
```

### `Session`

```java
public class Session {
    public String sessionId;
    public String roomName;
    public String hostUserId;
    public List<String> participants;
    public String createdAt;
    public boolean isActive;
}
```

### `User`

```java
public class User {
    public String id;
    public String username;
}
```

---

## ⚠️ Gestion des erreurs

### Exceptions disponibles

```java
SmaRTCException              // Exception de base
AuthenticationException      // Identifiants incorrects
SessionNotFoundException     // Session introuvable
NetworkException            // Problème réseau
```

### Exemple de gestion

```java
client.login("alice", "password")
    .exceptionally(throwable -> {
        Throwable cause = throwable.getCause();
        
        if (cause instanceof AuthenticationException) {
            // Identifiants invalides
        } else if (cause instanceof NetworkException) {
            // Problème réseau
        }
        
        return null;
    })
    .join();
```

---

## 🛠️ Troubleshooting

### Problème : `UnknownHostException` sur Android

**Solution** : Utilisez `10.0.2.2` pour l'émulateur :

```java
Config config = new Config()
    .apiBaseUrl("http://10.0.2.2:8080");
```

Pour un appareil physique :

```java
Config config = new Config()
    .apiBaseUrl("http://192.168.1.10:8080");  // IP de votre PC
```

---

### Problème : `NetworkOnMainThreadException` (Android)

**Solution** : Toutes les méthodes retournent des `CompletableFuture`, utilisez-les sur un thread background :

```java
// ✅ CORRECT
executor.execute(() -> {
    client.startCall("Room").join();
});
```

---

### Problème : `ClearTextTrafficException` (Android 9+)

**Solution** : Ajoutez dans `AndroidManifest.xml` :

```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

---

## 📦 Build

### Maven

```bash
mvn clean package
```

### Gradle

```bash
./gradlew build
```

### JAR exécutable

```bash
mvn clean compile assembly:single
```

---

## 🧪 Tests

```java
@Test
public void testLogin() throws Exception {
    SmaRTCClient client = new SmaRTCClient();
    client.login("alice", "password123").join();
    assertTrue(client.isLoggedIn());
    assertEquals("alice", client.getCurrentUsername());
}
```

---

## 📚 Ressources

- [Documentation API REST](../../docs/README.md)
- [OkHttp Documentation](https://square.github.io/okhttp/)
- [Gson User Guide](https://github.com/google/gson/blob/master/UserGuide.md)
- [CompletableFuture Guide](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html)

---

## 🤝 Support

- **Issues GitHub** : [SmaRTC Issues](https://github.com/DeLTa-X-Tunisia/SmaRTC/issues)
- **Documentation** : [docs/](../../docs/)

---

## 📄 Licence

MIT License – Développé par **DeLTa-X Tunisia** 🇹🇳

---

**☕ Prêt à intégrer WebRTC dans vos applications Java ? Start calling avec SmaRTC !**
