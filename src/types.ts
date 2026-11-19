/**
 * Types for WL System - Estoque Galpão
 */

export type UserLevel = 1 | 2;

export interface UserAccount {
  uid?: string;
  username: string;
  email?: string;
  passwordHash: string;
  nivel: UserLevel;
  roleName: 'Operador' | 'Administrador';
  role?: 'admin' | 'operator';
  active?: boolean;
  createdAt?: string;
}

export interface PackagingType {
  id?: string;
  sigla: string; // ex: 'FARDO', 'CX', 'SACO', 'GARRAFA', 'UN', 'LATA', 'BALDE'
  nome: string;  // ex: 'Caixa (CX)', 'Fardo', 'Saco', etc.
}

export interface StockProduct {
  id: string;
  numero: number;
  nome: string;
  quantidade: number;
  estoqueMinimo: number;
  unidade: string; // 'CX', 'FARDO', 'UN', 'SACO', etc.
  categoria: string; // 'Alimentos', 'Limpeza', 'Descartáveis', 'Bebidas', 'Outros'
  ultimaAtualizacao: string;
  inativo?: boolean;
}

export type MovementType = 'Entrada' | 'Saída';

export interface StockMovement {
  id: string;
  productId?: string;
  dataHora: string;
  numero: number;
  produto: string;
  tipo: MovementType;
  quantidade: number;
  usuario: string;
  userId?: string;
  saldoApos?: number;
  observacao?: string;
}

export interface SystemStats {
  totalProdutos: number;
  totalUnidades: number;
  produtosZerados: number;
  produtosEstoqueBaixo: number;
  produtosInativos?: number;
  totalEntradasMes: number;
  totalSaidasMes: number;
}
