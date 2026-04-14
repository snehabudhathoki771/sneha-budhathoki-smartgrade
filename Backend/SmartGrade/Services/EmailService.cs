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

        private string GetApiUrl()
        {
            return _config["EmailApi:Url"]
                ?? throw new Exception("Email API URL not configured");
        }

        private string GetSecret()
        {
            return _config["EmailApi:Secret"]
                ?? throw new Exception("Email API Secret not configured");
        }

        private async Task SendEmailAsync(string to, string subject, string body)
        {
            var payload = new
            {
                to = to,
                subject = subject,
                body = body,
                secret = GetSecret()
            };

            var response = await _http.PostAsJsonAsync(GetApiUrl(), payload);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine("EMAIL ERROR: " + error);
                throw new Exception("Email sending failed");
            }
        }

        // =========================
        // FORGOT PASSWORD
        // =========================
        public async Task SendResetEmailAsync(string toEmail, string resetLink)
        {
            var html = $@"
                <h2>Reset Your Password</h2>
                <p>You requested a password reset.</p>
                <a href='{resetLink}'>Click here to reset password</a>
                <p>This link expires in 30 minutes.</p>
            ";

            await SendEmailAsync(toEmail, "SmartGrade – Password Reset", html);
        }

        // =========================
        // ADMIN RESET
        // =========================
        public async Task SendAdminResetPasswordEmailAsync(string toEmail, string fullName, string newPassword)
        {
            var html = $@"
                <p>Hello {fullName},</p>
                <p>Your password was reset by admin.</p>
                <p><b>Temporary Password: {newPassword}</b></p>
                <p>Please change it after login.</p>
            ";

            await SendEmailAsync(toEmail, "SmartGrade – Password Reset by Admin", html);
        }

        // =========================
        // ACCOUNT DEACTIVATION
        // =========================
        public async Task SendAccountDeactivatedEmailAsync(string toEmail, string fullName, DateTime? until)
        {
            string html;

            if (until.HasValue)
            {
                html = $@"
                    <p>Hello {fullName},</p>
                    <p>Your account is temporarily deactivated until {until.Value:dd MMM yyyy}.</p>
                ";
            }
            else
            {
                html = $@"
                    <p>Hello {fullName},</p>
                    <p>Your account has been permanently deactivated.</p>
                ";
            }

            await SendEmailAsync(toEmail, "SmartGrade – Account Deactivated", html);
        }
    }
}