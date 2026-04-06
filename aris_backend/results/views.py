from rest_framework.decorators import api_view, csrf_exempt
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime

from .services.excel_parser import parse_excel
from .services.processor import normalize_and_clean, process_data, validate_store_output
from .services.validator import validate_excel
from .store import store, store_lock
from .services.section_toppers_queries import (
    section_toppers_grouped,
    section_toppers_top10_by_section,
)

@csrf_exempt
@api_view(['POST'])
def upload_file(request):
    file = request.FILES.get('file')

    if not file:
        return Response({"error": "No file uploaded"}, status=400)

    if not file.name.endswith('.xlsx'):
        return Response({"error": "Invalid file type. Only .xlsx files are supported."}, status=400)

    try:
        # 1. Parse Excel
        raw_data = parse_excel(file)
        
        # 2 + 3. Clean strings (strip) + Normalize case
        cleaned_data = normalize_and_clean(raw_data)
        
        # 4. Validate structure
        try:
            validate_excel(cleaned_data)
        except Exception as e:
            # Human-readable column/sheet errors
            return Response({"error": str(e)}, status=400)
            
        # 5 + 6. Validate types + Process + convert
        try:
            processed = process_data(cleaned_data)
        except Exception as e:
            # Human-readable data type/range errors
            return Response({"error": f"Data Integrity Error: {str(e)}"}, status=400)
        
        # 7. FINAL OUTPUT VALIDATION
        validate_store_output(processed)

        # 8. Store overwrite
        with store_lock:
            store.clear()
            store.update({
                "metadata": {
                    "filename": file.name,
                    "last_updated": datetime.now().strftime("%b %d, %I:%M %p"),
                    "summary": {
                        "toppers": len(processed["toppers"].get("college", [])),
                        "sections": len(processed.get("sections", [])),
                        "subjects": len(processed.get("subjects", []))
                    }
                },
                "exam": processed.get("exam", {}),
                "toppers": {
                    "college": processed["toppers"].get("college", []),
                    "science": processed["toppers"].get("science", []),
                    "commerce": processed["toppers"].get("commerce", []),
                    "section": processed["toppers"].get("section", []),
                },
                "sections": processed.get("sections", []),
                "heatmap": processed.get("heatmap", []),
                "subjects": processed.get("subjects", []),
            })

        return Response({
            "message": "Upload successful",
            "summary": store["metadata"]["summary"]
        }, status=200)

    except Exception as e:
        return Response({"error": f"Unexpected error: {str(e)}"}, status=400)

@api_view(['GET'])
def get_status(request):
    if not store["metadata"]["filename"]:
        return Response({
            "status": "empty",
            "message": "No data uploaded yet"
        }, status=200)

    return Response(store["metadata"])

@api_view(['GET'])
def get_college_toppers(request):
    return Response(store["toppers"]["college"])

@api_view(['GET'])
def get_science_toppers(request):
    return Response(store["toppers"]["science"])

@api_view(['GET'])
def get_commerce_toppers(request):
    return Response(store["toppers"]["commerce"])

@api_view(['GET'])
def get_section_toppers(request):
    return Response(store["toppers"]["section"])


@api_view(["GET"])
def get_section_toppers_grouped(request):
    with store_lock:
        rows = list(store["toppers"]["section"])
    return Response(section_toppers_grouped(rows))


@api_view(["GET"])
def get_section_toppers_top10(request):
    with store_lock:
        rows = list(store["toppers"]["section"])
    return Response(section_toppers_top10_by_section(rows))

@api_view(['GET'])
def get_sections(request):
    return Response(store["sections"])

@api_view(['GET'])
def get_heatmap(request):
    return Response(store["heatmap"])

@api_view(['GET'])
def get_subjects(request):
    return Response(store["subjects"])

@csrf_exempt
@api_view(['POST'])
def clear_data(request):
    """Clear all stored results and reset to empty state"""
    with store_lock:
        store.clear()
        store.update({
            "metadata": {
                "filename": None,
                "last_updated": None,
                "summary": {
                    "toppers": 0,
                    "sections": 0,
                    "subjects": 0
                }
            },
            "exam": {},
            "toppers": {
                "college": [],
                "science": [],
                "commerce": [],
                "section": [],
            },
            "sections": [],
            "heatmap": [],
            "subjects": [],
        })
    return Response({"message": "All data cleared successfully"}, status=200)
