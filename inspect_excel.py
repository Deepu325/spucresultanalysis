import pandas as pd
import os

file_path = r"d:\SPUC-ARIS\spuc FINAL RESULT SHEET.xlsx"

if os.path.exists(file_path):
    try:
        # Load the excel file
        # We'll check the first few rows of each sheet
        xl = pd.ExcelFile(file_path)
        print(f"Sheets: {xl.sheet_names}")
        # Inspect topper sheets specifically (case-insensitive)
        topper_targets = ["COLLEGE TOPPERS", "SCIENCE TOPPERS", "COMMERCE TOPPERS", "SECTION WISE TOPPERS LIST"]
        sheet_map = {s.upper(): s for s in xl.sheet_names}
        
        for target in topper_targets:
            # Check for close matches or exact upper matches
            found = None
            if target in sheet_map:
                found = sheet_map[target]
            else:
                # Try partial match or double-letter handle
                target_clean = target.replace(" ", "")
                for s in xl.sheet_names:
                    if target_clean in s.upper().replace(" ", ""):
                        found = s
                        break
            
            if found:
                df = pd.read_excel(file_path, sheet_name=found, nrows=5)
                print(f"\nSheet: {found} (Matched: {target})")
                print(f"Columns: {df.columns.tolist()}")
                print(df.head())
            else:
                print(f"\nSheet matching '{target}' not found.")
    except Exception as e:
        print(f"Error reading excel: {e}")
else:
    print(f"File not found: {file_path}")
