using System;
using System.IO;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TunRTC.API.Services
{
    public interface IFileStorageService
    {
        Task<(string storedFileName, string fileHash)> SaveFileAsync(IFormFile file, CancellationToken cancellationToken = default);
        Task<Stream?> GetFileAsync(string storedFileName);
        Task<bool> DeleteFileAsync(string storedFileName);
        string GetFilePath(string storedFileName);
        bool FileExists(string storedFileName);
        string GetCategory(string contentType);
        string FormatFileSize(long bytes);
    }

    public class FileStorageService : IFileStorageService
    {
        private readonly string _storagePath;
        private readonly ILogger<FileStorageService> _logger;
        private readonly long _maxFileSize;
        private readonly string[] _allowedExtensions;

        public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
        {
            _logger = logger;
            
            // Default to /data/files in Docker, or ./Storage locally
            _storagePath = configuration["FileStorage:Path"] ?? 
                Path.Combine(Directory.GetCurrentDirectory(), "Storage", "Files");
            
            // Max file size in bytes (default 100MB)
            _maxFileSize = configuration.GetValue<long>("FileStorage:MaxFileSizeBytes", 104857600);
            
            // Allowed file extensions
            _allowedExtensions = configuration.GetSection("FileStorage:AllowedExtensions")
                .Get<string[]>() ?? new[] 
                { 
                    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",  // Images
                    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".rtf", // Documents
                    ".mp4", ".webm", ".avi", ".mov", ".mkv",  // Video
                    ".mp3", ".wav", ".ogg", ".m4a",  // Audio
                    ".zip", ".rar", ".7z", ".tar", ".gz"  // Archives
                };

            // Ensure storage directory exists
            EnsureStorageDirectoryExists();
        }

        private void EnsureStorageDirectoryExists()
        {
            if (!Directory.Exists(_storagePath))
            {
                Directory.CreateDirectory(_storagePath);
                _logger.LogInformation("Created storage directory: {Path}", _storagePath);
            }

            // Create subdirectories for organization
            var subDirs = new[] { "images", "documents", "videos", "audio", "other" };
            foreach (var dir in subDirs)
            {
                var subPath = Path.Combine(_storagePath, dir);
                if (!Directory.Exists(subPath))
                {
                    Directory.CreateDirectory(subPath);
                }
            }
        }

        public async Task<(string storedFileName, string fileHash)> SaveFileAsync(IFormFile file, CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            if (file.Length > _maxFileSize)
                throw new ArgumentException($"File size exceeds maximum allowed size of {FormatFileSize(_maxFileSize)}");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
                throw new ArgumentException($"File type '{extension}' is not allowed");

            // Generate unique filename
            var category = GetCategory(file.ContentType);
            var storedFileName = $"{Guid.NewGuid()}{extension}";
            var categoryPath = Path.Combine(_storagePath, category);
            var fullPath = Path.Combine(categoryPath, storedFileName);

            string fileHash;

            // Stream directly to disk (no RAM overload!)
            using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, 
                FileShare.None, bufferSize: 81920, useAsync: true))
            {
                using var sha256 = SHA256.Create();
                using var cryptoStream = new CryptoStream(fileStream, sha256, CryptoStreamMode.Write);
                
                await file.CopyToAsync(cryptoStream, cancellationToken);
                cryptoStream.FlushFinalBlock();
                
                fileHash = BitConverter.ToString(sha256.Hash!).Replace("-", "").ToLowerInvariant();
            }

            _logger.LogInformation("File saved: {FileName} ({Size}) -> {StoredName}", 
                file.FileName, FormatFileSize(file.Length), storedFileName);

            return ($"{category}/{storedFileName}", fileHash);
        }

        public Task<Stream?> GetFileAsync(string storedFileName)
        {
            var fullPath = Path.Combine(_storagePath, storedFileName);
            
            if (!File.Exists(fullPath))
                return Task.FromResult<Stream?>(null);

            // Return stream for efficient memory usage
            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, 
                FileShare.Read, bufferSize: 81920, useAsync: true);
            
            return Task.FromResult<Stream?>(stream);
        }

        public Task<bool> DeleteFileAsync(string storedFileName)
        {
            var fullPath = Path.Combine(_storagePath, storedFileName);
            
            if (!File.Exists(fullPath))
                return Task.FromResult(false);

            try
            {
                File.Delete(fullPath);
                _logger.LogInformation("File deleted: {StoredName}", storedFileName);
                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete file: {StoredName}", storedFileName);
                return Task.FromResult(false);
            }
        }

        public string GetFilePath(string storedFileName)
        {
            return Path.Combine(_storagePath, storedFileName);
        }

        public bool FileExists(string storedFileName)
        {
            return File.Exists(Path.Combine(_storagePath, storedFileName));
        }

        public string GetCategory(string contentType)
        {
            if (string.IsNullOrEmpty(contentType))
                return "other";

            contentType = contentType.ToLowerInvariant();

            if (contentType.StartsWith("image/"))
                return "images";
            if (contentType.StartsWith("video/"))
                return "videos";
            if (contentType.StartsWith("audio/"))
                return "audio";
            if (contentType.StartsWith("application/pdf") ||
                contentType.Contains("document") ||
                contentType.Contains("spreadsheet") ||
                contentType.Contains("presentation") ||
                contentType.StartsWith("text/"))
                return "documents";

            return "other";
        }

        public string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            int order = 0;
            double size = bytes;
            
            while (size >= 1024 && order < sizes.Length - 1)
            {
                order++;
                size /= 1024;
            }
            
            return $"{size:0.##} {sizes[order]}";
        }
    }
}
