# WL System - Sistema de Gestão de Estoque Galpão

Sistema moderno de controle e gestão de estoque para galpão e distribuição (DM Santos Empreendimentos / WL System), migrado de PyQt5 para arquitetura Web moderna (React 19, TypeScript, Tailwind CSS v4, Lucide Icons), incluindo pré-carregamento dos 57 itens reais e histórico de movimentações, controle de acesso multi-nível (Operador, Gerente, Administrador), busca em tempo real, lançamento ágil de entradas/saídas com validação de saldo e exportação de relatórios em PDF e CSV.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões confirmadas pelo usuário:**
> 1. **Escopo focado no Estoque**: O sistema será dedicado exclusivamente ao módulo de Estoque Galpão, controle de entradas/saídas, inventário e histórico detalhado.
> 2. **Carga inicial de dados reais**: Serão importados os 57 produtos reais com suas quantidades atuais e o histórico completo de movimentações provenientes de `estoque.json`.
> 3. **Autenticação Multi-Nível**: Sistema de login por perfil com 3 níveis (Nível 1 - Operador, Nível 2 - Gerente, Nível 3 - Administrador) pré-configurado com as contas existentes (`Willian`, `Carla`, `admin`, `super`, etc.).

- **Identidade Visual**: Uso da logomarca oficial da DM Santos Empreendimentos (`/public/assets/aistudio/logo_9288734e.png`), paleta institucional verde esmeralda (`#16a34a` / `#15803d` / `#2e7d32`) e cinzas corporativos de alto contraste.
- **Persistência de Dados**: Armazenamento reativo no navegador via `localStorage` com opção de backup/restauração em JSON idêntico ao modelo original.

---

## 1. Overview & Core Concept

- **O que faz**: Permite que operadores e gerentes de galpão gerenciem o estoque físico de mercadorias (fardos, caixas, alimentos, descartáveis e limpeza), efetuem registros instantâneos de entrada (recebimento de fornecedor) e saída (carregamento/vendas), consultem histórico completo de movimentações com data/hora e usuário, recebam alertas de estoque baixo e gerem relatórios em PDF no padrão do galpão.
- **Público-alvo**: Operadores de logística, estoquistas, supervisores de expedição e diretores da DM Santos Empreendimentos.
- **Valor Principal**: Interface rápida, intuitiva e à prova de falhas (evita saídas maiores que o saldo em estoque, oferece busca instantânea por nome ou número do item e elimina a necessidade de instalação de software desktop).

---

## 2. User Experience & Visual Design

### Fluxos Principais
1. **Login & Seleção de Perfil**: Tela de login moderna com identificação de usuário e senha, direcionando automaticamente para as permissões correspondentes (Nível 1, 2 ou 3).
2. **Visão Geral & Indicadores**:
   - Total de itens cadastrados no galpão.
   - Volume total de unidades em estoque.
   - Alertas de itens sem estoque (zerados) e itens com estoque crítico.
   - Total de movimentações do mês/dia.
3. **Tabela Interativa de Estoque**:
   - Colunas: `Nº`, `Produto`, `Entrada Rápida`, `Saída Rápida`, `Qtd Atual`, `Status`, `Ações`.
   - Busca em tempo real por nome (com suporte a fragmentos) ou número de código.
   - Botões de incremento/decremento com modal de confirmação rápida e validação de quantidade disponível.
   - Filtros de estado: Todos, Em Falta (0 un), Estoque Baixo, Em Estoque.
4. **Aba de Histórico de Movimentações**:
   - Registro cronológico decrescente de todas as entradas e saídas.
   - Badges tipográficos verdes para Entrada e vermelhos para Saída.
   - Filtro por período (de / até) e por termo de busca ou tipo.
5. **Painel de Usuários (Apenas Administrador - Nível 3)**:
   - Adicionar novo usuário, alterar senha, alterar nível de acesso e remover.
6. **Exportação de Relatórios**:
   - Geração de relatório PDF formatado com o layout exato dos relatórios do Galpão (cabeçalho verde institucional, data/hora de emissão, tabela zebrada e paginação limpa).
   - Exportação em planilha CSV para controle contábil.

### Identidade Visual & Tipografia
- **Tipografia**: `Plus Jakarta Sans` para títulos e botões; algarismos tabulares (`font-mono tabular-nums`) em quantidades e datas.
- **Cores & Tema**:
  - Dominante: Branco puro e ardósia suave (`bg-slate-50`, `bg-white`).
  - Destaque Institucional: Verde esmeralda galpão (`#15803d` / `#16a34a`), correspondendo à identidade DM Santos.
  - Alertas Semânticos: Âmbar (`#d97706`) para estoque baixo; vermelho carmesim (`#dc2626`) para faltas e saídas.
- **Design Sem Clichês**: Sem pílulas estáticas redundantes, sem gráficos falsos, tipografia equilibrada, densidade agradável de leitura para operação de armazém.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Arquitetura Web SPA em React + TypeScript + Tailwind CSS**
  - *Abordagem*: Substituir a interface desktop PyQt5 por uma aplicação web responsiva de alta performance rodando no navegador.
  - *Por quê*: Permite acesso simultâneo em computadores do galpão, tablets ou smartphones sem instalar Python ou dependências Qt.
- **Decisão 2: Importação Integrada dos Dados Reais**
  - *Abordagem*: Carregar diretamente os 57 produtos reais catalogados e os registros históricos contidos em `estoque_6614dfac.json`, mantendo a consistência dos códigos numéricos e nomes originais.
  - *Por quê*: O cliente continua operando sem perda do inventário nem do histórico acumulado.
- **Decisão 3: Níveis de Permissão Granulares**
  - *Abordagem*: Nível 1 pode apenas movimentar e consultar; Nível 2 pode cadastrar/editar itens; Nível 3 pode excluir itens e gerenciar usuários.
  - *Por quê*: Previne exclusões acidentais na rotina diária do galpão.

---

## 4. Technical Architecture & Data Strategy

### Diagrama do Sistema

```
┌───────────────────────────────────────────────────────────────┐
│                 WL System - Estoque Galpão                    │
├───────────────────────────────┬───────────────────────────────┤
│          Nível 1              │           Nível 2 / 3         │
│         (Operador)            │       (Gerente / Admin)       │
└───────────────┬───────────────┴───────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────────────────────────────────────────┐
│                       Camada de Apresentação                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  TopBar & Auth  │  │ Dashboard KPIs  │  │ Relatórios PDF │ │
│  └─────────────────┘  └─────────────────┘  └────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │   Abas: [ 📦 Estoque ] | [ 📜 Histórico ] | [ 👥 Usuários ]│ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     Gestão de Estado & Lógica                 │
│  • Validação de Saldo (Saída ≤ Saldo Atual)                  │
│  • Registro Automático em Histórico com Timestamp e Usuário   │
│  • Motor de Busca & Filtro por Código / Nome                  │
│  • Exportador PDF / CSV Client-Side                           │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                   Persistência de Dados                       │
│  • LocalStorage (Chaves: `wl_estoque_v1`, `wl_historico_v1`) │
│  • Pré-carregamento com `estoque.json` e `users.json`         │
│  • Backup & Restauração JSON (Compatível com PyQt5)           │
└───────────────────────────────────────────────────────────────┘
```

### Estrutura de Dados
- **Produto**:
  ```ts
  interface Product {
    id: number;
    numero: string;
    nome: string;
    quantidade: number;
    minEstoque?: number;
    categoria?: string;
    ultimaAtualizacao: string;
  }
  ```
- **Movimentação (Histórico)**:
  ```ts
  interface MovementRecord {
    id: string;
    dataHora: string;
    numero: string;
    produto: string;
    tipo: 'Entrada' | 'Saída';
    quantidade: number;
    usuario?: string;
    observacao?: string;
  }
  ```
- **Usuário**:
  ```ts
  interface User {
    username: string;
    nivel: 1 | 2 | 3;
    nomeCompleto?: string;
  }
  ```

---

## 5. Implementation Steps

1. **Estrutura de Dados & Mock Inicial**: Criar dataset com os 57 itens e histórico real convertidos de `estoque_6614dfac.json` e as contas de `users_a0211500.json`.
2. **Contexto & Hook de Estoque**: Implementar gerenciamento de estado persistente com operações atômicas (`adicionarProduto`, `registrarEntrada`, `registrarSaida`, `editarProduto`, `removerProduto`).
3. **Módulo de Autenticação**: Tela de login com visual elegante da DM Santos, autenticação por usuário/senha e controle de permissões.
4. **Interface Principal de Estoque**: Tabela de produtos com busca inteligente, filtros de estoque, atalhos de entrada/saída direta, modal de detalhes e formulário de novo item.
5. **Aba de Histórico**: Tabela de movimentações cronológicas com paginação, busca e filtros rápidos.
6. **Módulo de Gestão de Usuários (Nível 3)**: Adicionar, editar senhas, níveis e remover contas.
7. **Exportação de Relatórios PDF & CSV**: Motor de impressão e geração de PDF com cabeçalho institucional idêntico aos relatórios anexados.
8. **Verificação & Testes**: Validar todas as interações, responsividade e compilação TypeScript limpa.
