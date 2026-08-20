from django.contrib import admin
from .models import Medicine, Prescription, PrescriptionItem


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ['name', 'strength', 'form']
    search_fields = ['name', 'strength']


class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 1


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'encounter',
                    'prescribed_by', 'status', 'prescribed_at']
    list_filter = ['status', 'prescribed_at']
    search_fields = ['encounter__patient__user__first_name',
                     'encounter__patient__user__last_name']
    inlines = [PrescriptionItemInline]
    readonly_fields = ['prescribed_at']
