# ZENOXIS Firestore Security Specification

## 1. Data Invariants
1. Every document under `/users/{userId}` belongs strictly to the authenticated user whose `request.auth.uid == userId`.
2. PII fields (`email`, `providerId`) are isolated in `/users/{userId}/private/info` and are strictly unreadable by any other user.
3. No unauthenticated read or write access is permitted on any path (default-deny global catch-all).
4. `uid`, `ownerId`, and `createdAt` are immutable after creation; `updatedAt` and `createdAt` must equal `request.time`.
5. Note on verified email check: Facebook accounts may not always include a verified email claim depending on Meta app permissions; therefore owner identity checks verify `request.auth != null && request.auth.uid == userId`, while strict schema and size limits enforce field integrity across every write.

## 2. Adversarial Payloads Tested
1. Unauthenticated `get` / `list` on `/users/uid1`.
2. Cross-user `get` on `/users/uid2/private/info` signed in as `uid1`.
3. Cross-user `list` on `/users` or `/users/uid2/attempts` signed in as `uid1`.
4. Identity spoofing: creating `/users/uid1` with `uid: "uid2"`.
5. Shadow field injection: creating `/users/uid1` with extra `isAdmin: true` ghost key.
6. Oversized ID injection: 500-character document ID on `/users/{userId}/attempts/{attemptId}`.
7. Invalid provider enum: setting `provider: "unknown"`.
8. Client timestamp spoofing: setting `createdAt` to a client string instead of `request.time`.
9. Immutable field tampering: updating `uid` or `createdAt` on `/users/uid1`.
10. Partial update key injection: updating `provider` alongside `workspaceRole`.
11. Out-of-bounds score injection: setting `percentage: 999` or negative score on an attempt.
12. Deleting or hijacking another user's attempt document.
