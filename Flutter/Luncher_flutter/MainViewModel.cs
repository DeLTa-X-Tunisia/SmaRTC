using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows.Media;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Win32;

namespace Luncher_flutter;

public class FlutterDevice
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Platform { get; set; } = "";
    public string Icon { get; set; } = "📱";

    public override string ToString() => $"{Icon} {Name}";
}

public partial class MainViewModel : ObservableObject
{
    private Process? _flutterProcess;
    private readonly StringBuilder _logBuilder = new();
    private string _flutterExecutable = "flutter";

    [ObservableProperty]
    private string _flutterProjectPath = "";

    [ObservableProperty]
    private string _flutterVersion = "Recherche...";

    [ObservableProperty]
    private bool _isFlutterFound;

    [ObservableProperty]
    private string _flutterStatusText = "🔍 Vérification...";

    [ObservableProperty]
    private Brush _flutterStatusColor = Brushes.Orange;

    [ObservableProperty]
    private ObservableCollection<FlutterDevice> _devices = new();

    [ObservableProperty]
    private FlutterDevice? _selectedDevice;

    [ObservableProperty]
    private bool _isRunning;

    [ObservableProperty]
    private string _statusText = "Prêt";

    [ObservableProperty]
    private Brush _statusColor = Brushes.Gray;

    [ObservableProperty]
    private string _logOutput = "";

    public MainViewModel()
    {
        // Chemin par défaut vers le projet Flutter
        var desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
        var candidates = new[]
        {
            Path.Combine(desktopPath, "SmaRTC Start", "SmaRTC", "Flutter", "Exemple_flutter"),
            Path.Combine(desktopPath, "SmaRTC Start", "Flutter", "Exemple_flutter"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), 
                "OneDrive", "Desktop", "SmaRTC Start", "SmaRTC", "Flutter", "Exemple_flutter"),
        };

        foreach (var path in candidates)
        {
            if (Directory.Exists(path))
            {
                FlutterProjectPath = path;
                break;
            }
        }

        // Initialisation
        _ = InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        await FindFlutterAsync();
        if (IsFlutterFound)
        {
            await GetFlutterVersionAsync();
            await RefreshDevicesAsync();
        }
    }

    /// <summary>
    /// Recherche l'exécutable Flutter dans plusieurs emplacements
    /// </summary>
    private async Task FindFlutterAsync()
    {
        AppendLog("🔍 Recherche de Flutter...");

        // Liste des chemins possibles pour Flutter
        var possiblePaths = new List<string>
        {
            // Via PATH (commande par défaut)
            "flutter",
            "flutter.bat",
            
            // Emplacements Windows courants
            @"C:\flutter\bin\flutter.bat",
            @"C:\src\flutter\bin\flutter.bat",
            @"C:\dev\flutter\bin\flutter.bat",
            
            // Dossier utilisateur
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "flutter", "bin", "flutter.bat"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "development", "flutter", "bin", "flutter.bat"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "fvm", "default", "bin", "flutter.bat"),
            
            // AppData/Local
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "flutter", "bin", "flutter.bat"),
            
            // Program Files
            @"C:\Program Files\flutter\bin\flutter.bat",
            @"C:\Program Files (x86)\flutter\bin\flutter.bat",
        };

        // Ajouter les chemins du PATH
        var pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var pathDir in pathEnv.Split(';'))
        {
            if (!string.IsNullOrEmpty(pathDir))
            {
                possiblePaths.Add(Path.Combine(pathDir, "flutter.bat"));
                possiblePaths.Add(Path.Combine(pathDir, "flutter"));
            }
        }

        // Tester chaque chemin
        foreach (var path in possiblePaths)
        {
            if (await TestFlutterPathAsync(path))
            {
                _flutterExecutable = path;
                IsFlutterFound = true;
                FlutterStatusText = "✅ Flutter trouvé";
                FlutterStatusColor = Brushes.LimeGreen;
                AppendLog($"✅ Flutter trouvé: {path}");
                return;
            }
        }

        // Essayer de trouver via where/which
        try
        {
            var whereResult = await RunRawCommandAsync("where", "flutter");
            if (!string.IsNullOrWhiteSpace(whereResult))
            {
                var foundPath = whereResult.Split('\n').FirstOrDefault()?.Trim();
                if (!string.IsNullOrEmpty(foundPath) && await TestFlutterPathAsync(foundPath))
                {
                    _flutterExecutable = foundPath;
                    IsFlutterFound = true;
                    FlutterStatusText = "✅ Flutter trouvé";
                    FlutterStatusColor = Brushes.LimeGreen;
                    AppendLog($"✅ Flutter trouvé via where: {foundPath}");
                    return;
                }
            }
        }
        catch { }

        // Non trouvé
        IsFlutterFound = false;
        FlutterStatusText = "❌ Flutter non trouvé";
        FlutterStatusColor = Brushes.Red;
        FlutterVersion = "Non installé";
        AppendLog("❌ Flutter non trouvé! Vérifiez l'installation et le PATH.");
        AppendLog("💡 Conseil: Ajoutez le dossier flutter/bin au PATH système.");
    }

    private async Task<bool> TestFlutterPathAsync(string path)
    {
        try
        {
            // Si c'est juste "flutter", on teste directement
            if (path == "flutter" || path == "flutter.bat")
            {
                var result = await RunRawCommandAsync(path, "--version");
                return result.Contains("Flutter");
            }

            // Sinon, vérifier si le fichier existe
            if (!File.Exists(path)) return false;

            var testResult = await RunRawCommandAsync(path, "--version");
            return testResult.Contains("Flutter");
        }
        catch
        {
            return false;
        }
    }

    private async Task<string> RunRawCommandAsync(string command, string arguments)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = command,
                Arguments = arguments,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null) return "";

            var output = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();
            return output;
        }
        catch
        {
            return "";
        }
    }

    private async Task GetFlutterVersionAsync()
    {
        try
        {
            var result = await RunCommandAsync(_flutterExecutable, "--version", waitForExit: true);
            var lines = result.Split('\n');
            if (lines.Length > 0 && lines[0].Contains("Flutter"))
            {
                FlutterVersion = lines[0].Trim();
            }
        }
        catch
        {
            FlutterVersion = "Version inconnue";
        }
    }

    [RelayCommand]
    private void BrowseProject()
    {
        var dialog = new OpenFolderDialog
        {
            Title = "Sélectionner le projet Flutter"
        };

        if (dialog.ShowDialog() == true)
        {
            FlutterProjectPath = dialog.FolderName;
            AppendLog($"📁 Projet sélectionné: {FlutterProjectPath}");
        }
    }

    [RelayCommand]
    private async Task RefreshDevicesAsync()
    {
        if (!IsFlutterFound)
        {
            AppendLog("❌ Flutter non trouvé - impossible de lister les devices");
            return;
        }

        AppendLog("🔄 Recherche des devices...");
        Devices.Clear();

        try
        {
            var result = await RunCommandAsync(_flutterExecutable, "devices", waitForExit: true);
            ParseDevices(result);
            
            if (Devices.Count > 0)
            {
                AppendLog($"✅ {Devices.Count} device(s) trouvé(s)");
            }
            else
            {
                AppendLog("⚠️ Aucun device détecté, ajout des devices par défaut...");
                AddDefaultDevices();
            }
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Erreur: {ex.Message}");
            AddDefaultDevices();
        }
    }

    private void AddDefaultDevices()
    {
        Devices.Add(new FlutterDevice { Id = "chrome", Name = "Chrome (web)", Platform = "web-javascript", Icon = "🌐" });
        Devices.Add(new FlutterDevice { Id = "edge", Name = "Edge (web)", Platform = "web-javascript", Icon = "🌐" });
        Devices.Add(new FlutterDevice { Id = "windows", Name = "Windows (desktop)", Platform = "windows-x64", Icon = "🖥️" });
        
        if (Devices.Count > 0)
        {
            SelectedDevice = Devices[0];
        }
    }

    private void ParseDevices(string output)
    {
        var lines = output.Split('\n');
        foreach (var line in lines)
        {
            // Format: Device Name • device-id • platform • status
            if (line.Contains("•") && !line.Contains("No devices") && !line.Contains("devices found"))
            {
                var parts = line.Split('•');
                if (parts.Length >= 2)
                {
                    var name = parts[0].Trim();
                    var id = parts[1].Trim();
                    var platform = parts.Length > 2 ? parts[2].Trim() : "";
                    
                    // Déterminer l'icône selon le type
                    var icon = platform.ToLower() switch
                    {
                        var p when p.Contains("web") => "🌐",
                        var p when p.Contains("android") => "📱",
                        var p when p.Contains("ios") => "🍎",
                        var p when p.Contains("windows") => "🖥️",
                        var p when p.Contains("macos") => "🍏",
                        var p when p.Contains("linux") => "🐧",
                        _ => "📱"
                    };

                    var device = new FlutterDevice
                    {
                        Name = name,
                        Id = id,
                        Platform = platform,
                        Icon = icon
                    };
                    Devices.Add(device);
                }
            }
        }

        // Si aucun device trouvé, ajouter les defaults
        if (Devices.Count == 0)
        {
            AddDefaultDevices();
            return;
        }

        if (Devices.Count > 0)
        {
            SelectedDevice = Devices[0];
        }
    }

    [RelayCommand]
    private async Task LaunchFlutterAsync()
    {
        if (!IsFlutterFound)
        {
            AppendLog("❌ Flutter non trouvé - impossible de lancer");
            return;
        }

        if (string.IsNullOrEmpty(FlutterProjectPath) || !Directory.Exists(FlutterProjectPath))
        {
            AppendLog("❌ Chemin du projet invalide");
            return;
        }

        if (SelectedDevice == null)
        {
            AppendLog("❌ Aucun device sélectionné");
            return;
        }

        IsRunning = true;
        StatusText = "En cours d'exécution";
        StatusColor = Brushes.LimeGreen;

        AppendLog($"🚀 Lancement sur {SelectedDevice.Name}...");
        AppendLog($"📂 Projet: {FlutterProjectPath}");
        AppendLog($"🔧 Commande: {_flutterExecutable} run -d {SelectedDevice.Id}");

        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = _flutterExecutable,
                Arguments = $"run -d {SelectedDevice.Id}",
                WorkingDirectory = FlutterProjectPath,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = true,
                CreateNoWindow = true
            };

            _flutterProcess = new Process { StartInfo = startInfo };
            
            _flutterProcess.OutputDataReceived += (s, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    App.Current.Dispatcher.Invoke(() => AppendLog(e.Data));
                }
            };

            _flutterProcess.ErrorDataReceived += (s, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    App.Current.Dispatcher.Invoke(() => AppendLog($"⚠️ {e.Data}"));
                }
            };

            _flutterProcess.EnableRaisingEvents = true;
            _flutterProcess.Exited += (s, e) =>
            {
                App.Current.Dispatcher.Invoke(() =>
                {
                    IsRunning = false;
                    StatusText = "Arrêté";
                    StatusColor = Brushes.Gray;
                    AppendLog("🛑 Flutter arrêté");
                });
            };

            _flutterProcess.Start();
            _flutterProcess.BeginOutputReadLine();
            _flutterProcess.BeginErrorReadLine();
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Erreur de lancement: {ex.Message}");
            IsRunning = false;
            StatusText = "Erreur";
            StatusColor = Brushes.Red;
        }
    }

    [RelayCommand]
    private void StopFlutter()
    {
        if (_flutterProcess != null && !_flutterProcess.HasExited)
        {
            AppendLog("⏹️ Arrêt de Flutter...");
            
            // Envoyer 'q' pour quitter proprement
            try
            {
                _flutterProcess.StandardInput.WriteLine("q");
            }
            catch
            {
                _flutterProcess.Kill(true);
            }
        }
    }

    [RelayCommand]
    private void HotReload()
    {
        if (_flutterProcess != null && !_flutterProcess.HasExited)
        {
            AppendLog("🔥 Hot Reload...");
            try
            {
                _flutterProcess.StandardInput.WriteLine("r");
            }
            catch (Exception ex)
            {
                AppendLog($"❌ Erreur: {ex.Message}");
            }
        }
    }

    [RelayCommand]
    private void HotRestart()
    {
        if (_flutterProcess != null && !_flutterProcess.HasExited)
        {
            AppendLog("♻️ Hot Restart...");
            try
            {
                _flutterProcess.StandardInput.WriteLine("R");
            }
            catch (Exception ex)
            {
                AppendLog($"❌ Erreur: {ex.Message}");
            }
        }
    }

    [RelayCommand]
    private async Task RunDoctorAsync()
    {
        if (!IsFlutterFound)
        {
            AppendLog("❌ Flutter non trouvé");
            return;
        }
        AppendLog("🩺 flutter doctor...");
        var result = await RunCommandAsync(_flutterExecutable, "doctor -v", waitForExit: true);
        AppendLog(result);
    }

    [RelayCommand]
    private async Task RunPubGetAsync()
    {
        if (!IsFlutterFound)
        {
            AppendLog("❌ Flutter non trouvé");
            return;
        }
        if (string.IsNullOrEmpty(FlutterProjectPath)) return;
        
        AppendLog("📦 flutter pub get...");
        var result = await RunCommandAsync(_flutterExecutable, "pub get", FlutterProjectPath, waitForExit: true);
        AppendLog(result);
    }

    [RelayCommand]
    private async Task RunCleanAsync()
    {
        if (!IsFlutterFound)
        {
            AppendLog("❌ Flutter non trouvé");
            return;
        }
        if (string.IsNullOrEmpty(FlutterProjectPath)) return;
        
        AppendLog("🧹 flutter clean...");
        var result = await RunCommandAsync(_flutterExecutable, "clean", FlutterProjectPath, waitForExit: true);
        AppendLog(result);
    }

    [RelayCommand]
    private async Task FindFlutterManuallyAsync()
    {
        var dialog = new OpenFileDialog
        {
            Title = "Sélectionner flutter.bat",
            Filter = "Flutter|flutter.bat;flutter.exe|Tous les fichiers|*.*",
            InitialDirectory = @"C:\"
        };

        if (dialog.ShowDialog() == true)
        {
            var path = dialog.FileName;
            if (await TestFlutterPathAsync(path))
            {
                _flutterExecutable = path;
                IsFlutterFound = true;
                FlutterStatusText = "✅ Flutter trouvé";
                FlutterStatusColor = Brushes.LimeGreen;
                AppendLog($"✅ Flutter configuré manuellement: {path}");
                await GetFlutterVersionAsync();
                await RefreshDevicesAsync();
            }
            else
            {
                AppendLog($"❌ Le fichier sélectionné n'est pas un exécutable Flutter valide");
            }
        }
    }

    [RelayCommand]
    private void ClearLogs()
    {
        _logBuilder.Clear();
        LogOutput = "";
    }

    private void AppendLog(string message)
    {
        var timestamp = DateTime.Now.ToString("HH:mm:ss");
        _logBuilder.AppendLine($"[{timestamp}] {message}");
        LogOutput = _logBuilder.ToString();
    }

    private async Task<string> RunCommandAsync(string command, string arguments, string? workingDir = null, bool waitForExit = false)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = command,
            Arguments = arguments,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        if (!string.IsNullOrEmpty(workingDir))
        {
            startInfo.WorkingDirectory = workingDir;
        }

        using var process = new Process { StartInfo = startInfo };
        var output = new StringBuilder();

        process.OutputDataReceived += (s, e) =>
        {
            if (!string.IsNullOrEmpty(e.Data))
            {
                output.AppendLine(e.Data);
            }
        };

        process.ErrorDataReceived += (s, e) =>
        {
            if (!string.IsNullOrEmpty(e.Data))
            {
                output.AppendLine(e.Data);
            }
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        if (waitForExit)
        {
            await process.WaitForExitAsync();
        }

        return output.ToString();
    }
}
