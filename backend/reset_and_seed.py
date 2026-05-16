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
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())

print("=== STEP 1: GET TOKEN ===")
token = get_token()
print(f"Token: {token[:50]}...")

print("\n=== STEP 2: CHECK CURRENT DATA ===")
# Just check courses publicly
req = urllib.request.Request(f"{BASE}/api/courses", method="GET")
with urllib.request.urlopen(req, timeout=10) as resp:
    courses = json.loads(resp.read())
    print(f"Courses in DB: {len(courses)}")

print("\n=== STEP 3: CALL RESET ENDPOINT ===")
try:
    result = api_post("/api/admin/reset/all", token)
    print(f"Reset result: {result}")
except Exception as e:
    print(f"Reset ERROR: {e}")

print("\n=== STEP 4: VERIFY CLEAR ===")
try:
    req = urllib.request.Request(f"{BASE}/api/courses", method="GET")
    with urllib.request.urlopen(req, timeout=10) as resp:
        courses = json.loads(resp.read())
        print(f"Courses after reset: {len(courses)}")
except Exception as e:
    print(f"Check ERROR: {e}")

print("\n=== STEP 5: RESTART BACKEND TO RE-SEED ===")
print("Killing backend process...")
print("(Manual restart needed: run 'run_backend.bat')")
print("After restart, DataInitializer will seed all data.")
