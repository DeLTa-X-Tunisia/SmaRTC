using System.Windows;

namespace Luncher_Python;

public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;

    public MainWindow()
    {
        InitializeComponent();
        _viewModel = new MainViewModel();
        DataContext = _viewModel;

        // Auto-scroll console
        _viewModel.PropertyChanged += (s, e) =>
        {
            if (e.PropertyName == nameof(MainViewModel.ConsoleOutput))
            {
                ConsoleScroller.ScrollToEnd();
            }
        };
    }

    protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
    {
        _viewModel.Cleanup();
        base.OnClosing(e);
    }
}
