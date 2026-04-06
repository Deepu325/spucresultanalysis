from threading import Lock

store_lock = Lock()

store = {
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
        "section": []
    },
    "sections": [],
    "heatmap": [],
    "subjects": []
}
