using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows;
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
    private bool _useCmd = true; // Utiliser cmd /c pour éviter les problèmes Git

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
    private string _flutterErrorDetail = "";

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
        else
        {
            // Même si Flutter n'est pas "trouvé" correctement, ajouter les devices par défaut
            AddDefaultDevices();
        }
    }

    /// <summary>
    /// Recherche l'exécutable Flutter dans plusieurs emplacements
    /// </summary>
    private async Task FindFlutterAsync()
    {
        AppendLog("🔍 Recherche de Flutter...");

        // D'abord, essayer via "where flutter" qui est plus fiable sur Windows
        try
        {
            var whereResult = await RunRawCommandAsync("where", "flutter");
            if (!string.IsNullOrWhiteSpace(whereResult) && !whereResult.Contains("not find"))
            {
                var foundPath = whereResult.Split('\n').FirstOrDefault()?.Trim();
                if (!string.IsNullOrEmpty(foundPath))
                {
                    // Flutter est dans le PATH, utiliser cmd /c pour éviter les erreurs Git
                    _flutterExecutable = "flutter";
                    _useCmd = true;
                    IsFlutterFound = true;
                    FlutterStatusText = "✅ Flutter trouvé";
                    FlutterStatusColor = Brushes.LimeGreen;
                    FlutterErrorDetail = "";
                    AppendLog($"✅ Flutter trouvé: {foundPath}");
                    return;
                }
            }
        }
        catch { }

        // Liste des chemins possibles pour Flutter
        var possiblePaths = new List<string>
        {
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
            if (File.Exists(path))
            {
                _flutterExecutable = path;
                _useCmd = false;
                IsFlutterFound = true;
                FlutterStatusText = "✅ Flutter trouvé";
                FlutterStatusColor = Brushes.LimeGreen;
                FlutterErrorDetail = "";
                AppendLog($"✅ Flutter trouvé: {path}");
                return;
            }
        }

        // Non trouvé
        IsFlutterFound = false;
        FlutterStatusText = "❌ Flutter non trouvé";
        FlutterStatusColor = Brushes.Red;
        FlutterVersion = "Non installé";
        FlutterErrorDetail = "Installez Flutter et ajoutez-le au PATH";
        AppendLog("❌ Flutter non trouvé! Vérifiez l'installation et le PATH.");
        AppendLog("💡 Conseil: Ajoutez le dossier flutter/bin au PATH système.");
        AppendLog("💡 Téléchargez Flutter: https://docs.flutter.dev/get-started/install");
    }

    private async Task<bool> TestFlutterPathAsync(string path)
    {
        try
        {
            if (!File.Exists(path) && path != "flutter" && path != "flutter.bat") 
                return false;

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
            var result = await RunFlutterCommandAsync("--version", waitForExit: true);
            var lines = result.Split('\n');
            
            // Ignorer les erreurs Git et chercher la ligne de version
            foreach (var line in lines)
            {
                if (line.Contains("Flutter") && (line.Contains(".") || line.Contains("stable") || line.Contains("beta")))
                {
                    FlutterVersion = line.Trim();
                    return;
                }
            }
            
            // Si erreur Git détectée
            if (result.Contains("not a clone") || result.Contains("requires Git"))
            {
                FlutterVersion = "⚠️ Problème Git détecté";
                FlutterErrorDetail = "Votre Flutter a un problème Git, mais devrait fonctionner";
                AppendLog("⚠️ Flutter a un problème Git - certaines fonctions peuvent être limitées");
                AppendLog("💡 Solution: git clone -b stable https://github.com/flutter/flutter.git");
            }
        }
        catch
        {
            FlutterVersion = "Version inconnue";
        }
    }

    /// <summary>
    /// Exécute une commande Flutter en utilisant cmd /c pour éviter les problèmes de PATH
    /// </summary>
    private async Task<string> RunFlutterCommandAsync(string arguments, bool waitForExit = false, string? workingDir = null)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = $"/c flutter {arguments}",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        if (!string.IsNullOrEmpty(workingDir))
        {
            psi.WorkingDirectory = workingDir;
        }

        using var process = new Process { StartInfo = psi };
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
            AppendLog("⚠️ Flutter non détecté - utilisation des devices par défaut");
            AddDefaultDevices();
            return;
        }

        AppendLog("🔄 Recherche des devices...");
        Devices.Clear();

        try
        {
            var result = await RunFlutterCommandAsync("devices", waitForExit: true);
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
        Devices.Clear();
        Devices.Add(new FlutterDevice { Id = "chrome", Name = "Chrome (web)", Platform = "web-javascript", Icon = "🌐" });
        Devices.Add(new FlutterDevice { Id = "edge", Name = "Edge (web)", Platform = "web-javascript", Icon = "🌐" });
        Devices.Add(new FlutterDevice { Id = "windows", Name = "Windows (desktop)", Platform = "windows-x64", Icon = "🖥️" });
        
        if (Devices.Count > 0 && SelectedDevice == null)
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
        AppendLog($"🔧 Commande: cmd /c flutter run -d {SelectedDevice.Id}");

        try
        {
            // Utiliser cmd /c flutter pour éviter les problèmes de PATH et Git
            var startInfo = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c flutter run -d {SelectedDevice.Id}",
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
                    // Ignorer les erreurs Git mais les afficher quand même en warning
                    var prefix = e.Data.Contains("not a clone") || e.Data.Contains("requires Git") 
                        ? "⚠️ [Git] " : "⚠️ ";
                    App.Current.Dispatcher.Invoke(() => AppendLog($"{prefix}{e.Data}"));
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
        AppendLog("🩺 flutter doctor -v...");
        var result = await RunFlutterCommandAsync("doctor -v", waitForExit: true);
        AppendLog(result);
    }

    [RelayCommand]
    private async Task RunPubGetAsync()
    {
        if (string.IsNullOrEmpty(FlutterProjectPath)) 
        {
            AppendLog("❌ Veuillez d'abord sélectionner un projet Flutter");
            return;
        }
        
        AppendLog("📦 flutter pub get...");
        var result = await RunFlutterCommandAsync("pub get", waitForExit: true, FlutterProjectPath);
        AppendLog(result);
    }

    [RelayCommand]
    private async Task RunCleanAsync()
    {
        if (string.IsNullOrEmpty(FlutterProjectPath))
        {
            AppendLog("❌ Veuillez d'abord sélectionner un projet Flutter");
            return;
        }
        
        AppendLog("🧹 flutter clean...");
        var result = await RunFlutterCommandAsync("clean", waitForExit: true, FlutterProjectPath);
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
            _flutterExecutable = path;
            _useCmd = false;
            IsFlutterFound = true;
            FlutterStatusText = "✅ Flutter trouvé";
            FlutterStatusColor = Brushes.LimeGreen;
            FlutterErrorDetail = "";
            AppendLog($"✅ Flutter configuré manuellement: {path}");
            await GetFlutterVersionAsync();
            await RefreshDevicesAsync();
        }
    }

    [RelayCommand]
    private void CopyLogs()
    {
        try
        {
            Clipboard.SetText(LogOutput);
            AppendLog("📋 Logs copiés dans le presse-papiers!");
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Erreur lors de la copie: {ex.Message}");
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
