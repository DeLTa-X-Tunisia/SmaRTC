-- Script SQL pour créer les tables de la base de données SmaRTC
-- Base de données: smartc
-- Utilisateur: postgres
-- Mot de passe: 2012704

-- Création de la table des utilisateurs
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL PRIMARY KEY,
    "Username" TEXT NOT NULL UNIQUE,
    "PasswordHash" TEXT NOT NULL,
    "Role" TEXT NOT NULL DEFAULT 'user',
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table des sessions
CREATE TABLE IF NOT EXISTS "Sessions" (
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT,
    "Description" TEXT,
    "CreatorId" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Sessions_Users_CreatorId" FOREIGN KEY ("CreatorId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Création de la table des participants
CREATE TABLE IF NOT EXISTS "Participants" (
    "Id" SERIAL PRIMARY KEY,
    "SessionId" INTEGER NOT NULL,
    "UserId" INTEGER NOT NULL,
    "JoinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Participants_Sessions_SessionId" FOREIGN KEY ("SessionId") 
        REFERENCES "Sessions" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Participants_Users_UserId" FOREIGN KEY ("UserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Création de la table d'historique des migrations EF Core
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" VARCHAR(150) PRIMARY KEY,
    "ProductVersion" VARCHAR(32) NOT NULL
);

-- Création des index
CREATE INDEX IF NOT EXISTS "IX_Sessions_CreatorId" ON "Sessions" ("CreatorId");
CREATE INDEX IF NOT EXISTS "IX_Participants_SessionId" ON "Participants" ("SessionId");
CREATE INDEX IF NOT EXISTS "IX_Participants_UserId" ON "Participants" ("UserId");

-- Insertion des migrations dans l'historique
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
    ('20251114124513_InitialCreate', '9.0.0'),
    ('20251114125131_UpdateSessionModel', '9.0.0'),
    ('20251114125229_UpdateSessionModel2', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Vérification : lister les tables créées
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
