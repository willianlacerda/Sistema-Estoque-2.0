/**
 * Types for WL System - Estoque Galpão
 */

export type UserLevel = 1 | 2;

export interface UserAccount {
  username: string;
  passwordHash: string; // Plaintext or hashed for this system
  nivel: UserLevel;
  roleName: 'Operador' | 'Administrador';
  createdAt?: string;
}

export interface PackagingType {
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
  dataHora: string;
  numero: number;
  produto: string;
  tipo: MovementType;
  quantidade: number;
  usuario: string;
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
