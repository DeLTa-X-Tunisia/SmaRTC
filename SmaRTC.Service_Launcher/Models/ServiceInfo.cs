using System.ComponentModel;
using System.Runtime.CompilerServices;

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

        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
