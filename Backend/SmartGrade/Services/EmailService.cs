using System.Net;
using System.Net.Mail;

namespace SmartGrade.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        private SmtpClient CreateSmtpClient(string smtpServer, int port, string username, string password)
        {
            System.Net.ServicePointManager.SecurityProtocol =
                System.Net.SecurityProtocolType.Tls12;

            return new SmtpClient
            {
                Host = smtpServer,
                Port = port,
                EnableSsl = true,
                Credentials = new NetworkCredential(username, password),
                Timeout = 20000,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };
        }

        public async Task SendResetEmailAsync(string toEmail, string resetLink)
        {
            try
            {
                var smtpServer = _config["EmailSettings:SmtpServer"]
                    ?? throw new Exception("SMTP server not configured");

                var portValue = _config["EmailSettings:Port"]
                    ?? throw new Exception("SMTP port not configured");

                if (!int.TryParse(portValue, out int port))
                    throw new Exception("Invalid SMTP port configuration");

                var username = _config["EmailSettings:Username"]
                    ?? throw new Exception("SMTP username not configured");

                var password = _config["EmailSettings:Password"]
                    ?? throw new Exception("SMTP password not configured");

                var senderEmail = _config["EmailSettings:SenderEmail"]
                    ?? throw new Exception("Sender email not configured");

                var senderName = _config["EmailSettings:SenderName"] ?? "SmartGrade";

                using var smtp = CreateSmtpClient(smtpServer, port, username, password);

                using var mail = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = "SmartGrade – Password Reset",
                    Body = $@"
                    Hello,

                    You requested a password reset for your SmartGrade account.

                    Click the link below to reset your password:
                    {resetLink}

                    This link will expire in 30 minutes.

                    If you did not request this, please ignore this email.

                    – SmartGrade Team
                    ",
                    IsBodyHtml = false
                };

                mail.To.Add(toEmail);

                await smtp.SendMailAsync(mail);

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
                var smtpServer = _config["EmailSettings:SmtpServer"]
                    ?? throw new Exception("SMTP server not configured");

                var portValue = _config["EmailSettings:Port"]
                    ?? throw new Exception("SMTP port not configured");

                if (!int.TryParse(portValue, out int port))
                    throw new Exception("Invalid SMTP port configuration");

                var username = _config["EmailSettings:Username"]
                    ?? throw new Exception("SMTP username not configured");

                var password = _config["EmailSettings:Password"]
                    ?? throw new Exception("SMTP password not configured");

                var senderEmail = _config["EmailSettings:SenderEmail"]
                    ?? throw new Exception("Sender email not configured");

                var senderName = _config["EmailSettings:SenderName"] ?? "SmartGrade";

                using var smtp = CreateSmtpClient(smtpServer, port, username, password);

                using var mail = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = "SmartGrade – Your Password Has Been Reset",
                    Body = $@"
                    Hello {fullName},

                    An administrator has reset your SmartGrade account password.

                    Your new temporary password is:

                    {newPassword}

                    Please login and change your password immediately.

                    – SmartGrade Team
                    ",
                    IsBodyHtml = false
                };

                mail.To.Add(toEmail);

                await smtp.SendMailAsync(mail);

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
                var smtpServer = _config["EmailSettings:SmtpServer"]
                    ?? throw new Exception("SMTP server not configured");

                var portValue = _config["EmailSettings:Port"]
                    ?? throw new Exception("SMTP port not configured");

                if (!int.TryParse(portValue, out int port))
                    throw new Exception("Invalid SMTP port configuration");

                var username = _config["EmailSettings:Username"]
                    ?? throw new Exception("SMTP username not configured");

                var password = _config["EmailSettings:Password"]
                    ?? throw new Exception("SMTP password not configured");

                var senderEmail = _config["EmailSettings:SenderEmail"]
                    ?? throw new Exception("Sender email not configured");

                var senderName = _config["EmailSettings:SenderName"] ?? "SmartGrade";

                using var smtp = CreateSmtpClient(smtpServer, port, username, password);

                string message;

                if (until.HasValue)
                {
                    message = $@"
                    Hello {fullName},

                    Your account has been temporarily deactivated by the administrator.

                    Deactivation period until: {until.Value:dd MMM yyyy}

                    Please contact the admin for assistance.

                    – SmartGrade Team
                    ";
                }
                else
                {
                    message = $@"
                    Hello {fullName},

                    Your account has been permanently deactivated by the administrator.

                    Please contact the admin for assistance.

                    – SmartGrade Team
                    ";
                }

                using var mail = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = "SmartGrade – Account Deactivated",
                    Body = message,
                    IsBodyHtml = false
                };

                mail.To.Add(toEmail);

                await smtp.SendMailAsync(mail);

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