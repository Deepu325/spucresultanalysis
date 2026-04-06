import pandas as pd

def parse_excel(file_obj):
    try:
        raw_data = pd.read_excel(file_obj, sheet_name=None)
        return raw_data
    except Exception as e:
        raise Exception(f"Invalid or corrupted Excel file: {str(e)}")
