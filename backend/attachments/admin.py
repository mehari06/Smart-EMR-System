from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import FileAttachment

@admin.register(FileAttachment)
class FileAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'file_type', 'description', 'patient', 'uploaded_by', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['description', 'patient__user__first_name', 'patient__user__last_name']
    readonly_fields = ['uploaded_at']
    autocomplete_fields = ['patient', 'uploaded_by']