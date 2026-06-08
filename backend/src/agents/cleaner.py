"""
Data Cleaner Agent
──────────────────
Responsibilities:
  • Standardise column names → snake_case.
  • Parse date-like string columns to datetime.
  • Coerce numeric-ish object columns to numbers.
  • Handle missing values:
      - Drop columns that are > 60 % null.
      - Drop rows that are > 50 % null.
      - Impute remaining nulls:
          · Numeric  → median (robust to outliers).
          · Categorical → mode (most-frequent value).
  • Remove duplicate rows.
  • Detect and clip outliers using the IQR method on numeric columns.
  • Log every transformation applied.
"""

import re
import pandas as pd
import numpy as np
from typing import Dict, Any, List

from src.core.state import AnalystState


# ─── Thresholds ──────────────────────────────────────────────────────────────
COL_NULL_THRESHOLD = 0.60   # drop column if > 60 % nulls
ROW_NULL_THRESHOLD = 0.50   # drop row   if > 50 % nulls
IQR_MULTIPLIER     = 1.5    # standard IQR fence multiplier


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _to_snake_case(name: str) -> str:
    """Convert a column name to snake_case."""
    name = re.sub(r"[^\w\s]", "", str(name))          # remove punctuation
    name = re.sub(r"\s+", "_", name.strip())           # spaces → underscore
    name = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", name)
    name = re.sub(r"([a-z\d])([A-Z])", r"\1_\2", name)
    return name.lower()


def _standardise_columns(df: pd.DataFrame, log: List[str]) -> pd.DataFrame:
    """Rename columns to snake_case and strip whitespace from values."""
    original = list(df.columns)
    df.columns = [_to_snake_case(c) for c in df.columns]
    renamed = [f"'{o}' -> '{n}'" for o, n in zip(original, df.columns) if o != n]
    if renamed:
        log.append(f"Renamed columns: {'; '.join(renamed)}")
    # Strip leading/trailing whitespace from string cells
    str_cols = df.select_dtypes(include="object").columns
    for col in str_cols:
        df[col] = df[col].str.strip()
    return df


def _parse_datetimes(df: pd.DataFrame, log: List[str]) -> pd.DataFrame:
    """Try to convert object columns that look like dates to datetime."""
    date_keywords = ("date", "time", "year", "month", "day", "dt", "timestamp")
    for col in df.select_dtypes(include="object").columns:
        if any(kw in col.lower() for kw in date_keywords):
            try:
                parsed = pd.to_datetime(df[col], infer_datetime_format=True, errors="coerce")
                if parsed.notna().sum() > len(df) * 0.5:   # accept if >50 % parsed
                    df[col] = parsed
                    log.append(f"Column '{col}' converted to datetime.")
            except Exception:
                pass
    return df


def _coerce_numeric_objects(df: pd.DataFrame, log: List[str]) -> pd.DataFrame:
    """
    For object columns where > 70 % of values can be cast to float,
    coerce the entire column to numeric (non-parseable → NaN).
    """
    for col in df.select_dtypes(include="object").columns:
        coerced = pd.to_numeric(df[col], errors="coerce")
        hit_rate = coerced.notna().sum() / max(len(df), 1)
        if hit_rate >= 0.70:
            df[col] = coerced
            log.append(f"Column '{col}' coerced to numeric (hit rate {hit_rate:.0%}).")
    return df


def _drop_high_null_columns(df: pd.DataFrame, log: List[str]) -> pd.DataFrame:
    null_ratio = df.isnull().mean()
    to_drop = null_ratio[null_ratio > COL_NULL_THRESHOLD].index.tolist()
    if to_drop:
        df = df.drop(columns=to_drop)
        log.append(f"Dropped {len(to_drop)} high-null columns (>{COL_NULL_THRESHOLD:.0%} nulls): {to_drop}")
    return df


def _drop_high_null_rows(df: pd.DataFrame, log: List[str]) -> pd.DataFrame:
    n_before = len(df)
    threshold = int(len(df.columns) * ROW_NULL_THRESHOLD)
    df = df.dropna(thresh=len(df.columns) - threshold)
    n_dropped = n_before - len(df)
    if n_dropped:
        log.append(f"Dropped {n_dropped} rows with >{ROW_NULL_THRESHOLD:.0%} missing values.")
    return df


def _impute_missing(df: pd.DataFrame, log: List[str]) -> pd.DataFrame:
    """Impute remaining nulls: median for numeric, mode for categorical."""
    numeric_cols = df.select_dtypes(include="number").columns
    cat_cols     = df.select_dtypes(include=["object", "category"]).columns

    for col in numeric_cols:
        n_null = int(df[col].isnull().sum())
        if n_null:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            log.append(f"Imputed {n_null} nulls in '{col}' with median ({median_val:.4g}).")

    for col in cat_cols:
        n_null = int(df[col].isnull().sum())
        if n_null:
            mode_val = df[col].mode(dropna=True)
            if not mode_val.empty:
                df[col] = df[col].fillna(mode_val[0])
                log.append(f"Imputed {n_null} nulls in '{col}' with mode ('{mode_val[0]}').")
            else:
                df[col] = df[col].fillna("Unknown")
                log.append(f"Imputed {n_null} nulls in '{col}' with 'Unknown' (no mode found).")

    return df


def _remove_duplicates(df: pd.DataFrame, log: List[str]) -> pd.DataFrame:
    n_before = len(df)
    df = df.drop_duplicates()
    n_dropped = n_before - len(df)
    if n_dropped:
        log.append(f"Removed {n_dropped} duplicate rows.")
    return df


def _clip_outliers_iqr(df: pd.DataFrame, log: List[str]) -> pd.DataFrame:
    """
    Clip numeric values that fall beyond the IQR fences.
    Only applied to columns with a meaningful spread (IQR > 0).
    """
    numeric_cols = df.select_dtypes(include="number").columns
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        lower = q1 - IQR_MULTIPLIER * iqr
        upper = q3 + IQR_MULTIPLIER * iqr
        n_outliers = int(((df[col] < lower) | (df[col] > upper)).sum())
        if n_outliers:
            df[col] = df[col].clip(lower=lower, upper=upper)
            log.append(
                f"Clipped {n_outliers} outliers in '{col}' "
                f"to [{lower:.4g}, {upper:.4g}] (IQR method)."
            )
    return df


# ─── Main node ────────────────────────────────────────────────────────────────

def cleaner_node(state: AnalystState) -> Dict[str, Any]:
    """
    Data Cleaner Node.

    Applies a systematic sequence of cleaning steps and returns
    the cleaned DataFrame + a detailed cleaning log.
    """
    print("\n========== CLEANER AGENT ==========")

    df = state.get("dataset")
    if df is None:
        msg = "[CLEANER] No dataset found in state."
        print(msg)
        return {
            "error_count": state.get("error_count", 0) + 1,
            "error_log": state.get("error_log", []) + [msg],
        }

    df = df.copy()
    log: List[str] = list(state.get("cleaning_log", []))

    n_before = df.shape

    # ── Step 1: Standardise column names ─────────────────────────────────────
    df = _standardise_columns(df, log)

    # ── Step 2: Parse datetime columns ───────────────────────────────────────
    df = _parse_datetimes(df, log)

    # ── Step 3: Coerce numeric-looking object columns ─────────────────────────
    df = _coerce_numeric_objects(df, log)

    # ── Step 4: Drop columns with too many nulls ──────────────────────────────
    df = _drop_high_null_columns(df, log)

    # ── Step 5: Drop rows with too many nulls ─────────────────────────────────
    df = _drop_high_null_rows(df, log)

    # ── Step 6: Impute remaining missing values ───────────────────────────────
    df = _impute_missing(df, log)

    # ── Step 7: Remove duplicates ─────────────────────────────────────────────
    df = _remove_duplicates(df, log)

    # ── Step 8: Clip outliers ─────────────────────────────────────────────────
    df = _clip_outliers_iqr(df, log)

    n_after = df.shape
    log.append(
        f"Cleaning complete: {n_before[0]} x {n_before[1]} -> "
        f"{n_after[0]} x {n_after[1]}."
    )
    print(f"[CLEANER] {n_before[0]}x{n_before[1]} -> {n_after[0]}x{n_after[1]}")
    print(f"[CLEANER] Applied {len(log)} cleaning operations.")

    return {
        "dataset": df,
        "cleaning_log": log,
        "error_count": 0,
    }
