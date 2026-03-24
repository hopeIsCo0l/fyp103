import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp: str, purpose: str = "verification") -> bool:
    """Send OTP via email. In dev (no SMTP), logs to console and returns True."""
    subject = "Your verification code" if purpose == "signup" else "Your login code"
    body = f"""
Your verification code is: {otp}

This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.
If you didn't request this, please ignore this email.
"""
    if settings.SMTP_HOST and settings.SMTP_USER:
        try:
            password = settings.SMTP_PASSWORD.replace(" ", "") if settings.SMTP_PASSWORD else ""
            msg = MIMEMultipart()
            msg["From"] = settings.EMAIL_FROM
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body.strip(), "plain"))
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                if password:
                    server.login(settings.SMTP_USER, password)
                server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
            logger.info(f"OTP email sent to {to_email}")
            return True
        except Exception as e:
            logger.exception(f"Failed to send OTP email: {e}")
            print(f"[ERROR] Email send failed: {e}")
            return False
    # Dev: log to console
    print(f"[DEV] OTP for {to_email}: {otp} (expires in {settings.OTP_EXPIRE_MINUTES} min)")
    return True
