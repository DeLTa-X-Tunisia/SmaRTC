using System;

namespace SmaRTC.Service_Launcher.Models
{
    public enum LogLevel
    {
        Info,
        Success,
        Warning,
        Error
    }

    public class LogEntry
    {
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public LogLevel Level { get; set; } = LogLevel.Info;
        public string Message { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;

        public string LevelIcon => Level switch
        {
            LogLevel.Info => "ℹ️",
            LogLevel.Success => "✅",
            LogLevel.Warning => "⚠️",
            LogLevel.Error => "❌",
            _ => "📝"
        };

        public string LevelColor => Level switch
        {
            LogLevel.Info => "#2196F3",
            LogLevel.Success => "#4CAF50",
            LogLevel.Warning => "#FF9800",
            LogLevel.Error => "#F44336",
            _ => "#9E9E9E"
        };

        public string FormattedTime => Timestamp.ToString("HH:mm:ss");
        
        public string DisplayText => $"[{FormattedTime}] {LevelIcon} {Message}";
    }
}
