using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TunRTC.API.Data;
using TunRTC.API.Models;
using TunRTC.API.Services;

namespace TunRTC.API.Controllers
{
    /// <summary>
    /// File Storage Controller - Streaming upload/download for industrial applications
    /// Supports up to 100MB files with minimal RAM usage
    /// </summary>
    [ApiController]
    [Route("api/files")]
    [Authorize]
    public class FileController : ControllerBase
    {
        private readonly TunRTCDBContext _context;
        private readonly IFileStorageService _fileStorage;
        private readonly ILogger<FileController> _logger;

        public FileController(
            TunRTCDBContext context, 
            IFileStorageService fileStorage,
            ILogger<FileController> logger)
        {
            _context = context;
            _fileStorage = fileStorage;
            _logger = logger;
        }

        /// <summary>
        /// Upload a file (max 100MB) - Uses streaming, no RAM overload
        /// </summary>
        /// <param name="file">The file to upload</param>
        /// <param name="sessionId">Optional session ID to associate the file with</param>
        /// <param name="description">Optional description</param>
        /// <returns>File metadata including download URL</returns>
        [HttpPost("upload")]
        [RequestSizeLimit(104857600)] // 100MB
        [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
        public async Task<ActionResult<FileUploadResponse>> Upload(
            IFormFile file,
            [FromForm] int? sessionId = null,
            [FromForm] string? description = null,
            [FromForm] int? expiresInHours = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "No file provided" });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { error = "User not authenticated" });

                // Verify session exists if provided
                if (sessionId.HasValue)
                {
                    var sessionExists = await _context.Sessions.AnyAsync(s => s.Id == sessionId.Value);
                    if (!sessionExists)
                        return NotFound(new { error = "Session not found" });
                }

                // Save file to disk (streaming)
                var (storedFileName, fileHash) = await _fileStorage.SaveFileAsync(file);

                // Save metadata to database
                var storedFile = new StoredFile
                {
                    OriginalFileName = file.FileName,
                    StoredFileName = storedFileName,
                    ContentType = file.ContentType,
                    Size = file.Length,
                    UploaderId = userId.Value,
                    SessionId = sessionId,
                    Description = description,
                    Category = _fileStorage.GetCategory(file.ContentType),
                    FileHash = fileHash,
                    ExpiresAt = expiresInHours.HasValue 
                        ? DateTime.UtcNow.AddHours(expiresInHours.Value) 
                        : null
                };

                _context.Set<StoredFile>().Add(storedFile);
                await _context.SaveChangesAsync();

                _logger.LogInformation("File uploaded: {FileName} by User {UserId}", 
                    file.FileName, userId);

                return Ok(new FileUploadResponse
                {
                    Id = storedFile.Id,
                    FileName = storedFile.OriginalFileName,
                    ContentType = storedFile.ContentType,
                    Size = storedFile.Size,
                    DownloadUrl = $"/api/files/{storedFile.Id}",
                    ThumbnailUrl = storedFile.Category == "images" 
                        ? $"/api/files/{storedFile.Id}/thumbnail" 
                        : null,
                    UploadedAt = storedFile.UploadedAt
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file");
                return StatusCode(500, new { error = "An error occurred while uploading the file" });
            }
        }

        /// <summary>
        /// Download a file by ID - Streaming download
        /// </summary>
        /// <param name="id">File ID</param>
        /// <returns>File stream</returns>
        [HttpGet("{id:guid}")]
        [AllowAnonymous] // Allow download with just the link (optional: remove for auth-only)
        public async Task<IActionResult> Download(Guid id)
        {
            var storedFile = await _context.Set<StoredFile>()
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

            if (storedFile == null)
                return NotFound(new { error = "File not found" });

            // Check expiration
            if (storedFile.ExpiresAt.HasValue && storedFile.ExpiresAt.Value < DateTime.UtcNow)
            {
                return Gone(new { error = "File has expired" });
            }

            var stream = await _fileStorage.GetFileAsync(storedFile.StoredFileName);
            if (stream == null)
                return NotFound(new { error = "File not found on disk" });

            return File(stream, storedFile.ContentType, storedFile.OriginalFileName);
        }

        /// <summary>
        /// Get file metadata without downloading
        /// </summary>
        /// <param name="id">File ID</param>
        /// <returns>File metadata</returns>
        [HttpGet("{id:guid}/info")]
        public async Task<ActionResult<FileListResponse>> GetFileInfo(Guid id)
        {
            var storedFile = await _context.Set<StoredFile>()
                .Include(f => f.Uploader)
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

            if (storedFile == null)
                return NotFound(new { error = "File not found" });

            return Ok(new FileListResponse
            {
                Id = storedFile.Id,
                FileName = storedFile.OriginalFileName,
                ContentType = storedFile.ContentType,
                Size = storedFile.Size,
                SizeFormatted = _fileStorage.FormatFileSize(storedFile.Size),
                DownloadUrl = $"/api/files/{storedFile.Id}",
                ThumbnailUrl = storedFile.Category == "images" 
                    ? $"/api/files/{storedFile.Id}/thumbnail" 
                    : null,
                Category = storedFile.Category,
                Description = storedFile.Description,
                UploaderName = storedFile.Uploader?.Username ?? "Unknown",
                UploadedAt = storedFile.UploadedAt
            });
        }

        /// <summary>
        /// List files for a session
        /// </summary>
        /// <param name="sessionId">Session ID</param>
        /// <returns>List of files</returns>
        [HttpGet("session/{sessionId:int}")]
        public async Task<ActionResult<IEnumerable<FileListResponse>>> GetSessionFiles(int sessionId)
        {
            var files = await _context.Set<StoredFile>()
                .Include(f => f.Uploader)
                .Where(f => f.SessionId == sessionId && !f.IsDeleted)
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => new FileListResponse
                {
                    Id = f.Id,
                    FileName = f.OriginalFileName,
                    ContentType = f.ContentType,
                    Size = f.Size,
                    SizeFormatted = _fileStorage.FormatFileSize(f.Size),
                    DownloadUrl = $"/api/files/{f.Id}",
                    ThumbnailUrl = f.Category == "images" ? $"/api/files/{f.Id}/thumbnail" : null,
                    Category = f.Category,
                    Description = f.Description,
                    UploaderName = f.Uploader != null ? f.Uploader.Username : "Unknown",
                    UploadedAt = f.UploadedAt
                })
                .ToListAsync();

            return Ok(files);
        }

        /// <summary>
        /// List files uploaded by the current user
        /// </summary>
        /// <returns>List of files</returns>
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<FileListResponse>>> GetMyFiles()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var files = await _context.Set<StoredFile>()
                .Where(f => f.UploaderId == userId.Value && !f.IsDeleted)
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => new FileListResponse
                {
                    Id = f.Id,
                    FileName = f.OriginalFileName,
                    ContentType = f.ContentType,
                    Size = f.Size,
                    SizeFormatted = _fileStorage.FormatFileSize(f.Size),
                    DownloadUrl = $"/api/files/{f.Id}",
                    ThumbnailUrl = f.Category == "images" ? $"/api/files/{f.Id}/thumbnail" : null,
                    Category = f.Category,
                    Description = f.Description,
                    UploaderName = "Me",
                    UploadedAt = f.UploadedAt
                })
                .ToListAsync();

            return Ok(files);
        }

        /// <summary>
        /// Delete a file (soft delete)
        /// </summary>
        /// <param name="id">File ID</param>
        /// <returns>Success message</returns>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var storedFile = await _context.Set<StoredFile>()
                .FirstOrDefaultAsync(f => f.Id == id);

            if (storedFile == null)
                return NotFound(new { error = "File not found" });

            // Only owner or admin can delete
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (storedFile.UploaderId != userId.Value && userRole != "Admin")
                return Forbid();

            // Soft delete (keep file for recovery)
            storedFile.IsDeleted = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("File deleted: {FileId} by User {UserId}", id, userId);

            return Ok(new { message = "File deleted successfully" });
        }

        /// <summary>
        /// Permanently delete a file (admin only)
        /// </summary>
        /// <param name="id">File ID</param>
        /// <returns>Success message</returns>
        [HttpDelete("{id:guid}/permanent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PermanentDelete(Guid id)
        {
            var storedFile = await _context.Set<StoredFile>()
                .FirstOrDefaultAsync(f => f.Id == id);

            if (storedFile == null)
                return NotFound(new { error = "File not found" });

            // Delete from disk
            await _fileStorage.DeleteFileAsync(storedFile.StoredFileName);

            // Delete from database
            _context.Set<StoredFile>().Remove(storedFile);
            await _context.SaveChangesAsync();

            _logger.LogInformation("File permanently deleted: {FileId}", id);

            return Ok(new { message = "File permanently deleted" });
        }

        /// <summary>
        /// Get storage statistics (admin only)
        /// </summary>
        /// <returns>Storage stats</returns>
        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _context.Set<StoredFile>()
                .Where(f => !f.IsDeleted)
                .GroupBy(f => f.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    Count = g.Count(),
                    TotalSize = g.Sum(f => f.Size),
                    TotalSizeFormatted = _fileStorage.FormatFileSize(g.Sum(f => f.Size))
                })
                .ToListAsync();

            var totalFiles = stats.Sum(s => s.Count);
            var totalSize = stats.Sum(s => s.TotalSize);

            return Ok(new
            {
                totalFiles,
                totalSize,
                totalSizeFormatted = _fileStorage.FormatFileSize(totalSize),
                byCategory = stats
            });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return null;
        }

        private ObjectResult Gone(object value)
        {
            return StatusCode(410, value);
        }
    }
}
