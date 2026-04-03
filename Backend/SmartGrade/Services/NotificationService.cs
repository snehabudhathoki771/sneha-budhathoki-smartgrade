using Microsoft.EntityFrameworkCore;
using SmartGrade.Data;
using SmartGrade.DTOs.Notification;
using SmartGrade.Models;

namespace SmartGrade.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        // ================= CREATE NOTIFICATION =================

        public async Task CreateAsync(
            int userId,
            string title,
            string message,
            string type,
            int? referenceId = null,
            string? route = null)
        {
            // Prevent duplicate unread notifications of same type
            var exists = await _context.Notifications
                .AnyAsync(n =>
                    n.UserId == userId &&
                    n.Title == title &&
                    !n.IsRead);

            if (exists)
                return;

            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                ReferenceId = referenceId,
                Route = route,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        // ================= GET USER NOTIFICATIONS =================

        public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    ReferenceId = n.ReferenceId,
                    Route = n.Route
                })
                .ToListAsync();
        }

        // ================= MARK ONE AS READ =================

        public async Task MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                return;

            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }

        // ================= MARK ALL AS READ =================

        public async Task MarkAllAsReadAsync(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
                notification.IsRead = true;

            await _context.SaveChangesAsync();
        }

        // ================= GET UNREAD COUNT =================

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }
    }
}