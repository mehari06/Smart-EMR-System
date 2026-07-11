"""
Patient Management Module — Constants

Central place for all string constants, error messages,
and configuration values used across the patients app.
"""

# ── Patient Number ─────────────────────────────────────────────
PATIENT_NUMBER_PREFIX = "PAT"
PATIENT_NUMBER_PADDING = 6          # PAT-000001

# ── Profile Photo ──────────────────────────────────────────────
ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"]
MAX_PROFILE_PHOTO_SIZE_MB = 2       # 2 MB
MAX_PROFILE_PHOTO_SIZE_BYTES = MAX_PROFILE_PHOTO_SIZE_MB * 1024 * 1024

# ── Phone ──────────────────────────────────────────────────────
PHONE_MIN_LENGTH = 7
PHONE_MAX_LENGTH = 20

# ── Error Messages ─────────────────────────────────────────────
class ErrorMessages:
    # Date of birth
    DOB_FUTURE               = "Date of birth cannot be in the future."
    DOB_UNREALISTIC          = "Date of birth is unrealistically far in the past."

    # Phone
    PHONE_INVALID            = "Phone number must contain only digits, spaces, +, or - characters."
    PHONE_TOO_SHORT          = f"Phone number must be at least {PHONE_MIN_LENGTH} digits."

    # Email
    EMAIL_DUPLICATE          = "A user with this email address already exists."

    # Profile photo
    PHOTO_INVALID_FORMAT     = (
        f"Invalid image format. Allowed formats: "
        f"{', '.join(ALLOWED_IMAGE_EXTENSIONS)}."
    )
    PHOTO_TOO_LARGE          = (
        f"Profile photo exceeds the maximum allowed size of "
        f"{MAX_PROFILE_PHOTO_SIZE_MB} MB."
    )

    # Patient number
    PATIENT_NUMBER_DUPLICATE = "A patient with this patient number already exists."

    # General
    PATIENT_NOT_FOUND        = "Patient not found."
    PATIENT_ALREADY_INACTIVE = "This patient account is already deactivated."
