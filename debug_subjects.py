#!/usr/bin/env python
import sys
import pandas as pd
sys.path.insert(0, 'aris_backend')

from results.services.normalization import process_subject_analysis

file_path = r'd:\SPUC-ARIS\spuc FINAL RESULT SHEET.xlsx'
df = pd.read_excel(file_path, sheet_name='SUBJECTWISE RESULT ANALYSIS', header=None)

print(f'DataFrame shape: {df.shape}')
print(f'\nFull first 3 rows:')
print(df.iloc[:3])
print()

# Show the structure
print(f'Header row (row 0): {df.iloc[0].tolist()[:15]}...')
print(f'Subheader row (row 1): {df.iloc[1].tolist()[:15]}...')
print()

# Try to process it
try:
    result = process_subject_analysis(df)
    print(f'✓ Processed successfully!')
    print(f'Number of subjects: {len(result)}')
    for subj in result[:5]:
        print(f"  - {subj['subject']}: {subj.get('enrolled', 0)} enrolled, {subj.get('pass_percentage', 0)} pass%")
except Exception as e:
    print(f'✗ Error: {e}')
    import traceback
    traceback.print_exc()
