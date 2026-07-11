"""
Patient Management Module — Validators

Reusable, standalone validation functions.
Import and call these from serializers or services.
"""

import os
import re
from datetime import date

from django.core.exceptions import ValidationError

from .constants import (
    ALLOWED_IMAGE_EXTENSIONS,
    MAX_PROFILE_PHOTO_SIZE_BYTES,
    PHONE_MIN_LENGTH,
    ErrorMessages,
)


def validate_date_of_birth(dob: date) -> None:
    """
    Ensures the date of birth is:
    - Not in the future.
    - Not unrealistically old (> 130 years).
    """
    today = date.today()
    if dob > today:
        raise ValidationError(ErrorMessages.DOB_FUTURE)
    if (today - dob).days > 130 * 365:
        raise ValidationError(ErrorMessages.DOB_UNREALISTIC)


def validate_phone_number(phone: str) -> None:
    """
    Ensures the phone number contains only valid characters
    and meets the minimum length requirement.
    """
    # Strip formatting characters to count only digits
    digits_only = re.sub(r"[\s\-\+]", "", phone)

    if not re.fullmatch(r"[\d\s\+\-]+", phone):
        raise ValidationError(ErrorMessages.PHONE_INVALID)

    if len(digits_only) < PHONE_MIN_LENGTH:
        raise ValidationError(ErrorMessages.PHONE_TOO_SHORT)


def validate_profile_photo(image) -> None:
    """
    Validates profile photo:
    - File extension must be in ALLOWED_IMAGE_EXTENSIONS.
    - File size must not exceed MAX_PROFILE_PHOTO_SIZE_BYTES.
    """
    if image is None:
        return

    ext = os.path.splitext(image.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(ErrorMessages.PHOTO_INVALID_FORMAT)

    if image.size > MAX_PROFILE_PHOTO_SIZE_BYTES:
        raise ValidationError(ErrorMessages.PHOTO_TOO_LARGE)
