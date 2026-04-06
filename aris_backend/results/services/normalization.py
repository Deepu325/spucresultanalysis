import re

import pandas as pd

SHEET_KEYS = (
    "COLLEGE TOPPERS",
    "SCIENCE TOPPERS",
    "COMMERCE TOPPERS",
    "SECTION WISE TOPPERS LIST",
    "SECTION WISE",
    "SECTION AND SUBJECT",
    "SUBJECTWISE RESULT ANALYSIS",
)

# Flexible sheet name mapping to handle typos and casing
def find_sheet(workbook, target_key):
    # exact match
    if target_key in workbook:
        return target_key
    # case-insensitive
    workbook_upper = {k.upper(): k for k in workbook.keys()}
    if target_key in workbook_upper:
        return workbook_upper[target_key]
    # partial/typo match (e.g. TOPPPERS)
    tk_clean = target_key.replace(" ", "")
    for k in workbook:
        k_clean = k.upper().replace(" ", "")
        if tk_clean == k_clean:
            return k
        # handle TOPPPERS specifically
        if tk_clean.replace("TOPPERS", "TOPPPERS") == k_clean:
            return k
        if tk_clean == k_clean.replace("TOPPPERS", "TOPPERS"):
            return k
    return None


def base_clean(df):
    df = df.copy()
    cleaned = []
    for i, c in enumerate(df.columns.astype(str).str.strip().str.upper()):
        if c in ("", "NAN", "NONE"):
            cleaned.append(f"__EMPTY_{i}")
        else:
            cleaned.append(c)
    df.columns = cleaned
    return df


def normalize_workbook(raw_data):
    # Return a new dict with normalized SHEET_KEYS as keys
    normalized = {}
    for sk in SHEET_KEYS:
        found = find_sheet(raw_data, sk)
        if found:
            normalized[sk] = base_clean(raw_data[found].copy())
    return normalized


def normalize_name(df):
    df = df.copy()
    if "STUDENT_NAME" in df.columns:
        return df
    if "NAME" in df.columns:
        df.rename(columns={"NAME": "STUDENT_NAME"}, inplace=True)
    elif "STUDENT NAME" in df.columns:
        df.rename(columns={"STUDENT NAME": "STUDENT_NAME"}, inplace=True)
    if "STUDENT_NAME" not in df.columns:
        raise Exception(
            "Missing name column (expected NAME, STUDENT NAME, or STUDENT_NAME)"
        )
    return df


def normalize_total(df):
    df = df.copy()
    if "TOT" in df.columns and "TOTAL" not in df.columns:
        df.rename(columns={"TOT": "TOTAL"}, inplace=True)
    if "TOTAL" not in df.columns:
        raise Exception("Missing TOTAL column")
    return df


def normalize_percentage(df):
    df = df.copy()
    # Check for '%' or 'PERCENTAGE'
    if "PERCENTAGE" not in df.columns:
        if "%" in df.columns:
            df.rename(columns={"%": "PERCENTAGE"}, inplace=True)
        else:
            raise Exception("Missing PERCENTAGE column")
    
    # Clean the percentage values
    pct = pd.to_numeric(
        df["PERCENTAGE"].astype(str).str.replace("%", "", regex=False),
        errors="coerce",
    )
    
    # Scale if they are decimals (e.g., 0.99 for 99%)
    if not pct.empty:
        non_null_pct = pct.dropna()
        if not non_null_pct.empty and non_null_pct.max() <= 1.01:
            pct = pct * 100.0
            
    if pct.isnull().any():
        # Maybe handle rows with no data gracefully later, but for now:
        pass 
    
    df["PERCENTAGE"] = pct
    return df


def _num_cell(x):
    if x == "" or (isinstance(x, float) and pd.isna(x)):
        return 0.0
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def _optional_str_from_row(row, *column_names):
    for col in column_names:
        if col not in row:
            continue
        v = row[col]
        if v is None or (isinstance(v, float) and pd.isna(v)):
            continue
        s = str(v).strip()
        if s and s.lower() != "nan":
            return s
    return ""


def _norm_header_key(k):
    return re.sub(r"[^A-Z0-9]", "", str(k).strip().upper())


# Headers that are never per-paper marks (identity, aggregates, labels).
_RESERVED_MARK_SCAN_NORMS = frozenset(
    {
        "STUDENTNAME",
        "NAME",
        "SECTION",
        "PERCENTAGE",
        "TOTAL",
        "TOT",
        "RESULTCLASS",
        "CLASS",
        "RANK",
        "ROLL",
        "ROLLNO",
        "SLNO",
        "SNO",
        "SERIAL",
        "SRNO",
        "NUMBER",
        "NO",
        "NUM",
        "ID",
        "ADM",
        "ADMISSION",
        "ADMISSIONNO",
        "DOB",
        "DATE",
        "GENDER",
        "PHONE",
        "EMAIL",
        "REMARK",
        "REMARKS",
        "GRADE",
        "GPA",
        "CGPA",
        "PERCENTILE",
        "ATTENDANCE",
        "STATUS",
        "RESULT",
        "DIST",
        "DISTINCTION",
        "MARKS",
        "GRANDTOTAL",
        "GRAND",
        "PLACE",
        "ADDRESS",
        "SUBTOTAL",
        "TOTALMARKS",
        "MAXMARKS",
        "MAXIMUMMARKS",
    }
)


def _coerce_exam_score(v):
    """Parse a per-paper mark (0–200). Handles '95', '95%', '95 / 100', Excel strings."""
    if v is None:
        return None
    try:
        if pd.isna(v):
            return None
    except TypeError:
        pass
    try:
        fv = float(v)
        if fv != fv:
            return None
        if 0 <= fv <= 200:
            return fv
        return None
    except (TypeError, ValueError, OverflowError):
        pass
    if not isinstance(v, str):
        return None
    s = v.strip().replace(",", "")
    if not s or s.lower() in ("nan", "ab", "-", "—", "na", "n/a"):
        return None
    s = s.replace("%", " ").strip()
    m = re.match(r"^(\d+(?:\.\d+)?)", s)
    if not m:
        return None
    try:
        fv = float(m.group(1))
        if 0 <= fv <= 200:
            return fv
    except ValueError:
        return None
    return None


def _format_exam_score(ce):
    if ce is None:
        return ""
    if abs(ce - round(ce)) < 1e-9:
        return str(int(round(ce)))
    t = f"{ce:.2f}".rstrip("0").rstrip(".")
    return t


def _mark_cell_str(v):
    ce = _coerce_exam_score(v)
    if ce is not None:
        return _format_exam_score(ce)
    return ""


def _ordered_mark_scores_for_row(df, row_idx, skip_indices=None, max_scores=4):
    """Subject marks only: left-to-right, never used for language slots."""
    skip = skip_indices or frozenset()
    out = []
    ncols = len(df.columns)
    for icol in range(ncols):
        if len(out) >= max_scores:
            break
        if icol in skip:
            continue
        col = df.columns[icol]
        nk = _norm_header_key(col)
        if not nk or nk.startswith("__EMPTY"):
            continue
        if nk in _RESERVED_MARK_SCAN_NORMS:
            continue
        v = df.iat[row_idx, icol]
        ce = _coerce_exam_score(v)
        if ce is None:
            continue
        s = _format_exam_score(ce)
        if s:
            out.append(s)
    return out


def _distribute_ordered_submarks_only(ordered):
    """Map up to four ordered scores → sub1–sub4 only (no language)."""
    padded = list(ordered[:4]) + ["", "", "", ""]
    return padded[0], padded[1], padded[2], padded[3]


# Norm keys: base_clean uppercases headers; _norm_header_key strips punctuation/spaces.
_LAN1_NORM_SET = frozenset(
    {
        "LAN1",
        "LANI",  # "LAN I" / Roman I
        "LANG1",
        "LANGI",
        "LANGUAGE1",
        "L1",
        "FIRSTLANGUAGE",
        "FIRSTLANG",
        "1STLANGUAGE",
        "1STLANG",
        "FL",
        "PAPER1",
        "PAPERI",  # "Paper I" (Roman)
        "PART1",
        "PARTI",  # "Part I" (Roman) — not PART1 (digit)
    }
)
_LAN2_NORM_SET = frozenset(
    {
        "LAN2",
        "LANII",
        "LANG2",
        "LANGII",
        "LANGUAGE2",
        "L2",
        "SECONDLANGUAGE",
        "SECONDLANG",
        "2NDLANGUAGE",
        "2NDLANG",
        "SL",
        "PAPER2",
        "PAPERII",
        "PART2",
        "PARTII",
    }
)

# First two matching columns (left-to-right) = lan1, lan2 — not used for PCM/Bio cores.
_LANGUAGE_SUBJECT_NORM_SET = frozenset(
    {
        "KHS",
        "KANNADA",
        "SANSKRIT",
        "HINDI",
        "TAMIL",
        "TELUGU",
        "MALAYALAM",
        "URDU",
        "ENGLISH",
        "ENG",
        "FRENCH",
        "GERMAN",
        "LATIN",
        "SPANISH",
        "ARABIC",
        "MARATHI",
        "BENGALI",
        "GUJARATI",
        "PUNJABI",
        "ODIA",
        "ORIYA",
        "KONKANI",
        "NEPALI",
        "ASSAMESE",
        "MANIPURI",
        "BODO",
        "DOGRI",
        "MAITHILI",
        "KASHMIRI",
        "SINDHI",
        "SINHALA",
        "RUSSIAN",
        "CHINESE",
        "JAPANESE",
        "KOREAN",
        "PERSIAN",
        "PALI",
        "PRAKRIT",
        "ABHINAVKANNADA",
        "FUNCTIONALENGLISH",
        "GENERALENGLISH",
        "ADDITIONALENGLISH",
        "OPTIONALENGLISH",
        "OPTIONALKANNADA",
        "OPTIONALHINDI",
        "OPTIONALSANSKRIT",
        "SL",
        "COMENG",
        "COMMENG",
        "COMMUNICATIONENGLISH",
        "COREENGLISH",
        "PROFESSIONALENGLISH",
    }
)

# Commerce / core subjects — never treat as language columns (substring match on norm).
_NON_LANGUAGE_HEADER_SUBSTRINGS = (
    "ACCOUNT",
    "BUSINESS",
    "ECONOMIC",
    "STATISTIC",
    "COMMERCE",
    "MARKETING",
    "FINANCE",
    "COMPANY",
    "CORPORATE",
    "SECRETAR",
    "BANKING",
    "INSURANCE",
    "COSTING",
    "AUDIT",
    "TAXATION",
    "ENTREPRENEUR",
    "MANAGEMENT",
    "ORGANISATION",
    "ORGANIZATION",
    "INFORMATICS",
    "COMPUTER",
    "MATHEMATICS",
    "MATHEMATIC",
    "PHYSICS",
    "CHEMISTRY",
    "BIOLOGY",
    "BOTANY",
    "ZOOLOGY",
    "ELECTRONICS",
    "PSYCHOLOGY",
    "SOCIOLOGY",
    "POLITICAL",
    "HISTORY",
    "GEOGRAPHY",
    "LOGIC",
    "EDUCATION",
    "HOME",
    "NUTRITION",
    "ART",
    "MUSIC",
    "DRAWING",
    "ENVIRONMENTAL",
    "SCIENCE",
    "SOCIAL",
)

_LANGUAGE_NAME_SUBSTRINGS = (
    "ENGLISH",
    "KANNADA",
    "HINDI",
    "SANSKRIT",
    "TAMIL",
    "TELUGU",
    "MALAYALAM",
    "URDU",
    "MARATHI",
    "BENGALI",
    "GUJARATI",
    "PUNJABI",
    "FRENCH",
    "GERMAN",
    "LATIN",
    "ARABIC",
    "NEPALI",
    "ODIA",
    "ORIYA",
    "KONKANI",
    "SINHALA",
    "KASHMIRI",
    "SINDHI",
    "PERSIAN",
    "PALI",
    "PRAKRIT",
    "RUSSIAN",
    "CHINESE",
    "JAPANESE",
    "KOREAN",
    "SPANISH",
    "PORTUGUESE",
    "ITALIAN",
    "GREEK",
    "HEBREW",
    "TURKISH",
    "THAI",
    "VIETNAMESE",
    "BURMESE",
    "KHMER",
    "LAO",
    "INDONESIAN",
    "MALAY",
    "TAGALOG",
    "FILIPINO",
    "DUTCH",
    "SWEDISH",
    "NORWEGIAN",
    "DANISH",
    "FINNISH",
    "POLISH",
    "CZECH",
    "HUNGARIAN",
    "ROMANIAN",
    "BULGARIAN",
    "UKRAINIAN",
    "ASSAMESE",
    "MANIPURI",
    "BODO",
    "DOGRI",
    "MAITHILI",
    "SANTHALI",
    "KURUKH",
    "HO",
    "MUNDARI",
    "WARANG",
    "TULU",
    "KODAVA",
    "COORG",
    "LAMBANI",
    "LAMANI",
    "LAMBAD",
    "BYARI",
    "BEARY",
    "KONKAN",
)


# Abbreviated language column titles (exact norm match only — avoids "ENG" in ENGINEERING).
_LANGUAGE_SHORT_CODE_NORMS = frozenset(
    {
        "KAN",
        "HIN",
        "SAN",
        "TAM",
        "TEL",
        "MAL",
        "URD",
        "MIL",
    }
)


def _norm_looks_like_language_column(nk):
    """True if header norm is a language paper, excluding commerce/science cores."""
    if not nk:
        return False
    if nk in _LANGUAGE_SUBJECT_NORM_SET:
        return True
    if nk in _LANGUAGE_SHORT_CODE_NORMS:
        return True
    for block in _NON_LANGUAGE_HEADER_SUBSTRINGS:
        if block in nk:
            return False
    for stem in _LANGUAGE_NAME_SUBSTRINGS:
        if stem in nk:
            return True
    return False


def extract_language_marks(df, row_idx, commerce_stream=False):
    """
    Detect dedicated language columns only (never subject columns).
    Returns (lan1_str, lan2_str, frozenset(column_indices_to_skip_for_sub_scan)).
    Either both strings are set or both are None.

    commerce_stream: Many II PUC commerce sheets number languages as SUB1/SUB2 and
    cores as SUB3–6. SUB5/SUB6-as-language is disabled for commerce to avoid pairing
    wrong papers; use SUB1/SUB2 fallback instead (see below).
    """
    norm_by_index = [(i, _norm_header_key(c)) for i, c in enumerate(df.columns)]

    def first_index_for_norm(target_norm):
        for i, nk in norm_by_index:
            if nk == target_norm:
                return i
        return None

    def pair_from_indices(i1, i2):
        if i1 is None or i2 is None or i1 == i2:
            return None, None, frozenset()
        v1 = _mark_cell_str(df.iat[row_idx, i1])
        v2 = _mark_cell_str(df.iat[row_idx, i2])
        if v1 and v2:
            return v1, v2, frozenset({i1, i2})
        return None, None, frozenset()

    # Case 1: LAN 1 / LAN 2 style — leftmost column per family, distinct indices
    i1 = None
    for i, nk in norm_by_index:
        if nk in _LAN1_NORM_SET:
            i1 = i
            break
    i2 = None
    if i1 is not None:
        for i, nk in norm_by_index:
            if i == i1:
                continue
            if nk in _LAN2_NORM_SET:
                i2 = i
                break

    v1, v2, used = pair_from_indices(i1, i2)
    if v1 is not None:
        return v1, v2, used

    # Case 2: Science layout K/H/S + English column (ENG or ENGLISH)
    ik = first_index_for_norm("KHS")
    ie = first_index_for_norm("ENG")
    if ie is None:
        ie = first_index_for_norm("ENGLISH")
    v1, v2, used = pair_from_indices(ik, ie)
    if v1 is not None:
        return v1, v2, used

    # Case 3: Named language columns (e.g. ENGLISH, HINDI) or headers containing language
    # stems — commerce-safe (Accountancy / Business / Eco excluded). First two in sheet order.
    lang_ix = []
    for i, nk in norm_by_index:
        if _norm_looks_like_language_column(nk):
            lang_ix.append(i)
    if len(lang_ix) >= 2:
        return pair_from_indices(lang_ix[0], lang_ix[1])

    # Case 4: Fifth/sixth paper slots (lang-last numbering). Not used for commerce_stream
    # — those sheets typically use SUB1/SUB2 for languages (Case 5); SUB5/SUB6 here would
    # mis-label core papers as languages when generic SUB1–6 columns exist.
    if not commerce_stream:
        for key_a, key_b in (
            ("SUB5", "SUB6"),
            ("SUBJECT5", "SUBJECT6"),
            ("SUBJ5", "SUBJ6"),
            ("PAPER5", "PAPER6"),
            ("PART5", "PART6"),
        ):
            ia = first_index_for_norm(key_a)
            ib = first_index_for_norm(key_b)
            v1, v2, used = pair_from_indices(ia, ib)
            if v1 is not None:
                return v1, v2, used

    # Case 5: Commerce — SUB1 & SUB2 as first/second language when a third subject slot exists
    if commerce_stream:
        i1 = first_index_for_norm("SUB1")
        i2 = first_index_for_norm("SUB2")
        i3 = first_index_for_norm("SUB3")
        if i1 is not None and i2 is not None and i3 is not None and i1 < i2 < i3:
            v1, v2, used = pair_from_indices(i1, i2)
            if v1 is not None:
                return v1, v2, used

    return None, None, frozenset()


def _row_norm_value_map(row):
    """First occurrence per normalized header (spaces/punctuation stripped)."""
    m = {}
    for k, v in row.items():
        nk = _norm_header_key(k)
        if nk and nk not in m:
            m[nk] = v
    return m


def _first_mark(norm_map, *norm_keys):
    for nk in norm_keys:
        if nk in norm_map:
            s = _mark_cell_str(norm_map[nk])
            if s:
                return s
    return ""


def _commerce_sub12_are_language_columns(df, lang_skip):
    """True when SUB1 & SUB2 columns were chosen as lan1/lan2 (skip set matches their indices)."""
    if not lang_skip or len(lang_skip) != 2:
        return False
    sub1_i = sub2_i = None
    for i, c in enumerate(df.columns):
        nk = _norm_header_key(c)
        if nk == "SUB1" and sub1_i is None:
            sub1_i = i
        elif nk == "SUB2" and sub2_i is None:
            sub2_i = i
    if sub1_i is None or sub2_i is None:
        return False
    return sub1_i in lang_skip and sub2_i in lang_skip


def _optional_marks_on_item(item, row, df, row_idx, commerce_stream=False):
    nm = _row_norm_value_map(row)

    lan1, lan2, lang_skip = extract_language_marks(
        df, row_idx, commerce_stream=commerce_stream
    )
    if lan1 is not None and lan2 is not None:
        item["lan1"] = lan1
        item["lan2"] = lan2
    else:
        item["lan1"] = None
        item["lan2"] = None

    sub1 = _first_mark(nm, "SUB1", "SUBJECT1", "SUBJ1")
    sub2 = _first_mark(nm, "SUB2", "SUBJECT2", "SUBJ2")
    sub3 = _first_mark(nm, "SUB3", "SUBJECT3", "SUBJ3")
    sub4 = _first_mark(nm, "SUB4", "SUBJECT4", "SUBJ4")

    # Commerce SUB1/SUB2 = languages → four core papers are SUB3–6 (avoid duplicating lang in Subs).
    if commerce_stream and _commerce_sub12_are_language_columns(df, lang_skip):
        sub1 = _first_mark(nm, "SUB3", "SUBJECT3", "SUBJ3")
        sub2 = _first_mark(nm, "SUB4", "SUBJECT4", "SUBJ4")
        sub3 = _first_mark(nm, "SUB5", "SUBJECT5", "SUBJ5")
        sub4 = _first_mark(nm, "SUB6", "SUBJECT6", "SUBJ6")

    # Lang columns present but subjects numbered SUB3–SUB6 only (never treat SUB1–2 as lang)
    if (lan1 is not None) and not (sub1 or sub2 or sub3 or sub4):
        b1 = _first_mark(nm, "SUB3", "SUBJECT3", "SUBJ3")
        b2 = _first_mark(nm, "SUB4", "SUBJECT4", "SUBJ4")
        b3 = _first_mark(nm, "SUB5", "SUBJECT5", "SUBJ5")
        b4 = _first_mark(nm, "SUB6", "SUBJECT6", "SUBJ6")
        if b1 or b2 or b3 or b4:
            sub1, sub2, sub3, sub4 = b1, b2, b3, b4

    sub_explicit_any = bool(sub1 or sub2 or sub3 or sub4)
    if not sub_explicit_any:
        ordered = _ordered_mark_scores_for_row(
            df, row_idx, skip_indices=lang_skip, max_scores=4
        )
        sub1, sub2, sub3, sub4 = _distribute_ordered_submarks_only(ordered)

    for i, val in enumerate((sub1, sub2, sub3, sub4), start=1):
        if val:
            item[f"sub{i}"] = val


def process_toppers(df, commerce_stream=False):
    df = base_clean(df)
    df = normalize_name(df)
    df = normalize_total(df)
    df = normalize_percentage(df)
    df["TOTAL"] = pd.to_numeric(df["TOTAL"], errors="coerce")
    if df["TOTAL"].isnull().any():
        raise Exception("Invalid TOTAL values in toppers sheet")
    df = df.sort_values(
        by="PERCENTAGE", ascending=False, kind="mergesort", ignore_index=True
    )
    out = []
    for row_idx in range(len(df)):
        r = df.iloc[row_idx].to_dict()
        item = {
            "name": r["STUDENT_NAME"],
            "percentage": float(r["PERCENTAGE"]),
            "total": float(r["TOTAL"]),
            "section": _optional_str_from_row(r, "SECTION"),
            "result_class": _optional_str_from_row(
                r, "RESULT_CLASS", "RESULT CLASS", "CLASS"
            ),
        }
        _optional_marks_on_item(
            item, r, df, row_idx, commerce_stream=commerce_stream
        )
        out.append(item)
    return out


def process_section_toppers(df):
    df = base_clean(df)
    df = normalize_name(df)
    df = normalize_percentage(df)
    out = []
    for row_idx in range(len(df)):
        row = df.iloc[row_idx]
        r = row.to_dict()
        rec = {
            "section": row["SECTION"],
            "name": r["STUDENT_NAME"],
            "percentage": float(r["PERCENTAGE"]),
            "total": None,
        }
        if "TOTAL" in df.columns:
            t = row.get("TOTAL")
            if t is not None and not (isinstance(t, float) and pd.isna(t)) and t != "":
                rec["total"] = float(t)
        if "MARKS" in df.columns:
            m = row.get("MARKS")
            if m is not None and not (isinstance(m, float) and pd.isna(m)) and m != "":
                rec["marks"] = float(m)
        rec["result_class"] = _optional_str_from_row(
            r, "RESULT_CLASS", "RESULT CLASS", "CLASS"
        )
        _optional_marks_on_item(rec, r, df, row_idx, commerce_stream=False)
        out.append(rec)
    return out


def _matrix_int(val):
    if val == "" or val is None or (isinstance(val, float) and pd.isna(val)):
        return 0
    try:
        return int(float(val))
    except (TypeError, ValueError):
        return 0


def _matrix_pass_pct(val):
    if val == "" or val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    try:
        s = str(val).replace("%", "").strip()
        if not s:
            return None
        return float(s)
    except (TypeError, ValueError):
        return None


def _norm_section_row_label(val):
    """Collapse whitespace so 'PASS  %' and 'PASS %' match."""
    s = str(val).strip()
    if s.lower() == "nan":
        return ""
    s = re.sub(r"\s+", " ", s)
    return s.upper()


def _section_matrix_cell(label_col, df, col, *row_labels):
    """First column label must match one of row_labels (already uppercased)."""
    for lab in row_labels:
        vals = df.loc[label_col == lab, col].values
        if len(vals) and str(vals[0]).strip() != "":
            return vals[0]
    return None


def _distinction_percentage_for_column(label_col, df, col, appeared_int):
    """Prefer DISTINCTION % row; else (distinction_count / appeared) * 100."""
    v = _section_matrix_cell(
        label_col, df, col, "DISTINCTION %", "DIST %", "DIST%", "DISTINCTION%"
    )
    if v is not None:
        pp = _matrix_pass_pct(v)
        if pp is not None:
            return round(pp, 2)
    v = _section_matrix_cell(
        label_col,
        df,
        col,
        "DISTINCTION COUNT",
        "DISTINCTIONS",
        "NO OF DISTINCTION",
        "DISTINCTION",
    )
    if v is not None and appeared_int > 0:
        cnt = _matrix_int(v)
        if cnt >= 0:
            return round((cnt / float(appeared_int)) * 100.0, 2)
    return 0.0


def process_section_wise(df):
    df = df.fillna("")
    if df.shape[1] < 2:
        raise Exception("SECTION WISE sheet: expected matrix with at least two columns")

    sections = df.columns[1:]
    result = []
    label_col = df.iloc[:, 0].map(_norm_section_row_label)

    for col in sections:
        appeared_raw = _section_matrix_cell(
            label_col, df, col, "APPEARED", "TOTAL APPEARED"
        )
        passed_raw = _section_matrix_cell(label_col, df, col, "PASSED", "NO OF STUDENTS PROMOTED", "STUDENTS PROMOTED")
        pass_raw = _section_matrix_cell(
            label_col,
            df,
            col,
            "PASS %",
            "PASS%",
            "PASS PERCENTAGE",
            "PASS PCT",
            "% PASS",
        )
        if pass_raw is None:
            continue
        pp = _matrix_pass_pct(pass_raw)
        if pp is None:
            continue
        appeared_n = _matrix_int(appeared_raw) if appeared_raw is not None else 0
        passed_n = _matrix_int(passed_raw) if passed_raw is not None else 0
        enrolled_raw = _section_matrix_cell(
            label_col,
            df,
            col,
            "ENROLLED",
            "TOTAL ENROLLED",
            "STUDENTS ENROLLED",
            "NO OF STUDENTS ENROLLED",
            "TOTAL STUDENTS",
        )
        enrolled_n = (
            _matrix_int(enrolled_raw) if enrolled_raw is not None else None
        )
        dist_pct = _distinction_percentage_for_column(label_col, df, col, appeared_n)
        
        # Extract grade distribution counts
        distinction_raw = _section_matrix_cell(label_col, df, col, "DISTINCTION")
        first_class_raw = _section_matrix_cell(label_col, df, col, "FIRST CLASS")
        second_class_raw = _section_matrix_cell(label_col, df, col, "SECOND CLASS")
        pass_class_raw = _section_matrix_cell(label_col, df, col, "PASS CLASS")
        
        distinction_n = _matrix_int(distinction_raw) if distinction_raw is not None else 0
        first_class_n = _matrix_int(first_class_raw) if first_class_raw is not None else 0
        second_class_n = _matrix_int(second_class_raw) if second_class_raw is not None else 0
        pass_class_n = _matrix_int(pass_class_raw) if pass_class_raw is not None else 0
        
        rec = {
            "section": str(col).strip(),
            "appeared": appeared_n,
            "passed": passed_n,
            "pass_percentage": pp,
            "distinction_percentage": dist_pct,
            "distinction": distinction_n,
            "first_class": first_class_n,
            "second_class": second_class_n,
            "pass_class": pass_class_n,
        }
        if enrolled_n is not None:
            rec["enrolled"] = enrolled_n
        
        result.append(rec)
    return result


def process_heatmap(df):
    df = df.fillna("")
    if df.shape[1] < 10:
        raise Exception(
            "SECTION AND SUBJECT sheet: expected at least 10 columns for heatmap parsing"
        )

    data = []
    current_section = None

    for _, row in df.iterrows():
        c0 = row.iloc[0]
        if c0 is not None and str(c0).strip():
            current_section = str(c0).strip()

        subject = row.iloc[1]
        if not subject or not str(subject).strip():
            continue
        
        subject_str = str(subject).strip().upper()
        
        # Skip section total rows (they have names like "TOTAL", "GRAND TOTAL", section total markers)
        if subject_str in ("TOTAL", "GRAND TOTAL", "SUM", "SUBTOTAL"):
            continue
        
        if current_section is None:
            continue
            
        # Don't skip if subject matches section (it might be the first subject)
        # Just skip if it's clearly a total row

        # Extract grade distribution columns (0-indexed: columns 2-8 are indices for grades)
        distinction = _num_cell(row.iloc[2])
        first_class = _num_cell(row.iloc[3])
        second_class = _num_cell(row.iloc[4])
        third_class = _num_cell(row.iloc[5])
        centums = _num_cell(row.iloc[6])
        fail = _num_cell(row.iloc[7])
        discontinued = _num_cell(row.iloc[8])
        
        # Read TOTAL from Excel column (index 9) if available, otherwise calculate
        if len(row) > 9:
            total_from_excel = _num_cell(row.iloc[9])
            if total_from_excel > 0:
                total = total_from_excel
            else:
                # Fallback to calculated total if TOTAL column is empty
                total = distinction + first_class + second_class + third_class + centums + fail + discontinued
        else:
            # Calculate total by summing all grades if no TOTAL column exists
            total = distinction + first_class + second_class + third_class + centums + fail + discontinued
        
        # Skip rows with zero total (empty or invalid data)
        if total == 0:
            continue
        
        passed = distinction + first_class + second_class + third_class
        pass_pct = (passed / total * 100.0) if total else 0.0

        data.append(
            {
                "section": current_section,
                "subject": subject_str,
                "distinction": int(distinction),
                "first_class": int(first_class),
                "second_class": int(second_class),
                "third_class": int(third_class),
                "centums": int(centums),
                "fail": int(fail),
                "discontinued": int(discontinued),
                "total": int(total),
                "pass_percentage": round(pass_pct, 2),
            }
        )

    return data


def process_subject_analysis(df):
    """
    Parse SUBJECTWISE RESULT ANALYSIS sheet
    Pandas reads with first row as headers, so:
    - Column names = Subject names (KAN, ENG, PHY, etc.) OR variants if subjects are missing
    - Row 0 = First metric (Total Students Enrolled) OR variant headers (SCI, COM, TOT)
    - Row 1+ = Other metrics
    """
    df = df.fillna("")
    df = df.reset_index(drop=True)
    
    if df.shape[1] < 2 or df.shape[0] < 1:
        raise Exception(
            "SUBJECTWISE RESULT ANALYSIS sheet: expected at least 2 columns and 1 data row"
        )

    print(f"DEBUG: DataFrame shape: {df.shape}")
    print(f"DEBUG: Column names (subjects?): {df.columns.tolist()[:15]}")
    print(f"DEBUG: Row 0 (data): {df.iloc[0].astype(str).str.strip().tolist()[:15]}")
    print(f"DEBUG: Row 1 (data): {df.iloc[1].astype(str).str.strip().tolist()[:15]}")
    
    # Column names are the subject headers (or variant names if parsing failed)
    col_names = df.columns.astype(str).str.strip()
    col_upper = col_names.astype(str).str.upper().tolist()
    
    # Row 0 of data - check if it's variant headers or metric data
    row_0_upper = df.iloc[0].astype(str).str.strip().str.upper().tolist()
    
    # If row 0 contains variants (SCI, COM, TOT), then column names are actual subjects
    has_variants_in_row0 = any(x in row_0_upper[1:] for x in ["SCI", "COM", "TOT"])
    
    if has_variants_in_row0:
        print(f"DEBUG: Row 0 contains variant headers (SCI/COM/TOT)")
        # Column names are subjects, Row 0 is variants
        subject_row = pd.Series(col_names)
        row_1_variants = row_0_upper
        data_start_row = 1
        has_subheaders = True
    else:
        print(f"DEBUG: Row 0 contains metric data, not variant headers")
        # Column names must be variant names (SCI, COM, TOT repeated)
        # In this case, we've lost the subject names - try to reconstruct
        subject_names = []
        
        # Try to make subject names from the column count
        # Skip first column (metric label)
        num_subjects = (len(col_names) - 1) / 3  # Assume SCI/COM/TOT for each
        if num_subjects == int(num_subjects):
            num_subjects = int(num_subjects)
            for i in range(num_subjects):
                subject_names.append(f"SUBJECT_{i+1}")
        else:
            # Fallback: use column names as-is
            subject_names = list(col_names[1:])
        
        subject_row = pd.Series([""] + subject_names)  # Re-add first empty column
        row_1_variants = col_upper
        data_start_row = 0
        has_subheaders = True
        print(f"DEBUG: Reconstructed subjects: {subject_names}")
    
    # Row labels (metric names)
    label_col = df.iloc[data_start_row:, 0].astype(str).str.strip().str.upper()
    
    # Map metric rows
    metric_mapping = {
        "TOTAL STUDENTS ENROLLED": "enrolled",
        "DISCONTINUED/ABSENT": "discontinued",
        "TOTAL APPEARED": "appeared",
        "DISTINCTION": "distinction",
        "FIRST CLASS": "first_class",
        "SECOND CLASS": "second_class",
        "PASS CLASS": "pass_class",
        "DETAINED": "detained",
        "NO OF STUDENTS PROMOTED": "promoted",
        "NO. OF CENTUMS": "centums",
        "PASS PERCENTAGE": "pass_percentage"
    }
    
    result = []
    
    if not has_subheaders:
        # Simple case: subjects with single values
        for col_idx in range(1, len(subject_row)):
            subject_name = subject_row.iloc[col_idx]
            if not subject_name or subject_name.lower() == "nan":
                continue
            
            subject_data = {"subject": subject_name, "pass_percentage": 0}
            
            for row_idx in range(data_start_row, len(df)):
                metric = label_col.iloc[row_idx - data_start_row]
                value = df.iat[row_idx, col_idx]
                
                for metric_key, data_key in metric_mapping.items():
                    if metric_key in metric:
                        parsed_val = _matrix_pass_pct(value) if "PERCENTAGE" in metric_key else _num_cell(value)
                        subject_data[data_key] = parsed_val if data_key != "pass_percentage" else (parsed_val or 0)
                        break
            
            result.append(subject_data)
    else:
        # Complex case: subjects with SCI/COM/TOT variants OR mixed single columns
        col_idx = 1
        while col_idx < len(subject_row):
            subject_name = subject_row.iloc[col_idx]
            if not subject_name or subject_name.lower() == "nan":
                col_idx += 1
                continue
            
            print(f"DEBUG: Processing subject '{subject_name}' at col_idx={col_idx}")
            
            # Determine variant structure (SCI, COM, TOT)
            # Check if this subject has variants or is a single column
            subheader_sci = row_1_variants[col_idx] if col_idx < len(row_1_variants) else ""
            subheader_com = row_1_variants[col_idx + 1] if col_idx + 1 < len(row_1_variants) else ""
            subheader_tot = row_1_variants[col_idx + 2] if col_idx + 2 < len(row_1_variants) else ""
            
            has_sci = "SCI" in str(subheader_sci)
            has_com = "COM" in str(subheader_com)
            has_tot = "TOT" in str(subheader_tot)
            
            print(f"DEBUG:   subheader_sci='{subheader_sci}', subheader_com='{subheader_com}', subheader_tot='{subheader_tot}'")
            print(f"DEBUG:   has_sci={has_sci}, has_com={has_com}, has_tot={has_tot}")
            
            subject_data = {"subject": subject_name}
            variants = {}
            
            # Check if this is a single-column subject (no variants)
            if not (has_sci or has_com or has_tot):
                print(f"DEBUG:   Single-column subject (no variants)")
                # Single column subject - read it as a single value
                variant_data = {}
                
                for row_idx in range(data_start_row, len(df)):
                    metric = label_col.iloc[row_idx - data_start_row]
                    value = df.iat[row_idx, col_idx]
                    
                    for metric_key, data_key in metric_mapping.items():
                        if metric_key in metric:
                            parsed_val = _matrix_pass_pct(value) if "PERCENTAGE" in metric_key else _num_cell(value)
                            variant_data[data_key] = parsed_val
                            if data_key == "pass_percentage":
                                subject_data["pass_percentage"] = parsed_val or 0
                            break
                
                subject_data.update(variant_data)
                result.append(subject_data)
                col_idx += 1  # Move to next column
                continue
            
            # Extract data for each variant
            for variant_idx, variant_key in enumerate(["science", "commerce", "total"]):
                if variant_idx == 0 and not has_sci:
                    continue
                if variant_idx == 1 and not has_com:
                    continue
                if variant_idx == 2 and not has_tot:
                    continue
                
                col_to_read = col_idx + variant_idx
                variant_data = {}
                pass_pct = 0
                
                for row_idx in range(data_start_row, len(df)):
                    metric = label_col.iloc[row_idx - data_start_row]
                    value = df.iat[row_idx, col_to_read]
                    
                    for metric_key, data_key in metric_mapping.items():
                        if metric_key in metric:
                            parsed_val = _matrix_pass_pct(value) if "PERCENTAGE" in metric_key else _num_cell(value)
                            variant_data[data_key] = parsed_val
                            if data_key == "pass_percentage":
                                pass_pct = parsed_val or 0
                            break
                
                variants[variant_key] = variant_data
            
            # Determine overall pass_percentage (prefer total, then average)
            if "total" in variants:
                subject_data["pass_percentage"] = variants["total"].get("pass_percentage", 0)
            elif variants:
                pcts = [v.get("pass_percentage", 0) for v in variants.values()]
                subject_data["pass_percentage"] = sum(pcts) / len(pcts) if pcts else 0
            
            subject_data["variants"] = variants if len(variants) > 1 else None
            
            # If single variant, flatten the data to top level
            if len(variants) == 1:
                variant_key = list(variants.keys())[0]
                subject_data.update(variants[variant_key])
            elif len(variants) > 1 and "total" in variants:
                # If multiple variants, prefer total variant's data at top level
                subject_data.update(variants["total"])
                # But preserve the pass_percentage average we calculated above
                pass_pct_avg = subject_data["pass_percentage"]
                subject_data.update(variants["total"])
                subject_data["pass_percentage"] = pass_pct_avg
            elif len(variants) > 1:
                # Fallback: average all metric values from variants
                metric_keys = ["enrolled", "appeared", "discontinued", "distinction", "first_class", "second_class", "pass_class", "detained", "promoted", "centums"]
                for key in metric_keys:
                    values = [v.get(key, 0) for v in variants.values() if key in v]
                    if values:
                        subject_data[key] = sum(values) / len(values)
            
            result.append(subject_data)
            
            # Move to next subject (skip the variant columns)
            col_idx += 3 if (has_sci and has_com and has_tot) else 1
    
    return result


def normalize_all(data):
    return {
        "toppers": {
            "college": process_toppers(data["COLLEGE TOPPERS"]),
            "science": process_toppers(data["SCIENCE TOPPERS"]),
            "commerce": process_toppers(
                data["COMMERCE TOPPERS"], commerce_stream=True
            ),
            "section": process_section_toppers(data["SECTION WISE TOPPERS LIST"]),
        },
        "sections": process_section_wise(data["SECTION WISE"]),
        "heatmap": process_heatmap(data["SECTION AND SUBJECT"]),
        "subjects": process_subject_analysis(data["SUBJECTWISE RESULT ANALYSIS"]),
        "exam": {},
    }
