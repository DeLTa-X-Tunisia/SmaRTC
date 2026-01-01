using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmaRTC.Service_Launcher.Models;
using SmaRTC.Service_Launcher.Services;

namespace SmaRTC.Service_Launcher.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly DockerService _dockerService;
        private readonly DispatcherTimer _statusTimer;

        [ObservableProperty]
        private bool _isLoading;

        [ObservableProperty]
        private string _statusText = "Prêt";

        [ObservableProperty]
        private bool _isDockerAvailable;

        [ObservableProperty]
        private string _globalStatus = "❓ Vérification...";

        [ObservableProperty]
        private string _globalStatusColor = "#9E9E9E";

        [ObservableProperty]
        private int _runningCount;

        [ObservableProperty]
        private int _totalCount;

        public ObservableCollection<ServiceInfo> Services { get; } = new();
        public ObservableCollection<LogEntry> Logs { get; } = new();

        public MainViewModel()
        {
            // Find SmaRTC project path - utilise le dossier parent du launcher
            var basePath = FindBasePath();
            
            _dockerService = new DockerService(basePath);
            _dockerService.OnLog += OnLogReceived;

            InitializeServices();

            _statusTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(5)
            };
            _statusTimer.Tick += async (s, e) => await RefreshStatusAsync();
            
            // Initial check
            _ = InitializeAsync();
        }

        private string FindBasePath()
        {
            // Ordre de priorité pour trouver le dossier de base
            var candidates = new[]
            {
                // 1. Dossier parent du launcher (SmaRTC Start)
                Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..")),
                
                // 2. Desktop/SmaRTC Start
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "SmaRTC Start"),
                
                // 3. Dossier contenant SmaRTC
                Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..")),
            };

            foreach (var candidate in candidates)
            {
                // Vérifier si le docker-compose.yml existe dans ce chemin
                var composePath = Path.Combine(candidate, "SmaRTC", "SmaRTC-core", "deploy", "docker-compose.yml");
                if (File.Exists(composePath))
                {
                    return candidate;
                }
                
                // Ancienne structure
                composePath = Path.Combine(candidate, "SmaRTC-core", "deploy", "docker-compose.yml");
                if (File.Exists(composePath))
                {
                    return candidate;
                }
            }

            // Fallback
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "SmaRTC Start");
        }

        private void InitializeServices()
        {
            var services = new[]
            {
                new ServiceInfo { Name = "API", ContainerName = "api", Icon = "🌐", Description = "REST API Server", Port = "8080" },
                new ServiceInfo { Name = "Signal Server", ContainerName = "signal-server", Icon = "📡", Description = "WebRTC Signaling", Port = "5001" },
                new ServiceInfo { Name = "PostgreSQL", ContainerName = "postgres", Icon = "🐘", Description = "Base de données", Port = "5432" },
                new ServiceInfo { Name = "Redis", ContainerName = "redis", Icon = "⚡", Description = "Cache en mémoire", Port = "6379" },
                new ServiceInfo { Name = "Nginx", ContainerName = "nginx", Icon = "🔀", Description = "Reverse Proxy", Port = "80" },
                new ServiceInfo { Name = "Coturn", ContainerName = "coturn", Icon = "🔄", Description = "STUN/TURN Server", Port = "3478" },
                new ServiceInfo { Name = "Janus", ContainerName = "janus", Icon = "🎥", Description = "Media Server", Port = "8088" },
                new ServiceInfo { Name = "Grafana", ContainerName = "grafana", Icon = "📊", Description = "Monitoring Dashboard", Port = "3000" },
                new ServiceInfo { Name = "Prometheus", ContainerName = "prometheus", Icon = "📈", Description = "Metrics Collection", Port = "9090" }
            };

            foreach (var service in services)
            {
                // Assigner les commandes individuelles
                service.StartCommand = new RelayCommand(async () => await StartSingleServiceAsync(service));
                service.StopCommand = new RelayCommand(async () => await StopSingleServiceAsync(service));
                Services.Add(service);
            }

            TotalCount = Services.Count;
        }

        private async Task StartSingleServiceAsync(ServiceInfo service)
        {
            if (service.IsActionInProgress) return;

            service.IsActionInProgress = true;
            service.Status = ServiceStatus.Starting;
            AddLog(LogLevel.Info, $"🚀 Démarrage de {service.Name}...");

            try
            {
                var result = await _dockerService.StartSingleServiceAsync(service.ContainerName);
                
                if (result.Success)
                {
                    await Task.Delay(2000);
                    await RefreshStatusAsync();
                }
                else
                {
                    service.Status = ServiceStatus.Error;
                    service.StatusMessage = result.Message;
                }
            }
            catch (Exception ex)
            {
                service.Status = ServiceStatus.Error;
                service.StatusMessage = ex.Message;
                AddLog(LogLevel.Error, $"Erreur: {ex.Message}");
            }
            finally
            {
                service.IsActionInProgress = false;
            }
        }

        private async Task StopSingleServiceAsync(ServiceInfo service)
        {
            if (service.IsActionInProgress) return;

            service.IsActionInProgress = true;
            service.Status = ServiceStatus.Stopping;
            AddLog(LogLevel.Info, $"⏹️ Arrêt de {service.Name}...");

            try
            {
                var result = await _dockerService.StopSingleServiceAsync(service.ContainerName);
                
                if (result.Success)
                {
                    service.Status = ServiceStatus.Stopped;
                    service.StatusMessage = "Arrêté";
                    await RefreshStatusAsync();
                }
                else
                {
                    service.Status = ServiceStatus.Error;
                    service.StatusMessage = result.Message;
                }
            }
            catch (Exception ex)
            {
                service.Status = ServiceStatus.Error;
                service.StatusMessage = ex.Message;
                AddLog(LogLevel.Error, $"Erreur: {ex.Message}");
            }
            finally
            {
                service.IsActionInProgress = false;
            }
        }

        private async Task InitializeAsync()
        {
            AddLog(LogLevel.Info, "🚀 SmaRTC Service Launcher démarré");
            
            // Afficher le chemin du docker-compose.yml trouvé
            var composePath = _dockerService.GetComposeFilePath();
            AddLog(LogLevel.Info, $"📁 Docker Compose: {composePath}");
            
            if (!File.Exists(composePath))
            {
                AddLog(LogLevel.Warning, "⚠️ Fichier docker-compose.yml non trouvé!");
            }
            
            IsLoading = true;
            StatusText = "Vérification de Docker...";

            IsDockerAvailable = await _dockerService.IsDockerRunningAsync();
            
            if (IsDockerAvailable)
            {
                AddLog(LogLevel.Success, "Docker Desktop est disponible");
                _statusTimer.Start();
                await RefreshStatusAsync();
            }
            else
            {
                AddLog(LogLevel.Error, "Docker Desktop n'est pas en cours d'exécution!");
                GlobalStatus = "❌ Docker indisponible";
                GlobalStatusColor = "#F44336";
                StatusText = "Docker n'est pas démarré";
            }

            IsLoading = false;
        }

        [RelayCommand]
        private async Task StartAllAsync()
        {
            if (IsLoading) return;

            IsLoading = true;
            StatusText = "Démarrage des services...";

            foreach (var service in Services)
            {
                service.Status = ServiceStatus.Starting;
            }

            var result = await _dockerService.StartServicesAsync();
            
            if (result.Success)
            {
                StatusText = "Services démarrés";
                await Task.Delay(3000);
                await RefreshStatusAsync();
            }
            else
            {
                StatusText = "Erreur lors du démarrage";
                MessageBox.Show(result.Message, "Erreur", MessageBoxButton.OK, MessageBoxImage.Error);
            }

            IsLoading = false;
        }

        [RelayCommand]
        private async Task StopAllAsync()
        {
            if (IsLoading) return;

            IsLoading = true;
            StatusText = "Arrêt des services...";

            foreach (var service in Services)
            {
                service.Status = ServiceStatus.Stopping;
            }

            var result = await _dockerService.StopServicesAsync();
            
            if (result.Success)
            {
                StatusText = "Services arrêtés";
                foreach (var service in Services)
                {
                    service.Status = ServiceStatus.Stopped;
                }
            }
            else
            {
                StatusText = "Erreur lors de l'arrêt";
            }

            await RefreshStatusAsync();
            IsLoading = false;
        }

        [RelayCommand]
        private async Task RestartAllAsync()
        {
            if (IsLoading) return;

            IsLoading = true;
            StatusText = "Redémarrage des services...";

            foreach (var service in Services)
            {
                service.Status = ServiceStatus.Starting;
            }

            var result = await _dockerService.RestartServicesAsync();
            
            StatusText = result.Success ? "Services redémarrés" : "Erreur lors du redémarrage";
            
            await Task.Delay(3000);
            await RefreshStatusAsync();
            IsLoading = false;
        }

        [RelayCommand]
        private async Task RefreshAsync()
        {
            await RefreshStatusAsync();
        }

        [RelayCommand]
        private void ClearLogs()
        {
            Logs.Clear();
            AddLog(LogLevel.Info, "Logs effacés");
        }

        [RelayCommand]
        private void OpenSwagger()
        {
            OpenUrl("http://localhost:8080/swagger");
        }

        [RelayCommand]
        private void OpenGrafana()
        {
            OpenUrl("http://localhost:3000");
        }

        [RelayCommand]
        private void OpenApi()
        {
            OpenUrl("http://localhost:8080/api/health/ping");
        }

        private void OpenUrl(string url)
        {
            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                AddLog(LogLevel.Error, $"Impossible d'ouvrir {url}: {ex.Message}");
            }
        }

        private async Task RefreshStatusAsync()
        {
            try
            {
                var statuses = await _dockerService.GetContainerStatusesAsync();
                int running = 0;

                foreach (var service in Services)
                {
                    var container = statuses.FirstOrDefault(s => 
                        s.Name.Equals(service.ContainerName, StringComparison.OrdinalIgnoreCase));

                    if (container != default)
                    {
                        if (container.Status.Contains("Up", StringComparison.OrdinalIgnoreCase))
                        {
                            service.Status = ServiceStatus.Running;
                            service.StatusMessage = container.Status;
                            running++;
                        }
                        else if (container.Status.Contains("Exited", StringComparison.OrdinalIgnoreCase))
                        {
                            service.Status = ServiceStatus.Stopped;
                            service.StatusMessage = "Arrêté";
                        }
                        else
                        {
                            service.Status = ServiceStatus.Unknown;
                            service.StatusMessage = container.Status;
                        }
                    }
                    else
                    {
                        service.Status = ServiceStatus.Stopped;
                        service.StatusMessage = "Non démarré";
                    }
                }

                RunningCount = running;
                UpdateGlobalStatus(running);
            }
            catch (Exception ex)
            {
                AddLog(LogLevel.Error, $"Erreur de rafraîchissement: {ex.Message}");
            }
        }

        private void UpdateGlobalStatus(int running)
        {
            if (running == TotalCount)
            {
                GlobalStatus = "✅ Tous les services sont actifs";
                GlobalStatusColor = "#4CAF50";
                StatusText = "Opérationnel";
            }
            else if (running == 0)
            {
                GlobalStatus = "❌ Aucun service actif";
                GlobalStatusColor = "#F44336";
                StatusText = "Services arrêtés";
            }
            else
            {
                GlobalStatus = $"⚠️ {running}/{TotalCount} services actifs";
                GlobalStatusColor = "#FF9800";
                StatusText = "Partiellement opérationnel";
            }
        }

        private void OnLogReceived(LogEntry entry)
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                Logs.Insert(0, entry);
                if (Logs.Count > 500) Logs.RemoveAt(Logs.Count - 1);
            });
        }

        private void AddLog(LogLevel level, string message)
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                Logs.Insert(0, new LogEntry
                {
                    Level = level,
                    Message = message,
                    Timestamp = DateTime.Now
                });
            });
        }
    }
}
