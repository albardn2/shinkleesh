#!/usr/bin/env bash
# =============================================================================
# Newsfeed API Integration Tests
# Tests: GET /posts/feed/new  and  GET /posts/feed/hot
# =============================================================================
set -uo pipefail

BASE="http://localhost:5000"
PASS=0
FAIL=0

green()  { printf "\033[32m%s\033[0m\n" "$*"; }
red()    { printf "\033[31m%s\033[0m\n" "$*"; }
bold()   { printf "\033[1m%s\033[0m\n" "$*"; }

check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    green "  ✓ $label"
    PASS=$((PASS + 1))
  else
    red "  ✗ $label — expected '$expected', got '$actual'"
    FAIL=$((FAIL + 1))
  fi
}

jp() {
  # Extract a field from JSON: jp 'expression' <<< "$json"
  python3 -c "import sys,json; d=json.load(sys.stdin); print($1)"
}

# ── setup: register + login two users ───────────────────────────────────────
bold "=== SETUP ==="

curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"nf_user_a","password":"Pass1234!"}' > /dev/null 2>&1 || true

TOKEN_A=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username_or_email":"nf_user_a","password":"Pass1234!"}' \
  | jp "d['access_token']")
echo "  Token A: ${TOKEN_A:0:20}..."

curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"nf_user_b","password":"Pass1234!"}' > /dev/null 2>&1 || true

TOKEN_B=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username_or_email":"nf_user_b","password":"Pass1234!"}' \
  | jp "d['access_token']")
echo "  Token B: ${TOKEN_B:0:20}..."

LAT="41.8781"
LNG="-87.6298"

# Create 3 posts with deterministic ordering
echo "  Creating posts..."
POST1=$(curl -s -X POST "$BASE/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"message\":\"NF post 1 oldest\",\"lat\":$LAT,\"lng\":$LNG}" \
  | jp "d['uuid']")
echo "    Post1: $POST1"
sleep 1

POST2=$(curl -s -X POST "$BASE/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"message\":\"NF post 2 middle\",\"lat\":$LAT,\"lng\":$LNG}" \
  | jp "d['uuid']")
echo "    Post2: $POST2"
sleep 1

POST3=$(curl -s -X POST "$BASE/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"message\":\"NF post 3 newest\",\"lat\":$LAT,\"lng\":$LNG}" \
  | jp "d['uuid']")
echo "    Post3: $POST3"

# Make post1 "hot": 2 upvotes + 2 comments
echo "  Making post1 hot (votes + comments)..."
curl -s -X POST "$BASE/votes" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"target_type\":\"post\",\"target_uuid\":\"$POST1\",\"vote_type\":\"upvote\"}" > /dev/null

curl -s -X POST "$BASE/votes" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "{\"target_type\":\"post\",\"target_uuid\":\"$POST1\",\"vote_type\":\"upvote\"}" > /dev/null

curl -s -X POST "$BASE/comments" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "{\"post_uuid\":\"$POST1\",\"message\":\"Comment A\",\"lat\":$LAT,\"lng\":$LNG}" > /dev/null

curl -s -X POST "$BASE/comments" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "{\"post_uuid\":\"$POST1\",\"message\":\"Comment B\",\"lat\":$LAT,\"lng\":$LNG}" > /dev/null

echo ""

# ── Test 1: New feed returns 200 with posts ─────────────────────────────────
bold "=== TEST 1: New feed basic ==="
BODY=$(curl -s -X GET "$BASE/posts/feed/new?lat=$LAT&lng=$LNG" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/posts/feed/new?lat=$LAT&lng=$LNG" \
  -H "Authorization: Bearer $TOKEN_A")

check "Returns 200" "200" "$STATUS"
TOTAL=$(echo "$BODY" | jp "d['total_count']")
check "Has posts (total >= 3)" "yes" "$(python3 -c "print('yes' if $TOTAL >= 3 else 'no')")"
check "Page is 1" "1" "$(echo "$BODY" | jp "d['page']")"

# ── Test 2: New feed ordering (newest first) ────────────────────────────────
bold "=== TEST 2: New feed ordering ==="
FIRST_UUID=$(echo "$BODY" | jp "d['posts'][0]['uuid']")
check "Newest post is first" "$POST3" "$FIRST_UUID"

# ── Test 3: Hot feed returns 200 ────────────────────────────────────────────
bold "=== TEST 3: Hot feed basic ==="
BODY_HOT=$(curl -s -X GET "$BASE/posts/feed/hot?lat=$LAT&lng=$LNG" \
  -H "Authorization: Bearer $TOKEN_A")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/posts/feed/hot?lat=$LAT&lng=$LNG" \
  -H "Authorization: Bearer $TOKEN_A")

check "Returns 200" "200" "$STATUS"

# ── Test 4: Hot feed ordering (most engagement first) ───────────────────────
bold "=== TEST 4: Hot feed ordering ==="
FIRST_HOT_UUID=$(echo "$BODY_HOT" | jp "d['posts'][0]['uuid']")
check "Most engaged post is first" "$POST1" "$FIRST_HOT_UUID"

FIRST_VOTES=$(echo "$BODY_HOT" | jp "d['posts'][0]['vote_count']")
FIRST_COMMENTS=$(echo "$BODY_HOT" | jp "d['posts'][0]['comment_count']")
echo "    (vote_count=$FIRST_VOTES, comment_count=$FIRST_COMMENTS)"

# ── Test 5: Pagination ──────────────────────────────────────────────────────
bold "=== TEST 5: Pagination ==="
BODY_PG=$(curl -s -X GET "$BASE/posts/feed/new?lat=$LAT&lng=$LNG&per_page=1&page=1" \
  -H "Authorization: Bearer $TOKEN_A")
POST_LEN=$(echo "$BODY_PG" | jp "len(d['posts'])")
PAGES=$(echo "$BODY_PG" | jp "d['pages']")

check "per_page=1 returns 1 post" "1" "$POST_LEN"
check "Multiple pages (>= 3)" "yes" "$(python3 -c "print('yes' if $PAGES >= 3 else 'no')")"

# page 2
BODY_PG2=$(curl -s -X GET "$BASE/posts/feed/new?lat=$LAT&lng=$LNG&per_page=1&page=2" \
  -H "Authorization: Bearer $TOKEN_A")
PG2_UUID=$(echo "$BODY_PG2" | jp "d['posts'][0]['uuid']")
check "Page 2 different from page 1" "yes" "$(python3 -c "print('yes' if '$PG2_UUID' != '$FIRST_UUID' else 'no')")"

# ── Test 6: Auth required ──────────────────────────────────────────────────
bold "=== TEST 6: Auth required ==="
S1=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/posts/feed/new?lat=$LAT&lng=$LNG")
S2=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/posts/feed/hot?lat=$LAT&lng=$LNG")
check "New feed no auth → 401" "401" "$S1"
check "Hot feed no auth → 401" "401" "$S2"

# ── Test 7: Missing params ─────────────────────────────────────────────────
bold "=== TEST 7: Missing params ==="
S3=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/posts/feed/new" \
  -H "Authorization: Bearer $TOKEN_A")
S4=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/posts/feed/hot?lat=$LAT" \
  -H "Authorization: Bearer $TOKEN_A")
check "No lat/lng → 422" "422" "$S3"
check "Only lat → 422" "422" "$S4"

# ── Test 8: Different location ──────────────────────────────────────────────
bold "=== TEST 8: Different location (Tokyo) ==="
BODY_TK=$(curl -s -X GET "$BASE/posts/feed/new?lat=35.6762&lng=139.6503" \
  -H "Authorization: Bearer $TOKEN_A")
TK_COUNT=$(echo "$BODY_TK" | jp "d['total_count']")
check "Tokyo has 0 posts" "0" "$TK_COUNT"

# ── Cleanup ─────────────────────────────────────────────────────────────────
bold "=== CLEANUP ==="
for uuid in $POST1 $POST2 $POST3; do
  curl -s -X DELETE "$BASE/posts/$uuid" -H "Authorization: Bearer $TOKEN_A" > /dev/null
done
green "  Deleted test posts"

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
bold "═══════════════════════════════════════"
if [[ $FAIL -eq 0 ]]; then
  green "  All $PASS tests passed!"
else
  red "  $PASS passed, $FAIL failed"
fi
bold "═══════════════════════════════════════"

[[ $FAIL -eq 0 ]] && exit 0 || exit 1
