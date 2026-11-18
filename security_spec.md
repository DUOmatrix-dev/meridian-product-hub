# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **PII Isolation**: User emails and private profile metadata live exclusively at `/users/{userId}/private/profile` and are readable/writable only by `request.auth.uid == userId`.
2. **Master Gate Relational Sync**: Every subcollection document (`requests`, `feedback`, `decisions`) must belong to an existing `/workspaces/{workspaceId}` and the acting user must be listed in the parent workspace's `memberUids` (for `get`, `create`, `update`, `delete`).
3. **Query Enforcer (Zero `get()` in `list`)**: All `allow list` rules validate `request.auth.uid in resource.data.memberUids` directly against document data without calling `get()` or `exists()`.
4. **Immortal & Temporal Integrity**: `ownerId`, `workspaceId`, and `createdAt` cannot be modified after creation. `createdAt` and `updatedAt` must equal `request.time`.
5. **Terminal State Locking**: A `FeatureRequest` with `status == 'shipped'` and an `AlignmentDecision` with `approvalStatus == 'locked'` are immutable once finalized.
6. **Strict Schema & Action-Based Updates**: Every create checks `hasAll` and `hasOnly` keys; every update wraps `isValid[Entity](incoming())` and splits permitted updates via `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Reading `/workspaces/ws-1` without `request.auth`.
2. **Unverified Email Write**: Creating a workspace with `request.auth.token.email_verified == false`.
3. **PII Cross-User Read**: User B attempting `get` on `/users/userA/private/profile`.
4. **Shadow Field Injection**: Creating a `FeatureRequest` with an extra ghost key `isApprovedByAdmin: true`.
5. **Identity Spoofing**: Creating a `FeatureRequest` where `ownerId` is `"other-user-uid"` instead of `request.auth.uid`.
6. **ID Poisoning (Resource Exhaustion)**: Creating a document with `requestId` of 2,000 characters or invalid symbols `../hack`.
7. **Orphaned Subcollection Write**: Creating `/workspaces/nonexistent-ws/requests/req-1` without a valid parent workspace.
8. **Blanket List Query Bypass**: Running a `list` query on `requests` without filtering by `memberUids array-contains uid`.
9. **Client Timestamp Forgery**: Creating a `FeatureRequest` with a client-supplied `Date` instead of `request.time`.
10. **Immortal Field Tampering**: Updating a `FeatureRequest` to change `ownerId` or `workspaceId` or `createdAt`.
11. **Terminal State Mutation**: Attempting to update `title` or `horizon` on a `FeatureRequest` whose existing `status == 'shipped'`, or an `AlignmentDecision` whose existing `approvalStatus == 'locked'`.
12. **Value Poisoning on Update**: Updating `reach` on a `FeatureRequest` to a negative number `-500` or string `"lots"`.
