from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from core.models import Staff
from patients.models import Patient

User = get_user_model()

class PatientAPITests(APITestCase):
    def setUp(self):
        # Create an admin user to interact with the API
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='password123',
            role='admin'
        )
        # Create a doctor user
        self.doctor_user = User.objects.create_user(
            email='doctor@test.com',
            password='password123',
            role='doctor'
        )
        
        # We need a token to authenticate
        # We can authenticate the client directly if JWT isn't strictly required by the test client,
        # but since SimpleJWT is used, let's just force authenticate the user.
        self.client.force_authenticate(user=self.admin_user)
        
        self.patient_data = {
            "email": "patient1@test.com",
            "password": "password123",
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
            "gender": "M",
            "blood_group": "O+",
            "phone": "+1234567890",
            "address": "123 Main St",
            "emergency_contact_name": "Jane Doe",
            "emergency_contact_phone": "+1987654321"
        }

    def test_create_patient(self):
        """
        Ensure we can create a new patient object.
        """
        url = reverse('patient-list') # Assumes router name is 'patient-list' for POST/GET
        response = self.client.post(url, self.patient_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Patient.objects.count(), 1)
        self.assertEqual(User.objects.count(), 3) # Admin, Doctor, + 1 Patient

    def test_get_patient_list(self):
        """
        Ensure we can retrieve the list of patients.
        """
        url = reverse('patient-list')
        self.client.post(url, self.patient_data, format='json') # create one
        
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that there is at least one patient in the response
        self.assertEqual(len(response.data['results']), 1)

    def test_unauthorized_access(self):
        """
        Ensure unauthenticated users cannot access patient data.
        """
        self.client.force_authenticate(user=None)
        url = reverse('patient-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
