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

    public override string ToString() => Name;
}

public partial class MainViewModel : ObservableObject
{
    private Process? _flutterProcess;
    private readonly StringBuilder _logBuilder = new();

    [ObservableProperty]
    private string _flutterProjectPath = "";

    [ObservableProperty]
    private string _flutterVersion = "Checking...";

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
        var defaultPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
            "SmaRTC Start", "Flutter", "Exemple_flutter");
        
        if (Directory.Exists(defaultPath))
        {
            FlutterProjectPath = defaultPath;
        }

        // Initialisation
        _ = InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        await GetFlutterVersionAsync();
        await RefreshDevicesAsync();
    }

    private async Task GetFlutterVersionAsync()
    {
        try
        {
            var result = await RunCommandAsync("flutter", "--version", waitForExit: true);
            var lines = result.Split('\n');
            if (lines.Length > 0)
            {
                FlutterVersion = lines[0].Trim();
            }
        }
        catch
        {
            FlutterVersion = "Flutter non trouvé";
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
        AppendLog("🔄 Recherche des devices...");
        Devices.Clear();

        try
        {
            var result = await RunCommandAsync("flutter", "devices", waitForExit: true);
            ParseDevices(result);
            AppendLog($"✅ {Devices.Count} device(s) trouvé(s)");
        }
        catch (Exception ex)
        {
            AppendLog($"❌ Erreur: {ex.Message}");
        }
    }

    private void ParseDevices(string output)
    {
        var lines = output.Split('\n');
        foreach (var line in lines)
        {
            if (line.Contains("•") && !line.Contains("No devices"))
            {
                var parts = line.Split('•');
                if (parts.Length >= 2)
                {
                    var device = new FlutterDevice
                    {
                        Name = parts[0].Trim(),
                        Id = parts[1].Trim(),
                        Platform = parts.Length > 2 ? parts[2].Trim() : ""
                    };
                    Devices.Add(device);
                }
            }
        }

        // Ajouter Chrome/Edge par défaut si aucun device
        if (Devices.Count == 0)
        {
            Devices.Add(new FlutterDevice { Id = "chrome", Name = "Chrome (web)", Platform = "web-javascript" });
            Devices.Add(new FlutterDevice { Id = "edge", Name = "Edge (web)", Platform = "web-javascript" });
            Devices.Add(new FlutterDevice { Id = "windows", Name = "Windows (desktop)", Platform = "windows-x64" });
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

        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "flutter",
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
        AppendLog("🩺 flutter doctor...");
        var result = await RunCommandAsync("flutter", "doctor", waitForExit: true);
        AppendLog(result);
    }

    [RelayCommand]
    private async Task RunPubGetAsync()
    {
        if (string.IsNullOrEmpty(FlutterProjectPath)) return;
        
        AppendLog("📦 flutter pub get...");
        var result = await RunCommandAsync("flutter", "pub get", FlutterProjectPath, waitForExit: true);
        AppendLog(result);
    }

    [RelayCommand]
    private async Task RunCleanAsync()
    {
        if (string.IsNullOrEmpty(FlutterProjectPath)) return;
        
        AppendLog("🧹 flutter clean...");
        var result = await RunCommandAsync("flutter", "clean", FlutterProjectPath, waitForExit: true);
        AppendLog(result);
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
