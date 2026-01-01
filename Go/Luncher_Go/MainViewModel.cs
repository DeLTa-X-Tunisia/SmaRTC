// SmaRTC Go Launcher - ViewModel
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Luncher_Go
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly string _projectPath;
        private readonly List<Process> _goProcesses = new();

        [ObservableProperty]
        private string _output = string.Empty;

        [ObservableProperty]
        private string _statusText = "🐹 Prêt - SmaRTC Go Launcher";

        [ObservableProperty]
        private bool _isBusy;

        [ObservableProperty]
        private int _clientCount;

        public bool IsNotBusy => !IsBusy;

        public MainViewModel()
        {
            // Find the Exemple_Go directory
            var baseDir = AppDomain.CurrentDomain.BaseDirectory;
            var searchDir = new DirectoryInfo(baseDir);
            
            while (searchDir != null && searchDir.Name != "SmaRTC")
            {
                searchDir = searchDir.Parent;
            }

            if (searchDir != null)
            {
                _projectPath = Path.Combine(searchDir.FullName, "Go", "Exemple_Go");
            }
            else
            {
                _projectPath = Path.Combine(baseDir, "..", "..", "..", "..", "Exemple_Go");
            }

            AppendOutput("╔══════════════════════════════════════════════════════════╗");
            AppendOutput("║     🐹 SmaRTC Go Launcher - DeLTa-X Tunisia 🇹🇳           ║");
            AppendOutput("║     © 2026 Mounir Azizi - All Rights Reserved            ║");
            AppendOutput("╚══════════════════════════════════════════════════════════╝");
            AppendOutput($"\n📁 Projet Go: {_projectPath}");
            AppendOutput("\n💡 Étapes: 1) go mod tidy → 2) go build → 3) Démarrer");
            AppendOutput("⚠️  Assurez-vous que Go est installé (go version)\n");
        }

        partial void OnIsBusyChanged(bool value)
        {
            OnPropertyChanged(nameof(IsNotBusy));
        }

        [RelayCommand]
        private async Task InstallAsync()
        {
            IsBusy = true;
            StatusText = "📦 Téléchargement des dépendances Go...";
            AppendOutput("\n🔄 Exécution de 'go mod tidy'...\n");

            try
            {
                await RunGoCommandAsync("mod", "tidy");
                AppendOutput("\n✅ Dépendances Go installées avec succès!");
                StatusText = "✅ Dépendances installées";
            }
            catch (Exception ex)
            {
                AppendOutput($"\n❌ Erreur: {ex.Message}");
                StatusText = "❌ Erreur lors de l'installation";
            }
            finally
            {
                IsBusy = false;
            }
        }

        [RelayCommand]
        private async Task BuildAsync()
        {
            IsBusy = true;
            StatusText = "🔨 Compilation du projet Go...";
            AppendOutput("\n🔄 Exécution de 'go build'...\n");

            try
            {
                await RunGoCommandAsync("build", "-o", "smartc-chat.exe", ".");
                AppendOutput("\n✅ Compilation réussie! (smartc-chat.exe)");
                StatusText = "✅ Compilation réussie";
            }
            catch (Exception ex)
            {
                AppendOutput($"\n❌ Erreur: {ex.Message}");
                StatusText = "❌ Erreur de compilation";
            }
            finally
            {
                IsBusy = false;
            }
        }

        [RelayCommand]
        private void Start()
        {
            StartNewClient();
        }

        [RelayCommand]
        private void NewClient()
        {
            StartNewClient();
        }

        private void StartNewClient()
        {
            StatusText = "▶️ Démarrage d'un client Go...";
            
            try
            {
                var exePath = Path.Combine(_projectPath, "smartc-chat.exe");
                
                if (!File.Exists(exePath))
                {
                    AppendOutput("\n⚠️ Exécutable non trouvé. Compilation en cours...");
                    _ = BuildAndStartAsync();
                    return;
                }

                var clientNumber = _goProcesses.Count + 1;
                
                var startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/k title 🐹 SmaRTC Go Client #{clientNumber} && \"{exePath}\"",
                    WorkingDirectory = _projectPath,
                    UseShellExecute = true,
                    CreateNoWindow = false
                };

                var process = Process.Start(startInfo);
                if (process != null)
                {
                    _goProcesses.Add(process);
                    ClientCount = _goProcesses.Count;
                    AppendOutput($"\n✅ Client Go #{clientNumber} démarré (PID: {process.Id})");
                    StatusText = $"▶️ {ClientCount} client(s) Go en cours d'exécution";

                    // Clean up when process exits
                    process.EnableRaisingEvents = true;
                    process.Exited += (s, e) =>
                    {
                        Application.Current.Dispatcher.Invoke(() =>
                        {
                            _goProcesses.Remove(process);
                            ClientCount = _goProcesses.Count;
                            AppendOutput($"\n🔌 Client Go #{clientNumber} fermé");
                            if (ClientCount == 0)
                            {
                                StatusText = "⏹️ Aucun client en cours";
                            }
                            else
                            {
                                StatusText = $"▶️ {ClientCount} client(s) Go en cours";
                            }
                        });
                    };
                }
            }
            catch (Exception ex)
            {
                AppendOutput($"\n❌ Erreur de démarrage: {ex.Message}");
                StatusText = "❌ Erreur de démarrage";
            }
        }

        private async Task BuildAndStartAsync()
        {
            await BuildAsync();
            StartNewClient();
        }

        [RelayCommand]
        private void Stop()
        {
            StatusText = "⏹️ Arrêt de tous les clients...";
            var count = _goProcesses.Count;

            foreach (var process in _goProcesses.ToArray())
            {
                try
                {
                    if (!process.HasExited)
                    {
                        process.Kill(entireProcessTree: true);
                    }
                }
                catch { }
            }

            _goProcesses.Clear();
            ClientCount = 0;
            AppendOutput($"\n⏹️ {count} client(s) Go arrêté(s)");
            StatusText = "⏹️ Tous les clients arrêtés";
        }

        private async Task RunGoCommandAsync(params string[] args)
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "go",
                WorkingDirectory = _projectPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8
            };

            foreach (var arg in args)
            {
                startInfo.ArgumentList.Add(arg);
            }

            using var process = new Process { StartInfo = startInfo };
            var outputBuilder = new StringBuilder();

            process.OutputDataReceived += (s, e) =>
            {
                if (e.Data != null)
                {
                    Application.Current.Dispatcher.Invoke(() => AppendOutput(e.Data));
                }
            };

            process.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null)
                {
                    Application.Current.Dispatcher.Invoke(() => AppendOutput($"⚠️ {e.Data}"));
                }
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception($"Go command failed with exit code {process.ExitCode}");
            }
        }

        private void AppendOutput(string text)
        {
            Output += text + Environment.NewLine;
        }
    }
}
