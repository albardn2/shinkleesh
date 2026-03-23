#!/usr/bin/env bash
# Voting API integration tests
# Covers: happy path, idempotency, vote flipping, removal, unauthenticated,
#         invalid payloads, non-existent targets, multi-user isolation.

BASE="http://localhost:5000"
PASS=0
FAIL=0
ERRORS=()

GREEN='\033[0;32m'; RED='\033[0;31m'; RESET='\033[0m'; BOLD='\033[1m'

assert() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo -e "${GREEN}  PASS${RESET} $label"
    ((PASS++))
  else
    echo -e "${RED}  FAIL${RESET} $label"
    echo "       expected: $expected"
    echo "       actual  : $actual"
    ((FAIL++))
    ERRORS+=("$label")
  fi
}

assert_contains() {
  local label="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -qi "$needle"; then
    echo -e "${GREEN}  PASS${RESET} $label"
    ((PASS++))
  else
    echo -e "${RED}  FAIL${RESET} $label"
    echo "       expected to contain: $needle"
    echo "       actual: $haystack"
    ((FAIL++))
    ERRORS+=("$label")
  fi
}

jq_val() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$2',''))" 2>/dev/null; }

post_auth() {
  local token="$1" data="$2"
  curl -s -X POST "$BASE/votes" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$data"
}

del_auth() {
  local token="$1" path="$2"
  curl -s -X DELETE "$BASE$path" \
    -H "Authorization: Bearer $token"
}

get_auth() {
  local token="$1" path="$2"
  curl -s -X GET "$BASE$path" \
    -H "Authorization: Bearer $token"
}

login() {
  local user="$1" pass="$2"
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username_or_email\":\"$user\",\"password\":\"$pass\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null
}

# ─── Setup: register two users ───────────────────────────────────────────────
echo -e "\n${BOLD}=== Setup: register & login users ===${RESET}"

SUFFIX=$RANDOM
U1="voter1_$SUFFIX"; U2="voter2_$SUFFIX"; PW="Pass1234!"

curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"username\":\"$U1\",\"password\":\"$PW\"}" > /dev/null

curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"username\":\"$U2\",\"password\":\"$PW\"}" > /dev/null

TOKEN_U1=$(login "$U1" "$PW")
TOKEN_U2=$(login "$U2" "$PW")

assert "User1 token obtained" "true" "$( [[ -n "$TOKEN_U1" ]] && echo true || echo false )"
assert "User2 token obtained" "true" "$( [[ -n "$TOKEN_U2" ]] && echo true || echo false )"

# ─── Setup: create post & comment ────────────────────────────────────────────
echo -e "\n${BOLD}=== Setup: create post & comment ===${RESET}"

BODY_POST=$(curl -s -X POST "$BASE/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_U1" \
  -d '{"message":"Test post for voting","lat":40.7128,"lng":-74.006}')
POST_UUID=$(jq_val "$BODY_POST" "uuid")
POST_VC_INIT=$(jq_val "$BODY_POST" "vote_count")
assert "Post created"                   "true" "$( [[ -n "$POST_UUID" ]] && echo true || echo false )"
assert "Post initial vote_count is 0"   "0"    "$POST_VC_INIT"

BODY_CMT=$(curl -s -X POST "$BASE/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_U1" \
  -d "{\"post_uuid\":\"$POST_UUID\",\"message\":\"Test comment\",\"lat\":40.7128,\"lng\":-74.006}")
COMMENT_UUID=$(jq_val "$BODY_CMT" "uuid")
assert "Comment created" "true" "$( [[ -n "$COMMENT_UUID" ]] && echo true || echo false )"

# ─── 1. Happy path: upvote a post ───────────────────────────────────────────
echo -e "\n${BOLD}=== Test 1: upvote post ===${RESET}"

R=$(post_auth "$TOKEN_U1" "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"upvote\"}")
VOTE_UUID=$(jq_val "$R" "uuid")
VOTE_TYPE=$(jq_val "$R" "vote_type")
assert "Returns a vote uuid"           "true"   "$( [[ -n "$VOTE_UUID" ]] && echo true || echo false )"
assert "vote_type=upvote"              "upvote" "$VOTE_TYPE"

POST_VC=$(jq_val "$(get_auth "$TOKEN_U1" "/posts/$POST_UUID")" "vote_count")
assert "Post vote_count=1"             "1"      "$POST_VC"

# ─── 2. Idempotency: same vote again ────────────────────────────────────────
echo -e "\n${BOLD}=== Test 2: idempotency (same vote) ===${RESET}"

R2=$(post_auth "$TOKEN_U1" "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"upvote\"}")
VOTE_UUID2=$(jq_val "$R2" "uuid")
assert "Same vote → same uuid (no-op)"           "$VOTE_UUID" "$VOTE_UUID2"

POST_VC2=$(jq_val "$(get_auth "$TOKEN_U1" "/posts/$POST_UUID")" "vote_count")
assert "vote_count still 1 (no double-count)"    "1"          "$POST_VC2"

# ─── 3. Flip vote: upvote → downvote ─────────────────────────────────────────
echo -e "\n${BOLD}=== Test 3: flip vote (upvote→downvote) ===${RESET}"

R3=$(post_auth "$TOKEN_U1" "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"downvote\"}")
FLIPPED=$(jq_val "$R3" "vote_type")
assert "vote_type flipped to downvote"           "downvote"  "$FLIPPED"

POST_VC3=$(jq_val "$(get_auth "$TOKEN_U1" "/posts/$POST_UUID")" "vote_count")
assert "vote_count=-1 (was 1, delta=-2)"         "-1"        "$POST_VC3"

# ─── 4. Flip back: downvote → upvote ─────────────────────────────────────────
echo -e "\n${BOLD}=== Test 4: flip back (downvote→upvote) ===${RESET}"

R4=$(post_auth "$TOKEN_U1" "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"upvote\"}")
assert "vote_type flipped back to upvote"        "upvote"    "$(jq_val "$R4" "vote_type")"

POST_VC4=$(jq_val "$(get_auth "$TOKEN_U1" "/posts/$POST_UUID")" "vote_count")
assert "vote_count=1 (was -1, delta=+2)"         "1"         "$POST_VC4"

# ─── 5. Remove vote ───────────────────────────────────────────────────────────
echo -e "\n${BOLD}=== Test 5: remove vote ===${RESET}"

R5=$(del_auth "$TOKEN_U1" "/votes/post/$POST_UUID")
assert "Remove returns vote uuid" "true" "$( [[ -n "$(jq_val "$R5" "uuid")" ]] && echo true || echo false )"

POST_VC5=$(jq_val "$(get_auth "$TOKEN_U1" "/posts/$POST_UUID")" "vote_count")
assert "vote_count=0 after removal" "0" "$POST_VC5"

# ─── 6. Remove already-removed vote (404) ────────────────────────────────────
echo -e "\n${BOLD}=== Test 6: remove non-existent vote (404) ===${RESET}"

R6=$(del_auth "$TOKEN_U1" "/votes/post/$POST_UUID")
assert_contains "Second remove → 404-like error" "not found" "$R6"

# ─── 7. Vote on a comment ─────────────────────────────────────────────────────
echo -e "\n${BOLD}=== Test 7: vote on comment ===${RESET}"

R7=$(post_auth "$TOKEN_U2" "{\"target_type\":\"comment\",\"target_uuid\":\"$COMMENT_UUID\",\"vote_type\":\"upvote\"}")
assert "Comment upvote returns vote_type=upvote" "upvote" "$(jq_val "$R7" "vote_type")"

CMT_VC=$(jq_val "$(get_auth "$TOKEN_U1" "/comments/$COMMENT_UUID")" "vote_count")
assert "Comment vote_count=1" "1" "$CMT_VC"

R7b=$(del_auth "$TOKEN_U2" "/votes/comment/$COMMENT_UUID")
assert "Remove comment vote" "true" "$( [[ -n "$(jq_val "$R7b" "uuid")" ]] && echo true || echo false )"

CMT_VC2=$(jq_val "$(get_auth "$TOKEN_U1" "/comments/$COMMENT_UUID")" "vote_count")
assert "Comment vote_count=0 after removal" "0" "$CMT_VC2"

# ─── 8. Multi-user independence ───────────────────────────────────────────────
echo -e "\n${BOLD}=== Test 8: multi-user independence ===${RESET}"

post_auth "$TOKEN_U1" "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"upvote\"}" > /dev/null
post_auth "$TOKEN_U2" "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"upvote\"}" > /dev/null

POST_VC6=$(jq_val "$(get_auth "$TOKEN_U1" "/posts/$POST_UUID")" "vote_count")
assert "vote_count=2 (two separate upvotes)" "2" "$POST_VC6"

# User2 flips to downvote; user1's vote unaffected
post_auth "$TOKEN_U2" "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"downvote\"}" > /dev/null

POST_VC7=$(jq_val "$(get_auth "$TOKEN_U1" "/posts/$POST_UUID")" "vote_count")
assert "vote_count=0 (user2 flip: 2-2=0)" "0" "$POST_VC7"

# Cleanup
del_auth "$TOKEN_U1" "/votes/post/$POST_UUID" > /dev/null
del_auth "$TOKEN_U2" "/votes/post/$POST_UUID" > /dev/null

# ─── 9. Unauthenticated request ───────────────────────────────────────────────
echo -e "\n${BOLD}=== Test 9: unauthenticated (no token) ===${RESET}"

R8=$(curl -s -X POST "$BASE/votes" -H "Content-Type: application/json" \
  -d "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"upvote\"}")
assert_contains "No token → JWT error msg" "token" "$R8"

R8b=$(curl -s -X DELETE "$BASE/votes/post/$POST_UUID")
assert_contains "No token DELETE → JWT error msg" "token" "$R8b"

# ─── 10. Vote on non-existent post ────────────────────────────────────────────
echo -e "\n${BOLD}=== Test 10: vote on non-existent post ===${RESET}"

FAKE="00000000-0000-0000-0000-000000000000"
R9=$(post_auth "$TOKEN_U1" "{\"target_type\":\"post\",\"target_uuid\":\"$FAKE\",\"vote_type\":\"upvote\"}")
assert_contains "Fake post UUID → not found" "not found" "$R9"

# ─── 11. Vote on non-existent comment ─────────────────────────────────────────
echo -e "\n${BOLD}=== Test 11: vote on non-existent comment ===${RESET}"

R10=$(post_auth "$TOKEN_U1" "{\"target_type\":\"comment\",\"target_uuid\":\"$FAKE\",\"vote_type\":\"upvote\"}")
assert_contains "Fake comment UUID → not found" "not found" "$R10"

# ─── 12. Invalid target_type ──────────────────────────────────────────────────
echo -e "\n${BOLD}=== Test 12: invalid target_type ===${RESET}"

R11=$(post_auth "$TOKEN_U1" "{\"target_type\":\"banana\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"upvote\"}")
assert_contains "Invalid target_type → validation error" "banana" "$R11"

# ─── 13. Invalid vote_type ────────────────────────────────────────────────────
echo -e "\n${BOLD}=== Test 13: invalid vote_type ===${RESET}"

R12=$(post_auth "$TOKEN_U1" "{\"target_type\":\"post\",\"target_uuid\":\"$POST_UUID\",\"vote_type\":\"sideways\"}")
assert_contains "Invalid vote_type → validation error" "sideways" "$R12"

# ─── 14. Missing required fields ──────────────────────────────────────────────
echo -e "\n${BOLD}=== Test 14: missing fields ===${RESET}"

R13=$(post_auth "$TOKEN_U1" "{\"target_type\":\"post\"}")
assert_contains "Missing vote_type/target_uuid → error" "error" "$(echo $R13 | tr '[:upper:]' '[:lower:]')"

# ─── 15. DELETE with invalid target_type ──────────────────────────────────────
echo -e "\n${BOLD}=== Test 15: DELETE invalid target_type ===${RESET}"

R14=$(del_auth "$TOKEN_U1" "/votes/banana/$POST_UUID")
assert_contains "DELETE bad target_type → error" "comment" "$(echo $R14 | tr '[:upper:]' '[:lower:]')"

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo -e "${BOLD}Results: ${GREEN}$PASS passed${RESET}, ${RED}$FAIL failed${RESET} (total $((PASS+FAIL)))"
echo -e "${BOLD}═══════════════════════════════════════${RESET}"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo -e "\n${RED}Failed tests:${RESET}"
  for e in "${ERRORS[@]}"; do echo "  - $e"; done
fi

[[ $FAIL -eq 0 ]]
