"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# Custom Admin Headers
admin.site.site_header = "SmartEMR Administration"
admin.site.site_title = "SmartEMR Portal"
admin.site.index_title = "Welcome to SmartEMR"


urlpatterns = [

    path('admin/', admin.site.urls),
    # Core app routing (Auth, Users, Organizations, Departments)
    # Note: core.urls itself contains paths like 'auth/login', 'staff', etc.
    # The trailing slash here is kept because core.urls uses both slash and no-slash paths.
    path('api/core/', include('core.urls')),

    # JWT token refresh — required by frontend axios interceptor
    path('api/core/auth/token/refresh',
         TokenRefreshView.as_view(), name='token_refresh'),

    # API Endpoints — dual routes to handle DefaultRouter(trailing_slash=False)
    # The non-slash handles list/create (^$)
    # The slashed handles detail/update/delete (^(?P<pk>[^/.]+)$)
    path('api/patients', include('patients.urls')),
    path('api/patients/', include('patients.urls')),

    path('api/appointments', include('appointments.urls')),
    path('api/appointments/', include('appointments.urls')),

    path('api/clinical', include('clinical.urls')),
    path('api/clinical/', include('clinical.urls')),

    path('api/prescriptions', include('prescriptions.urls')),
    path('api/prescriptions/', include('prescriptions.urls')),

    path('api/laboratory', include('laboratory.urls')),
    path('api/laboratory/', include('laboratory.urls')),

    path('api/reports', include('reports.urls')),
    path('api/reports/', include('reports.urls')),

    path('api/attachments', include('attachments.urls')),
    path('api/attachments/', include('attachments.urls')),

    path('api/audit', include('audit.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/queue', include('queue_management.urls')),
    path('api/queue/', include('queue_management.urls')),
    path('api/notifications', include('notifications.urls')),
    path('api/notifications/', include('notifications.urls')),

    # path('api/notifications/', include('notifications.urls'))
]
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
