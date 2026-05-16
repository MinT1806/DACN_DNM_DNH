import urllib.request, urllib.error, json, sys

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

def api_get_raw(path, token):
    req = urllib.request.Request(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {token}"},
        method="GET"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp

token = get_token()
print(f"Token: {token[:50]}...")
print()

# Lessons
try:
    r = api_get("/api/lessons?page=0&size=5", token)
    if isinstance(r, dict):
        print(f"=== LESSONS ===")
        print(f"  Total elements: {r.get('totalElements', r.get('total', 'N/A'))}")
        print(f"  Content count: {len(r.get('content', r.get('data', [])))}")
        for item in r.get('content', r.get('data', []))[:3]:
            print(f"  - {item.get('title', 'N/A')} (courseId={item.get('courseId', 'N/A')})")
    else:
        print(f"=== LESSONS === count={len(r)}")
        for item in r[:3]:
            print(f"  - {item.get('title', 'N/A')}")
except Exception as e:
    print(f"=== LESSONS === ERROR: {e}")

# Tests
try:
    r = api_get("/api/tests", token)
    print(f"\n=== TESTS === count={len(r)}")
    for item in r:
        print(f"  - {item.get('title', item.get('testTitle', 'N/A'))} ({item.get('type', 'N/A')})")
except Exception as e:
    print(f"=== TESTS === ERROR: {e}")

# Stories
try:
    r = api_get("/api/stories", token)
    print(f"\n=== STORIES === type={type(r).__name__} count={len(r) if isinstance(r, list) else 'N/A'}")
    if isinstance(r, list):
        for item in r:
            if isinstance(item, dict):
                print(f"  - {item.get('title', 'N/A')} (steps={item.get('totalSteps', 'N/A')})")
            else:
                print(f"  - {item}")
    else:
        print(f"  Raw: {str(r)[:300]}")
except Exception as e:
    print(f"=== STORIES === ERROR: {e}")

# Story controller
try:
    resp = api_get_raw("/api/story", token)
    print(f"\n=== STORY CONTROLLER === status={resp.status}, len={resp.length}")
    data = json.loads(resp.read())
    print(f"  Data: {str(data)[:200]}")
except Exception as e:
    print(f"=== STORY CONTROLLER === ERROR: {e}")

# User Progress
try:
    r = api_get("/api/progress", token)
    if isinstance(r, list):
        print(f"\n=== USER PROGRESS === count={len(r)}")
        for item in r[:5]:
            print(f"  - userId={item.get('userId')}, lessonId={item.get('lessonId')}, completed={item.get('completed')}")
    elif isinstance(r, dict):
        total = r.get('totalElements', r.get('total', len(r.get('content', []))))
        print(f"\n=== USER PROGRESS === total={total}")
        for item in r.get('content', [])[:5]:
            print(f"  - userId={item.get('userId')}, lessonId={item.get('lessonId')}, completed={item.get('completed')}")
except Exception as e:
    print(f"=== USER PROGRESS === ERROR: {e}")

# Saved Words
try:
    r = api_get("/api/saved-words", token)
    if isinstance(r, list):
        print(f"\n=== SAVED WORDS === count={len(r)}")
    elif isinstance(r, dict):
        print(f"\n=== SAVED WORDS === total={r.get('totalElements', r.get('total', 'N/A'))}")
except Exception as e:
    print(f"=== SAVED WORDS === ERROR: {e}")

# Badges
try:
    r = api_get("/api/badges", token)
    if isinstance(r, list):
        print(f"\n=== BADGES === count={len(r)}")
        for item in r:
            print(f"  - {item.get('name', 'N/A')} ({item.get('type', 'N/A')})")
    elif isinstance(r, dict):
        print(f"\n=== BADGES === total={r.get('totalElements', 'N/A')}")
except Exception as e:
    print(f"=== BADGES === ERROR: {e}")

# Daily Challenges
try:
    r = api_get("/api/daily-challenges", token)
    print(f"\n=== DAILY CHALLENGES ===")
    if isinstance(r, list):
        print(f"  count={len(r)}")
        for item in r:
            print(f"  - {item.get('title', 'N/A')} ({item.get('type', 'N/A')})")
    elif isinstance(r, dict):
        print(f"  total={r.get('totalElements', r.get('total', 'N/A'))}")
        for item in r.get('content', r.get('data', []))[:3]:
            print(f"  - {item.get('title', 'N/A')}")
except Exception as e:
    print(f"=== DAILY CHALLENGES === ERROR: {e}")

print("\n=== DONE ===")
