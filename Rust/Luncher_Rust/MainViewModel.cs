// SmaRTC Rust Launcher - ViewModel
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

namespace Luncher_Rust
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly string _projectPath;
        private readonly List<Process> _rustProcesses = new();

        [ObservableProperty]
        private string _output = string.Empty;

        [ObservableProperty]
        private string _statusText = "🦀 Prêt - SmaRTC Rust Launcher";

        [ObservableProperty]
        private bool _isBusy;

        [ObservableProperty]
        private int _clientCount;

        public bool IsNotBusy => !IsBusy;

        public MainViewModel()
        {
            // Find the Exemple_Rust directory
            var baseDir = AppDomain.CurrentDomain.BaseDirectory;
            var searchDir = new DirectoryInfo(baseDir);
            
            while (searchDir != null && searchDir.Name != "SmaRTC")
            {
                searchDir = searchDir.Parent;
            }

            if (searchDir != null)
            {
                _projectPath = Path.Combine(searchDir.FullName, "Rust", "Exemple_Rust");
            }
            else
            {
                _projectPath = Path.Combine(baseDir, "..", "..", "..", "..", "Exemple_Rust");
            }

            AppendOutput("╔══════════════════════════════════════════════════════════╗");
            AppendOutput("║     🦀 SmaRTC Rust Launcher - DeLTa-X Tunisia 🇹🇳         ║");
            AppendOutput("║     © 2026 Mounir Azizi - All Rights Reserved            ║");
            AppendOutput("╚══════════════════════════════════════════════════════════╝");
            AppendOutput($"\n📁 Projet Rust: {_projectPath}");
            AppendOutput("\n💡 Étapes: 1) cargo build → 2) Démarrer");
            AppendOutput("⚠️  Assurez-vous que Rust est installé (rustc --version)\n");
        }

        partial void OnIsBusyChanged(bool value)
        {
            OnPropertyChanged(nameof(IsNotBusy));
        }

        [RelayCommand]
        private async Task BuildAsync()
        {
            IsBusy = true;
            StatusText = "🔨 Compilation du projet Rust...";
            AppendOutput("\n🔄 Exécution de 'cargo build --release'...\n");

            try
            {
                await RunCargoCommandAsync("build", "--release");
                AppendOutput("\n✅ Compilation réussie!");
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
            StatusText = "▶️ Démarrage d'un client Rust...";
            
            try
            {
                var exePath = Path.Combine(_projectPath, "target", "release", "smartc-rust-example.exe");
                
                // Also check debug path
                if (!File.Exists(exePath))
                {
                    exePath = Path.Combine(_projectPath, "target", "debug", "smartc-rust-example.exe");
                }

                if (!File.Exists(exePath))
                {
                    AppendOutput("\n⚠️ Exécutable non trouvé. Compilation en cours...");
                    _ = BuildAndStartAsync();
                    return;
                }

                var clientNumber = _rustProcesses.Count + 1;
                
                var startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/k title 🦀 SmaRTC Rust Client #{clientNumber} && \"{exePath}\"",
                    WorkingDirectory = _projectPath,
                    UseShellExecute = true,
                    CreateNoWindow = false
                };

                var process = Process.Start(startInfo);
                if (process != null)
                {
                    _rustProcesses.Add(process);
                    ClientCount = _rustProcesses.Count;
                    AppendOutput($"\n✅ Client Rust #{clientNumber} démarré (PID: {process.Id})");
                    StatusText = $"▶️ {ClientCount} client(s) Rust en cours d'exécution";

                    // Clean up when process exits
                    process.EnableRaisingEvents = true;
                    process.Exited += (s, e) =>
                    {
                        Application.Current.Dispatcher.Invoke(() =>
                        {
                            _rustProcesses.Remove(process);
                            ClientCount = _rustProcesses.Count;
                            AppendOutput($"\n🔌 Client Rust #{clientNumber} fermé");
                            if (ClientCount == 0)
                            {
                                StatusText = "⏹️ Aucun client en cours";
                            }
                            else
                            {
                                StatusText = $"▶️ {ClientCount} client(s) Rust en cours";
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
            var count = _rustProcesses.Count;

            foreach (var process in _rustProcesses.ToArray())
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

            _rustProcesses.Clear();
            ClientCount = 0;
            AppendOutput($"\n⏹️ {count} client(s) Rust arrêté(s)");
            StatusText = "⏹️ Tous les clients arrêtés";
        }

        private async Task RunCargoCommandAsync(params string[] args)
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "cargo",
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
                throw new Exception($"Cargo command failed with exit code {process.ExitCode}");
            }
        }

        private void AppendOutput(string text)
        {
            Output += text + Environment.NewLine;
        }
    }
}
