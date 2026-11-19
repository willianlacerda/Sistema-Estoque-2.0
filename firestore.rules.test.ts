/**
 * Phase 0: Security TDD Specification Suite for WL System Firestore Rules.
 * Verifies that all "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 *
 * Run against the Firebase Emulator with @firebase/rules-unit-testing when testing locally.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  actor: {
    uid: string;
    email: string;
    email_verified: boolean;
    role: 'admin' | 'operator' | 'unauthenticated';
  };
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
  enforcedByPillar: string;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Admin Role on User Create',
    actor: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true, role: 'operator' },
    operation: 'create',
    path: '/users/attacker_uid',
    payload: {
      uid: 'attacker_uid',
      username: 'Hacker',
      email: 'attacker@example.com',
      role: 'admin',
      active: true,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Pillar 2 & 4: Prevent Self-Assigned Roles',
  },
  {
    id: 2,
    name: 'Privilege Escalation via Own Profile Update',
    actor: { uid: 'op_uid', email: 'op@example.com', email_verified: true, role: 'operator' },
    operation: 'update',
    path: '/users/op_uid',
    payload: { role: 'admin', updatedAt: 'SERVER_TIMESTAMP' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Pillar 4: Action-Based affectedKeys().hasOnly([username, updatedAt])',
  },
  {
    id: 3,
    name: 'Ghost/Shadow Field Injection on Product Create',
    actor: { uid: 'admin_uid', email: 'wlsystemdm@gmail.com', email_verified: true, role: 'admin' },
    operation: 'create',
    path: '/products/prod_999',
    payload: {
      id: 'prod_999',
      workspaceId: 'dm-santos-central',
      numero: 999,
      nome: 'ARROZ',
      quantidade: 10,
      estoqueMinimo: 5,
      unidade: 'UN',
      categoria: 'Alimentos',
      ultimaAtualizacao: '19/11/2026 12:00',
      inativo: false,
      isVerified: true,
      createdAt: 'SERVER_TIMESTAMP',
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Pillar 2: Strict keys().hasOnly() schema gate',
  },
  {
    id: 4,
    name: 'Operator Renaming Product or Modifying Stock Threshold',
    actor: { uid: 'op_uid', email: 'op@example.com', email_verified: true, role: 'operator' },
    operation: 'update',
    path: '/products/prod_1',
    payload: { nome: 'HACKED', estoqueMinimo: 9999, updatedAt: 'SERVER_TIMESTAMP' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Pillar 4: Tiered Identity Logic (Operator restricted to stock movement fields)',
  },
  {
    id: 5,
    name: 'Operator Attempting to Delete Movement History Entry',
    actor: { uid: 'op_uid', email: 'op@example.com', email_verified: true, role: 'operator' },
    operation: 'delete',
    path: '/movements/mov_1',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Pillar 4: Admin-only movement deletion',
  },
  {
    id: 6,
    name: 'Tampering with Immutable Movement Audit Record',
    actor: { uid: 'admin_uid', email: 'wlsystemdm@gmail.com', email_verified: true, role: 'admin' },
    operation: 'update',
    path: '/movements/mov_1',
    payload: { quantidade: 1, observacao: 'Tampered' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Audit Log Immutability (allow update: if false)',
  },
  {
    id: 7,
    name: 'Identity Spoofing on Movement Create',
    actor: { uid: 'op_uid', email: 'op@example.com', email_verified: true, role: 'operator' },
    operation: 'create',
    path: '/movements/mov_spoof',
    payload: {
      id: 'mov_spoof',
      workspaceId: 'dm-santos-central',
      dataHora: '19/11/2026 12:00',
      numero: 1,
      produto: 'PRODUTO X',
      tipo: 'Entrada',
      quantidade: 5,
      usuario: 'Willian',
      userId: 'other_user_uid',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Pillar 2: Identity Integrity (userId == request.auth.uid)',
  },
  {
    id: 8,
    name: 'Orphaned Movement Referencing Non-Existent Product',
    actor: { uid: 'op_uid', email: 'op@example.com', email_verified: true, role: 'operator' },
    operation: 'create',
    path: '/movements/mov_orphan',
    payload: {
      id: 'mov_orphan',
      workspaceId: 'dm-santos-central',
      productId: 'does_not_exist_999',
      dataHora: '19/11/2026 12:00',
      numero: 1,
      produto: 'FANTASMA',
      tipo: 'Entrada',
      quantidade: 5,
      usuario: 'Op',
      userId: 'op_uid',
      createdAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Phase 4 #11: Global Consistency Invariant via exists()',
  },
  {
    id: 9,
    name: 'Client-Forged Timestamp on Category Create',
    actor: { uid: 'admin_uid', email: 'wlsystemdm@gmail.com', email_verified: true, role: 'admin' },
    operation: 'create',
    path: '/categories/cat_forged',
    payload: {
      id: 'cat_forged',
      workspaceId: 'dm-santos-central',
      nome: 'Bebidas',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Phase 4 #13: Temporal Integrity (createdAt == request.time)',
  },
  {
    id: 10,
    name: 'PII Blanket Scraping of Another User Profile',
    actor: { uid: 'op_uid', email: 'op@example.com', email_verified: true, role: 'operator' },
    operation: 'get',
    path: '/users/admin_uid',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Pillar 6: PII Isolation (get restricted to isOwner or isAdmin)',
  },
  {
    id: 11,
    name: 'Unverified Email Spoofing Bootstrap Admin',
    actor: { uid: 'spoof_uid', email: 'wlsystemdm@gmail.com', email_verified: false, role: 'operator' },
    operation: 'delete',
    path: '/products/prod_1',
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Red Team Email Spoofing Guard (email_verified == true)',
  },
  {
    id: 12,
    name: 'Resource Poisoning via Negative Stock Quantity',
    actor: { uid: 'op_uid', email: 'op@example.com', email_verified: true, role: 'operator' },
    operation: 'update',
    path: '/products/prod_1',
    payload: {
      quantidade: -500,
      ultimaAtualizacao: '19/11/2026 12:00',
      inativo: false,
      updatedAt: 'SERVER_TIMESTAMP',
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedByPillar: 'Pillar 2 & 3: Value Poisoning Guard (quantidade >= 0)',
  },
];
