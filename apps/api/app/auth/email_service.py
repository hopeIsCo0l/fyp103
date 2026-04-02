import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, body: str) -> bool:
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
            return True
        except Exception as e:
            logger.exception(f"Failed to send email: {e}")
            print(f"[ERROR] Email send failed: {e}", flush=True)
            return False
    print(f"[DEV] Email to {to_email} | {subject}\n{body.strip()}", flush=True)
    return True


def send_otp_email(to_email: str, otp: str, purpose: str = "verification") -> bool:
    """Send OTP via email. In dev (no SMTP), logs to console and returns True."""
    subject = "Your verification code" if purpose == "signup" else "Your login code"
    body = f"""
Your verification code is: {otp}

This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.
If you didn't request this, please ignore this email.
"""
    ok = _send_email(to_email, subject, body)
    if ok:
        logger.info(f"OTP email sent to {to_email}")
    return ok


def send_password_reset_email(to_email: str, token: str) -> bool:
    subject = "Password reset instructions"
    body = f"""
Use this reset token to update your password:

{token}

This token expires in {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.
If you didn't request this, please ignore this email.
"""
    ok = _send_email(to_email, subject, body)
    if ok:
        logger.info(f"Password reset email sent to {to_email}")
    return ok
