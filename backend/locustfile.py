"""
Smart EMR - Complete Performance Test
Simulates real-world workflows for each user role.

Test Users:
- admin@test.com / test123456
- doctor@test.com / test123456
- nurse@test.com / test123456
- receptionist@test.com / test123456
- patient@test.com / test123456

Run:
    locust -f locustfile.py
"""

from locust import HttpUser, task, between
import random


class BaseEMRUser(HttpUser):
    """Base class with common setup."""
    
    wait_time = between(1, 3)
    
    def on_start(self):
        """Initialize."""
        self.token = None
        self.headers = {}
    
    def login(self, email, password):
        """Login helper."""
        response = self.client.post(
            "/api/core/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            }
        else:
            print(f"Login failed for {email}: {response.status_code} - {response.text}")
    
    # ── Common Tasks ──────────────────────────────────────────
    
    @task(1)
    def view_profile(self):
        """View own profile."""
        if self.token:
            self.client.get("/api/core/auth/me", headers=self.headers)
    
    @task(1)
    def view_departments(self):
        """View departments list."""
        if self.token:
            self.client.get("/api/core/departments", headers=self.headers)


class AdminUser(BaseEMRUser):
    """Admin workflow: Manage everything."""
    
    def on_start(self):
        self.login("admin@smartemr.com", "Admin@123")
    
    @task(5)
    def view_patients(self):
        """View patient list."""
        self.client.get(
            "/api/patients",
            headers=self.headers,
            params={"page": random.randint(1, 5), "page_size": 20}
        )
    
    @task(4)
    def view_staff(self):
        """View staff directory."""
        self.client.get("/api/core/staff", headers=self.headers)
    
    @task(3)
    def view_audit_logs(self):
        """View audit logs."""
        self.client.get(
            "/api/audit/",
            headers=self.headers,
            params={"page": 1, "page_size": 20}
        )
    
    @task(3)
    def view_appointments(self):
        """View all appointments."""
        self.client.get(
            "/api/appointments",
            headers=self.headers,
            params={"page": random.randint(1, 3)}
        )
    
    @task(2)
    def search_patients(self):
        """Search patients."""
        names = ["John", "Sarah", "Abebe", "Maria", "David", "Hirut", "Patient"]
        self.client.get(
            "/api/patients",
            headers=self.headers,
            params={"search": random.choice(names), "page_size": 10}
        )
    
    @task(2)
    def view_organizations(self):
        """View organizations."""
        self.client.get("/api/core/organizations", headers=self.headers)
    
    @task(1)
    def view_departments(self):
        """View departments."""
        self.client.get("/api/core/departments", headers=self.headers)


class DoctorUser(BaseEMRUser):
    """Doctor workflow: See patients, encounters, prescribe."""
    
    def on_start(self):
        self.login("dr.smith@smartemr.com", "Doctor@123")
    
    @task(5)
    def view_my_appointments(self):
        """View assigned appointments."""
        self.client.get(
            "/api/appointments",
            headers=self.headers,
            params={"page": 1, "page_size": 10}
        )
    
    @task(4)
    def view_my_encounters(self):
        """View active encounters."""
        self.client.get(
            "/api/clinical/encounters",
            headers=self.headers,
            params={"status": "O", "page_size": 10}
        )
    
    @task(3)
    def view_patient_detail(self):
        """View a patient's details."""
        patient_id = random.randint(1, 100)
        self.client.get(
            f"/api/patients/{patient_id}",
            headers=self.headers
        )
    
    @task(3)
    def view_my_queue(self):
        """View assigned queue."""
        self.client.get(
            "/api/queue/my-queue",
            headers=self.headers
        )
    
    @task(2)
    def view_lab_orders(self):
        """View lab orders."""
        self.client.get(
            "/api/laboratory/orders",
            headers=self.headers,
            params={"page": 1, "page_size": 10}
        )
    
    @task(2)
    def view_radiology(self):
        """View radiology orders."""
        self.client.get(
            "/api/clinical/radiology/orders",
            headers=self.headers,
            params={"page": 1}
        )
    
    @task(1)
    def view_prescriptions(self):
        """View prescriptions."""
        self.client.get(
            "/api/prescriptions",
            headers=self.headers,
            params={"page": 1}
        )


class NurseUser(BaseEMRUser):
    """Nurse workflow: Queue, triage, vitals."""
    
    def on_start(self):
        self.login("nurse.jones@smartemr.com", "Nurse@123")
    
    @task(5)
    def view_queue(self):
        """View patient queue."""
        self.client.get("/api/queue", headers=self.headers)
    
    @task(4)
    def view_queue_stats(self):
        """View queue statistics."""
        self.client.get("/api/queue/stats", headers=self.headers)
    
    @task(3)
    def view_checked_in_patients(self):
        """View checked-in appointments."""
        self.client.get(
            "/api/appointments",
            headers=self.headers,
            params={"status": "I", "page_size": 20}
        )
    
    @task(3)
    def view_pending_vitals(self):
        """View encounters needing vitals."""
        self.client.get(
            "/api/clinical/encounters",
            headers=self.headers,
            params={"status": "O", "page_size": 10}
        )
    
    @task(2)
    def view_patients(self):
        """View patients."""
        self.client.get(
            "/api/patients",
            headers=self.headers,
            params={"page": 1, "page_size": 10}
        )
    
    @task(2)
    def search_patients(self):
        """Search patients."""
        names = ["John", "Sarah", "Abebe", "Maria", "Patient"]
        self.client.get(
            "/api/patients",
            headers=self.headers,
            params={"search": random.choice(names)}
        )


class ReceptionistUser(BaseEMRUser):
    """Receptionist workflow: Schedule, check-in, search."""
    
    def on_start(self):
        self.login("reception@smartemr.com", "Recept@123")
    
    @task(5)
    def view_today_appointments(self):
        """View today's appointments."""
        self.client.get(
            "/api/appointments/today",
            headers=self.headers
        )
    
    @task(4)
    def search_patients(self):
        """Search patients (most common task)."""
        names = ["John", "Sarah", "Abebe", "Maria", "David", "Patient"]
        self.client.get(
            "/api/patients",
            headers=self.headers,
            params={"search": random.choice(names), "page_size": 10}
        )
    
    @task(3)
    def view_scheduled_appointments(self):
        """View scheduled appointments."""
        self.client.get(
            "/api/appointments",
            headers=self.headers,
            params={"status": "S", "page_size": 20}
        )
    
    @task(2)
    def view_patients(self):
        """View patient list."""
        self.client.get(
            "/api/patients",
            headers=self.headers,
            params={"page": 1, "page_size": 20}
        )
    
    @task(2)
    def view_departments(self):
        """View departments (for scheduling)."""
        self.client.get("/api/core/departments", headers=self.headers)
    
    @task(2)
    def view_staff(self):
        """View staff (for scheduling)."""
        self.client.get("/api/core/staff", headers=self.headers)
    
    @task(1)
    def check_in_patient(self):
        """Check in a patient (simulated)."""
        appointment_id = random.randint(1, 50)
        self.client.post(
            f"/api/appointments/{appointment_id}/checkin",
            headers=self.headers,
            json={}
        )


class PatientUser(BaseEMRUser):
    """Patient workflow: View own data."""
    
    def on_start(self):
        self.login("patient1@smartemr.com", "Patient@123")
    
    @task(4)
    def view_my_appointments(self):
        """View own appointments."""
        self.client.get(
            "/api/appointments",
            headers=self.headers,
            params={"page": 1}
        )
    
    @task(3)
    def view_my_lab_results(self):
        """View own lab results."""
        self.client.get(
            "/api/laboratory/orders",
            headers=self.headers,
            params={"page": 1}
        )
    
    @task(3)
    def view_my_prescriptions(self):
        """View own prescriptions."""
        self.client.get(
            "/api/prescriptions",
            headers=self.headers,
            params={"page": 1}
        )
    
    @task(2)
    def view_my_profile(self):
        """View own profile."""
        self.client.get("/api/core/auth/me", headers=self.headers)
    
    @task(2)
    def view_my_encounters(self):
        """View own encounters."""
        self.client.get(
            "/api/clinical/encounters",
            headers=self.headers,
            params={"page": 1}
        )
    
    @task(1)
    def view_departments(self):
        """View departments (for appointment request)."""
        self.client.get("/api/core/departments", headers=self.headers)