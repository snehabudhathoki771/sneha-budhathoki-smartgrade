using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace SmartGrade.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _http;

        public EmailService(IConfiguration config)
        {
            _config = config;
            _http = new HttpClient();
        }

        private string GetApiKey()
        {
            return _config["RESEND_API_KEY"]
                ?? throw new Exception("Resend API key not configured");
        }

        public async Task SendResetEmailAsync(string toEmail, string resetLink)
        {
            try
            {
                var apiKey = GetApiKey();

                _http.DefaultRequestHeaders.Clear();
                _http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", apiKey);

                var body = new
                {
                    from = "onboarding@resend.dev>",
                    to = new[] { toEmail },
                    subject = "SmartGrade – Password Reset",
                    html = $@"
                    <p>Hello,</p>

                    <p>You requested a password reset for your SmartGrade account.</p>

                    <p>Click the link below to reset your password:</p>

                    <a href='{resetLink}'>Reset Password</a>

                    <p>This link will expire in 30 minutes.</p>

                    <p>If you did not request this, please ignore this email.</p>

                    <p>– SmartGrade Team</p>
                    "
                };

                var response = await _http.PostAsJsonAsync(
                    "https://api.resend.com/emails",
                    body
                );

                response.EnsureSuccessStatusCode();

                Console.WriteLine($"Email sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine("EMAIL ERROR: " + ex.Message);
                throw;
            }
        }


        public async Task SendAdminResetPasswordEmailAsync(string toEmail, string fullName, string newPassword)
        {
            try
            {
                var apiKey = GetApiKey();

                _http.DefaultRequestHeaders.Clear();
                _http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", apiKey);

                var body = new
                {   
                    from = "onboarding@resend.dev>",
                    to = new[] { toEmail },
                    subject = "SmartGrade – Your Password Has Been Reset",
                    html = $@"
                    <p>Hello {fullName},</p>

                    <p>An administrator has reset your SmartGrade account password.</p>

                    <p>Your new temporary password is:</p>

                    <b>{newPassword}</b>

                    <p>Please login and change your password immediately.</p>

                    <p>– SmartGrade Team</p>
                    "
                };

                var response = await _http.PostAsJsonAsync(
                    "https://api.resend.com/emails",
                    body
                );

                response.EnsureSuccessStatusCode();

                Console.WriteLine($"Admin reset email sent to {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine("EMAIL ERROR: " + ex.Message);
                throw;
            }
        }

        public async Task SendAccountDeactivatedEmailAsync(string toEmail, string fullName, DateTime? until)
        {
            try
            {
                var apiKey = GetApiKey();

                _http.DefaultRequestHeaders.Clear();
                _http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", apiKey);

                string message;

                if (until.HasValue)
                {
                    message = $@"
                    <p>Hello {fullName},</p>

                    <p>Your account has been temporarily deactivated by the administrator.</p>

                    <p>Deactivation period until: {until.Value:dd MMM yyyy}</p>

                    <p>Please contact the admin for assistance.</p>

                    <p>– SmartGrade Team</p>
                    ";
                }
                else
                {
                    message = $@"
                    <p>Hello {fullName},</p>

                    <p>Your account has been permanently deactivated by the administrator.</p>

                    <p>Please contact the admin for assistance.</p>

                    <p>– SmartGrade Team</p>
                    ";
                }

                var body = new
                {
                    from = "onboarding@resend.dev",
                    to = new[] { toEmail },
                    subject = "SmartGrade – Account Deactivated",
                    html = message
                };

                var response = await _http.PostAsJsonAsync(
                    "https://api.resend.com/emails",
                    body
                );

                response.EnsureSuccessStatusCode();

                Console.WriteLine($"Deactivation email sent to {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine("EMAIL ERROR: " + ex.Message);
                throw;
            }
        }
    }
}