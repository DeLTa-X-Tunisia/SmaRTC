using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows;
using System.Windows.Media;

namespace Luncher_Python;

public partial class MainViewModel : ObservableObject
{
    private readonly List<Process> _pythonProcesses = new();
    private readonly StringBuilder _consoleBuilder = new();
    private string? _projectPath;
    private string? _pythonPath;
    private int _clientCount = 0;

    [ObservableProperty]
    private string _consoleOutput = "";

    [ObservableProperty]
    private string _statusText = "Arrêté";

    [ObservableProperty]
    private Brush _statusColor = Brushes.Gray;

    [ObservableProperty]
    private bool _isRunning;

    [ObservableProperty]
    private bool _canStart = true;

    [ObservableProperty]
    private bool _canInstall = true;

    [ObservableProperty]
    private string _pythonInfo = "Recherche de Python...";

    [ObservableProperty]
    private string _clientCountText = "";

    public MainViewModel()
    {
        FindProjectPath();
        FindPython();
        Log("🐍 SmaRTC Python Launcher initialisé");
        Log($"📂 Projet: {_projectPath ?? "Non trouvé"}");
    }

    private void FindProjectPath()
    {
        var basePaths = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "Exemple_Python"),
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "Exemple_Python"),
            Path.Combine(Environment.CurrentDirectory, "..", "Exemple_Python"),
            @"C:\Users\azizi\OneDrive\Desktop\SmaRTC Start\SmaRTC\Python\Exemple_Python",
        };

        foreach (var basePath in basePaths)
        {
            var fullPath = Path.GetFullPath(basePath);
            if (Directory.Exists(fullPath) && File.Exists(Path.Combine(fullPath, "main.py")))
            {
                _projectPath = fullPath;
                return;
            }
        }
    }

    private void FindPython()
    {
        // Chercher python dans le PATH
        var pythonNames = new[] { "python", "python3", "py" };
        
        foreach (var name in pythonNames)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = name,
                    Arguments = "--version",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true,
                };
                
                using var process = Process.Start(psi);
                if (process != null)
                {
                    var output = process.StandardOutput.ReadToEnd();
                    process.WaitForExit();
                    if (process.ExitCode == 0)
                    {
                        _pythonPath = name;
                        PythonInfo = $"✅ {output.Trim()} ({name})";
                        return;
                    }
                }
            }
            catch { }
        }

        PythonInfo = "❌ Python non trouvé. Installez Python 3.10+";
        CanStart = false;
        CanInstall = false;
    }

    private void Log(string message)
    {
        var timestamp = DateTime.Now.ToString("HH:mm:ss");
        _consoleBuilder.AppendLine($"[{timestamp}] {message}");
        ConsoleOutput = _consoleBuilder.ToString();
    }

    [RelayCommand]
    private async Task Install()
    {
        if (_projectPath == null || _pythonPath == null)
        {
            Log("❌ Projet ou Python non trouvé !");
            return;
        }

        CanInstall = false;
        CanStart = false;
        StatusText = "Installation...";
        StatusColor = Brushes.Orange;
        Log("📦 Installation des dépendances pip...");

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = _pythonPath,
                Arguments = "-m pip install -r requirements.txt",
                WorkingDirectory = _projectPath,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };

            using var process = Process.Start(psi);
            if (process == null)
            {
                Log("❌ Impossible de démarrer pip");
                return;
            }

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            if (!string.IsNullOrWhiteSpace(output))
            {
                foreach (var line in output.Split('\n').Where(l => !string.IsNullOrWhiteSpace(l)))
                {
                    Log($"  {line.Trim()}");
                }
            }

            if (process.ExitCode == 0)
            {
                Log("✅ Dépendances installées avec succès");
                StatusText = "Prêt";
                StatusColor = Brushes.LimeGreen;
            }
            else
            {
                Log($"❌ Erreur pip: {error}");
                StatusText = "Erreur installation";
                StatusColor = Brushes.Red;
            }
        }
        catch (Exception ex)
        {
            Log($"❌ Erreur: {ex.Message}");
            StatusText = "Erreur";
            StatusColor = Brushes.Red;
        }
        finally
        {
            CanInstall = true;
            CanStart = true;
        }
    }

    [RelayCommand]
    private void Start()
    {
        if (_projectPath == null || _pythonPath == null)
        {
            Log("❌ Projet ou Python non trouvé !");
            return;
        }

        LaunchClient();
        CanStart = false;
    }

    [RelayCommand]
    private void StartAnother()
    {
        if (_projectPath == null || _pythonPath == null)
        {
            Log("❌ Projet ou Python non trouvé !");
            return;
        }

        LaunchClient();
    }

    private void LaunchClient()
    {
        _clientCount++;
        Log($"🚀 Lancement du client #{_clientCount}...");

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/k title SmaRTC Python Client #{_clientCount} && cd /d \"{_projectPath}\" && {_pythonPath} main.py",
                UseShellExecute = true,
                CreateNoWindow = false,
            };

            var process = Process.Start(psi);

            if (process != null)
            {
                _pythonProcesses.Add(process);
                IsRunning = true;
                StatusText = "En cours d'exécution";
                StatusColor = Brushes.LimeGreen;
                UpdateClientCount();
                Log($"✅ Client #{_clientCount} démarré");

                process.EnableRaisingEvents = true;
                process.Exited += (s, e) =>
                {
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        _pythonProcesses.Remove(process);
                        UpdateClientCount();
                        Log($"⏹ Un client Python s'est fermé");
                        
                        if (_pythonProcesses.Count == 0)
                        {
                            IsRunning = false;
                            CanStart = true;
                            StatusText = "Arrêté";
                            StatusColor = Brushes.Gray;
                            _clientCount = 0;
                        }
                    });
                };
            }
        }
        catch (Exception ex)
        {
            Log($"❌ Erreur démarrage: {ex.Message}");
            _clientCount--;
        }
    }

    private void UpdateClientCount()
    {
        ClientCountText = _pythonProcesses.Count > 0 
            ? $"({_pythonProcesses.Count} client{(_pythonProcesses.Count > 1 ? "s" : "")} actif{(_pythonProcesses.Count > 1 ? "s" : "")})" 
            : "";
    }

    [RelayCommand]
    private void Stop()
    {
        Log("⏹ Arrêt de tous les clients...");
        
        foreach (var process in _pythonProcesses.ToList())
        {
            try
            {
                if (!process.HasExited)
                {
                    KillProcessTree(process.Id);
                }
            }
            catch { }
        }
        
        _pythonProcesses.Clear();
        _clientCount = 0;
        IsRunning = false;
        CanStart = true;
        StatusText = "Arrêté";
        StatusColor = Brushes.Gray;
        UpdateClientCount();
        Log("✅ Tous les clients arrêtés");
    }

    private void KillProcessTree(int pid)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "taskkill",
                Arguments = $"/T /F /PID {pid}",
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            Process.Start(psi)?.WaitForExit();
        }
        catch { }
    }

    [RelayCommand]
    private void CopyLogs()
    {
        try
        {
            Clipboard.SetText(ConsoleOutput);
            Log("📋 Logs copiés dans le presse-papier");
        }
        catch { }
    }

    [RelayCommand]
    private void ClearLogs()
    {
        _consoleBuilder.Clear();
        ConsoleOutput = "";
    }

    public void Cleanup()
    {
        Stop();
    }
}
