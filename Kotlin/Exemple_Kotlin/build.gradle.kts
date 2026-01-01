plugins {
    kotlin("jvm") version "1.9.22"
    application
}

group = "com.smartc"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // SignalR client
    implementation("com.microsoft.signalr:signalr:8.0.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // JSON
    implementation("com.google.code.gson:gson:2.10.1")
    
    // Colored console output
    implementation("org.fusesource.jansi:jansi:2.4.1")
    
    // SLF4J (required by SignalR)
    implementation("org.slf4j:slf4j-simple:2.0.9")
}

application {
    mainClass.set("com.smartc.MainKt")
}

tasks.jar {
    manifest {
        attributes["Main-Class"] = "com.smartc.MainKt"
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) }) {
        exclude("META-INF/*.SF")
        exclude("META-INF/*.DSA")
        exclude("META-INF/*.RSA")
        exclude("META-INF/MANIFEST.MF")
    }
}

kotlin {
    jvmToolchain(21)
}
