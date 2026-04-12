using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartGrade.Data;
using SmartGrade.DTOs;
using SmartGrade.Models;
using SmartGrade.Services;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SmartGrade.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;
        private readonly NotificationService _notificationService;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration,
            EmailService emailService,
            NotificationService notificationService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _notificationService = notificationService;
        }

        // POST: api/Auth/signup

        [HttpPost("signup")]
        public async Task<IActionResult> Signup(RegisterDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = request.Email.ToLower();

            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
                return BadRequest(new { message = "User with this email already exists." });

            var user = new User
            {
                FullName = request.FullName,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role == "Teacher"
                ? "Teacher"
                : request.Role == "Admin"
                    ? "Admin"
                    : "Student"
                        };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // get all admins
            var admins = await _context.Users
                .Where(u => u.Role == "Admin")
                .Select(u => u.Id)
                .ToListAsync();

            // send notification to each admin
            foreach (var adminId in admins)
            {
                await _notificationService.CreateAsync(
                    adminId,
                    "New User Created",
                    $"A new {user.Role} account has been created: {user.FullName}",
                    "System",
                    "Admin"
                );
            }

            return Ok(new { message = "User registered successfully" });
        }


        // POST: api/Auth/login

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            // validate request
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = request.Email.ToLower();

            // find user
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password." });

            // verify password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid email or password." });

            // auto re-activate
            if (user.DeactivatedUntil.HasValue && user.DeactivatedUntil < DateTime.UtcNow)
            {
                user.IsActive = true;
                user.DeactivatedUntil = null;
                await _context.SaveChangesAsync();
            }

            // block inactive users
            if (!user.IsActive)
            {
                // TEMPORARY DEACTIVATION
                if (user.DeactivatedUntil.HasValue)
                {
                    var remainingTime = user.DeactivatedUntil.Value - DateTime.UtcNow;

                    if (remainingTime.TotalSeconds > 0)
                    {
                        return StatusCode(403, new
                        {
                            message = "Your account is temporarily deactivated.",
                            remainingSeconds = (int)remainingTime.TotalSeconds
                        });
                    }
                }

                // PERMANENT DEACTIVATION
                return StatusCode(403, new
                {
                    message = "Your account has been permanently deactivated. Contact admin."
                });
            }

            // create claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            // jwt config
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    Convert.ToDouble(_configuration["Jwt:ExpiryMinutes"])
                ),
                signingCredentials: creds
            );

            var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

            // refresh token
            user.RefreshToken = Guid.NewGuid().ToString();
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            // response
            return Ok(new
            {
                token = jwtToken,
                refreshToken = user.RefreshToken,
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role
                }
            });
        }

        // POST: api/Auth/refresh-token

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken(RefreshTokenDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.RefreshToken == request.RefreshToken &&
                u.RefreshTokenExpiryTime > DateTime.UtcNow
            );

            if (user == null)
                return Unauthorized("Invalid or expired refresh token.");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Email),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    Convert.ToDouble(_configuration["Jwt:ExpiryMinutes"])
                ),
                signingCredentials: creds
            );

            var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new { token = jwtToken });
        }


        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                if (user == null)
                    return Ok("If email exists, reset link has been sent.");

                var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

                user.ResetToken = token;
                user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
                await _context.SaveChangesAsync();

                var resetLink = $"https://sneha-budhathoki-smartgrade-6xfv5hew2.vercel.app/reset-password?token={token}";

                Console.WriteLine("RESET LINK: " + resetLink);
                Console.WriteLine("Sending email to: " + user.Email);

                await _emailService.SendResetEmailAsync(user.Email, resetLink);

                Console.WriteLine("Email sent successfully!");

                return Ok("If email exists, reset link has been sent.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("FULL ERROR: " + ex.ToString());

                
                return StatusCode(500, new
                {
                    message = "Email sending failed",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }

        // POST: api/Auth/reset-password

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.ResetToken == request.Token &&
                    u.ResetTokenExpiry > DateTime.UtcNow
                );

            if (user == null)
                return BadRequest("Invalid or expired token.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ResetToken = null;
            user.ResetTokenExpiry = null;

            await _context.SaveChangesAsync();

            return Ok("Password reset successful.");
        }


        // DEBUG
        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Role
                })
                .ToListAsync();

            return Ok(users);
        }
    }
}
