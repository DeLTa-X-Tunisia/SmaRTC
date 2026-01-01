using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

namespace SmaRTC.Service_Launcher.Models
{
    public enum ServiceStatus
    {
        Stopped,
        Starting,
        Running,
        Stopping,
        Error,
        Unknown
    }

    public class ServiceInfo : INotifyPropertyChanged
    {
        private string _name = string.Empty;
        private string _containerName = string.Empty;
        private string _description = string.Empty;
        private string _port = string.Empty;
        private ServiceStatus _status = ServiceStatus.Unknown;
        private string _statusMessage = string.Empty;
        private string _icon = "🔲";
        private bool _isActionInProgress;

        // Commands pour les boutons individuels
        public ICommand? StartCommand { get; set; }
        public ICommand? StopCommand { get; set; }

        public string Name
        {
            get => _name;
            set { _name = value; OnPropertyChanged(); }
        }

        public string ContainerName
        {
            get => _containerName;
            set { _containerName = value; OnPropertyChanged(); }
        }

        public string Description
        {
            get => _description;
            set { _description = value; OnPropertyChanged(); }
        }

        public string Port
        {
            get => _port;
            set { _port = value; OnPropertyChanged(); }
        }

        public ServiceStatus Status
        {
            get => _status;
            set
            {
                _status = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(StatusIcon));
                OnPropertyChanged(nameof(StatusColor));
                OnPropertyChanged(nameof(StartButtonColor));
                OnPropertyChanged(nameof(StopButtonColor));
                OnPropertyChanged(nameof(CanStart));
                OnPropertyChanged(nameof(CanStop));
            }
        }

        public string StatusMessage
        {
            get => _statusMessage;
            set { _statusMessage = value; OnPropertyChanged(); }
        }

        public string Icon
        {
            get => _icon;
            set { _icon = value; OnPropertyChanged(); }
        }

        public bool IsActionInProgress
        {
            get => _isActionInProgress;
            set
            {
                _isActionInProgress = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(CanStart));
                OnPropertyChanged(nameof(CanStop));
            }
        }

        public string StatusIcon => Status switch
        {
            ServiceStatus.Running => "✅",
            ServiceStatus.Stopped => "❌",
            ServiceStatus.Starting => "⏳",
            ServiceStatus.Stopping => "⏳",
            ServiceStatus.Error => "⚠️",
            _ => "❓"
        };

        public string StatusColor => Status switch
        {
            ServiceStatus.Running => "#4CAF50",
            ServiceStatus.Stopped => "#9E9E9E",
            ServiceStatus.Starting => "#FF9800",
            ServiceStatus.Stopping => "#FF9800",
            ServiceStatus.Error => "#F44336",
            _ => "#9E9E9E"
        };

        // Couleur du bouton Start (vert si arrêté = peut démarrer)
        public string StartButtonColor => Status switch
        {
            ServiceStatus.Stopped => "#4CAF50",
            ServiceStatus.Error => "#4CAF50",
            ServiceStatus.Unknown => "#4CAF50",
            _ => "#555555"
        };

        // Couleur du bouton Stop (rouge si démarré = peut arrêter)
        public string StopButtonColor => Status switch
        {
            ServiceStatus.Running => "#F44336",
            _ => "#555555"
        };

        // Peut-on démarrer ce service ?
        public bool CanStart => !IsActionInProgress && Status != ServiceStatus.Running && Status != ServiceStatus.Starting;

        // Peut-on arrêter ce service ?
        public bool CanStop => !IsActionInProgress && Status == ServiceStatus.Running;

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
