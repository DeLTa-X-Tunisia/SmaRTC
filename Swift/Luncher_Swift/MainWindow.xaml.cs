using System;
using System.Diagnostics;
using System.IO;
using System.Windows;

namespace Luncher_Swift
{
    public partial class MainWindow : Window
    {
        private readonly string _examplePath;

        public MainWindow()
        {
            InitializeComponent();
            
            // Get the example folder path
            string currentDir = AppDomain.CurrentDomain.BaseDirectory;
            _examplePath = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", "..", "Exemple_Swift"));
        }

        private void OpenFolder_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (Directory.Exists(_examplePath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "explorer.exe",
                        Arguments = $"\"{_examplePath}\"",
                        UseShellExecute = true
                    });
                }
                else
                {
                    // Try to find the folder relative to the solution
                    string altPath = FindExampleFolder();
                    if (!string.IsNullOrEmpty(altPath) && Directory.Exists(altPath))
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = "explorer.exe",
                            Arguments = $"\"{altPath}\"",
                            UseShellExecute = true
                        });
                    }
                    else
                    {
                        MessageBox.Show(
                            "The Swift example folder could not be found.\n\n" +
                            $"Expected path: {_examplePath}\n\n" +
                            "Please navigate to the Swift/Exemple_Swift folder manually.",
                            "Folder Not Found",
                            MessageBoxButton.OK,
                            MessageBoxImage.Information);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error opening folder: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private string FindExampleFolder()
        {
            // Try to find Exemple_Swift folder by walking up directories
            string? dir = AppDomain.CurrentDomain.BaseDirectory;
            
            for (int i = 0; i < 10 && dir != null; i++)
            {
                string testPath = Path.Combine(dir, "Exemple_Swift");
                if (Directory.Exists(testPath))
                    return testPath;
                
                testPath = Path.Combine(dir, "Swift", "Exemple_Swift");
                if (Directory.Exists(testPath))
                    return testPath;
                
                dir = Directory.GetParent(dir)?.FullName;
            }
            
            return string.Empty;
        }
    }
}
