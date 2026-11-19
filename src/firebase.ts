import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const WORKSPACE_ID = 'dm-santos-central' as const;
export const BOOTSTRAP_ADMIN_EMAIL = 'wlsystemdm@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Defensive payload constraint helpers synchronized verbatim with firebase-blueprint.json
export const BLUEPRINT_LIMITS = {
  idMaxLength: 128,
  idPattern: /^[a-zA-Z0-9_-]+$/,
  usernameMaxLength: 100,
  emailMaxLength: 150,
  productNameMaxLength: 180,
  unitMaxLength: 30,
  categoryNameMaxLength: 60,
  packagingSiglaMaxLength: 20,
  packagingNameMaxLength: 60,
  dateDisplayMaxLength: 40,
  observacaoMaxLength: 300,
  maxNumber: 100000000,
} as const;

export function sanitizeString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function sanitizeDocId(raw: string, fallbackPrefix: string): string {
  const cleaned = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, BLUEPRINT_LIMITS.idMaxLength);

  if (cleaned.length >= 1 && BLUEPRINT_LIMITS.idPattern.test(cleaned)) {
    return cleaned;
  }
  return `${fallbackPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) return 0;
  return Math.min(BLUEPRINT_LIMITS.maxNumber, Math.max(0, value));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();
