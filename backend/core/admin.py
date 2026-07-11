from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, Organization, Department, Staff


# ============================================================
# USER ADMIN
# ============================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin for the EMR User model.
    Replaces 'username' with 'email' and adds 'role'.
    """
    list_display   = ['email', 'first_name', 'last_name', 'role', 'is_verified', 'is_active', 'is_staff']
    list_filter    = ['role', 'is_active', 'is_verified', 'is_staff']
    search_fields  = ['email', 'first_name', 'last_name']
    ordering       = ['email']
    readonly_fields = ['last_login', 'date_joined']

    # Fields shown when EDITING an existing user
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        (_('Personal Information'), {
            'fields': ('first_name', 'last_name', 'phone')
        }),
        (_('Role & Status'), {
            'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser')
        }),
        (_('Groups & Permissions'), {
            'classes': ('collapse',),
            'fields': ('groups', 'user_permissions'),
        }),
        (_('Important Dates'), {
            'classes': ('collapse',),
            'fields': ('last_login', 'date_joined'),
        }),
    )

    # Fields shown when CREATING a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name',
                'role', 'phone',
                'password1', 'password2',
            ),
        }),
    )


# ============================================================
# ORGANIZATION ADMIN
# ============================================================

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display   = ['name', 'email', 'phone', 'created_at']
    search_fields  = ['name', 'email']
    readonly_fields = ['created_at']


# ============================================================
# DEPARTMENT ADMIN
# ============================================================

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display  = ['name', 'organization', 'description']
    list_filter   = ['organization']
    search_fields = ['name']


# ============================================================
# STAFF ADMIN
# ============================================================

@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display   = ['staff_id', 'get_full_name', 'get_role', 'department', 'is_active', 'joined_at']
    list_filter    = ['user__role', 'department', 'is_active']
    search_fields  = ['staff_id', 'user__first_name', 'user__last_name', 'user__email']
    readonly_fields = ['joined_at']

    @admin.display(description='Full Name')
    def get_full_name(self, obj):
        return obj.user.get_full_name()

    @admin.display(description='Role')
    def get_role(self, obj):
        return obj.user.get_role_display()
