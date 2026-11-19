# WL System — Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants

1. **Authentication & Verification Gate**: No unauthenticated or unverified (`email_verified != true`) user may read or write any document in Firestore.
2. **PII Isolation**: User profile documents in `/users/{userId}` contain `email` (PII). Only the profile owner (`request.auth.uid == userId`) or a verified administrator may read a user document. Only administrators may list `/users`.
3. **Anti-Privilege Escalation**:
   - On `/users/{userId}` create, a non-bootstrap user MUST have `role == 'operator'` and `active == true`. Self-assigning `role == 'admin'` is strictly denied.
   - On `/users/{userId}` update, a non-admin owner may ONLY modify `username` and `updatedAt`. Modifying `role`, `active`, `uid`, `email`, or `createdAt` is strictly denied.
4. **Tiered Inventory Permissions**:
   - Only verified administrators may create or delete `/products/{productId}`, `/categories/{categoryId}`, `/packagingTypes/{packagingId}`, or `/metadata/{docId}`.
   - Active verified operators may update ONLY `['quantidade', 'ultimaAtualizacao', 'inativo', 'updatedAt']` on `/products/{productId}` to record stock movements. They cannot rename products, alter `numero`, `categoria`, `estoqueMinimo`, `unidade`, `workspaceId`, or `createdAt`.
5. **Audit Log Immutability & Admin Deletion**:
   - `/movements/{movementId}` records are immutable (`allow update: if false`).
   - Creating a movement requires `userId == request.auth.uid`, `createdAt == request.time`, positive `quantidade > 0`, and if `productId` is provided, the referenced `/products/{productId}` document MUST exist.
   - Only verified administrators may delete `/movements/{movementId}`.
6. **Strict Schema, Boundaries, & Temporal Integrity**:
   - All document IDs match `^[a-zA-Z0-9_\-]+$` with max length 128.
   - All strings have explicit `.size()` bounds matching `firebase-blueprint.json`.
   - Every create enforces `hasAll` + `hasOnly` to reject ghost/shadow fields.
   - Every timestamp (`createdAt`, `updatedAt`) MUST equal `request.time` on write and `createdAt` MUST remain immutable on update.
7. **Scoped List Queries**:
   - Every `allow list` on shared warehouse collections explicitly checks `resource.data.workspaceId == 'dm-santos-central'` without calling `get()`/`exists()`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

All 12 payloads below MUST return `PERMISSION_DENIED`:

1. **Self-Assigned Admin on Create (`/users/attacker_uid`)**
```json
{
  "uid": "attacker_uid",
  "username": "Hacker",
  "email": "attacker@example.com",
  "role": "admin",
  "active": true,
  "createdAt": "SERVER_TIMESTAMP",
  "updatedAt": "SERVER_TIMESTAMP"
}
```
2. **Privilege Escalation via Own Profile Update (`/users/op_uid`)**
```json
{
  "role": "admin",
  "updatedAt": "SERVER_TIMESTAMP"
}
```
3. **Ghost/Shadow Field Injection on Product Create (`/products/prod_999`)**
```json
{
  "id": "prod_999",
  "workspaceId": "dm-santos-central",
  "numero": 999,
  "nome": "ARROZ",
  "quantidade": 10,
  "estoqueMinimo": 5,
  "unidade": "UN",
  "categoria": "Alimentos",
  "ultimaAtualizacao": "19/11/2026 12:00",
  "inativo": false,
  "isVerified": true,
  "createdAt": "SERVER_TIMESTAMP",
  "updatedAt": "SERVER_TIMESTAMP"
}
```
4. **Operator Attempting to Rename Product or Change Min Stock (`/products/prod_1`)**
```json
{
  "nome": "HACKED NAME",
  "estoqueMinimo": 9999,
  "updatedAt": "SERVER_TIMESTAMP"
}
```
5. **Operator Attempting to Delete Movement Audit Entry (`/movements/mov_1`)**
- Operation: `DELETE /movements/mov_1` as role `operator`.
6. **Attempt to Modify Existing Audit Log (`/movements/mov_1`)**
```json
{
  "quantidade": 1,
  "observacao": "Tampered"
}
```
7. **Identity Spoofing on Movement Create (`/movements/mov_spoof`)**
```json
{
  "id": "mov_spoof",
  "workspaceId": "dm-santos-central",
  "dataHora": "19/11/2026 12:00",
  "numero": 1,
  "produto": "PRODUTO X",
  "tipo": "Entrada",
  "quantidade": 5,
  "usuario": "Willian",
  "userId": "other_user_uid",
  "createdAt": "SERVER_TIMESTAMP"
}
```
8. **Orphaned Movement Referencing Non-Existent Product (`/movements/mov_orphan`)**
```json
{
  "id": "mov_orphan",
  "workspaceId": "dm-santos-central",
  "productId": "does_not_exist_999",
  "dataHora": "19/11/2026 12:00",
  "numero": 1,
  "produto": "FANTASMA",
  "tipo": "Entrada",
  "quantidade": 5,
  "usuario": "Op",
  "userId": "op_uid",
  "createdAt": "SERVER_TIMESTAMP"
}
```
9. **Client-Forged Timestamp on Create (`/categories/cat_forged`)**
```json
{
  "id": "cat_forged",
  "workspaceId": "dm-santos-central",
  "nome": "Bebidas",
  "createdAt": "2020-01-01T00:00:00Z",
  "updatedAt": "2020-01-01T00:00:00Z"
}
```
10. **PII Scraping: Operator Reading Another User's Profile (`/users/admin_uid`)**
- Operation: `GET /users/admin_uid` as authenticated `op_uid` (non-admin).
11. **Unverified Admin Email Spoof (`email: "wlsystemdm@gmail.com"`, `email_verified: false`)**
- Operation: `DELETE /products/prod_1` with `email_verified: false`.
12. **Resource Poisoning: Invalid/Oversized Document ID & Negative Quantity (`/products/../../evil$id`)**
```json
{
  "quantidade": -500,
  "ultimaAtualizacao": "19/11/2026 12:00",
  "inativo": false,
  "updatedAt": "SERVER_TIMESTAMP"
}
```
