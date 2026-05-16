import urllib.request, urllib.error, urllib.parse, json, time

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

def api_get(path, token):
    req = urllib.request.Request(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {token}"},
        method="GET"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())

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

token = get_token()
print(f"Token: {token[:50]}...")
print()

# Check current state
print("=== CURRENT STATE ===")
stats = api_get("/api/admin/stats", token)
print(f"  Total Users:   {stats.get('totalUsers')}")
print(f"  Total Courses: {stats.get('totalCourses')}")
print(f"  Vocabulary:     {stats.get('totalVocabulary')}")
print()

# List users
users = api_get("/api/admin/users?size=50", token)
print(f"=== USERS ({len(users)}) ===")
for u in users:
    print(f"  [{u.get('role')}] {u.get('username')} - {u.get('fullName')}")
print()

# Check vocabulary
vocab = api_get("/api/vocabulary?page=0&size=1", token)
if isinstance(vocab, list):
    print(f"=== VOCABULARY (list, first entry) ===")
    print(f"  First word: {vocab[0].get('word') if vocab else 'NONE'}")
elif isinstance(vocab, dict):
    print(f"=== VOCABULARY (dict) ===")
    print(f"  Total elements: {vocab.get('totalElements', vocab.get('total', 'N/A'))}")

print()
print("Note: Data was seeded at first startup. DB already had data, so seeds were skipped.")
print("To re-seed, call DELETE /api/admin/reset/all then restart backend.")
print("=== DONE ===")
