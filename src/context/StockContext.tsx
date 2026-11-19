import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  WORKSPACE_ID,
  BOOTSTRAP_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  BLUEPRINT_LIMITS,
  sanitizeString,
  sanitizeDocId,
  clampQuantity,
} from '../firebase';
import { StockProduct, StockMovement, UserAccount, UserLevel, SystemStats, PackagingType } from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_CATEGORIES,
  INITIAL_PACKAGING_TYPES,
  inferCategory,
  inferUnit,
} from '../data/initialData';

interface CategoryDoc {
  id: string;
  nome: string;
}

interface PackagingDoc extends PackagingType {
  id: string;
}

interface StockContextType {
  products: StockProduct[];
  movements: StockMovement[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  authReady: boolean;
  isSyncing: boolean;
  isAccessSuspended: boolean;
  categories: string[];
  packagingTypes: PackagingType[];
  stats: SystemStats;
  lastUpdatedTime: string;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  login: (username: string, pass: string) => { success: boolean; message?: string };
  logout: () => Promise<void>;
  registerMovement: (
    productId: string,
    tipo: 'Entrada' | 'Saída',
    quantidade: number,
    observacao?: string
  ) => { success: boolean; message: string };
  removeMovement: (id: string, revertStock?: boolean) => { success: boolean; message: string };
  addProduct: (
    nome: string,
    quantidadeInicial: number,
    estoqueMinimo?: number,
    unidade?: string,
    categoria?: string
  ) => { success: boolean; message: string };
  updateProduct: (id: string, updates: Partial<StockProduct>) => { success: boolean; message: string };
  removeProduct: (id: string) => { success: boolean; message: string };
  inactivateProduct: (id: string) => { success: boolean; message: string };
  activateProduct: (id: string) => { success: boolean; message: string };
  addCategory: (nome: string) => { success: boolean; message: string };
  updateCategory: (oldName: string, newName: string) => { success: boolean; message: string };
  removeCategory: (nome: string, reassignTo?: string) => { success: boolean; message: string };
  addPackagingType: (sigla: string, nome: string) => { success: boolean; message: string };
  updatePackagingType: (oldSigla: string, newSigla: string, newNome: string) => { success: boolean; message: string };
  removePackagingType: (sigla: string) => { success: boolean; message: string };
  addUser: (username: string, pass: string, nivel: UserLevel) => { success: boolean; message: string };
  updateUserPassword: (username: string, newPass: string) => { success: boolean; message: string };
  updateUserLevel: (identifier: string, newLevel: UserLevel) => { success: boolean; message: string };
  toggleUserActive: (uid: string, active: boolean) => { success: boolean; message: string };
  removeUser: (identifier: string) => { success: boolean; message: string };
  exportBackupJson: () => string;
  importBackupJson: (jsonString: string) => { success: boolean; message: string };
  resetDataToInitial: () => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

function getNowFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) {
    const d = ts.toDate();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return typeof ts === 'string' ? ts : '';
}

function parseBrDateToMs(dataHora: string): number {
  const match = dataHora.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) return 0;
  const [, dd, mm, yyyy, hh = '00', min = '00'] = match;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min)).getTime();
}

function isUserAdmin(user: UserAccount | null): boolean {
  if (!user) return false;
  return (
    user.nivel === 2 ||
    Number(user.nivel) === 2 ||
    user.role === 'admin' ||
    (user.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  );
}

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAccessSuspended, setIsAccessSuspended] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [categoryDocs, setCategoryDocs] = useState<CategoryDoc[]>([]);
  const [packagingDocs, setPackagingDocs] = useState<PackagingDoc[]>([]);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(getNowFormatted());

  const seedAttemptedRef = useRef(false);

  // Surface any async Firestore permission errors cleanly to React ErrorBoundary
  if (fatalError) {
    throw fatalError;
  }

  const reportAsyncError = (error: unknown, op: OperationType, path: string) => {
    try {
      handleFirestoreError(error, op, path);
    } catch (wrapped) {
      setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
    }
  };

  // Derived string list of categories & packaging types
  const categories = React.useMemo(() => {
    if (categoryDocs.length === 0) return INITIAL_CATEGORIES;
    return categoryDocs.map((c) => c.nome);
  }, [categoryDocs]);

  const packagingTypes: PackagingType[] = React.useMemo(() => {
    if (packagingDocs.length === 0) return INITIAL_PACKAGING_TYPES;
    return packagingDocs.map((p) => ({ id: p.id, sigla: p.sigla, nome: p.nome }));
  }, [packagingDocs]);

  // 1. Listen to Firebase Auth state and sync the user's profile doc in /users/{uid}
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setFirebaseUser(fbUser);

      if (!fbUser) {
        setCurrentUser(null);
        setUsers([]);
        setProducts([]);
        setMovements([]);
        setCategoryDocs([]);
        setPackagingDocs([]);
        setIsAccessSuspended(false);
        setAuthReady(true);
        return;
      }

      setIsSyncing(true);
      const userPath = `users/${fbUser.uid}`;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const emailLower = (fbUser.email || '').toLowerCase();
      const isBootstrap = emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const displayName = sanitizeString(
            fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Operador'),
            BLUEPRINT_LIMITS.usernameMaxLength
          );
          await setDoc(userDocRef, {
            uid: fbUser.uid,
            username: displayName || 'Operador',
            email: sanitizeString(fbUser.email || '', BLUEPRINT_LIMITS.emailMaxLength),
            role: isBootstrap ? 'admin' : 'operator',
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else if (isBootstrap && snap.data()?.role !== 'admin') {
          await updateDoc(userDocRef, {
            role: 'admin',
            active: true,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        reportAsyncError(err, OperationType.WRITE, userPath);
        setAuthReady(true);
        setIsSyncing(false);
        return;
      }

      unsubProfile = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const isAdm = isBootstrap || data.role === 'admin';
            const active = isBootstrap ? true : data.active !== false;
            setIsAccessSuspended(!active);
            setCurrentUser({
              uid: fbUser.uid,
              username: data.username || fbUser.displayName || 'Operador',
              email: data.email || fbUser.email || '',
              passwordHash: '',
              nivel: (isAdm ? 2 : 1) as UserLevel,
              roleName: isAdm ? 'Administrador' : 'Operador',
              role: isAdm ? 'admin' : 'operator',
              active,
              createdAt: formatTimestamp(data.createdAt),
            });
          }
          setAuthReady(true);
        },
        (err) => {
          reportAsyncError(err, OperationType.GET, userPath);
          setAuthReady(true);
        }
      );
    });

    return () => {
      if (unsubProfile) unsubProfile();
      unsubAuth();
    };
  }, []);

  // 2. Seed initial warehouse catalog once when an Admin signs in on a fresh database
  const seedInitialDataToFirestore = async (uid: string) => {
    const nowStr = getNowFormatted();

    // Commit in safe batches (max 400 writes per batch)
    const operations: Array<(b: ReturnType<typeof writeBatch>) => void> = [];

    const prodIdByNumber = new Map<number, string>();
    const prodIdByName = new Map<string, string>();

    INITIAL_PRODUCTS.forEach((p) => {
      const pid = sanitizeDocId(p.id || `prod_${p.numero}`, 'prod');
      prodIdByNumber.set(p.numero, pid);
      prodIdByName.set(p.nome.trim().toUpperCase(), pid);
      operations.push((b) => {
        b.set(doc(db, 'products', pid), {
          id: pid,
          workspaceId: WORKSPACE_ID,
          numero: Math.max(1, Math.floor(p.numero)),
          nome: sanitizeString(p.nome.toUpperCase(), BLUEPRINT_LIMITS.productNameMaxLength),
          quantidade: clampQuantity(p.quantidade),
          estoqueMinimo: clampQuantity(p.estoqueMinimo || 15),
          unidade: sanitizeString(p.unidade || 'UN', BLUEPRINT_LIMITS.unitMaxLength),
          categoria: sanitizeString(p.categoria || 'Outros', BLUEPRINT_LIMITS.categoryNameMaxLength),
          ultimaAtualizacao: sanitizeString(p.ultimaAtualizacao || nowStr, BLUEPRINT_LIMITS.dateDisplayMaxLength),
          inativo: Boolean(p.inativo),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    });

    INITIAL_CATEGORIES.forEach((cat) => {
      const cid = sanitizeDocId(`cat_${cat}`, 'cat');
      operations.push((b) => {
        b.set(doc(db, 'categories', cid), {
          id: cid,
          workspaceId: WORKSPACE_ID,
          nome: sanitizeString(cat, BLUEPRINT_LIMITS.categoryNameMaxLength),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    });

    INITIAL_PACKAGING_TYPES.forEach((pt) => {
      const pkid = sanitizeDocId(`pack_${pt.sigla}`, 'pack');
      operations.push((b) => {
        b.set(doc(db, 'packagingTypes', pkid), {
          id: pkid,
          workspaceId: WORKSPACE_ID,
          sigla: sanitizeString(pt.sigla.toUpperCase(), BLUEPRINT_LIMITS.packagingSiglaMaxLength),
          nome: sanitizeString(pt.nome, BLUEPRINT_LIMITS.packagingNameMaxLength),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    });

    INITIAL_MOVEMENTS.forEach((m, idx) => {
      const mid = sanitizeDocId(m.id || `mov_${idx + 1}`, 'mov');
      const qty = Math.max(1, clampQuantity(m.quantidade));
      const matchedProductId =
        prodIdByName.get(m.produto.trim().toUpperCase()) || prodIdByNumber.get(m.numero);

      const movPayload: Record<string, unknown> = {
        id: mid,
        workspaceId: WORKSPACE_ID,
        dataHora: sanitizeString(m.dataHora || nowStr, BLUEPRINT_LIMITS.dateDisplayMaxLength),
        numero: Math.max(1, Math.floor(m.numero || 1)),
        produto: sanitizeString(m.produto.toUpperCase(), BLUEPRINT_LIMITS.productNameMaxLength),
        tipo: m.tipo === 'Saída' ? 'Saída' : 'Entrada',
        quantidade: qty,
        usuario: sanitizeString(m.usuario || 'Sistema', BLUEPRINT_LIMITS.usernameMaxLength),
        userId: uid,
        createdAt: serverTimestamp(),
      };
      if (matchedProductId) {
        movPayload.productId = matchedProductId;
      }
      if (m.observacao) {
        movPayload.observacao = sanitizeString(m.observacao, BLUEPRINT_LIMITS.observacaoMaxLength);
      }

      operations.push((b) => {
        b.set(doc(db, 'movements', mid), movPayload);
      });
    });

    operations.push((b) => {
      b.set(doc(db, 'metadata', 'bootstrap'), {
        workspaceId: WORKSPACE_ID,
        seeded: true,
        seededBy: uid,
        updatedAt: serverTimestamp(),
      });
    });

    const CHUNK_SIZE = 350;
    for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      operations.slice(i, i + CHUNK_SIZE).forEach((fn) => fn(batch));
      await batch.commit();
    }
  };

  useEffect(() => {
    if (!authReady || !firebaseUser || !currentUser || isAccessSuspended) return;
    if (!isUserAdmin(currentUser) || seedAttemptedRef.current) return;

    seedAttemptedRef.current = true;
    const bootstrapRef = doc(db, 'metadata', 'bootstrap');

    (async () => {
      try {
        const snap = await getDoc(bootstrapRef);
        if (!snap.exists()) {
          await seedInitialDataToFirestore(firebaseUser.uid);
        }
      } catch (err) {
        reportAsyncError(err, OperationType.WRITE, 'metadata/bootstrap');
      }
    })();
  }, [authReady, firebaseUser, currentUser, isAccessSuspended]);

  // 3. Attach real-time Firestore onSnapshot listeners ONLY when auth is ready & user is active
  useEffect(() => {
    if (!authReady || !firebaseUser || !currentUser || isAccessSuspended) {
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);
    let productsLoaded = false;

    const productsQuery = query(
      collection(db, 'products'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    const unsubProducts = onSnapshot(
      productsQuery,
      (snapshot) => {
        const list: StockProduct[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            numero: Number(data.numero) || 1,
            nome: String(data.nome || ''),
            quantidade: Number(data.quantidade) || 0,
            estoqueMinimo: Number(data.estoqueMinimo) || 15,
            unidade: String(data.unidade || 'UN'),
            categoria: String(data.categoria || 'Outros'),
            ultimaAtualizacao: String(data.ultimaAtualizacao || ''),
            inativo: Boolean(data.inativo),
          };
        });
        list.sort((a, b) => a.numero - b.numero);
        setProducts(list);
        setLastUpdatedTime(getNowFormatted());
        if (!productsLoaded) {
          productsLoaded = true;
          setIsSyncing(false);
        }
      },
      (err) => {
        reportAsyncError(err, OperationType.LIST, 'products');
        setIsSyncing(false);
      }
    );

    const movementsQuery = query(
      collection(db, 'movements'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    const unsubMovements = onSnapshot(
      movementsQuery,
      (snapshot) => {
        const raw = snapshot.docs.map((d) => {
          const data = d.data();
          const createdMs =
            data.createdAt instanceof Timestamp
              ? data.createdAt.toMillis()
              : parseBrDateToMs(String(data.dataHora || ''));
          return {
            sortKey: parseBrDateToMs(String(data.dataHora || '')) || createdMs,
            createdMs,
            item: {
              id: data.id || d.id,
              productId: data.productId,
              dataHora: String(data.dataHora || ''),
              numero: Number(data.numero) || 1,
              produto: String(data.produto || ''),
              tipo: (data.tipo === 'Saída' ? 'Saída' : 'Entrada') as 'Entrada' | 'Saída',
              quantidade: Number(data.quantidade) || 0,
              usuario: String(data.usuario || 'Operador'),
              userId: data.userId,
              saldoApos: typeof data.saldoApos === 'number' ? data.saldoApos : undefined,
              observacao: data.observacao,
            } as StockMovement,
          };
        });

        raw.sort((a, b) => {
          if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey;
          return b.createdMs - a.createdMs;
        });

        setMovements(raw.map((r) => r.item));
        setLastUpdatedTime(getNowFormatted());
      },
      (err) => {
        reportAsyncError(err, OperationType.LIST, 'movements');
      }
    );

    const categoriesQuery = query(
      collection(db, 'categories'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const list: CategoryDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          nome: String(d.data().nome || ''),
        }));
        list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setCategoryDocs(list);
      },
      (err) => {
        reportAsyncError(err, OperationType.LIST, 'categories');
      }
    );

    const packagingQuery = query(
      collection(db, 'packagingTypes'),
      where('workspaceId', '==', WORKSPACE_ID)
    );
    const unsubPackaging = onSnapshot(
      packagingQuery,
      (snapshot) => {
        const list: PackagingDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          sigla: String(d.data().sigla || ''),
          nome: String(d.data().nome || ''),
        }));
        list.sort((a, b) => a.sigla.localeCompare(b.sigla, 'pt-BR'));
        setPackagingDocs(list);
      },
      (err) => {
        reportAsyncError(err, OperationType.LIST, 'packagingTypes');
      }
    );

    // Only Admins subscribe to the /users directory (PII Isolation)
    let unsubUsers: (() => void) | null = null;
    if (isUserAdmin(currentUser)) {
      unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const list: UserAccount[] = snapshot.docs.map((d) => {
            const data = d.data();
            const isAdm =
              data.role === 'admin' ||
              String(data.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
            return {
              uid: d.id,
              username: String(data.username || 'Usuário'),
              email: String(data.email || ''),
              passwordHash: '',
              nivel: (isAdm ? 2 : 1) as UserLevel,
              roleName: isAdm ? 'Administrador' : 'Operador',
              role: isAdm ? 'admin' : 'operator',
              active: data.active !== false,
              createdAt: formatTimestamp(data.createdAt),
            };
          });
          list.sort((a, b) => {
            if (b.nivel !== a.nivel) return b.nivel - a.nivel;
            return a.username.localeCompare(b.username, 'pt-BR');
          });
          setUsers(list);
        },
        (err) => {
          reportAsyncError(err, OperationType.LIST, 'users');
        }
      );
    } else {
      setUsers([currentUser]);
    }

    return () => {
      unsubProducts();
      unsubMovements();
      unsubCategories();
      unsubPackaging();
      if (unsubUsers) unsubUsers();
    };
  }, [authReady, firebaseUser?.uid, currentUser?.nivel, isAccessSuspended]);

  // Derived system metrics
  const stats: SystemStats = React.useMemo(() => {
    const activeProducts = products.filter((p) => !p.inativo);
    const inactiveProducts = products.filter((p) => p.inativo);
    const totalProdutos = activeProducts.length;
    const totalUnidades = activeProducts.reduce((acc, p) => acc + (p.quantidade || 0), 0);
    const produtosZerados = activeProducts.filter((p) => p.quantidade <= 0).length;
    const produtosEstoqueBaixo = activeProducts.filter(
      (p) => p.quantidade > 0 && p.quantidade <= p.estoqueMinimo
    ).length;
    const produtosInativos = inactiveProducts.length;

    const totalEntradasMes = movements
      .filter((m) => m.tipo === 'Entrada')
      .reduce((acc, m) => acc + m.quantidade, 0);
    const totalSaidasMes = movements
      .filter((m) => m.tipo === 'Saída')
      .reduce((acc, m) => acc + m.quantidade, 0);

    return {
      totalProdutos,
      totalUnidades,
      produtosZerados,
      produtosEstoqueBaixo,
      produtosInativos,
      totalEntradasMes,
      totalSaidasMes,
    };
  }, [products, movements]);

  // Auth actions
  const signInWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { success: false, message: 'Login cancelado. Clique novamente para entrar com sua conta Google.' };
      }
      if (code === 'auth/unauthorized-domain') {
        return {
          success: false,
          message:
            'Domínio ainda não autorizado no Firebase Authentication. Adicione este endereço em Authentication → Settings → Authorized domains no Console do Firebase.',
        };
      }
      if (code === 'auth/popup-blocked') {
        return {
          success: false,
          message: 'O navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.',
        };
      }
      return {
        success: false,
        message: err?.message || 'Não foi possível entrar com o Google. Tente novamente.',
      };
    }
  };

  // Legacy signature kept for backward compatibility
  const login = (): { success: boolean; message?: string } => {
    return { success: false, message: 'Use o botão "Entrar com Google" para acessar o estoque na nuvem.' };
  };

  const logout = async () => {
    seedAttemptedRef.current = false;
    await signOut(auth);
  };

  // =========================================================================
  // FIRESTORE MUTATIONS (Real-time synchronized across all devices)
  // =========================================================================

  const registerMovement = (
    productId: string,
    tipo: 'Entrada' | 'Saída',
    quantidade: number,
    observacao?: string
  ): { success: boolean; message: string } => {
    if (!auth.currentUser || !currentUser) {
      return { success: false, message: 'Sessão expirada. Faça login novamente.' };
    }
    if (quantidade <= 0 || isNaN(quantidade)) {
      return { success: false, message: 'A quantidade deve ser maior que zero.' };
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    const cleanQty = clampQuantity(quantidade);
    if (tipo === 'Saída' && cleanQty > targetProduct.quantidade) {
      return {
        success: false,
        message: `Saída (${cleanQty}) maior que o estoque atual disponível (${targetProduct.quantidade}).`,
      };
    }

    const novoSaldo =
      tipo === 'Entrada'
        ? clampQuantity(targetProduct.quantidade + cleanQty)
        : clampQuantity(targetProduct.quantidade - cleanQty);
    const timestamp = getNowFormatted();
    const wasInactive = Boolean(targetProduct.inativo);
    const shouldReactivate = wasInactive && tipo === 'Entrada' && cleanQty > 0;
    const movId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const finalObs = observacao
      ? shouldReactivate
        ? `${observacao} (Reativação de produto)`
        : observacao
      : shouldReactivate
      ? 'Reativação de produto via entrada de estoque'
      : undefined;

    const batch = writeBatch(db);
    batch.update(doc(db, 'products', productId), {
      quantidade: novoSaldo,
      inativo: shouldReactivate ? false : Boolean(targetProduct.inativo),
      ultimaAtualizacao: sanitizeString(timestamp, BLUEPRINT_LIMITS.dateDisplayMaxLength),
      updatedAt: serverTimestamp(),
    });

    const movPayload: Record<string, unknown> = {
      id: movId,
      workspaceId: WORKSPACE_ID,
      productId,
      dataHora: sanitizeString(timestamp, BLUEPRINT_LIMITS.dateDisplayMaxLength),
      numero: Math.max(1, Math.floor(targetProduct.numero)),
      produto: sanitizeString(targetProduct.nome.toUpperCase(), BLUEPRINT_LIMITS.productNameMaxLength),
      tipo,
      quantidade: cleanQty,
      usuario: sanitizeString(currentUser.username, BLUEPRINT_LIMITS.usernameMaxLength),
      userId: auth.currentUser.uid,
      saldoApos: novoSaldo,
      createdAt: serverTimestamp(),
    };
    if (finalObs) {
      movPayload.observacao = sanitizeString(finalObs, BLUEPRINT_LIMITS.observacaoMaxLength);
    }
    batch.set(doc(db, 'movements', movId), movPayload);

    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.WRITE, `products/${productId}`);
    });

    return {
      success: true,
      message: shouldReactivate
        ? `Entrada de ${cleanQty} ${targetProduct.unidade}(s) registrada! O produto "${targetProduct.nome}" foi reativado e sincronizado na nuvem.`
        : `${tipo} de ${cleanQty} ${targetProduct.unidade}(s) registrada e sincronizada em tempo real!`,
    };
  };

  const removeMovement = (
    id: string,
    revertStock: boolean = true
  ): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return {
        success: false,
        message: 'Apenas usuários administradores têm permissão para excluir registros do histórico.',
      };
    }

    const targetMovement = movements.find((m) => m.id === id);
    if (!targetMovement) {
      return { success: false, message: 'Registro de movimentação não encontrado.' };
    }

    let stockMessage = '';
    const batch = writeBatch(db);

    if (revertStock) {
      const prod = products.find(
        (p) =>
          (targetMovement.productId && p.id === targetMovement.productId) ||
          p.numero === targetMovement.numero ||
          p.nome.trim().toUpperCase() === targetMovement.produto.trim().toUpperCase()
      );

      if (prod) {
        const newQty =
          targetMovement.tipo === 'Entrada'
            ? clampQuantity(prod.quantidade - targetMovement.quantidade)
            : clampQuantity(prod.quantidade + targetMovement.quantidade);
        stockMessage = ` O estoque de "${prod.nome}" foi estornado de ${prod.quantidade} para ${newQty} ${prod.unidade}(s).`;

        batch.update(doc(db, 'products', prod.id), {
          quantidade: newQty,
          ultimaAtualizacao: sanitizeString(getNowFormatted(), BLUEPRINT_LIMITS.dateDisplayMaxLength),
          updatedAt: serverTimestamp(),
        });
      }
    }

    batch.delete(doc(db, 'movements', id));
    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.DELETE, `movements/${id}`);
    });

    return {
      success: true,
      message: `Registro de ${targetMovement.tipo.toLowerCase()} (${targetMovement.quantidade} un) de "${targetMovement.produto}" excluído com sucesso!${stockMessage}`,
    };
  };

  const addProduct = (
    nome: string,
    quantidadeInicial: number,
    estoqueMinimo: number = 15,
    unidade?: string,
    categoria?: string
  ): { success: boolean; message: string } => {
    if (!auth.currentUser || !isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem cadastrar novos produtos.' };
    }

    const cleanName = sanitizeString(nome.toUpperCase(), BLUEPRINT_LIMITS.productNameMaxLength);
    if (!cleanName) {
      return { success: false, message: 'Informe o nome do produto.' };
    }

    const exists = products.some((p) => p.nome.toUpperCase() === cleanName);
    if (exists) {
      return { success: false, message: `Já existe um produto cadastrado com o nome "${cleanName}".` };
    }

    const maxNum = products.reduce((max, p) => Math.max(max, p.numero), 0);
    const numero = Math.floor(maxNum + 1);
    const timestamp = getNowFormatted();
    const initialQty = clampQuantity(quantidadeInicial || 0);
    const prodId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const unitFinal = sanitizeString(unidade || inferUnit(cleanName), BLUEPRINT_LIMITS.unitMaxLength);
    const catFinal = sanitizeString(categoria || inferCategory(cleanName), BLUEPRINT_LIMITS.categoryNameMaxLength);

    const batch = writeBatch(db);
    batch.set(doc(db, 'products', prodId), {
      id: prodId,
      workspaceId: WORKSPACE_ID,
      numero,
      nome: cleanName,
      quantidade: initialQty,
      estoqueMinimo: clampQuantity(estoqueMinimo || 15),
      unidade: unitFinal,
      categoria: catFinal,
      ultimaAtualizacao: sanitizeString(timestamp, BLUEPRINT_LIMITS.dateDisplayMaxLength),
      inativo: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (initialQty > 0) {
      const movId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      batch.set(doc(db, 'movements', movId), {
        id: movId,
        workspaceId: WORKSPACE_ID,
        productId: prodId,
        dataHora: sanitizeString(timestamp, BLUEPRINT_LIMITS.dateDisplayMaxLength),
        numero,
        produto: cleanName,
        tipo: 'Entrada',
        quantidade: initialQty,
        usuario: sanitizeString(currentUser?.username || 'Admin', BLUEPRINT_LIMITS.usernameMaxLength),
        userId: auth.currentUser.uid,
        saldoApos: initialQty,
        observacao: 'Carga inicial de cadastro',
        createdAt: serverTimestamp(),
      });
    }

    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.CREATE, `products/${prodId}`);
    });

    return { success: true, message: `Produto "${cleanName}" cadastrado e sincronizado na nuvem!` };
  };

  const updateProduct = (
    id: string,
    updates: Partial<StockProduct>
  ): { success: boolean; message: string } => {
    if (!auth.currentUser || !isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem editar produtos.' };
    }

    const current = products.find((p) => p.id === id);
    if (!current) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    const timestamp = getNowFormatted();
    const cleanUpdates: Record<string, unknown> = {
      ultimaAtualizacao: sanitizeString(timestamp, BLUEPRINT_LIMITS.dateDisplayMaxLength),
      updatedAt: serverTimestamp(),
    };

    if (typeof updates.nome === 'string' && updates.nome.trim()) {
      cleanUpdates.nome = sanitizeString(updates.nome.toUpperCase(), BLUEPRINT_LIMITS.productNameMaxLength);
    }
    if (typeof updates.quantidade === 'number') {
      cleanUpdates.quantidade = clampQuantity(updates.quantidade);
    }
    if (typeof updates.estoqueMinimo === 'number') {
      cleanUpdates.estoqueMinimo = clampQuantity(updates.estoqueMinimo);
    }
    if (typeof updates.unidade === 'string' && updates.unidade.trim()) {
      cleanUpdates.unidade = sanitizeString(updates.unidade, BLUEPRINT_LIMITS.unitMaxLength);
    }
    if (typeof updates.categoria === 'string' && updates.categoria.trim()) {
      cleanUpdates.categoria = sanitizeString(updates.categoria, BLUEPRINT_LIMITS.categoryNameMaxLength);
    }
    if (typeof updates.inativo === 'boolean') {
      cleanUpdates.inativo = updates.inativo;
    }

    const batch = writeBatch(db);
    batch.update(doc(db, 'products', id), cleanUpdates);

    if (typeof updates.quantidade === 'number' && updates.quantidade !== current.quantidade) {
      const nextQty = clampQuantity(updates.quantidade);
      const diff = nextQty - current.quantidade;
      if (diff !== 0) {
        const movId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        batch.set(doc(db, 'movements', movId), {
          id: movId,
          workspaceId: WORKSPACE_ID,
          productId: id,
          dataHora: sanitizeString(timestamp, BLUEPRINT_LIMITS.dateDisplayMaxLength),
          numero: Math.max(1, Math.floor(current.numero)),
          produto: String(cleanUpdates.nome || current.nome),
          tipo: diff > 0 ? 'Entrada' : 'Saída',
          quantidade: Math.abs(diff),
          usuario: sanitizeString(currentUser?.username || 'Admin', BLUEPRINT_LIMITS.usernameMaxLength),
          userId: auth.currentUser.uid,
          saldoApos: nextQty,
          observacao: 'Ajuste manual de inventário',
          createdAt: serverTimestamp(),
        });
      }
    }

    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.UPDATE, `products/${id}`);
    });

    return { success: true, message: 'Produto atualizado com sucesso!' };
  };

  const removeProduct = (id: string): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem excluir produtos.' };
    }
    const target = products.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    const remaining = products.filter((p) => p.id !== id);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'products', id));

    remaining.forEach((p, idx) => {
      const expectedNum = idx + 1;
      if (p.numero !== expectedNum) {
        batch.update(doc(db, 'products', p.id), {
          numero: expectedNum,
          updatedAt: serverTimestamp(),
        });
      }
    });

    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.DELETE, `products/${id}`);
    });

    return { success: true, message: `Produto "${target.nome}" removido do catálogo!` };
  };

  const inactivateProduct = (id: string): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem inativar produtos.' };
    }
    const target = products.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    updateDoc(doc(db, 'products', id), {
      inativo: true,
      ultimaAtualizacao: sanitizeString(getNowFormatted(), BLUEPRINT_LIMITS.dateDisplayMaxLength),
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      reportAsyncError(err, OperationType.UPDATE, `products/${id}`);
    });

    return {
      success: true,
      message: `Produto Nº ${target.numero} - "${target.nome}" inativado!`,
    };
  };

  const activateProduct = (id: string): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem reativar produtos.' };
    }
    const target = products.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    updateDoc(doc(db, 'products', id), {
      inativo: false,
      ultimaAtualizacao: sanitizeString(getNowFormatted(), BLUEPRINT_LIMITS.dateDisplayMaxLength),
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      reportAsyncError(err, OperationType.UPDATE, `products/${id}`);
    });

    return {
      success: true,
      message: `Produto Nº ${target.numero} - "${target.nome}" reativado no catálogo principal!`,
    };
  };

  // Categories
  const addCategory = (nome: string): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem gerenciar categorias.' };
    }
    const clean = sanitizeString(nome, BLUEPRINT_LIMITS.categoryNameMaxLength);
    if (!clean) {
      return { success: false, message: 'O nome da categoria não pode ser vazio.' };
    }
    if (categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      return { success: false, message: `A categoria "${clean}" já existe.` };
    }

    const cid = sanitizeDocId(`cat_${clean}_${Date.now().toString(36)}`, 'cat');
    setDoc(doc(db, 'categories', cid), {
      id: cid,
      workspaceId: WORKSPACE_ID,
      nome: clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      reportAsyncError(err, OperationType.CREATE, `categories/${cid}`);
    });

    return { success: true, message: `Categoria "${clean}" cadastrada com sucesso!` };
  };

  const updateCategory = (oldName: string, newName: string): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem gerenciar categorias.' };
    }
    const clean = sanitizeString(newName, BLUEPRINT_LIMITS.categoryNameMaxLength);
    if (!clean) {
      return { success: false, message: 'O novo nome da categoria não pode ser vazio.' };
    }
    if (
      oldName.toLowerCase() !== clean.toLowerCase() &&
      categories.some((c) => c.toLowerCase() === clean.toLowerCase())
    ) {
      return { success: false, message: `Já existe uma categoria chamada "${clean}".` };
    }

    const targetDoc = categoryDocs.find((c) => c.nome === oldName);
    const affectedProducts = products.filter((p) => p.categoria === oldName);
    const batch = writeBatch(db);

    if (targetDoc) {
      batch.update(doc(db, 'categories', targetDoc.id), {
        nome: clean,
        updatedAt: serverTimestamp(),
      });
    } else {
      const cid = sanitizeDocId(`cat_${clean}`, 'cat');
      batch.set(doc(db, 'categories', cid), {
        id: cid,
        workspaceId: WORKSPACE_ID,
        nome: clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    affectedProducts.forEach((p) => {
      batch.update(doc(db, 'products', p.id), {
        categoria: clean,
        updatedAt: serverTimestamp(),
      });
    });

    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.UPDATE, 'categories');
    });

    return {
      success: true,
      message: `Categoria atualizada para "${clean}"${
        affectedProducts.length > 0 ? ` em ${affectedProducts.length} produto(s)` : ''
      }!`,
    };
  };

  const removeCategory = (nome: string, reassignTo: string = 'Outros'): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem gerenciar categorias.' };
    }
    if (categories.length <= 1) {
      return { success: false, message: 'O sistema deve manter pelo menos 1 categoria ativa.' };
    }

    const fallback =
      reassignTo && reassignTo !== nome && categories.includes(reassignTo)
        ? reassignTo
        : categories.find((c) => c !== nome) || 'Outros';

    const targetDoc = categoryDocs.find((c) => c.nome === nome);
    const affectedProducts = products.filter((p) => p.categoria === nome);
    const batch = writeBatch(db);

    if (targetDoc) {
      batch.delete(doc(db, 'categories', targetDoc.id));
    }

    affectedProducts.forEach((p) => {
      batch.update(doc(db, 'products', p.id), {
        categoria: fallback,
        updatedAt: serverTimestamp(),
      });
    });

    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.DELETE, `categories/${targetDoc?.id || nome}`);
    });

    return {
      success: true,
      message:
        affectedProducts.length > 0
          ? `Categoria "${nome}" removida. ${affectedProducts.length} produto(s) reclassificado(s) para "${fallback}".`
          : `Categoria "${nome}" removida com sucesso!`,
    };
  };

  // Packaging Types
  const addPackagingType = (sigla: string, nome: string): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem gerenciar embalagens.' };
    }
    const cleanSigla = sanitizeString(sigla.toUpperCase(), BLUEPRINT_LIMITS.packagingSiglaMaxLength);
    const cleanNome = sanitizeString(nome || cleanSigla, BLUEPRINT_LIMITS.packagingNameMaxLength);
    if (!cleanSigla) {
      return { success: false, message: 'A sigla do tipo de embalagem não pode ser vazia.' };
    }
    if (packagingTypes.some((p) => p.sigla.toUpperCase() === cleanSigla)) {
      return { success: false, message: `O tipo de embalagem "${cleanSigla}" já existe.` };
    }

    const pkid = sanitizeDocId(`pack_${cleanSigla}_${Date.now().toString(36)}`, 'pack');
    setDoc(doc(db, 'packagingTypes', pkid), {
      id: pkid,
      workspaceId: WORKSPACE_ID,
      sigla: cleanSigla,
      nome: cleanNome,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      reportAsyncError(err, OperationType.CREATE, `packagingTypes/${pkid}`);
    });

    return { success: true, message: `Tipo de embalagem "${cleanSigla}" cadastrado com sucesso!` };
  };

  const updatePackagingType = (
    oldSigla: string,
    newSigla: string,
    newNome: string
  ): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem gerenciar embalagens.' };
    }
    const cleanSigla = sanitizeString(newSigla.toUpperCase(), BLUEPRINT_LIMITS.packagingSiglaMaxLength);
    const cleanNome = sanitizeString(newNome || cleanSigla, BLUEPRINT_LIMITS.packagingNameMaxLength);
    if (!cleanSigla) {
      return { success: false, message: 'A sigla da embalagem não pode ser vazia.' };
    }
    if (
      oldSigla.toUpperCase() !== cleanSigla &&
      packagingTypes.some((p) => p.sigla.toUpperCase() === cleanSigla)
    ) {
      return { success: false, message: `Já existe um tipo de embalagem com a sigla "${cleanSigla}".` };
    }

    const targetDoc = packagingDocs.find((p) => p.sigla === oldSigla);
    const affectedProducts = products.filter((p) => p.unidade === oldSigla);
    const batch = writeBatch(db);

    if (targetDoc) {
      batch.update(doc(db, 'packagingTypes', targetDoc.id), {
        sigla: cleanSigla,
        nome: cleanNome,
        updatedAt: serverTimestamp(),
      });
    } else {
      const pkid = sanitizeDocId(`pack_${cleanSigla}`, 'pack');
      batch.set(doc(db, 'packagingTypes', pkid), {
        id: pkid,
        workspaceId: WORKSPACE_ID,
        sigla: cleanSigla,
        nome: cleanNome,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (oldSigla !== cleanSigla) {
      affectedProducts.forEach((p) => {
        batch.update(doc(db, 'products', p.id), {
          unidade: cleanSigla,
          updatedAt: serverTimestamp(),
        });
      });
    }

    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.UPDATE, 'packagingTypes');
    });

    return {
      success: true,
      message: `Tipo de embalagem atualizado para "${cleanSigla}"${
        affectedProducts.length > 0 ? ` em ${affectedProducts.length} produto(s)` : ''
      }!`,
    };
  };

  const removePackagingType = (sigla: string): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem gerenciar embalagens.' };
    }
    if (packagingTypes.length <= 1) {
      return { success: false, message: 'O sistema deve manter pelo menos 1 tipo de embalagem ativo.' };
    }

    const fallback = packagingTypes.find((p) => p.sigla !== sigla)?.sigla || 'UN';
    const targetDoc = packagingDocs.find((p) => p.sigla === sigla);
    const affectedProducts = products.filter((p) => p.unidade === sigla);
    const batch = writeBatch(db);

    if (targetDoc) {
      batch.delete(doc(db, 'packagingTypes', targetDoc.id));
    }

    affectedProducts.forEach((p) => {
      batch.update(doc(db, 'products', p.id), {
        unidade: fallback,
        updatedAt: serverTimestamp(),
      });
    });

    batch.commit().catch((err) => {
      reportAsyncError(err, OperationType.DELETE, `packagingTypes/${targetDoc?.id || sigla}`);
    });

    return {
      success: true,
      message:
        affectedProducts.length > 0
          ? `Embalagem "${sigla}" removida. ${affectedProducts.length} produto(s) atualizado(s) para "${fallback}".`
          : `Tipo de embalagem "${sigla}" removido com sucesso!`,
    };
  };

  // Users RBAC Management (Real Firebase Auth users in /users/{uid})
  const addUser = (): { success: boolean; message: string } => {
    return {
      success: false,
      message:
        'Com o login Google na nuvem, novos membros apenas abrem o aplicativo e clicam em "Entrar com Google" para aparecerem nesta lista automaticamente.',
    };
  };

  const updateUserPassword = (): { success: boolean; message: string } => {
    return {
      success: false,
      message: 'As senhas são gerenciadas com segurança diretamente pela conta Google de cada usuário.',
    };
  };

  const updateUserLevel = (identifier: string, newLevel: UserLevel): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem alterar permissões.' };
    }

    const target = users.find((u) => u.uid === identifier || u.username === identifier);
    if (!target || !target.uid) {
      return { success: false, message: 'Usuário não encontrado.' };
    }
    if ((target.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: 'O Administrador Principal não pode ter seu nível alterado.' };
    }
    if (target.uid === currentUser?.uid) {
      return { success: false, message: 'Você não pode alterar seu próprio nível de acesso.' };
    }

    const newRole = newLevel === 2 ? 'admin' : 'operator';
    updateDoc(doc(db, 'users', target.uid), {
      role: newRole,
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      reportAsyncError(err, OperationType.UPDATE, `users/${target.uid}`);
    });

    return {
      success: true,
      message: `Permissão de "${target.username}" atualizada para ${
        newLevel === 2 ? 'Administrador' : 'Operador'
      }!`,
    };
  };

  const toggleUserActive = (uid: string, active: boolean): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem suspender ou reativar acessos.' };
    }

    const target = users.find((u) => u.uid === uid);
    if (!target) {
      return { success: false, message: 'Usuário não encontrado.' };
    }
    if ((target.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: 'Não é possível suspender o Administrador Principal.' };
    }
    if (target.uid === currentUser?.uid) {
      return { success: false, message: 'Você não pode suspender sua própria conta.' };
    }

    updateDoc(doc(db, 'users', uid), {
      active,
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      reportAsyncError(err, OperationType.UPDATE, `users/${uid}`);
    });

    return {
      success: true,
      message: active
        ? `Acesso de "${target.username}" reativado com sucesso!`
        : `Acesso de "${target.username}" suspenso imediatamente.`,
    };
  };

  const removeUser = (identifier: string): { success: boolean; message: string } => {
    if (!isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem remover usuários.' };
    }

    const target = users.find((u) => u.uid === identifier || u.username === identifier);
    if (!target || !target.uid) {
      return { success: false, message: 'Usuário não encontrado.' };
    }
    if ((target.email || '').toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: 'Não é possível excluir o Administrador Principal.' };
    }
    if (target.uid === currentUser?.uid) {
      return { success: false, message: 'Você não pode excluir o usuário logado atualmente.' };
    }

    deleteDoc(doc(db, 'users', target.uid)).catch((err) => {
      reportAsyncError(err, OperationType.DELETE, `users/${target.uid}`);
    });

    return { success: true, message: `Registro de "${target.username}" removido.` };
  };

  // Backup Export / Import / Reset
  const exportBackupJson = (): string => {
    const payload = {
      sistema: 'WL System - Estoque Galpão (Cloud Firestore)',
      versao: '3.0',
      exportadoEm: getNowFormatted(),
      estoque: products.map((p) => [String(p.numero), p.nome, String(p.quantidade)]),
      produtosDetalhados: products,
      historico: movements.map((m) => [m.dataHora, String(m.numero), m.produto, m.tipo, m.quantidade]),
      historicoDetalhado: movements,
      categorias: categories,
      embalagens: packagingTypes,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importBackupJson = (jsonString: string): { success: boolean; message: string } => {
    if (!auth.currentUser || !isUserAdmin(currentUser)) {
      return { success: false, message: 'Apenas administradores podem restaurar backups na nuvem.' };
    }

    try {
      const parsed = JSON.parse(jsonString);
      let importedProducts: StockProduct[] = [];
      let importedMovements: StockMovement[] = [];
      const nowStr = getNowFormatted();

      if (Array.isArray(parsed.produtosDetalhados)) {
        importedProducts = parsed.produtosDetalhados;
      } else if (Array.isArray(parsed.estoque)) {
        importedProducts = parsed.estoque.map((item: any, idx: number) => {
          const numero = parseInt(item[0], 10) || idx + 1;
          const nome = String(item[1] || '').toUpperCase();
          const quantidade = parseFloat(item[2]) || 0;
          return {
            id: `prod_${numero}`,
            numero,
            nome,
            quantidade,
            estoqueMinimo: 15,
            unidade: inferUnit(nome),
            categoria: inferCategory(nome),
            ultimaAtualizacao: nowStr,
            inativo: false,
          };
        });
      } else {
        return { success: false, message: 'Arquivo JSON inválido: propriedade "estoque" não encontrada.' };
      }

      if (Array.isArray(parsed.historicoDetalhado)) {
        importedMovements = parsed.historicoDetalhado;
      } else if (Array.isArray(parsed.historico)) {
        importedMovements = parsed.historico.map((item: any, idx: number) => ({
          id: `mov_${idx + 1}`,
          dataHora: String(item[0] || ''),
          numero: parseInt(item[1], 10) || 0,
          produto: String(item[2] || ''),
          tipo: item[3] === 'Entrada' ? 'Entrada' : 'Saída',
          quantidade: Number(item[4]) || 1,
          usuario: 'Backup',
          observacao: 'Importado via JSON',
        }));
      }

      const uid = auth.currentUser.uid;
      const operations: Array<(b: ReturnType<typeof writeBatch>) => void> = [];

      // Delete existing products & movements
      products.forEach((p) => operations.push((b) => b.delete(doc(db, 'products', p.id))));
      movements.forEach((m) => operations.push((b) => b.delete(doc(db, 'movements', m.id))));

      const prodIdByNumber = new Map<number, string>();
      importedProducts.forEach((p, idx) => {
        const pid = sanitizeDocId(p.id || `prod_${p.numero || idx + 1}`, 'prod');
        const num = Math.max(1, Math.floor(p.numero || idx + 1));
        prodIdByNumber.set(num, pid);
        operations.push((b) => {
          b.set(doc(db, 'products', pid), {
            id: pid,
            workspaceId: WORKSPACE_ID,
            numero: num,
            nome: sanitizeString((p.nome || `PRODUTO ${num}`).toUpperCase(), BLUEPRINT_LIMITS.productNameMaxLength),
            quantidade: clampQuantity(p.quantidade),
            estoqueMinimo: clampQuantity(p.estoqueMinimo || 15),
            unidade: sanitizeString(p.unidade || 'UN', BLUEPRINT_LIMITS.unitMaxLength),
            categoria: sanitizeString(p.categoria || 'Outros', BLUEPRINT_LIMITS.categoryNameMaxLength),
            ultimaAtualizacao: sanitizeString(p.ultimaAtualizacao || nowStr, BLUEPRINT_LIMITS.dateDisplayMaxLength),
            inativo: Boolean(p.inativo),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      });

      importedMovements.forEach((m, idx) => {
        const mid = sanitizeDocId(m.id || `mov_${idx + 1}_${Date.now().toString(36)}`, 'mov');
        const num = Math.max(1, Math.floor(m.numero || 1));
        const matchedProdId = prodIdByNumber.get(num);
        const movPayload: Record<string, unknown> = {
          id: mid,
          workspaceId: WORKSPACE_ID,
          dataHora: sanitizeString(m.dataHora || nowStr, BLUEPRINT_LIMITS.dateDisplayMaxLength),
          numero: num,
          produto: sanitizeString((m.produto || 'PRODUTO').toUpperCase(), BLUEPRINT_LIMITS.productNameMaxLength),
          tipo: m.tipo === 'Saída' ? 'Saída' : 'Entrada',
          quantidade: Math.max(1, clampQuantity(m.quantidade)),
          usuario: sanitizeString(m.usuario || 'Backup', BLUEPRINT_LIMITS.usernameMaxLength),
          userId: uid,
          createdAt: serverTimestamp(),
        };
        if (matchedProdId) movPayload.productId = matchedProdId;
        if (m.observacao) {
          movPayload.observacao = sanitizeString(m.observacao, BLUEPRINT_LIMITS.observacaoMaxLength);
        }
        operations.push((b) => b.set(doc(db, 'movements', mid), movPayload));
      });

      (async () => {
        try {
          const CHUNK_SIZE = 350;
          for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            operations.slice(i, i + CHUNK_SIZE).forEach((fn) => fn(batch));
            await batch.commit();
          }
        } catch (err) {
          reportAsyncError(err, OperationType.WRITE, 'products');
        }
      })();

      return {
        success: true,
        message: `Backup importado na nuvem com sucesso! ${importedProducts.length} produtos sincronizados para todos os dispositivos.`,
      };
    } catch (e: any) {
      return { success: false, message: `Erro ao analisar JSON: ${e.message}` };
    }
  };

  const resetDataToInitial = () => {
    if (!auth.currentUser || !isUserAdmin(currentUser)) return;
    const uid = auth.currentUser.uid;

    (async () => {
      try {
        const deletes: Array<(b: ReturnType<typeof writeBatch>) => void> = [];
        products.forEach((p) => deletes.push((b) => b.delete(doc(db, 'products', p.id))));
        movements.forEach((m) => deletes.push((b) => b.delete(doc(db, 'movements', m.id))));
        categoryDocs.forEach((c) => deletes.push((b) => b.delete(doc(db, 'categories', c.id))));
        packagingDocs.forEach((p) => deletes.push((b) => b.delete(doc(db, 'packagingTypes', p.id))));

        const CHUNK_SIZE = 350;
        for (let i = 0; i < deletes.length; i += CHUNK_SIZE) {
          const batch = writeBatch(db);
          deletes.slice(i, i + CHUNK_SIZE).forEach((fn) => fn(batch));
          await batch.commit();
        }

        await seedInitialDataToFirestore(uid);
      } catch (err) {
        reportAsyncError(err, OperationType.WRITE, 'metadata/bootstrap');
      }
    })();
  };

  return (
    <StockContext.Provider
      value={{
        products,
        movements,
        users,
        currentUser,
        authReady,
        isSyncing,
        isAccessSuspended,
        categories,
        packagingTypes,
        stats,
        lastUpdatedTime,
        signInWithGoogle,
        login,
        logout,
        registerMovement,
        removeMovement,
        addProduct,
        updateProduct,
        removeProduct,
        inactivateProduct,
        activateProduct,
        addCategory,
        updateCategory,
        removeCategory,
        addPackagingType,
        updatePackagingType,
        removePackagingType,
        addUser,
        updateUserPassword,
        updateUserLevel,
        toggleUserActive,
        removeUser,
        exportBackupJson,
        importBackupJson,
        resetDataToInitial,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
