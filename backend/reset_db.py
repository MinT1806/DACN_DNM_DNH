import urllib.request, json, time

BASE = "http://localhost:8080"

def get_token():
    req = urllib.request.Request(
        f"{BASE}/api/auth/login",
        data=json.dumps({"username": "admin", "password": "admin123"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
        return data["data"]["token"]

def api_post(path, token, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())

print("=== RESETTING DATABASE ===")
token = get_token()
print(f"Logged in as admin")

try:
    print("Calling DELETE /api/admin/reset/all...")
    result = api_post("/api/admin/reset/all", token)
    print(f"Result: {result}")
except Exception as e:
    print(f"Error: {e}")
    print("Reset endpoint failed. Will try direct approach.")
