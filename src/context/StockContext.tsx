import React, { createContext, useContext, useState, useEffect } from 'react';
import { StockProduct, StockMovement, UserAccount, UserLevel, SystemStats, PackagingType } from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PACKAGING_TYPES,
  inferCategory,
  inferUnit,
} from '../data/initialData';

interface StockContextType {
  products: StockProduct[];
  movements: StockMovement[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  categories: string[];
  packagingTypes: PackagingType[];
  stats: SystemStats;
  lastUpdatedTime: string;
  login: (username: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  registerMovement: (productId: string, tipo: 'Entrada' | 'Saída', quantidade: number, observacao?: string) => { success: boolean; message: string };
  removeMovement: (id: string, revertStock?: boolean) => { success: boolean; message: string };
  addProduct: (nome: string, quantidadeInicial: number, estoqueMinimo?: number, unidade?: string, categoria?: string) => { success: boolean; message: string };
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
  updateUserLevel: (username: string, newLevel: UserLevel) => { success: boolean; message: string };
  removeUser: (username: string) => { success: boolean; message: string };
  exportBackupJson: () => string;
  importBackupJson: (jsonString: string) => { success: boolean; message: string };
  resetDataToInitial: () => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const LS_PRODUCTS_KEY = 'wl_estoque_produtos_v2';
const LS_MOVEMENTS_KEY = 'wl_estoque_historico_v2';
const LS_USERS_KEY = 'wl_estoque_usuarios_v2';
const LS_CURRENT_USER_KEY = 'wl_estoque_current_user_v2';
const LS_CATEGORIES_KEY = 'wl_estoque_categorias_v2';
const LS_PACKAGING_KEY = 'wl_estoque_embalagens_v2';

function getNowFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<StockProduct[]>(() => {
    try {
      const stored = localStorage.getItem(LS_PRODUCTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const stored = localStorage.getItem(LS_MOVEMENTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load movements from localStorage', e);
    }
    return INITIAL_MOVEMENTS;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(LS_USERS_KEY);
      if (stored) {
        const parsed: UserAccount[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((u) => {
            const isAdm =
              u.username.toLowerCase() === 'willian' ||
              u.username.toLowerCase() === 'admin' ||
              Number(u.nivel) === 2;
            return {
              ...u,
              nivel: (isAdm ? 2 : 1) as UserLevel,
              roleName: isAdm ? 'Administrador' : 'Operador',
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem(LS_CURRENT_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          const isAdm =
            parsed.username?.toLowerCase() === 'willian' ||
            parsed.username?.toLowerCase() === 'admin' ||
            Number(parsed.nivel) === 2;
          const nivelNum: UserLevel = isAdm ? 2 : 1;
          return {
            ...parsed,
            nivel: nivelNum,
            roleName: nivelNum === 2 ? 'Administrador' : 'Operador',
          };
        }
      }
    } catch (e) {
      console.error('Failed to load current user', e);
    }
    // Default to Willian (Admin) so the system opens directly ready to use
    return INITIAL_USERS[0];
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LS_CATEGORIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load categories from localStorage', e);
    }
    return INITIAL_CATEGORIES;
  });

  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>(() => {
    try {
      const stored = localStorage.getItem(LS_PACKAGING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load packaging types from localStorage', e);
    }
    return INITIAL_PACKAGING_TYPES;
  });

  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(getNowFormatted());

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_MOVEMENTS_KEY, JSON.stringify(movements));
    } catch (e) {
      console.error(e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_PACKAGING_KEY, JSON.stringify(packagingTypes));
    } catch (e) {
      console.error(e);
    }
  }, [packagingTypes]);

  useEffect(() => {
    try {
      if (currentUser) {
        // Enforce Willian is always Admin
        if (currentUser.username.toLowerCase() === 'willian' && currentUser.nivel !== 2) {
          const fixedUser: UserAccount = {
            ...currentUser,
            nivel: 2,
            roleName: 'Administrador',
          };
          setCurrentUser(fixedUser);
          localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(fixedUser));
        } else {
          localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(currentUser));
        }
        localStorage.setItem('wl_last_username', currentUser.username);
      } else {
        localStorage.removeItem(LS_CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Derived system metrics
  const stats: SystemStats = React.useMemo(() => {
    const activeProducts = products.filter((p) => !p.inativo);
    const inactiveProducts = products.filter((p) => p.inativo);
    const totalProdutos = activeProducts.length;
    const totalUnidades = activeProducts.reduce((acc, p) => acc + (p.quantidade || 0), 0);
    const produtosZerados = activeProducts.filter((p) => p.quantidade <= 0).length;
    const produtosEstoqueBaixo = activeProducts.filter((p) => p.quantidade > 0 && p.quantidade <= p.estoqueMinimo).length;
    const produtosInativos = inactiveProducts.length;

    // Movement totals
    const totalEntradasMes = movements.filter((m) => m.tipo === 'Entrada').reduce((acc, m) => acc + m.quantidade, 0);
    const totalSaidasMes = movements.filter((m) => m.tipo === 'Saída').reduce((acc, m) => acc + m.quantidade, 0);

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

  const login = (usernameInput: string, passInput: string): { success: boolean; message?: string } => {
    const trimmedUser = usernameInput.trim();
    const found = users.find(
      (u) => u.username.toLowerCase() === trimmedUser.toLowerCase() && u.passwordHash === passInput
    );
    if (found) {
      const isAdm =
        found.username.toLowerCase() === 'willian' ||
        found.username.toLowerCase() === 'admin' ||
        Number(found.nivel) === 2;
      const userToSet: UserAccount = {
        ...found,
        nivel: (isAdm ? 2 : 1) as UserLevel,
        roleName: isAdm ? 'Administrador' : 'Operador',
      };
      setCurrentUser(userToSet);
      return { success: true };
    }
    return { success: false, message: 'Usuário ou senha incorretos.' };
  };

  const logout = () => {
    if (currentUser?.username) {
      try {
        localStorage.setItem('wl_last_username', currentUser.username);
      } catch (e) {
        console.error(e);
      }
    }
    setCurrentUser(null);
  };

  const registerMovement = (
    productId: string,
    tipo: 'Entrada' | 'Saída',
    quantidade: number,
    observacao?: string
  ): { success: boolean; message: string } => {
    if (quantidade <= 0 || isNaN(quantidade)) {
      return { success: false, message: 'A quantidade deve ser maior que zero.' };
    }

    const prodIndex = products.findIndex((p) => p.id === productId);
    if (prodIndex === -1) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    const targetProduct = products[prodIndex];

    if (tipo === 'Saída' && quantidade > targetProduct.quantidade) {
      return {
        success: false,
        message: `Saída (${quantidade}) maior que o estoque atual disponível (${targetProduct.quantidade}).`,
      };
    }

    const novoSaldo = tipo === 'Entrada' ? targetProduct.quantidade + quantidade : targetProduct.quantidade - quantidade;
    const timestamp = getNowFormatted();
    const wasInactive = Boolean(targetProduct.inativo);
    const shouldReactivate = wasInactive && tipo === 'Entrada' && quantidade > 0;

    const updatedProduct: StockProduct = {
      ...targetProduct,
      quantidade: novoSaldo,
      inativo: shouldReactivate ? false : targetProduct.inativo,
      ultimaAtualizacao: timestamp,
    };

    const newMovement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataHora: timestamp,
      numero: targetProduct.numero,
      produto: targetProduct.nome,
      tipo,
      quantidade,
      usuario: currentUser?.username || 'Sistema',
      saldoApos: novoSaldo,
      observacao: observacao
        ? shouldReactivate
          ? `${observacao} (Reativação de produto)`
          : observacao
        : shouldReactivate
        ? 'Reativação de produto via entrada de estoque'
        : undefined,
    };

    const newProducts = [...products];
    newProducts[prodIndex] = updatedProduct;

    setProducts(newProducts);
    setMovements([newMovement, ...movements]);
    setLastUpdatedTime(timestamp);

    return {
      success: true,
      message: shouldReactivate
        ? `Entrada de ${quantidade} ${targetProduct.unidade}(s) registrada! O produto "${targetProduct.nome}" foi reativado e voltou para a lista principal.`
        : `${tipo} de ${quantidade} ${targetProduct.unidade}(s) registrada com sucesso!`,
    };
  };

  const removeMovement = (
    id: string,
    revertStock: boolean = true
  ): { success: boolean; message: string } => {
    // Admin validation
    const isAdm = Boolean(
      currentUser &&
        (currentUser.nivel === 2 ||
          Number(currentUser.nivel) === 2 ||
          currentUser.username.toLowerCase() === 'willian' ||
          currentUser.username.toLowerCase() === 'admin')
    );

    if (!isAdm) {
      return {
        success: false,
        message: 'Apenas usuários administradores têm permissão para excluir registros do histórico.',
      };
    }

    const targetIndex = movements.findIndex((m) => m.id === id);
    if (targetIndex === -1) {
      return { success: false, message: 'Registro de movimentação não encontrado.' };
    }

    const targetMovement = movements[targetIndex];
    let stockMessage = '';

    // Revert product stock balance if requested
    if (revertStock) {
      const prodIndex = products.findIndex(
        (p) =>
          p.numero === targetMovement.numero ||
          p.nome.trim().toUpperCase() === targetMovement.produto.trim().toUpperCase()
      );

      if (prodIndex !== -1) {
        const prod = products[prodIndex];
        let newQty = prod.quantidade;

        if (targetMovement.tipo === 'Entrada') {
          // Reverting an Entrada: subtract quantity from current stock
          newQty = Math.max(0, prod.quantidade - targetMovement.quantidade);
          stockMessage = ` O estoque de "${prod.nome}" foi estornado de ${prod.quantidade} para ${newQty} ${prod.unidade}(s).`;
        } else {
          // Reverting a Saída: return quantity back into stock
          newQty = prod.quantidade + targetMovement.quantidade;
          stockMessage = ` O estoque de "${prod.nome}" foi estornado de ${prod.quantidade} para ${newQty} ${prod.unidade}(s).`;
        }

        const timestamp = getNowFormatted();
        const updatedProduct: StockProduct = {
          ...prod,
          quantidade: newQty,
          ultimaAtualizacao: timestamp,
        };

        const updatedProducts = [...products];
        updatedProducts[prodIndex] = updatedProduct;
        setProducts(updatedProducts);
      }
    }

    // Remove from movements list
    const remainingMovements = movements.filter((_, idx) => idx !== targetIndex);
    setMovements(remainingMovements);
    setLastUpdatedTime(getNowFormatted());

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
    const cleanName = nome.trim().toUpperCase();
    if (!cleanName) {
      return { success: false, message: 'Informe o nome do produto.' };
    }

    // Check duplicate
    const exists = products.some((p) => p.nome.toUpperCase() === cleanName);
    if (exists) {
      return { success: false, message: 'Já existe um produto cadastrado com este nome.' };
    }

    const maxNum = products.reduce((max, p) => (p.numero > max ? p.numero : max), 0);
    const numero = maxNum + 1;
    const initialQty = Math.max(0, quantidadeInicial || 0);
    const timestamp = getNowFormatted();

    const newProd: StockProduct = {
      id: `prod_${Date.now()}`,
      numero,
      nome: cleanName,
      quantidade: initialQty,
      estoqueMinimo: estoqueMinimo || 15,
      unidade: unidade || inferUnit(cleanName),
      categoria: categoria || inferCategory(cleanName),
      ultimaAtualizacao: timestamp,
    };

    setProducts([...products, newProd]);
    setLastUpdatedTime(timestamp);

    if (initialQty > 0) {
      const initialMovement: StockMovement = {
        id: `mov_${Date.now()}`,
        dataHora: timestamp,
        numero,
        produto: cleanName,
        tipo: 'Entrada',
        quantidade: initialQty,
        usuario: currentUser?.username || 'Sistema',
        saldoApos: initialQty,
        observacao: 'Carga inicial de cadastro',
      };
      setMovements([initialMovement, ...movements]);
    }

    return { success: true, message: `Produto "${cleanName}" cadastrado com sucesso!` };
  };

  const updateProduct = (id: string, updates: Partial<StockProduct>): { success: boolean; message: string } => {
    const prodIndex = products.findIndex((p) => p.id === id);
    if (prodIndex === -1) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    const current = products[prodIndex];
    const timestamp = getNowFormatted();

    // If quantity is adjusted directly
    if (typeof updates.quantidade === 'number' && updates.quantidade !== current.quantidade) {
      const diff = updates.quantidade - current.quantidade;
      const tipo: 'Entrada' | 'Saída' = diff > 0 ? 'Entrada' : 'Saída';
      const absDiff = Math.abs(diff);

      const adjustmentMovement: StockMovement = {
        id: `mov_${Date.now()}`,
        dataHora: timestamp,
        numero: current.numero,
        produto: updates.nome ? updates.nome.toUpperCase() : current.nome,
        tipo,
        quantidade: absDiff,
        usuario: currentUser?.username || 'Sistema',
        saldoApos: updates.quantidade,
        observacao: 'Ajuste manual de inventário',
      };
      setMovements([adjustmentMovement, ...movements]);
    }

    const updated: StockProduct = {
      ...current,
      ...updates,
      nome: updates.nome ? updates.nome.trim().toUpperCase() : current.nome,
      ultimaAtualizacao: timestamp,
    };

    const newProducts = [...products];
    newProducts[prodIndex] = updated;
    setProducts(newProducts);
    setLastUpdatedTime(timestamp);

    return { success: true, message: 'Produto atualizado com sucesso!' };
  };

  const removeProduct = (id: string): { success: boolean; message: string } => {
    const target = products.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Produto não encontrado.' };
    }

    // Renumber remaining products sequentially like in PyQt5
    const remaining = products.filter((p) => p.id !== id);
    const renumbered = remaining.map((p, idx) => ({
      ...p,
      numero: idx + 1,
    }));

    setProducts(renumbered);
    setLastUpdatedTime(getNowFormatted());

    return { success: true, message: `Produto "${target.nome}" removido do catálogo!` };
  };

  const inactivateProduct = (id: string): { success: boolean; message: string } => {
    const prodIndex = products.findIndex((p) => p.id === id);
    if (prodIndex === -1) {
      return { success: false, message: 'Produto não encontrado.' };
    }
    const target = products[prodIndex];
    const timestamp = getNowFormatted();
    const updated: StockProduct = {
      ...target,
      inativo: true,
      ultimaAtualizacao: timestamp,
    };
    const newProducts = [...products];
    newProducts[prodIndex] = updated;
    setProducts(newProducts);
    setLastUpdatedTime(timestamp);
    return {
      success: true,
      message: `Produto Nº ${target.numero} - "${target.nome}" inativado! Ele sairá da lista principal ("Todos") e poderá ser acessado na aba "Inativos".`,
    };
  };

  const activateProduct = (id: string): { success: boolean; message: string } => {
    const prodIndex = products.findIndex((p) => p.id === id);
    if (prodIndex === -1) {
      return { success: false, message: 'Produto não encontrado.' };
    }
    const target = products[prodIndex];
    const timestamp = getNowFormatted();
    const updated: StockProduct = {
      ...target,
      inativo: false,
      ultimaAtualizacao: timestamp,
    };
    const newProducts = [...products];
    newProducts[prodIndex] = updated;
    setProducts(newProducts);
    setLastUpdatedTime(timestamp);
    return {
      success: true,
      message: `Produto Nº ${target.numero} - "${target.nome}" reativado no catálogo principal!`,
    };
  };

  const addCategory = (nome: string): { success: boolean; message: string } => {
    const clean = nome.trim();
    if (!clean) {
      return { success: false, message: 'O nome da categoria não pode ser vazio.' };
    }
    const exists = categories.some((c) => c.toLowerCase() === clean.toLowerCase());
    if (exists) {
      return { success: false, message: `A categoria "${clean}" já existe.` };
    }
    setCategories([...categories, clean]);
    return { success: true, message: `Categoria "${clean}" cadastrada com sucesso!` };
  };

  const updateCategory = (oldName: string, newName: string): { success: boolean; message: string } => {
    const clean = newName.trim();
    if (!clean) {
      return { success: false, message: 'O novo nome da categoria não pode ser vazio.' };
    }
    if (oldName.toLowerCase() !== clean.toLowerCase() && categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      return { success: false, message: `Já existe uma categoria chamada "${clean}".` };
    }

    const updatedCategories = categories.map((c) => (c === oldName ? clean : c));
    setCategories(updatedCategories);

    // Update all products using oldName
    let count = 0;
    const updatedProducts = products.map((p) => {
      if (p.categoria === oldName) {
        count++;
        return { ...p, categoria: clean };
      }
      return p;
    });
    if (count > 0) {
      setProducts(updatedProducts);
    }

    return {
      success: true,
      message: `Categoria atualizada para "${clean}"${count > 0 ? ` em ${count} produto(s)` : ''}!`,
    };
  };

  const removeCategory = (nome: string, reassignTo: string = 'Outros'): { success: boolean; message: string } => {
    if (categories.length <= 1) {
      return { success: false, message: 'O sistema deve possuir pelo menos uma categoria.' };
    }

    const updatedCategories = categories.filter((c) => c !== nome);
    setCategories(updatedCategories);

    // Reassign products that used this category
    const targetCategory = updatedCategories.includes(reassignTo) ? reassignTo : updatedCategories[0];
    let count = 0;
    const updatedProducts = products.map((p) => {
      if (p.categoria === nome) {
        count++;
        return { ...p, categoria: targetCategory };
      }
      return p;
    });
    if (count > 0) {
      setProducts(updatedProducts);
    }

    return {
      success: true,
      message: `Categoria "${nome}" removida${count > 0 ? ` (${count} produto(s) transferidos para "${targetCategory}")` : ''}!`,
    };
  };

  const addPackagingType = (siglaInput: string, nomeInput: string): { success: boolean; message: string } => {
    const cleanSigla = siglaInput.trim().toUpperCase();
    const cleanNome = nomeInput.trim() || cleanSigla;
    if (!cleanSigla) {
      return { success: false, message: 'A sigla da embalagem é obrigatória (ex: LATA, BALDE).' };
    }
    if (packagingTypes.some((pt) => pt.sigla.toUpperCase() === cleanSigla)) {
      return { success: false, message: `Já existe uma embalagem com a sigla "${cleanSigla}".` };
    }

    const newPackaging: PackagingType = {
      sigla: cleanSigla,
      nome: cleanNome,
    };
    setPackagingTypes([...packagingTypes, newPackaging]);
    return { success: true, message: `Tipo de embalagem "${cleanNome}" (${cleanSigla}) cadastrado!` };
  };

  const updatePackagingType = (oldSigla: string, newSigla: string, newNome: string): { success: boolean; message: string } => {
    const cleanSigla = newSigla.trim().toUpperCase();
    const cleanNome = newNome.trim() || cleanSigla;
    if (!cleanSigla) {
      return { success: false, message: 'A sigla não pode ser vazia.' };
    }
    if (oldSigla !== cleanSigla && packagingTypes.some((pt) => pt.sigla.toUpperCase() === cleanSigla)) {
      return { success: false, message: `A sigla "${cleanSigla}" já está em uso.` };
    }

    const updated = packagingTypes.map((pt) =>
      pt.sigla === oldSigla ? { sigla: cleanSigla, nome: cleanNome } : pt
    );
    setPackagingTypes(updated);

    // Update products using oldSigla
    let count = 0;
    const updatedProducts = products.map((p) => {
      if (p.unidade === oldSigla) {
        count++;
        return { ...p, unidade: cleanSigla };
      }
      return p;
    });
    if (count > 0) {
      setProducts(updatedProducts);
    }

    return {
      success: true,
      message: `Embalagem atualizada para "${cleanNome}" (${cleanSigla})${count > 0 ? ` em ${count} produto(s)` : ''}!`,
    };
  };

  const removePackagingType = (sigla: string): { success: boolean; message: string } => {
    if (packagingTypes.length <= 1) {
      return { success: false, message: 'O sistema deve possuir pelo menos um tipo de embalagem.' };
    }

    const remaining = packagingTypes.filter((pt) => pt.sigla !== sigla);
    setPackagingTypes(remaining);

    // Reassign products to fallback
    const fallback = remaining.find((pt) => pt.sigla === 'UN')?.sigla || remaining[0].sigla;
    let count = 0;
    const updatedProducts = products.map((p) => {
      if (p.unidade === sigla) {
        count++;
        return { ...p, unidade: fallback };
      }
      return p;
    });
    if (count > 0) {
      setProducts(updatedProducts);
    }

    return {
      success: true,
      message: `Embalagem "${sigla}" removida${count > 0 ? ` (${count} produto(s) atualizados para "${fallback}")` : ''}!`,
    };
  };

  const addUser = (username: string, pass: string, nivel: UserLevel): { success: boolean; message: string } => {
    if (!currentUser || currentUser.nivel !== 2) {
      return { success: false, message: 'Permissão negada. Apenas Administradores podem cadastrar novos usuários.' };
    }
    const cleanUser = username.trim();
    if (!cleanUser || !pass) {
      return { success: false, message: 'Informe nome de usuário e senha.' };
    }
    if (users.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      return { success: false, message: 'Já existe um usuário com este nome.' };
    }

    const roleName: 'Administrador' | 'Operador' =
      nivel === 2 ? 'Administrador' : 'Operador';
    const newUser: UserAccount = {
      username: cleanUser,
      passwordHash: pass,
      nivel,
      roleName,
      createdAt: getNowFormatted(),
    };

    setUsers([...users, newUser]);
    return { success: true, message: `Usuário "${cleanUser}" cadastrado com perfil ${roleName}!` };
  };

  const updateUserPassword = (username: string, newPass: string): { success: boolean; message: string } => {
    if (!currentUser || (currentUser.username !== username && currentUser.nivel !== 2)) {
      return { success: false, message: 'Permissão negada. Usuários Operadores não podem alterar a senha de outros usuários.' };
    }
    if (!newPass.trim()) return { success: false, message: 'A senha não pode ser vazia.' };
    const updated = users.map((u) => (u.username === username ? { ...u, passwordHash: newPass } : u));
    setUsers(updated);
    return { success: true, message: `Senha do usuário ${username} alterada!` };
  };

  const updateUserLevel = (username: string, newLevel: UserLevel): { success: boolean; message: string } => {
    if (!currentUser || currentUser.nivel !== 2) {
      return { success: false, message: 'Permissão negada. Usuários Operadores não podem alterar o nível de outros usuários.' };
    }
    if (username.toLowerCase() === 'willian' && newLevel !== 2) {
      return { success: false, message: 'O usuário Willian é o Administrador principal e não pode ter seu nível alterado.' };
    }
    const roleName: 'Administrador' | 'Operador' =
      newLevel === 2 ? 'Administrador' : 'Operador';
    const updated = users.map((u) => (u.username === username ? { ...u, nivel: newLevel, roleName } : u));
    setUsers(updated);
    return { success: true, message: `Nível de ${username} atualizado para ${roleName}!` };
  };

  const removeUser = (username: string): { success: boolean; message: string } => {
    if (!currentUser || currentUser.nivel !== 2) {
      return { success: false, message: 'Permissão negada. Usuários Operadores não podem excluir outros usuários.' };
    }
    if (username.toLowerCase() === 'willian') {
      return { success: false, message: 'O usuário Willian é o Administrador principal e não pode ser removido.' };
    }
    if (users.length <= 1) {
      return { success: false, message: 'Não é possível remover o único usuário do sistema.' };
    }
    if (currentUser?.username === username) {
      return { success: false, message: 'Você não pode remover seu próprio usuário logado.' };
    }
    setUsers(users.filter((u) => u.username !== username));
    return { success: true, message: `Usuário "${username}" removido com sucesso!` };
  };

  const exportBackupJson = (): string => {
    // Schema of estoque.json with added categorias and embalagens
    const estoqueArr = products.map((p) => [String(p.numero), p.nome, String(p.quantidade)]);
    const historicoArr = movements.map((m) => [m.dataHora, String(m.numero), m.produto, m.tipo, m.quantidade]);

    const backupObj = {
      estoque: estoqueArr,
      historico: historicoArr,
      categorias: categories,
      embalagens: packagingTypes,
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const importBackupJson = (jsonString: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.estoque || !Array.isArray(parsed.estoque)) {
        return { success: false, message: 'Formato inválido. Campo "estoque" não encontrado.' };
      }

      const importedProducts: StockProduct[] = parsed.estoque.map((item: any[], idx: number) => {
        const num = parseInt(item[0], 10) || idx + 1;
        const nome = String(item[1] || '').trim().toUpperCase();
        const qtd = parseInt(item[2], 10) || 0;
        return {
          id: `prod_imp_${num}_${Date.now()}`,
          numero: num,
          nome,
          quantidade: qtd,
          estoqueMinimo: 15,
          unidade: inferUnit(nome),
          categoria: inferCategory(nome),
          ultimaAtualizacao: getNowFormatted(),
        };
      });

      let importedMovements: StockMovement[] = [];
      if (parsed.historico && Array.isArray(parsed.historico)) {
        importedMovements = parsed.historico.map((m: any[], idx: number) => ({
          id: `mov_imp_${idx}_${Date.now()}`,
          dataHora: m[0] || getNowFormatted(),
          numero: parseInt(m[1], 10) || 0,
          produto: m[2] || '',
          tipo: m[3] === 'Entrada' ? 'Entrada' : 'Saída',
          quantidade: parseInt(m[4], 10) || 0,
          usuario: 'Backup',
        }));
      }

      if (parsed.categorias && Array.isArray(parsed.categorias) && parsed.categorias.length > 0) {
        setCategories(parsed.categorias);
      }

      if (parsed.embalagens && Array.isArray(parsed.embalagens) && parsed.embalagens.length > 0) {
        setPackagingTypes(parsed.embalagens);
      }

      setProducts(importedProducts);
      if (importedMovements.length > 0) {
        setMovements(importedMovements);
      }
      setLastUpdatedTime(getNowFormatted());

      return {
        success: true,
        message: `Backup importado com sucesso! ${importedProducts.length} produtos carregados.`,
      };
    } catch (e: any) {
      return { success: false, message: `Erro ao analisar JSON: ${e.message}` };
    }
  };

  const resetDataToInitial = () => {
    setProducts(INITIAL_PRODUCTS);
    setMovements(INITIAL_MOVEMENTS);
    setUsers(INITIAL_USERS);
    setCategories(INITIAL_CATEGORIES);
    setPackagingTypes(INITIAL_PACKAGING_TYPES);
    setLastUpdatedTime(getNowFormatted());
    localStorage.removeItem(LS_PRODUCTS_KEY);
    localStorage.removeItem(LS_MOVEMENTS_KEY);
    localStorage.removeItem(LS_USERS_KEY);
    localStorage.removeItem(LS_CATEGORIES_KEY);
    localStorage.removeItem(LS_PACKAGING_KEY);
  };

  return (
    <StockContext.Provider
      value={{
        products,
        movements,
        users,
        currentUser,
        categories,
        packagingTypes,
        stats,
        lastUpdatedTime,
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
