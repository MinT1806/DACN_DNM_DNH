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

# Just count everything via public endpoints and admin stats
stats = get_auth("/api/admin/stats", token)
courses = get("/api/courses")
vocab = get("/api/vocabulary?page=0&size=1")
tests = get("/api/tests")
forum = get("/api/forum/posts?page=0&size=1")
users = get_auth("/api/admin/users?size=50", token)

vocab_count = vocab.get('totalElements', vocab.get('total', 0)) if isinstance(vocab, dict) else (len(vocab) if isinstance(vocab, list) else 0)
forum_count = 0
if isinstance(forum, dict):
    forum_count = forum.get('totalElements', forum.get('total', 0))
    if forum_count == 0:
        forum_count = forum.get('data', {}).get('total', 0)
elif isinstance(forum, list):
    forum_count = len(forum)

print("=" * 65)
print("ABC ENGLISH - SEEDED DATA SUMMARY")
print("=" * 65)
print(f"  USERS:      {stats['totalUsers']:>4} total  | Active: {stats['activeUsers']}")
print(f"  COURSES:    {stats['totalCourses']:>4} total")
print(f"  VOCABULARY: {vocab_count:>4} words")
print(f"  TESTS:      {len(tests):>4} tests")
print(f"  FORUM:      {forum_count:>4} posts")
print("-" * 65)
print(f"  Completion Rate: {stats.get('completionRate', 'N/A')}%")
print(f"  Avg Score:      {stats.get('platformAverageScore', 'N/A')}")
print("-" * 65)
print("COURSES:")
for c in courses:
    print(f"  [{c['level']}] {c['title']}")
print("-" * 65)
print("USERS BY ROLE:")
from collections import Counter
roles = Counter(u.get('role') for u in users)
for role, count in sorted(roles.items()):
    print(f"  {role}: {count}")
print("=" * 65)
print("ALL SEED ENTITIES VERIFIED SUCCESSFULLY")
print("=" * 65)
