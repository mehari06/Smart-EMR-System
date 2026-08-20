"""
Email Service using Resend API.
Sends beautiful HTML emails.
"""

import httpx
from django.conf import settings


class ResendEmailService:
    """Send emails via Resend API."""
    
    API_URL = 'https://api.resend.com/emails'
    
    @classmethod
    def send(cls, *, to_email, subject, html_content):
        """Send email using Resend API."""
        
        if not settings.RESEND_API_KEY:
            print(f"[EMAIL] No API key configured. Would send to {to_email}: {subject}")
            return None
        
        headers = {
            'Authorization': f'Bearer {settings.RESEND_API_KEY}',
            'Content-Type': 'application/json',
        }
        
        payload = {
            'from': settings.RESEND_FROM_EMAIL,
            'to': [to_email],
            'subject': subject,
            'html': html_content,
        }
        
        try:
            with httpx.Client(timeout=10) as client:
                response = client.post(cls.API_URL, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
            return None


def get_appointment_reminder_html(*, patient_name, appointment_date, appointment_time, doctor_name, department, location):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f4f8; padding: 20px; margin: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
            .header {{ background: linear-gradient(135deg, #1E90FF 0%, #0066CC 100%); padding: 30px; text-align: center; }}
            .logo {{ width: 56px; height: 56px; border-radius: 50%; background: #fff; margin: 0 auto; display: flex; align-items: center; justify-content: center; }}
            .logo-text {{ color: #1E90FF; font-size: 24px; font-weight: bold; }}
            .header-title {{ color: #fff; font-size: 28px; font-weight: bold; margin: 12px 0 4px; }}
            .header-subtitle {{ color: #E0F0FF; font-size: 14px; margin: 0; }}
            .content {{ padding: 32px 24px; }}
            .title {{ color: #1a1a1a; font-size: 22px; font-weight: bold; margin-bottom: 16px; }}
            .greeting {{ color: #1a1a1a; font-size: 16px; margin: 0 0 16px; }}
            .paragraph {{ color: #4b5563; font-size: 15px; line-height: 24px; margin: 12px 0; }}
            .card {{ background: #F0F7FF; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #BFDBFE; }}
            .card-title {{ color: #1E90FF; font-size: 16px; font-weight: bold; margin-bottom: 12px; }}
            .detail-row {{ margin-bottom: 12px; }}
            .label {{ color: #6b7280; font-size: 14px; font-weight: bold; }}
            .value {{ color: #1a1a1a; font-size: 14px; }}
            .button {{ background: #1E90FF; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block; margin-top: 20px; }}
            .footer {{ padding: 20px 24px; background: #f9fafb; text-align: center; }}
            .footer-text {{ color: #6b7280; font-size: 12px; margin: 4px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo"><span class="logo-text">SE</span></div>
                <h1 class="header-title">Smart EMR</h1>
                <p class="header-subtitle">Electronic Medical Record System</p>
            </div>
            <div class="content">
                <h2 class="title">📅 Appointment Reminder</h2>
                <p class="greeting">Dear {patient_name},</p>
                <p class="paragraph">This is a friendly reminder about your upcoming appointment.</p>
                <div class="card">
                    <p class="card-title">Appointment Details</p>
                    <div class="detail-row"><span class="label">📅 Date:</span> <span class="value">{appointment_date}</span></div>
                    <div class="detail-row"><span class="label">⏰ Time:</span> <span class="value">{appointment_time}</span></div>
                    <div class="detail-row"><span class="label">👨‍⚕️ Doctor:</span> <span class="value">{doctor_name}</span></div>
                    <div class="detail-row"><span class="label">🏥 Department:</span> <span class="value">{department}</span></div>
                    <div class="detail-row"><span class="label">📍 Location:</span> <span class="value">{location}</span></div>
                </div>
                <a href="{settings.FRONTEND_URL}/appointments" class="button">View My Appointments</a>
            </div>
            <div class="footer">
                <p class="footer-text">© 2026 Smart EMR System. All rights reserved.</p>
                <p class="footer-text">This email contains no protected health information.</p>
            </div>
        </div>
    </body>
    </html>
    """


def get_lab_result_html(*, patient_name, test_name, verified_by, verified_date):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, sans-serif; background: #f0f4f8; padding: 20px; margin: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); padding: 30px; text-align: center; }}
            .header-title {{ color: #fff; font-size: 24px; margin: 0; }}
            .content {{ padding: 32px 24px; }}
            .greeting {{ color: #1a1a1a; font-size: 16px; }}
            .paragraph {{ color: #4b5563; font-size: 15px; }}
            .card {{ background: #F0FDF4; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #BBF7D0; }}
            .security {{ background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px; margin: 20px 0; }}
            .security-title {{ color: #D97706; font-size: 14px; font-weight: bold; }}
            .security-text {{ color: #92400E; font-size: 13px; }}
            .button {{ background: #16A34A; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1 class="header-title">🔬 Lab Result Available</h1></div>
            <div class="content">
                <p class="greeting">Dear {patient_name},</p>
                <p class="paragraph">Your laboratory test result has been reviewed and verified.</p>
                <div class="card">
                    <p>Test: {test_name}</p>
                    <p>Verified by: {verified_by}</p>
                    <p>Verified on: {verified_date}</p>
                </div>
                <div class="security">
                    <p class="security-title">🔒 Privacy Notice</p>
                    <p class="security-text">For your security, we never send actual results via email. Please log in to view your results.</p>
                </div>
                <a href="{settings.FRONTEND_URL}/lab-results" class="button">View Results in Portal</a>
            </div>
        </div>
    </body>
    </html>
    """


def get_medication_reminder_html(*, patient_name, medication_name, dosage, frequency):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, sans-serif; background: #f0f4f8; padding: 20px; margin: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); padding: 30px; text-align: center; }}
            .header-title {{ color: #fff; font-size: 24px; margin: 0; }}
            .content {{ padding: 32px 24px; }}
            .card {{ background: #F5F3FF; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #DDD6FE; }}
            .med-name {{ color: #7C3AED; font-size: 18px; font-weight: bold; }}
            .button {{ background: #7C3AED; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1 class="header-title">💊 Medication Reminder</h1></div>
            <div class="content">
                <p>Dear {patient_name},</p>
                <p>It's time to take your medication.</p>
                <div class="card">
                    <p class="med-name">💊 {medication_name}</p>
                    <p>Dosage: {dosage}</p>
                    <p>Frequency: {frequency}</p>
                </div>
                <a href="{settings.FRONTEND_URL}/medications" class="button">View My Medications</a>
            </div>
        </div>
    </body>
    </html>
    """


def get_password_reset_html(*, user_name, reset_link, expiry_minutes):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, sans-serif; background: #f0f4f8; padding: 20px; margin: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 30px; text-align: center; }}
            .header-title {{ color: #fff; font-size: 24px; margin: 0; }}
            .content {{ padding: 32px 24px; }}
            .button {{ background: #DC2626; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }}
            .warning {{ background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin: 20px 0; color: #991B1B; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1 class="header-title">🔐 Password Reset</h1></div>
            <div class="content">
                <p>Hello {user_name},</p>
                <p>We received a request to reset your password.</p>
                <a href="{reset_link}" class="button">Reset Password</a>
                <div class="warning">
                    <p>⚠️ This link expires in {expiry_minutes} minutes.</p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """


def get_schedule_digest_html(*, doctor_name, appointment_count, first_appointment_time, last_appointment_time):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, sans-serif; background: #f0f4f8; padding: 20px; margin: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #1E90FF 0%, #0066CC 100%); padding: 30px; text-align: center; }}
            .header-title {{ color: #fff; font-size: 24px; margin: 0; }}
            .content {{ padding: 32px 24px; }}
            .card {{ background: #EFF6FF; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #BFDBFE; }}
            .button {{ background: #1E90FF; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1 class="header-title">📋 Your Daily Schedule</h1></div>
            <div class="content">
                <p>Good morning, Dr. {doctor_name}!</p>
                <div class="card">
                    <p>Total Appointments: {appointment_count}</p>
                    <p>First Appointment: {first_appointment_time}</p>
                    <p>Last Appointment: {last_appointment_time}</p>
                </div>
                <a href="{settings.FRONTEND_URL}/appointments" class="button">View Full Schedule</a>
            </div>
        </div>
    </body>
    </html>
    """
def get_account_invitation_html(*, user_name, email, login_url):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f4f8; padding: 20px; margin: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
            .header {{ background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 30px; text-align: center; }}
            .logo {{ width: 56px; height: 56px; border-radius: 50%; background: #fff; margin: 0 auto; display: flex; align-items: center; justify-content: center; }}
            .logo-text {{ color: #8B5CF6; font-size: 24px; font-weight: bold; }}
            .header-title {{ color: #fff; font-size: 24px; margin: 12px 0 4px; }}
            .content {{ padding: 32px 24px; }}
            .greeting {{ color: #1a1a1a; font-size: 16px; }}
            .info-box {{ background: #F5F3FF; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #DDD6FE; }}
            .button {{ background: #8B5CF6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: bold; }}
            .footer {{ padding: 20px 24px; background: #f9fafb; text-align: center; color: #999; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo"><span class="logo-text">SE</span></div>
                <h1 class="header-title">👋 Welcome to Smart EMR</h1>
            </div>
            <div class="content">
                <p class="greeting">Hello {user_name},</p>
                <p>Your account has been created on the Smart EMR platform. You can now log in using your email address.</p>
                <div class="info-box">
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Getting Started:</strong> Use the login link below to access your account.</p>
                </div>
                <a href="{login_url}" class="button">Log In to Smart EMR</a>
                <p style="margin-top: 20px; color: #999; font-size: 13px;">For security, never share your password with anyone.</p>
            </div>
            <div class="footer">
                <p>© 2026 Smart EMR System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """