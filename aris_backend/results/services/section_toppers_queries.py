"""Backend grouping for Section Toppers — summary (1 per section) and detailed (top 10 per section)."""

import json

import pandas as pd


def _records_json_safe(records):
    if not records:
        return records
    return json.loads(pd.DataFrame(records).to_json(orient="records", default_handler=str))


def section_toppers_grouped(records):
    """
    One highest-percentage student per section.
    Sorted by percentage descending for presentation (insight uses first row).
    """
    if not records:
        return []
    df = pd.DataFrame(records)
    df["PERCENTAGE"] = df["percentage"].astype(float)
    grouped = (
        df.sort_values("percentage", ascending=False)
        .groupby("section", sort=False)
        .head(1)
        .reset_index(drop=True)
    )
    out = grouped.to_dict(orient="records")
    out.sort(key=lambda r: float(r["percentage"]), reverse=True)
    return _records_json_safe(out)


def section_toppers_top10_by_section(records):
    """
    Top 10 students per section, grouped by section key (string).
    """
    if not records:
        return {}
    df = pd.DataFrame(records)
    df["PERCENTAGE"] = df["percentage"].astype(float)
    df = df.sort_values(["section", "percentage"], ascending=[True, False])
    result = {}
    for section, group in df.groupby("section", sort=True):
        chunk = group.head(10).to_dict(orient="records")
        result[str(section)] = _records_json_safe(chunk)
    return result
