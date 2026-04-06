from django.urls import path
from . import views

urlpatterns = [
    path('api/upload/', views.upload_file),
    path('api/clear/', views.clear_data),
    path('api/status/', views.get_status),

    path('api/toppers/college/', views.get_college_toppers),
    path('api/toppers/science/', views.get_science_toppers),
    path('api/toppers/commerce/', views.get_commerce_toppers),
    path('api/toppers/section/', views.get_section_toppers),
    path('api/section-toppers/grouped/', views.get_section_toppers_grouped),
    path('api/section-toppers/top10/', views.get_section_toppers_top10),

    path('api/sections/', views.get_sections),
    path('api/heatmap/', views.get_heatmap),
    path('api/subjects/', views.get_subjects),
]
