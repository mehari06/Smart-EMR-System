# EMR System — Coding Standards & Guidelines

This document outlines the coding standards, naming conventions, and architectural rules to be followed during the development of the Electronic Medical Record (EMR) System. Adhering to these standards ensures consistency, maintainability, and scalability across the codebase.

---

## 1. Naming Conventions

### Python & Django (PEP 8)
* **Classes (Models, Views, Serializers):** `PascalCase` (e.g., `PatientProfile`, `CreateEncounterView`)
* **Functions & Methods:** `snake_case` (e.g., `calculate_bmi()`, `get_patient_history()`)
* **Variables & Fields:** `snake_case` (e.g., `patient_number`, `blood_group`)
* **Constants & Choice Fields:** `UPPER_SNAKE_CASE` (e.g., `STATUS_ACTIVE`, `GENDER_MALE`)
* **Module & File Names:** `snake_case` (e.g., `permissions.py`, `setup_groups.py`)

### API & Routing
* **URL Paths:** `kebab-case` and plural nouns (e.g., `/api/patients/`, `/api/clinical-encounters/`)
* **URL Names:** `snake_case` (e.g., `name='patient_list'`)

---

## 2. Django Model Standards

### Structure & Ordering
Every model must follow a consistent structure:
1. Field definitions
2. `__str__` method
3. Custom properties/methods
4. `class Meta` configuration

### Rules
* **String Representation:** Every model MUST have a descriptive `__str__` method.
* **Ordering:** Always define `ordering` inside `class Meta` to ensure consistent query results.
* **Foreign Keys:** 
  * Use `on_delete=models.PROTECT` for critical clinical data (e.g., you cannot delete a Doctor if they have Encounters).
  * Use `on_delete=models.CASCADE` for owned profile data (e.g., deleting a User deletes their Staff profile).
* **Circular Imports:** Avoid importing models directly into other `models.py` files. Use string references instead (e.g., `models.ForeignKey('patients.Patient', ...)`).
* **Permissions:** Define custom permissions relevant to business logic inside `Meta.permissions` rather than relying solely on default CRUD permissions.

---

## 3. Django REST Framework (DRF) Standards

### Serializers
* Use `ModelSerializer` as the base for most serializers.
* Keep nested serializers minimal (1-level deep) to avoid performance hits (N+1 query problems).
* Define separate serializers for `List` views vs `Detail`/`Create` views if the payloads differ significantly in size.

### Views & ViewSets
* Prefer `ModelViewSet` for standard CRUD operations.
* Prefer `APIView` for custom, non-CRUD operations.
* **Authentication:** Ensure `permission_classes` are explicitly declared on every view. Never leave an endpoint exposed accidentally.

### Responses
* Always return proper HTTP status codes:
  * `200 OK` for successful GET/PUT/PATCH
  * `201 Created` for successful POST
  * `204 No Content` for successful DELETE
  * `400 Bad Request` for validation errors
  * `401 Unauthorized` for missing/invalid auth token
  * `403 Forbidden` for lack of role permissions

---

## 4. Code Quality & Formatting

* **Line Length:** Aim for a maximum line length of 88-100 characters.
* **Docstrings:** Use docstrings `"""..."""` for all Classes and complex functions. Briefly explain the *why* and *what*, not the *how*.
* **Comments:** Use inline comments `##` only when the code logic is highly complex or non-obvious. Write self-documenting code by choosing excellent variable names.
* **Fat Models, Skinny Views:** Put business logic inside model methods or service classes rather than cluttering views.

---

## 5. Security Practices

* **Environment Variables:** Never hardcode secrets, passwords, or API keys. Always use `.env` via `python-dotenv`.
* **RBAC Enforcement:** Never trust the frontend. The backend must explicitly verify permissions via DRF `BasePermission` classes (`IsAdministrator`, `IsDoctor`, etc.) before fulfilling any request.

---

## 6. Git Workflow

* **Branching:** Use descriptive branch names:
  * `feature/patient-registration`
  * `bugfix/appointment-overlap`
  * `refactor/auth-module`
* **Commits:** Write clear, imperative commit messages:
  * Good: `Add custom permissions to Appointment model`
  * Bad: `Fixed stuff`
