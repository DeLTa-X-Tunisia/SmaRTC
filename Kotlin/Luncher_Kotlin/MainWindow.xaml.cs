// SmaRTC Kotlin Launcher
// © 2026 Mounir Azizi - DeLTa-X Tunisia - All Rights Reserved

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using ModernWpf.Controls;

namespace Luncher_Kotlin
{
    public partial class MainWindow : Window
    {
        private List<Process> _runningProcesses = new List<Process>();
        private string _projectPath;
        private string _javaPath = "";
        private bool _isJavaInstalled = false;
        private int _clientCounter = 0;

        public MainWindow()
        {
            InitializeComponent();
            
            // Find the Kotlin project path
            var currentDir = AppDomain.CurrentDomain.BaseDirectory;
            _projectPath = FindKotlinProject(currentDir);
            
            Loaded += async (s, e) => await CheckEnvironment();
        }

        private string FindKotlinProject(string startPath)
        {
            // Navigate up to find SmaRTC folder
            var dir = new DirectoryInfo(startPath);
            while (dir != null)
            {
                var kotlinPath = Path.Combine(dir.FullName, "Kotlin", "Exemple_Kotlin");
                if (Directory.Exists(kotlinPath) && File.Exists(Path.Combine(kotlinPath, "build.gradle.kts")))
                    return kotlinPath;

                // Check if we're in the Kotlin folder structure
                if (dir.Name == "Luncher_Kotlin" || dir.Name == "bin" || dir.Name == "Debug" || dir.Name == "Release" || dir.Name == "net9.0-windows")
                {
                    dir = dir.Parent;
                    continue;
                }
                
                // Check sibling folder
                var siblingPath = Path.Combine(dir.FullName, "Exemple_Kotlin");
                if (Directory.Exists(siblingPath) && File.Exists(Path.Combine(siblingPath, "build.gradle.kts")))
                    return siblingPath;

                dir = dir.Parent;
            }

            // Fallback: relative to launcher
            return Path.GetFullPath(Path.Combine(startPath, "..", "..", "..", "..", "Exemple_Kotlin"));
        }

        private async Task CheckEnvironment()
        {
            AppendConsole("🔍 Vérification de l'environnement...\n", Colors.Cyan);
            AppendConsole($"📁 Projet: {_projectPath}\n", Colors.Gray);
            
            await CheckJava();
        }

        private string? FindJavaPath()
        {
            // Check common Java installation paths
            string[] commonPaths = new[]
            {
                @"C:\Program Files\Eclipse Adoptium\jdk-21",
                @"C:\Program Files\Java\jdk-21",
                @"C:\Program Files\Microsoft\jdk-21",
                @"C:\Program Files\Eclipse Adoptium",
                @"C:\Program Files\Java",
                @"C:\Program Files\Microsoft"
            };

            // First, check if java is in PATH
            try
            {
                var pathEnv = Environment.GetEnvironmentVariable("PATH", EnvironmentVariableTarget.Machine) + ";" +
                              Environment.GetEnvironmentVariable("PATH", EnvironmentVariableTarget.User);
                
                foreach (var path in pathEnv.Split(';'))
                {
                    var javaExe = Path.Combine(path.Trim(), "java.exe");
                    if (File.Exists(javaExe))
                    {
                        return javaExe;
                    }
                }
            }
            catch { }

            // Check common installation paths
            foreach (var basePath in commonPaths)
            {
                if (Directory.Exists(basePath))
                {
                    // Direct path
                    var javaExe = Path.Combine(basePath, "bin", "java.exe");
                    if (File.Exists(javaExe))
                        return javaExe;

                    // Search subdirectories for JDK 21+
                    try
                    {
                        foreach (var dir in Directory.GetDirectories(basePath))
                        {
                            if (dir.Contains("21") || dir.Contains("22") || dir.Contains("23"))
                            {
                                javaExe = Path.Combine(dir, "bin", "java.exe");
                                if (File.Exists(javaExe))
                                    return javaExe;
                            }
                        }
                    }
                    catch { }
                }
            }

            // Check JAVA_HOME
            var javaHome = Environment.GetEnvironmentVariable("JAVA_HOME");
            if (!string.IsNullOrEmpty(javaHome))
            {
                var javaExe = Path.Combine(javaHome, "bin", "java.exe");
                if (File.Exists(javaExe))
                    return javaExe;
            }

            return null;
        }

        private async Task CheckJava()
        {
            _javaPath = FindJavaPath() ?? "";
            
            if (string.IsNullOrEmpty(_javaPath))
            {
                _isJavaInstalled = false;
                JavaStatusText.Text = "❌ Non trouvé";
                JavaStatusText.Foreground = new SolidColorBrush(Colors.Red);
                AppendConsole("❌ Java JDK non trouvé!\n", Colors.Red);
                AppendConsole("💡 Installez JDK 21: winget install EclipseAdoptium.Temurin.21.JDK\n", Colors.Yellow);
                return;
            }

            try
            {
                var result = await RunCommandAsync(_javaPath, "--version", Path.GetDirectoryName(_javaPath)!, false);
                if (result.ExitCode == 0 && !string.IsNullOrEmpty(result.Output))
                {
                    var version = result.Output.Split('\n')[0].Trim();
                    _isJavaInstalled = true;
                    JavaStatusText.Text = $"✅ {version}";
                    JavaStatusText.Foreground = new SolidColorBrush(Colors.LightGreen);
                    AppendConsole($"✅ Java: {version}\n", Colors.LightGreen);
                    AppendConsole($"📍 Path: {_javaPath}\n", Colors.Gray);
                }
                else
                {
                    _isJavaInstalled = false;
                    JavaStatusText.Text = "❌ Erreur de version";
                    JavaStatusText.Foreground = new SolidColorBrush(Colors.Red);
                }
            }
            catch (Exception ex)
            {
                _isJavaInstalled = false;
                JavaStatusText.Text = "❌ Erreur";
                JavaStatusText.Foreground = new SolidColorBrush(Colors.Red);
                AppendConsole($"❌ Erreur: {ex.Message}\n", Colors.Red);
            }
        }

        private async void VerifyButton_Click(object sender, RoutedEventArgs e)
        {
            VerifyButton.IsEnabled = false;
            AppendConsole("\n🔄 Re-vérification de l'environnement...\n", Colors.Cyan);
            await CheckJava();
            VerifyButton.IsEnabled = true;
        }

        private async void BuildButton_Click(object sender, RoutedEventArgs e)
        {
            if (!_isJavaInstalled)
            {
                await ShowErrorDialog("Java non installé", "Veuillez d'abord installer Java JDK 21.");
                return;
            }

            BuildButton.IsEnabled = false;
            BuildStatusText.Text = "⏳ Compilation...";
            BuildStatusText.Foreground = new SolidColorBrush(Colors.Orange);
            
            AppendConsole("\n🔨 Compilation Gradle en cours...\n", Colors.Cyan);

            try
            {
                // Use gradlew.bat for Windows
                var gradlewPath = Path.Combine(_projectPath, "gradlew.bat");
                
                // If gradlew doesn't exist, use gradle directly or download wrapper
                string command;
                string args;
                
                if (File.Exists(gradlewPath))
                {
                    command = gradlewPath;
                    args = "build --no-daemon -q";
                }
                else
                {
                    // Try to use gradle from PATH
                    command = "cmd.exe";
                    args = "/c gradle build --no-daemon -q";
                }
                
                var result = await RunCommandAsync(command, args, _projectPath, true);
                
                if (result.ExitCode == 0)
                {
                    GradleStatusText.Text = "✅ OK";
                    GradleStatusText.Foreground = new SolidColorBrush(Colors.LightGreen);
                    BuildStatusText.Text = "✅ Succès";
                    BuildStatusText.Foreground = new SolidColorBrush(Colors.LightGreen);
                    AppendConsole("✅ Build réussi!\n", Colors.LightGreen);
                }
                else
                {
                    BuildStatusText.Text = "❌ Échec";
                    BuildStatusText.Foreground = new SolidColorBrush(Colors.Red);
                    AppendConsole($"❌ Build échoué (code: {result.ExitCode})\n", Colors.Red);
                }
            }
            catch (Exception ex)
            {
                BuildStatusText.Text = "❌ Erreur";
                BuildStatusText.Foreground = new SolidColorBrush(Colors.Red);
                AppendConsole($"❌ Erreur: {ex.Message}\n", Colors.Red);
            }

            BuildButton.IsEnabled = true;
        }

        private async void RunButton_Click(object sender, RoutedEventArgs e)
        {
            await LaunchClient(1);
        }

        private async void RunButton2_Click(object sender, RoutedEventArgs e)
        {
            await LaunchClient(2);
        }

        private async Task LaunchClient(int clientNumber)
        {
            if (!_isJavaInstalled)
            {
                await ShowErrorDialog("Java non installé", "Veuillez d'abord installer Java JDK 21.");
                return;
            }

            _clientCounter++;
            AppendConsole($"\n▶️ Démarrage du Client Kotlin #{clientNumber}...\n", Color.FromRgb(246, 166, 35));

            try
            {
                var jarPath = FindJarFile();
                
                if (string.IsNullOrEmpty(jarPath))
                {
                    AppendConsole("⚠️ JAR non trouvé. Utilisez 'Build' d'abord.\n", Colors.Yellow);
                    return;
                }

                // Run in new console window for interactive chat
                var startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c start \"🟣 SmaRTC Kotlin Chat #{clientNumber}\" /D \"{_projectPath}\" \"{_javaPath}\" -jar \"{jarPath}\"",
                    WorkingDirectory = _projectPath,
                    UseShellExecute = true,
                    CreateNoWindow = true
                };

                var process = Process.Start(startInfo);
                
                if (process != null)
                {
                    _runningProcesses.Add(process);
                    AppendConsole($"✅ Client #{clientNumber} démarré (PID: {process.Id})\n", Colors.LightGreen);
                    
                    // Monitor process
                    _ = Task.Run(async () =>
                    {
                        await process.WaitForExitAsync();
                        Dispatcher.Invoke(() =>
                        {
                            _runningProcesses.Remove(process);
                            AppendConsole($"⏹️ Client #{clientNumber} terminé\n", Colors.Yellow);
                        });
                    });
                }
            }
            catch (Exception ex)
            {
                AppendConsole($"❌ Erreur: {ex.Message}\n", Colors.Red);
            }
        }

        private string? FindJarFile()
        {
            var buildLibs = Path.Combine(_projectPath, "build", "libs");
            if (Directory.Exists(buildLibs))
            {
                var jarFiles = Directory.GetFiles(buildLibs, "*.jar");
                foreach (var jar in jarFiles)
                {
                    if (jar.Contains("-all") || !jar.Contains("-sources") && !jar.Contains("-javadoc"))
                        return jar;
                }
                if (jarFiles.Length > 0)
                    return jarFiles[0];
            }
            return null;
        }

        private void StopAllButton_Click(object sender, RoutedEventArgs e)
        {
            var count = 0;
            foreach (var process in _runningProcesses.ToArray())
            {
                try
                {
                    if (!process.HasExited)
                    {
                        process.Kill(true);
                        count++;
                    }
                }
                catch { }
            }
            _runningProcesses.Clear();
            
            if (count > 0)
                AppendConsole($"⏹️ {count} client(s) arrêté(s).\n", Colors.Yellow);
            else
                AppendConsole("ℹ️ Aucun client en cours d'exécution.\n", Colors.Gray);
        }

        private async void CleanButton_Click(object sender, RoutedEventArgs e)
        {
            CleanButton.IsEnabled = false;
            AppendConsole("\n🧹 Nettoyage en cours...\n", Colors.Cyan);

            try
            {
                var buildDir = Path.Combine(_projectPath, "build");
                var gradleDir = Path.Combine(_projectPath, ".gradle");
                
                if (Directory.Exists(buildDir))
                {
                    Directory.Delete(buildDir, true);
                    AppendConsole("✅ Dossier build/ supprimé\n", Colors.LightGreen);
                }
                
                if (Directory.Exists(gradleDir))
                {
                    Directory.Delete(gradleDir, true);
                    AppendConsole("✅ Dossier .gradle/ supprimé\n", Colors.LightGreen);
                }

                BuildStatusText.Text = "Non compilé";
                BuildStatusText.Foreground = new SolidColorBrush(Colors.Gray);
                GradleStatusText.Text = "Non vérifié";
                GradleStatusText.Foreground = new SolidColorBrush(Colors.Gray);
                
                AppendConsole("✅ Nettoyage terminé!\n", Colors.LightGreen);
            }
            catch (Exception ex)
            {
                AppendConsole($"❌ Erreur: {ex.Message}\n", Colors.Red);
            }

            CleanButton.IsEnabled = true;
        }

        private void OpenFolderButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "explorer.exe",
                    Arguments = _projectPath,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                AppendConsole($"❌ Erreur: {ex.Message}\n", Colors.Red);
            }
        }

        private void ClearButton_Click(object sender, RoutedEventArgs e)
        {
            ConsoleOutput.Text = "";
            AppendConsole("🎯 Console effacée\n", Colors.Gray);
        }

        private void AppendConsole(string text, Color color)
        {
            Dispatcher.Invoke(() =>
            {
                var run = new Run(text) { Foreground = new SolidColorBrush(color) };
                ConsoleOutput.Inlines.Add(run);
                ConsoleScrollViewer.ScrollToEnd();
            });
        }

        private async Task<(int ExitCode, string Output)> RunCommandAsync(string command, string arguments, string workingDirectory, bool showOutput)
        {
            var output = "";
            var exitCode = -1;

            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = command,
                    Arguments = arguments,
                    WorkingDirectory = workingDirectory,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                // Set JAVA_HOME environment variable
                if (!string.IsNullOrEmpty(_javaPath))
                {
                    var javaHome = Path.GetDirectoryName(Path.GetDirectoryName(_javaPath));
                    startInfo.Environment["JAVA_HOME"] = javaHome;
                    
                    // Add Java to PATH
                    var currentPath = Environment.GetEnvironmentVariable("PATH") ?? "";
                    startInfo.Environment["PATH"] = $"{Path.GetDirectoryName(_javaPath)};{currentPath}";
                }

                using var process = new Process { StartInfo = startInfo };
                
                process.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        output += e.Data + "\n";
                        if (showOutput)
                            AppendConsole(e.Data + "\n", Colors.White);
                    }
                };

                process.ErrorDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        output += e.Data + "\n";
                        if (showOutput)
                            AppendConsole(e.Data + "\n", Colors.Orange);
                    }
                };

                process.Start();
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                await process.WaitForExitAsync();
                exitCode = process.ExitCode;
            }
            catch (Exception ex)
            {
                output = ex.Message;
            }

            return (exitCode, output);
        }

        private async Task ShowErrorDialog(string title, string message)
        {
            var dialog = new ContentDialog
            {
                Title = title,
                Content = message,
                CloseButtonText = "OK",
                DefaultButton = ContentDialogButton.Close
            };
            await dialog.ShowAsync();
        }

        protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
        {
            foreach (var process in _runningProcesses)
            {
                try 
                { 
                    if (!process.HasExited)
                        process.Kill(true); 
                } 
                catch { }
            }
            base.OnClosing(e);
        }
    }
}
