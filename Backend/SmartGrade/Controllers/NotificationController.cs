using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartGrade.Services;
using System.Security.Claims;

namespace SmartGrade.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _notificationService;

        public NotificationController(NotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // ================= GET CURRENT USER ID =================

        private int GetUserId()
        {
            return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        // ================= GET MY NOTIFICATIONS =================

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = GetUserId();
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            var notifications = await _notificationService
                .GetUserNotificationsAsync(userId, userRole);

            return Ok(notifications);
        }

        // ================= MARK SINGLE NOTIFICATION AS READ =================

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetUserId();

            await _notificationService
                .MarkAsReadAsync(id, userId);

            return Ok();
        }

        // ================= MARK ALL AS READ =================

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetUserId();

            await _notificationService
                .MarkAllAsReadAsync(userId);

            return Ok();
        }

        // ================= GET UNREAD COUNT =================

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetUserId();

            var count = await _notificationService
                .GetUnreadCountAsync(userId);

            return Ok(count);
        }
    }
}