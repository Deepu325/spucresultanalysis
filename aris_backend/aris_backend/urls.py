from django.urls import path, include

urlpatterns = [
    path('', include('results.urls')),
]
