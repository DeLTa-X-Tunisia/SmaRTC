using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace Luncher_csharp
{
    public class MainViewModel : INotifyPropertyChanged
    {
        private readonly HttpClient _httpClient;
        private readonly DispatcherTimer _statusTimer;
        private Process? _client1Process;
        private Process? _client2Process;

        private bool _isApiConnected;
        private bool _isSignalConnected;
        private bool _isLoading;
        private string _statusText = "Vérification...";
        private bool _isClient1Running;
        private bool _isClient2Running;

        public bool IsApiConnected
        {
            get => _isApiConnected;
            set { _isApiConnected = value; OnPropertyChanged(); OnPropertyChanged(nameof(CanLaunchClients)); }
        }

        public bool IsSignalConnected
        {
            get => _isSignalConnected;
            set { _isSignalConnected = value; OnPropertyChanged(); OnPropertyChanged(nameof(CanLaunchClients)); }
        }

        public bool IsLoading
        {
            get => _isLoading;
            set { _isLoading = value; OnPropertyChanged(); }
        }

        public string StatusText
        {
            get => _statusText;
            set { _statusText = value; OnPropertyChanged(); }
        }

        public bool IsClient1Running
        {
            get => _isClient1Running;
            set { _isClient1Running = value; OnPropertyChanged(); }
        }

        public bool IsClient2Running
        {
            get => _isClient2Running;
            set { _isClient2Running = value; OnPropertyChanged(); }
        }

        public bool CanLaunchClients => IsApiConnected && IsSignalConnected;

        public ObservableCollection<LogEntry> Logs { get; } = new();

        public MainViewModel()
        {
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };

            _statusTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(3) };
            _statusTimer.Tick += async (s, e) => await CheckConnectionsAsync();
            _statusTimer.Start();

            _ = InitializeAsync();
        }

        private async Task InitializeAsync()
        {
            AddLog("🚀 Luncher C# démarré", LogLevel.Info);
            await CheckConnectionsAsync();
            await BuildExampleProjectAsync();
        }

        private async Task BuildExampleProjectAsync()
        {
            AddLog("🔨 Compilation du projet Exemple_csharp...", LogLevel.Info);
            IsLoading = true;

            try
            {
                var projectPath = FindExampleProjectPath();
                if (string.IsNullOrEmpty(projectPath))
                {
                    AddLog("❌ Projet Exemple_csharp non trouvé", LogLevel.Error);
                    return;
                }

                var psi = new ProcessStartInfo
                {
                    FileName = "dotnet",
                    Arguments = "build -c Release",
                    WorkingDirectory = projectPath,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                using var process = Process.Start(psi);
                if (process != null)
                {
                    await process.WaitForExitAsync();
                    if (process.ExitCode == 0)
                    {
                        AddLog("✅ Compilation réussie", LogLevel.Success);
                    }
                    else
                    {
                        var error = await process.StandardError.ReadToEndAsync();
                        AddLog($"❌ Erreur de compilation: {error}", LogLevel.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                AddLog($"❌ Erreur: {ex.Message}", LogLevel.Error);
            }
            finally
            {
                IsLoading = false;
            }
        }

        public async Task CheckConnectionsAsync()
        {
            // Check API
            try
            {
                var response = await _httpClient.GetAsync("http://localhost:8080/api/health/ping");
                IsApiConnected = response.IsSuccessStatusCode;
            }
            catch
            {
                IsApiConnected = false;
            }

            // Check Signal Server
            try
            {
                var response = await _httpClient.GetAsync("http://localhost:5001/");
                IsSignalConnected = true; // 404 is OK, server is running
            }
            catch
            {
                IsSignalConnected = false;
            }

            UpdateStatusText();
        }

        private void UpdateStatusText()
        {
            if (IsApiConnected && IsSignalConnected)
            {
                StatusText = "✅ Services SmaRTC connectés";
            }
            else if (!IsApiConnected && !IsSignalConnected)
            {
                StatusText = "❌ Services SmaRTC non disponibles";
            }
            else
            {
                StatusText = "⚠️ Connexion partielle";
            }
        }

        public void LaunchClient1()
        {
            if (_client1Process != null && !_client1Process.HasExited)
            {
                AddLog("⚠️ Client1 est déjà en cours d'exécution", LogLevel.Warning);
                return;
            }

            _client1Process = LaunchClient(1);
            if (_client1Process != null)
            {
                IsClient1Running = true;
                _client1Process.Exited += (s, e) =>
                {
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        IsClient1Running = false;
                        AddLog("Client1 s'est terminé", LogLevel.Info);
                    });
                };
                AddLog("🟢 Client1 démarré", LogLevel.Success);
            }
        }

        public void LaunchClient2()
        {
            if (_client2Process != null && !_client2Process.HasExited)
            {
                AddLog("⚠️ Client2 est déjà en cours d'exécution", LogLevel.Warning);
                return;
            }

            _client2Process = LaunchClient(2);
            if (_client2Process != null)
            {
                IsClient2Running = true;
                _client2Process.Exited += (s, e) =>
                {
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        IsClient2Running = false;
                        AddLog("Client2 s'est terminé", LogLevel.Info);
                    });
                };
                AddLog("🟣 Client2 démarré", LogLevel.Success);
            }
        }

        public void LaunchBothClients()
        {
            LaunchClient1();
            LaunchClient2();
        }

        private Process? LaunchClient(int clientNumber)
        {
            try
            {
                var projectPath = FindExampleProjectPath();
                if (string.IsNullOrEmpty(projectPath))
                {
                    AddLog("❌ Projet non trouvé", LogLevel.Error);
                    return null;
                }

                var exePath = Path.Combine(projectPath, "bin", "Release", "net9.0", "Exemple_csharp.exe");
                
                if (!File.Exists(exePath))
                {
                    AddLog($"❌ Executable non trouvé: {exePath}", LogLevel.Error);
                    return null;
                }

                var psi = new ProcessStartInfo
                {
                    FileName = exePath,
                    Arguments = clientNumber.ToString(),
                    UseShellExecute = true,
                    WorkingDirectory = Path.GetDirectoryName(exePath)
                };

                var process = Process.Start(psi);
                if (process != null)
                {
                    process.EnableRaisingEvents = true;
                }
                return process;
            }
            catch (Exception ex)
            {
                AddLog($"❌ Erreur de lancement: {ex.Message}", LogLevel.Error);
                return null;
            }
        }

        public void StopClient1()
        {
            if (_client1Process != null && !_client1Process.HasExited)
            {
                _client1Process.Kill();
                IsClient1Running = false;
                AddLog("Client1 arrêté", LogLevel.Info);
            }
        }

        public void StopClient2()
        {
            if (_client2Process != null && !_client2Process.HasExited)
            {
                _client2Process.Kill();
                IsClient2Running = false;
                AddLog("Client2 arrêté", LogLevel.Info);
            }
        }

        public void StopAllClients()
        {
            StopClient1();
            StopClient2();
        }

        private string? FindExampleProjectPath()
        {
            // Path is sibling folder to Luncher_csharp
            var basePath = AppDomain.CurrentDomain.BaseDirectory;
            
            // Navigate up from bin\Debug\net9.0-windows to Luncher_csharp then to parent
            var current = new DirectoryInfo(basePath);
            
            // Find the root "SmaRTC Start" folder
            while (current != null)
            {
                var exempleDir = Path.Combine(current.FullName, "Exemple_csharp");
                if (Directory.Exists(exempleDir) && File.Exists(Path.Combine(exempleDir, "Exemple_csharp.csproj")))
                {
                    return exempleDir;
                }
                current = current.Parent;
            }

            // Fallback to desktop path
            return Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                "SmaRTC Start", "Exemple_csharp"
            );
        }

        public void ClearLogs()
        {
            Logs.Clear();
            AddLog("Logs effacés", LogLevel.Info);
        }

        public void OpenSwagger()
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "http://localhost:8080/swagger",
                UseShellExecute = true
            });
        }

        private void AddLog(string message, LogLevel level)
        {
            Application.Current.Dispatcher.Invoke(() =>
            {
                Logs.Insert(0, new LogEntry
                {
                    Timestamp = DateTime.Now,
                    Message = message,
                    Level = level
                });

                if (Logs.Count > 200)
                {
                    Logs.RemoveAt(Logs.Count - 1);
                }
            });
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string? name = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        }
    }

    public enum LogLevel
    {
        Info,
        Success,
        Warning,
        Error
    }

    public class LogEntry
    {
        public DateTime Timestamp { get; set; }
        public string Message { get; set; } = "";
        public LogLevel Level { get; set; }

        public string FormattedTime => Timestamp.ToString("HH:mm:ss");

        public string LevelIcon => Level switch
        {
            LogLevel.Info => "ℹ️",
            LogLevel.Success => "✅",
            LogLevel.Warning => "⚠️",
            LogLevel.Error => "❌",
            _ => "📝"
        };

        public string LevelColor => Level switch
        {
            LogLevel.Info => "#2196F3",
            LogLevel.Success => "#4CAF50",
            LogLevel.Warning => "#FF9800",
            LogLevel.Error => "#F44336",
            _ => "#9E9E9E"
        };

        public string DisplayText => $"[{FormattedTime}] {LevelIcon} {Message}";
    }
}
