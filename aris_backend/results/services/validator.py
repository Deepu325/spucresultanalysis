from .normalization import SHEET_KEYS, normalize_name, normalize_total, normalize_percentage


TOPPER_SHEETS = (
    "COLLEGE TOPPERS",
    "SCIENCE TOPPERS",
    "COMMERCE TOPPERS",
)

OPTIONAL_COLUMNS = {
    "SECTION WISE TOPPERS LIST": ["MARKS", "TOTAL", "TOT"],
}


def _validate_topper_sheet(df, sheet):
    if df.empty:
        raise Exception(f"Validation Failed: Empty dataset in sheet '{sheet}'")
    try:
        d = normalize_name(df.copy())
        d = normalize_total(d)
        
        # Handle RES -> RESULT for toppers
        if "RESULT" not in d.columns and "RES" in d.columns:
            d.rename(columns={"RES": "RESULT"}, inplace=True)
            
        # Normalize percentage before checking existence
        d = normalize_percentage(d)
    except Exception as e:
        msg = str(e)
        if not msg.startswith("Validation Failed"):
            raise Exception(f"Validation Failed: {msg}") from e
        raise
    if "PERCENTAGE" not in d.columns:
        raise Exception(
            f"Validation Failed: Missing required column 'PERCENTAGE' in '{sheet}' sheet"
        )


def _validate_section_topper_list(df):
    if df.empty:
        raise Exception(
            "Validation Failed: Empty dataset in sheet 'SECTION WISE TOPPERS LIST'"
        )
    try:
        d = normalize_name(df.copy())
        # Normalize percentage before checking existence
        d = normalize_percentage(d)
    except Exception as e:
        msg = str(e)
        if not msg.startswith("Validation Failed"):
            raise Exception(f"Validation Failed: {msg}") from e
        raise
    if "SECTION" not in d.columns:
        raise Exception(
            "Validation Failed: Missing required column 'SECTION' in 'SECTION WISE TOPPERS LIST' sheet"
        )
    if "PERCENTAGE" not in d.columns:
        raise Exception(
            "Validation Failed: Missing required column 'PERCENTAGE' in 'SECTION WISE TOPPERS LIST' sheet"
        )


def _validate_matrix_sheet(df, sheet, min_cols):
    if df.empty:
        raise Exception(f"Validation Failed: Empty dataset in sheet '{sheet}'")
    if df.shape[1] < min_cols:
        raise Exception(
            f"Validation Failed: Sheet '{sheet}' must have at least {min_cols} columns"
        )


def validate_excel(workbook):
    for sheet in SHEET_KEYS:
        if sheet not in workbook:
            raise Exception(f"Validation Failed: Missing sheet '{sheet}'")

        df = workbook[sheet]

        if sheet in TOPPER_SHEETS:
            _validate_topper_sheet(df, sheet)
        elif sheet == "SECTION WISE TOPPERS LIST":
            _validate_section_topper_list(df)
        elif sheet == "SECTION WISE":
            _validate_matrix_sheet(df, sheet, min_cols=2)
        elif sheet == "SECTION AND SUBJECT":
            _validate_matrix_sheet(df, sheet, min_cols=10)
        elif sheet == "SUBJECTWISE RESULT ANALYSIS":
            _validate_matrix_sheet(df, sheet, min_cols=2)
