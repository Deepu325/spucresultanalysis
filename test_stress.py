import os
import sys
import pandas as pd
import io

sys.path.append("d:/SPUC-ARIS/aris_backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aris_backend.settings")

from results.services.excel_parser import parse_excel
from results.services.validator import validate_excel
from results.services.processor import normalize_and_clean, process_data


def _section_wise_df(appeared, passed, pass_pct_cells):
    """Matrix: row labels in col 0, one section column with values."""
    return pd.DataFrame(
        {
            "LABEL": ["APPEARED", "PASSED", "PASS %"],
            "SEC-A": [appeared[0], passed[0], pass_pct_cells[0]],
        }
    )


def _subjectwise_df(pass_row):
    return pd.DataFrame({"LABEL": ["PASS %"], "MATH": [pass_row[0]], "PHY": [pass_row[1]]})


def _heatmap_df(rows):
    cols = [f"c{i}" for i in range(10)]
    return pd.DataFrame(rows, columns=cols)


def create_excel_with_data(sheets_data):
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        for sheet_name, df in sheets_data.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    output.seek(0)
    output.name = "test.xlsx"
    return output


def run_test(name, sheets_data, should_pass=True):
    print(f"\n--- Running {name} ---")
    try:
        file_obj = create_excel_with_data(sheets_data)
        raw_data = parse_excel(file_obj)
        cleaned = normalize_and_clean(raw_data)
        validate_excel(cleaned)
        processed = process_data(cleaned)

        if should_pass:
            print("PASSED (as expected)")
            return processed
        print("TEST FAILED: Expected fail but it passed!")
    except Exception as e:
        if not should_pass:
            print(f"PASSED (Failed as expected: {str(e)})")
        else:
            print(f"TEST FAILED: Expected success but failed: {str(e)}")


valid_data = {
    "COLLEGE TOPPERS": pd.DataFrame(
        {"Student Name": ["A"], "Percentage": [90], "Total": [600]}
    ),
    "SCIENCE TOPPERS": pd.DataFrame(
        {"Student Name": ["A"], "Percentage": [90], "Total": [600]}
    ),
    "COMMERCE TOPPERS": pd.DataFrame(
        {"Student Name": ["B"], "Percentage": [80], "Total": [500]}
    ),
    "SECTION WISE TOPPERS LIST": pd.DataFrame(
        {"Section": ["A"], "Student Name": ["A"], "Percentage": [90]}
    ),
    "SECTION WISE": _section_wise_df([100], [95], ["95%"]),
    "SECTION AND SUBJECT": _heatmap_df(
        [["SEC-A", "MATH", 10, 20, 5, 5, 0, 0, 0, 100]]
    ),
    "SUBJECTWISE RESULT ANALYSIS": _subjectwise_df(["90%", "85%"]),
}

# TEST 1
test1_data = {k: v.copy() for k, v in valid_data.items()}
test1_data["SECTION WISE "] = test1_data.pop("SECTION WISE")
run_test("TEST 1: Sheet Name Attack ('SECTION WISE ')", test1_data, should_pass=False)

# TEST 2 — matrix too narrow
test2_data = {k: v.copy() for k, v in valid_data.items()}
test2_data["SECTION WISE"] = pd.DataFrame({"LABEL": ["APPEARED"]})
run_test("TEST 2: Matrix with only one column", test2_data, should_pass=False)

# TEST 3
test3_data = {k: v.copy() for k, v in valid_data.items()}
test3_data["SECTION WISE"] = pd.DataFrame(
    {
        "LABEL": ["APPEARED", "PASSED", "PASS %"],
        "A": [100, 85, "85 %"],
        "B": [100, 90, " 90%"],
        "C": [100, 88, "88.5 %"],
    }
)
res3 = run_test("TEST 3: Dirty Pass % in matrix", test3_data, should_pass=True)
if res3:
    vals = [x["pass_percentage"] for x in res3.get("sections", [])]
    print(f"   Converted values: {vals}")
    if vals == [85.0, 90.0, 88.5]:
        print("   Dirty percentages parsed OK")
    else:
        print("   Dirty percentages mismatch")

# TEST 4
test4_data = {k: v.copy() for k, v in valid_data.items()}
test4_data["SECTION WISE"] = pd.DataFrame(
    {
        "LABEL": ["APPEARED", "PASSED", "PASS %"],
        "A": [100, 95, "95%"],
        "B": [None, None, None],
    }
)
res4 = run_test("TEST 4: Matrix with blank column", test4_data, should_pass=True)
if res4:
    print(f"   Section rows: {len(res4.get('sections', []))}")

# TEST 5
test5_data = {k: v.copy() for k, v in valid_data.items()}
test5_data["COLLEGE TOPPERS"] = pd.DataFrame(
    {"Student Name": ["A", "B"], "Percentage": [90, "N/A"], "Total": [600, 500]}
)
run_test("TEST 5: Wrong Data Type (N/A)", test5_data, should_pass=False)
