import requests
import os

url = "http://127.0.0.1:8000/api/upload/"
file_path = r"d:\SPUC-ARIS\spuc FINAL RESULT SHEET.xlsx"

if os.path.exists(file_path):
    try:
        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(url, files=files)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error during upload: {e}")
else:
    print(f"File not found: {file_path}")
