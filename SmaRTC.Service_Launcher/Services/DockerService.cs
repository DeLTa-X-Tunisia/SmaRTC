using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using SmaRTC.Service_Launcher.Models;

namespace SmaRTC.Service_Launcher.Services
{
    public class DockerService
    {
        private readonly string _composeFilePath;
        private readonly string _projectPath;
        private static readonly string SettingsFile = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "SmaRTC.Service_Launcher",
            "settings.json");

        public event Action<LogEntry>? OnLog;
        public event Action<string, ServiceStatus, string>? OnServiceStatusChanged;

        public DockerService(string projectPath)
        {
            _projectPath = projectPath;
            _composeFilePath = FindDockerComposeFile(projectPath);
        }

        /// <summary>
        /// Recherche le fichier docker-compose.yml dans plusieurs emplacements possibles
        /// </summary>
        private string FindDockerComposeFile(string basePath)
        {
            // 1. Vérifier dans les settings utilisateur
            var savedPath = LoadSavedComposePath();
            if (!string.IsNullOrEmpty(savedPath) && File.Exists(savedPath))
            {
                return savedPath;
            }

            // 2. Liste des chemins possibles (par ordre de priorité)
            var possiblePaths = new[]
            {
                // Nouvelle structure (après réorganisation)
                Path.Combine(basePath, "SmaRTC-core", "deploy", "docker-compose.yml"),
                Path.Combine(basePath, "SmaRTC", "SmaRTC-core", "deploy", "docker-compose.yml"),
                
                // Ancienne structure
                Path.Combine(basePath, "deploy", "docker-compose.yml"),
                Path.Combine(basePath, "SmaRTC", "deploy", "docker-compose.yml"),
                
                // Chemins relatifs au launcher
                Path.Combine(basePath, "..", "SmaRTC", "SmaRTC-core", "deploy", "docker-compose.yml"),
                Path.Combine(basePath, "..", "SmaRTC-core", "deploy", "docker-compose.yml"),
                
                // Chemin absolu par défaut (Desktop)
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), 
                    "SmaRTC Start", "SmaRTC", "SmaRTC-core", "deploy", "docker-compose.yml"),
            };

            foreach (var path in possiblePaths)
            {
                var normalizedPath = Path.GetFullPath(path);
                if (File.Exists(normalizedPath))
                {
                    // Sauvegarder pour les prochaines utilisations
                    SaveComposePath(normalizedPath);
                    return normalizedPath;
                }
            }

            // Retourner le chemin le plus probable même s'il n'existe pas (pour le message d'erreur)
            return Path.Combine(basePath, "SmaRTC-core", "deploy", "docker-compose.yml");
        }

        private string? LoadSavedComposePath()
        {
            try
            {
                if (File.Exists(SettingsFile))
                {
                    var json = File.ReadAllText(SettingsFile);
                    var settings = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                    if (settings?.TryGetValue("DockerComposePath", out var path) == true)
                    {
                        return path;
                    }
                }
            }
            catch { }
            return null;
        }

        private void SaveComposePath(string path)
        {
            try
            {
                var dir = Path.GetDirectoryName(SettingsFile)!;
                if (!Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }

                var settings = new Dictionary<string, string> { ["DockerComposePath"] = path };
                File.WriteAllText(SettingsFile, JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch { }
        }

        /// <summary>
        /// Permet de définir manuellement le chemin du fichier docker-compose.yml
        /// </summary>
        public void SetComposeFilePath(string path)
        {
            if (File.Exists(path))
            {
                SaveComposePath(path);
            }
        }

        /// <summary>
        /// Retourne le chemin actuel du fichier docker-compose.yml
        /// </summary>
        public string GetComposeFilePath() => _composeFilePath;

        public async Task<bool> IsDockerRunningAsync()
        {
            try
            {
                var result = await RunCommandAsync("docker", "info", timeout: 10000);
                return result.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> IsDockerComposeAvailableAsync()
        {
            try
            {
                var result = await RunCommandAsync("docker", "compose version", timeout: 10000);
                return result.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        public async Task<List<(string Name, string Status, string Ports)>> GetContainerStatusesAsync()
        {
            var containers = new List<(string, string, string)>();
            
            try
            {
                var result = await RunCommandAsync("docker", 
                    "ps -a --format \"{{.Names}}|{{.Status}}|{{.Ports}}\" --filter \"name=deploy-\"",
                    timeout: 30000);

                if (result.ExitCode == 0 && !string.IsNullOrWhiteSpace(result.Output))
                {
                    var lines = result.Output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var line in lines)
                    {
                        var parts = line.Trim().Split('|');
                        if (parts.Length >= 2)
                        {
                            var name = parts[0].Replace("deploy-", "").Replace("-1", "");
                            var status = parts[1];
                            var ports = parts.Length > 2 ? parts[2] : "";
                            containers.Add((name, status, ports));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log(LogLevel.Error, $"Erreur lors de la récupération des statuts: {ex.Message}");
            }

            return containers;
        }

        public async Task<(bool Success, string Message)> StartServicesAsync()
        {
            Log(LogLevel.Info, "🚀 Démarrage des services SmaRTC...");

            // Check Docker
            if (!await IsDockerRunningAsync())
            {
                var msg = "Docker Desktop n'est pas en cours d'exécution. Veuillez le démarrer.";
                Log(LogLevel.Error, msg);
                return (false, msg);
            }

            // Check compose file
            if (!File.Exists(_composeFilePath))
            {
                var msg = $"Fichier docker-compose.yml non trouvé: {_composeFilePath}";
                Log(LogLevel.Error, msg);
                return (false, msg);
            }

            try
            {
                var workDir = Path.GetDirectoryName(_composeFilePath)!;
                
                Log(LogLevel.Info, "📦 Construction et démarrage des conteneurs...");
                
                var result = await RunCommandAsync("docker", 
                    "compose up -d --build",
                    workingDirectory: workDir,
                    timeout: 300000); // 5 minutes

                if (result.ExitCode == 0)
                {
                    Log(LogLevel.Success, "✅ Tous les services ont été démarrés avec succès!");
                    return (true, "Services démarrés avec succès");
                }
                else
                {
                    // Parse error message
                    var errorMsg = ParseDockerError(result.Error, result.Output);
                    Log(LogLevel.Error, $"❌ Erreur: {errorMsg}");
                    return (false, errorMsg);
                }
            }
            catch (Exception ex)
            {
                var msg = $"Exception lors du démarrage: {ex.Message}";
                Log(LogLevel.Error, msg);
                return (false, msg);
            }
        }

        public async Task<(bool Success, string Message)> StopServicesAsync()
        {
            Log(LogLevel.Info, "⏹️ Arrêt des services SmaRTC...");

            if (!await IsDockerRunningAsync())
            {
                var msg = "Docker Desktop n'est pas en cours d'exécution.";
                Log(LogLevel.Warning, msg);
                return (false, msg);
            }

            try
            {
                var workDir = Path.GetDirectoryName(_composeFilePath)!;
                
                var result = await RunCommandAsync("docker", 
                    "compose down",
                    workingDirectory: workDir,
                    timeout: 120000);

                if (result.ExitCode == 0)
                {
                    Log(LogLevel.Success, "✅ Tous les services ont été arrêtés.");
                    return (true, "Services arrêtés avec succès");
                }
                else
                {
                    var errorMsg = ParseDockerError(result.Error, result.Output);
                    Log(LogLevel.Error, $"❌ Erreur: {errorMsg}");
                    return (false, errorMsg);
                }
            }
            catch (Exception ex)
            {
                var msg = $"Exception lors de l'arrêt: {ex.Message}";
                Log(LogLevel.Error, msg);
                return (false, msg);
            }
        }

        public async Task<(bool Success, string Message)> RestartServicesAsync()
        {
            Log(LogLevel.Info, "🔄 Redémarrage des services SmaRTC...");

            var stopResult = await StopServicesAsync();
            if (!stopResult.Success)
            {
                // Continue anyway, services might already be stopped
                Log(LogLevel.Warning, "Avertissement lors de l'arrêt, tentative de démarrage...");
            }

            await Task.Delay(2000); // Wait a bit

            return await StartServicesAsync();
        }

        public async Task<string> GetServiceLogsAsync(string containerName, int lines = 50)
        {
            try
            {
                var result = await RunCommandAsync("docker", 
                    $"logs deploy-{containerName}-1 --tail {lines}",
                    timeout: 30000);

                return result.Output + result.Error;
            }
            catch (Exception ex)
            {
                return $"Erreur: {ex.Message}";
            }
        }

        /// <summary>
        /// Démarre un service individuel
        /// </summary>
        public async Task<(bool Success, string Message)> StartSingleServiceAsync(string containerName)
        {
            Log(LogLevel.Info, $"🚀 Démarrage de {containerName}...");

            if (!await IsDockerRunningAsync())
            {
                var msg = "Docker Desktop n'est pas en cours d'exécution.";
                Log(LogLevel.Error, msg);
                return (false, msg);
            }

            if (!File.Exists(_composeFilePath))
            {
                var msg = $"Fichier docker-compose.yml non trouvé: {_composeFilePath}";
                Log(LogLevel.Error, msg);
                return (false, msg);
            }

            try
            {
                var workDir = Path.GetDirectoryName(_composeFilePath)!;
                
                var result = await RunCommandAsync("docker", 
                    $"compose up -d {containerName}",
                    workingDirectory: workDir,
                    timeout: 120000);

                if (result.ExitCode == 0)
                {
                    Log(LogLevel.Success, $"✅ {containerName} démarré avec succès!");
                    return (true, $"{containerName} démarré");
                }
                else
                {
                    var errorMsg = ParseDockerError(result.Error, result.Output);
                    Log(LogLevel.Error, $"❌ Erreur {containerName}: {errorMsg}");
                    return (false, errorMsg);
                }
            }
            catch (Exception ex)
            {
                var msg = $"Exception lors du démarrage de {containerName}: {ex.Message}";
                Log(LogLevel.Error, msg);
                return (false, msg);
            }
        }

        /// <summary>
        /// Arrête un service individuel
        /// </summary>
        public async Task<(bool Success, string Message)> StopSingleServiceAsync(string containerName)
        {
            Log(LogLevel.Info, $"⏹️ Arrêt de {containerName}...");

            if (!await IsDockerRunningAsync())
            {
                var msg = "Docker Desktop n'est pas en cours d'exécution.";
                Log(LogLevel.Warning, msg);
                return (false, msg);
            }

            try
            {
                var workDir = Path.GetDirectoryName(_composeFilePath)!;
                
                var result = await RunCommandAsync("docker", 
                    $"compose stop {containerName}",
                    workingDirectory: workDir,
                    timeout: 60000);

                if (result.ExitCode == 0)
                {
                    Log(LogLevel.Success, $"✅ {containerName} arrêté.");
                    return (true, $"{containerName} arrêté");
                }
                else
                {
                    var errorMsg = ParseDockerError(result.Error, result.Output);
                    Log(LogLevel.Error, $"❌ Erreur {containerName}: {errorMsg}");
                    return (false, errorMsg);
                }
            }
            catch (Exception ex)
            {
                var msg = $"Exception lors de l'arrêt de {containerName}: {ex.Message}";
                Log(LogLevel.Error, msg);
                return (false, msg);
            }
        }

        /// <summary>
        /// Redémarre un service individuel
        /// </summary>
        public async Task<(bool Success, string Message)> RestartSingleServiceAsync(string containerName)
        {
            Log(LogLevel.Info, $"🔄 Redémarrage de {containerName}...");

            var stopResult = await StopSingleServiceAsync(containerName);
            await Task.Delay(1000);
            return await StartSingleServiceAsync(containerName);
        }

        private string ParseDockerError(string stderr, string stdout)
        {
            var combined = stderr + stdout;
            
            // Port already in use
            var portMatch = Regex.Match(combined, @"port[s]?\s+(\d+).*(?:already|in use|occupied)", RegexOptions.IgnoreCase);
            if (portMatch.Success)
            {
                return $"Le port {portMatch.Groups[1].Value} est déjà utilisé par une autre application.";
            }

            // PostgreSQL specific errors
            if (combined.Contains("postgres", StringComparison.OrdinalIgnoreCase) && 
                combined.Contains("5432"))
            {
                return "PostgreSQL n'a pas pu démarrer (port 5432 déjà utilisé ou erreur de configuration).";
            }

            // Build errors
            if (combined.Contains("Build FAILED", StringComparison.OrdinalIgnoreCase))
            {
                var errorLines = combined.Split('\n')
                    .Where(l => l.Contains("error", StringComparison.OrdinalIgnoreCase))
                    .Take(3);
                return $"Erreur de compilation: {string.Join(" | ", errorLines)}";
            }

            // Image pull errors
            if (combined.Contains("pull access denied") || combined.Contains("manifest unknown"))
            {
                return "Impossible de télécharger l'image Docker. Vérifiez votre connexion internet.";
            }

            // Network errors
            if (combined.Contains("network") && combined.Contains("error", StringComparison.OrdinalIgnoreCase))
            {
                return "Erreur de réseau Docker. Essayez: docker network prune";
            }

            // Volume errors
            if (combined.Contains("volume") && combined.Contains("error", StringComparison.OrdinalIgnoreCase))
            {
                return "Erreur de volume Docker. Essayez: docker volume prune";
            }

            // Permission errors
            if (combined.Contains("permission denied", StringComparison.OrdinalIgnoreCase))
            {
                return "Erreur de permissions. Exécutez Docker Desktop en tant qu'administrateur.";
            }

            // Generic error - return first meaningful error line
            var firstError = combined.Split('\n')
                .FirstOrDefault(l => l.Contains("error", StringComparison.OrdinalIgnoreCase) 
                                  || l.Contains("failed", StringComparison.OrdinalIgnoreCase));
            
            return firstError ?? "Une erreur inconnue s'est produite. Consultez les logs Docker.";
        }

        private async Task<(int ExitCode, string Output, string Error)> RunCommandAsync(
            string command, 
            string arguments, 
            string? workingDirectory = null,
            int timeout = 60000)
        {
            var psi = new ProcessStartInfo
            {
                FileName = command,
                Arguments = arguments,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                WorkingDirectory = workingDirectory ?? ""
            };

            using var process = new Process { StartInfo = psi };
            var output = string.Empty;
            var error = string.Empty;

            process.OutputDataReceived += (s, e) =>
            {
                if (e.Data != null)
                {
                    output += e.Data + "\n";
                    if (e.Data.Contains("Started") || e.Data.Contains("Running") || e.Data.Contains("Built"))
                    {
                        Log(LogLevel.Info, e.Data);
                    }
                }
            };

            process.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null)
                {
                    error += e.Data + "\n";
                }
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            var completed = await Task.Run(() => process.WaitForExit(timeout));
            
            if (!completed)
            {
                process.Kill();
                throw new TimeoutException("La commande a dépassé le délai d'attente.");
            }

            return (process.ExitCode, output, error);
        }

        private void Log(LogLevel level, string message)
        {
            OnLog?.Invoke(new LogEntry
            {
                Level = level,
                Message = message,
                Timestamp = DateTime.Now
            });
        }
    }
}
