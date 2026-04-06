from .normalization import normalize_all, normalize_workbook


def normalize_and_clean(raw_data):
    return normalize_workbook(raw_data)


def process_data(workbook):
    return normalize_all(workbook)


def validate_store_output(store):
    required_keys = ["toppers", "sections", "heatmap", "subjects"]

    for key in required_keys:
        if key not in store:
            raise Exception(f"Missing key in store: {key}")

    if not isinstance(store["toppers"]["college"], list):
        raise Exception("Invalid toppers.college format")

    for item in store["toppers"]["college"]:
        if "name" not in item:
            raise Exception("Missing name in college toppers")
        if "percentage" not in item:
            raise Exception("Missing percentage in college toppers")
        if "total" not in item:
            raise Exception("Missing total in college toppers")
