using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows;
using System.Windows.Media;

namespace Luncher_TypeScript;

public partial class MainViewModel : ObservableObject
{
    private Process? _nodeProcess;
    private readonly StringBuilder _consoleBuilder = new();
    private string? _projectPath;
    private string? _npmPath;

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

    public MainViewModel()
    {
        FindProjectPath();
        FindNpm();
        Log("🟦 SmaRTC TypeScript Launcher initialisé");
        Log($"📂 Projet: {_projectPath ?? "Non trouvé"}");
        Log($"📦 npm: {_npmPath ?? "Non trouvé"}");
    }

    private void FindProjectPath()
    {
        var basePaths = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "Exemple_TypeScript"),
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "Exemple_TypeScript"),
            Path.Combine(Environment.CurrentDirectory, "..", "Exemple_TypeScript"),
            @"C:\Users\azizi\OneDrive\Desktop\SmaRTC Start\SmaRTC\TypeScript\Exemple_TypeScript",
        };

        foreach (var basePath in basePaths)
        {
            var fullPath = Path.GetFullPath(basePath);
            if (Directory.Exists(fullPath) && File.Exists(Path.Combine(fullPath, "package.json")))
            {
                _projectPath = fullPath;
                return;
            }
        }
    }

    private void FindNpm()
    {
        // Chercher npm dans le PATH
        var pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
        var paths = pathEnv.Split(';');

        foreach (var path in paths)
        {
            var npmCmd = Path.Combine(path, "npm.cmd");
            if (File.Exists(npmCmd))
            {
                _npmPath = npmCmd;
                return;
            }
        }

        // Emplacements courants
        var commonPaths = new[]
        {
            @"C:\Program Files\nodejs\npm.cmd",
            @"C:\Program Files (x86)\nodejs\npm.cmd",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "npm.cmd"),
        };

        foreach (var path in commonPaths)
        {
            if (File.Exists(path))
            {
                _npmPath = path;
                return;
            }
        }

        _npmPath = "npm"; // Essayer le PATH directement
    }

    private void Log(string message)
    {
        var timestamp = DateTime.Now.ToString("HH:mm:ss");
        _consoleBuilder.AppendLine($"[{timestamp}] {message}");
        ConsoleOutput = _consoleBuilder.ToString();
    }

    [RelayCommand]
    private async Task Start()
    {
        if (_projectPath == null)
        {
            Log("❌ Projet Exemple_TypeScript non trouvé !");
            return;
        }

        CanStart = false;
        StatusText = "Installation...";
        StatusColor = Brushes.Orange;
        Log("📦 Installation des dépendances npm...");

        try
        {
            // npm install
            var installResult = await RunCommandAsync("npm", "install", _projectPath);
            if (!installResult)
            {
                Log("❌ Échec de npm install");
                CanStart = true;
                StatusText = "Erreur";
                StatusColor = Brushes.Red;
                return;
            }
            Log("✅ Dépendances installées");

            // npm run build
            Log("🔨 Compilation TypeScript...");
            StatusText = "Compilation...";
            var buildResult = await RunCommandAsync("npm", "run build", _projectPath);
            if (!buildResult)
            {
                Log("❌ Échec de la compilation");
                CanStart = true;
                StatusText = "Erreur";
                StatusColor = Brushes.Red;
                return;
            }
            Log("✅ Compilation terminée");

            // npm start
            Log("🚀 Démarrage du serveur...");
            StatusText = "Démarrage...";
            StartServer();

        }
        catch (Exception ex)
        {
            Log($"❌ Erreur: {ex.Message}");
            CanStart = true;
            StatusText = "Erreur";
            StatusColor = Brushes.Red;
        }
    }

    private async Task<bool> RunCommandAsync(string command, string args, string workingDir)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c {command} {args}",
                WorkingDirectory = workingDir,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };

            using var process = Process.Start(psi);
            if (process == null) return false;

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

            return process.ExitCode == 0 || string.IsNullOrEmpty(error);
        }
        catch (Exception ex)
        {
            Log($"❌ Erreur commande: {ex.Message}");
            return false;
        }
    }

    private void StartServer()
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm start",
                WorkingDirectory = _projectPath,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };

            _nodeProcess = Process.Start(psi);
            if (_nodeProcess == null)
            {
                Log("❌ Impossible de démarrer le serveur");
                return;
            }

            _nodeProcess.OutputDataReceived += (s, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    Application.Current.Dispatcher.Invoke(() => Log(e.Data));
                }
            };

            _nodeProcess.ErrorDataReceived += (s, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    Application.Current.Dispatcher.Invoke(() => Log($"⚠ {e.Data}"));
                }
            };

            _nodeProcess.BeginOutputReadLine();
            _nodeProcess.BeginErrorReadLine();

            _nodeProcess.Exited += (s, e) =>
            {
                Application.Current.Dispatcher.Invoke(() =>
                {
                    IsRunning = false;
                    CanStart = true;
                    StatusText = "Arrêté";
                    StatusColor = Brushes.Gray;
                    Log("⏹ Serveur arrêté");
                });
            };
            _nodeProcess.EnableRaisingEvents = true;

            IsRunning = true;
            StatusText = "En cours d'exécution";
            StatusColor = Brushes.LimeGreen;
            Log("✅ Serveur démarré sur http://localhost:3500");

        }
        catch (Exception ex)
        {
            Log($"❌ Erreur démarrage: {ex.Message}");
            CanStart = true;
            StatusText = "Erreur";
            StatusColor = Brushes.Red;
        }
    }

    [RelayCommand]
    private void Stop()
    {
        if (_nodeProcess != null && !_nodeProcess.HasExited)
        {
            Log("⏹ Arrêt du serveur...");
            try
            {
                // Kill process tree
                KillProcessTree(_nodeProcess.Id);
            }
            catch (Exception ex)
            {
                Log($"⚠ Erreur arrêt: {ex.Message}");
            }
        }

        IsRunning = false;
        CanStart = true;
        StatusText = "Arrêté";
        StatusColor = Brushes.Gray;
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
    private void OpenBrowser()
    {
        OpenUrl("http://localhost:3500");
    }

    [RelayCommand]
    private void OpenUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return;

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true,
            });
        }
        catch (Exception ex)
        {
            Log($"❌ Impossible d'ouvrir: {ex.Message}");
        }
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
