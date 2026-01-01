using System.Windows;

namespace Luncher_csharp
{
    public partial class MainWindow : Window
    {
        private readonly MainViewModel _viewModel;

        public MainWindow()
        {
            InitializeComponent();
            _viewModel = new MainViewModel();
            DataContext = _viewModel;
        }

        private void LaunchClient1_Click(object sender, RoutedEventArgs e)
        {
            _viewModel.LaunchClient1();
        }

        private void LaunchClient2_Click(object sender, RoutedEventArgs e)
        {
            _viewModel.LaunchClient2();
        }

        private void StopClient1_Click(object sender, RoutedEventArgs e)
        {
            _viewModel.StopClient1();
        }

        private void StopClient2_Click(object sender, RoutedEventArgs e)
        {
            _viewModel.StopClient2();
        }

        private void LaunchBoth_Click(object sender, RoutedEventArgs e)
        {
            _viewModel.LaunchBothClients();
        }

        private async void Refresh_Click(object sender, RoutedEventArgs e)
        {
            await _viewModel.CheckConnectionsAsync();
        }

        private void OpenSwagger_Click(object sender, RoutedEventArgs e)
        {
            _viewModel.OpenSwagger();
        }

        private void ClearLogs_Click(object sender, RoutedEventArgs e)
        {
            _viewModel.ClearLogs();
        }
    }
}
