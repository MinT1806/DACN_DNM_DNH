import urllib.request, json

BASE = "http://localhost:8080"

def get(path):
    req = urllib.request.Request(f"{BASE}{path}", method="GET")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())

def get_auth(path, token):
    req = urllib.request.Request(f"{BASE}{path}", headers={"Authorization": f"Bearer {token}"}, method="GET")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())

def login():
    req = urllib.request.Request(f"{BASE}/api/auth/login",
        data=json.dumps({"username": "admin", "password": "admin123"}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())["data"]["token"]

token = login()
stats = get_auth("/api/admin/stats", token)

# Get all users
users = get_auth("/api/admin/users", token)
print(f"Admin stats totalUsers: {stats['totalUsers']}")
print(f"Admin /users endpoint count: {len(users)}")
print(f"Users: {[u.get('username') for u in users]}")

# Forum posts
forum = get("/api/forum/posts?page=0&size=5")
if isinstance(forum, dict):
    print(f"\nForum page 0 content: {len(forum.get('content', []))}")
    print(f"Total forum: {forum.get('total', forum.get('totalElements', 'unknown'))}")
    for p in forum.get('content', [])[:5]:
        print(f"  - {p.get('title', 'N/A')[:50]}")
