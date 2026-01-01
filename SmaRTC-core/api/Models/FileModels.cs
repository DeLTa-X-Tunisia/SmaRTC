using System;
using System.ComponentModel.DataAnnotations;

namespace TunRTC.API.Models
{
    /// <summary>
    /// Represents a stored file in the system
    /// </summary>
    public class StoredFile
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [MaxLength(255)]
        public string OriginalFileName { get; set; } = null!;
        
        [Required]
        [MaxLength(255)]
        public string StoredFileName { get; set; } = null!;
        
        [Required]
        [MaxLength(100)]
        public string ContentType { get; set; } = null!;
        
        public long Size { get; set; }
        
        public int UploaderId { get; set; }
        public User? Uploader { get; set; }
        
        public int? SessionId { get; set; }
        public Session? Session { get; set; }
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExpiresAt { get; set; }
        
        public bool IsDeleted { get; set; } = false;
        
        /// <summary>
        /// File category: document, image, video, audio, other
        /// </summary>
        [MaxLength(50)]
        public string Category { get; set; } = "other";
        
        /// <summary>
        /// SHA256 hash for duplicate detection
        /// </summary>
        [MaxLength(64)]
        public string? FileHash { get; set; }
    }

    /// <summary>
    /// Response model for file upload
    /// </summary>
    public class FileUploadResponse
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = null!;
        public string ContentType { get; set; } = null!;
        public long Size { get; set; }
        public string DownloadUrl { get; set; } = null!;
        public string? ThumbnailUrl { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    /// <summary>
    /// Response model for file list
    /// </summary>
    public class FileListResponse
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = null!;
        public string ContentType { get; set; } = null!;
        public long Size { get; set; }
        public string SizeFormatted { get; set; } = null!;
        public string DownloadUrl { get; set; } = null!;
        public string? ThumbnailUrl { get; set; }
        public string Category { get; set; } = null!;
        public string? Description { get; set; }
        public string UploaderName { get; set; } = null!;
        public DateTime UploadedAt { get; set; }
    }

    /// <summary>
    /// Request model for file upload metadata
    /// </summary>
    public class FileUploadRequest
    {
        public int? SessionId { get; set; }
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        /// <summary>
        /// Optional expiration in hours (null = never expires)
        /// </summary>
        public int? ExpiresInHours { get; set; }
    }
}
