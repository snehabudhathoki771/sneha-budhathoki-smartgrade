using System.Security.Claims;
using SmartGrade.Data;
using SmartGrade.Models;

namespace SmartGrade.Services
{
    public class AuditService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditService(
            AppDbContext context,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogAsync(string action, string details)
        {
            var user = _httpContextAccessor.HttpContext?.User;

            var email = user?.FindFirst(ClaimTypes.Email)?.Value
                        ?? user?.Identity?.Name
                        ?? "Unknown";

            var audit = new AuditLog
            {
                Action = action,
                PerformedBy = email,
                Timestamp = DateTime.UtcNow,
                Details = details
            };

            _context.AuditLogs.Add(audit);
            await _context.SaveChangesAsync();
        }
    }
}