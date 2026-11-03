import { StockProduct, StockMovement, UserAccount, PackagingType } from '../types';

export const INITIAL_CATEGORIES: string[] = [
  'Alimentos',
  'Limpeza',
  'Descartáveis',
  'Bebidas',
  'Outros',
];

export const INITIAL_PACKAGING_TYPES: PackagingType[] = [
  { sigla: 'FARDO', nome: 'FARDO' },
  { sigla: 'CX', nome: 'CAIXA (CX)' },
  { sigla: 'SACO', nome: 'SACO' },
  { sigla: 'GARRAFA', nome: 'GARRAFA / PET' },
  { sigla: 'UN', nome: 'UNIDADE (UN)' },
  { sigla: 'LATA', nome: 'LATA' },
  { sigla: 'BALDE', nome: 'BALDE' },
  { sigla: 'PACOTE', nome: 'PACOTE' },
];

export const INITIAL_USERS: UserAccount[] = [
  { username: 'Willian', passwordHash: '7548', nivel: 2, roleName: 'Administrador' },
  { username: 'Gislany', passwordHash: '123', nivel: 2, roleName: 'Administrador' },
  { username: 'admin', passwordHash: 'admin', nivel: 2, roleName: 'Administrador' },
  { username: 'super', passwordHash: 'superpass', nivel: 2, roleName: 'Administrador' },
  { username: 'Carla', passwordHash: '159', nivel: 1, roleName: 'Operador' },
  { username: 'Lanna', passwordHash: '123', nivel: 1, roleName: 'Operador' },
  { username: 'Jose', passwordHash: '123', nivel: 1, roleName: 'Operador' },
  { username: 'user1', passwordHash: 'pass1', nivel: 1, roleName: 'Operador' },
];

export function inferCategory(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('DETERGENTE') || upper.includes('SABÃO') || upper.includes('SABAO') || upper.includes('SODA SOL') || upper.includes('AMACIANTE') || upper.includes('AGUA SANITARIA') || upper.includes('DESINFETANTE') || upper.includes('PAPEL HIG')) {
    return 'Limpeza';
  }
  if (upper.includes('COPO') || upper.includes('PRATO') || upper.includes('FRALDA') || upper.includes('ABS ')) {
    return 'Descartáveis';
  }
  if (upper.includes('CACHAÇA') || upper.includes('CANINHA') || upper.includes('AGUA MINERAL')) {
    return 'Bebidas';
  }
  return 'Alimentos';
}

export function inferUnit(name: string): string {
  const upper = name.toUpperCase();
  if (upper.startsWith('CX ') || upper.includes(' CX ') || upper.includes('CAIXA')) return 'CX';
  if (upper.startsWith('FARDO ') || upper.startsWith('FRADO ') || upper.includes('FARDO')) return 'FARDO';
  if (upper.includes('SACO')) return 'SACO';
  if (upper.includes('LITRO') || upper.includes('PET') || upper.includes('LT')) return 'GARRAFA';
  return 'UN';
}

export const RAW_ESTOQUE: [string, string, string][] = [
  ["1", "CX SODA SOL POTE 1KG 12UNI", "177"],
  ["2", "FARINHA AMARELA 50KG", "3"],
  ["3", "FARINHA BRANCA SACO 50KG", "6"],
  ["4", "FARDO POLVILHO DOCE LOPES 1 KG 20X1", "35"],
  ["5", "FRADO MIX LOPES 25 KG", "190"],
  ["6", "FARDO SAL PREMIUM 30X1", "220"],
  ["7", "FARDO PAPEL HIGIÊNICO F.D MAX L 12 P11", "65"],
  ["8", "FARDO ARROZ BENTO 5X6", "224"],
  ["9", "CX COPO DESCARTAVEL 300ML C/20", "23"],
  ["10", "CX DETERGENTE YPÊ NEUTRO 500ML C/ 24 UN", "312"],
  ["11", "CX DETERGENTE YPÊ COCO 500ML C/24 UN", "165"],
  ["12", "CX CACHAÇA 51  C/12UN", "0"],
  ["13", "FARDO FECULA PINDUCA 1 KG C/ 20 UN", "298"],
  ["14", "CX CAFE MARATA VACUO 250GR 20UN", "725"],
  ["15", "FARDO LEITE PO CCGL 200G C/50UN", "49"],
  ["16", "FARDO FECULA DE MANDIOCA LOPES  25 KG", "94"],
  ["17", "FARDO POLVILHO AZEDO LOPES 1KG  (20UN)", "27"],
  ["18", "FARDO POLVILHO AZEDO 25KG", "45"],
  ["19", "FARDO ARROZ D`MAIS TIPO 1 / 5 KG", "79"],
  ["20", "FARDO LEITE PO CCGL 400G C/25UN", "49"],
  ["21", "CX COPO DESCARTAVEL IBRAS 150 ML", "0"],
  ["22", "CX COPO DESCARTAVEL IBRAS 180 ML", "0"],
  ["23", "FARDO MACARRÃO ESPAGUETE GALO 500G", "99"],
  ["24", "CX DETERGENTE YPÊ MAÇÃ C /24 UN", "0"],
  ["25", "FARDO AÇUCAR ITAJA 2KG C/15UN", "1000"],
  ["26", "CX OLEO SOJA COMIGO 900ML C/20 UN", "0"],
  ["27", "CX DETERGENTE YPÊ LIMÃO 500M/ C /24 UN", "90"],
  ["28", "FARDO TRIGO DONA BENTA S/ FERMENTO 1 KG C/10 UN", "120"],
  ["29", "FARDO TRIGO DONA BENTA C/ FERMENTO 1 KG C/ 10 UN", "60"],
  ["30", "FARDO TRIGO DONA BENTA S/ FERMENTO 25 KG", "250"],
  ["31", "CX ROSQUINHA RANCHEIRO 300G C/ 30 UN", "34"],
  ["32", "FARDO LEITE CCGL 1 KG C/ 10 UN", "120"],
  ["33", "FARDO ARROZ BUTUI T1 5KG C/6UN (AZUL)", "270"],
  ["34", "CX MACARRÃO SANDELLA N:1", "20"],
  ["35", "CX MACARRÃO SANDELLA N:2", "169"],
  ["36", "CX MACARRÃO SANDELLA N:3", "20"],
  ["37", "CX MACARRÃO SANDELLA N:7", "15"],
  ["38", "CX MACARRÃO SANDELLA N:9", "170"],
  ["39", "CX MACARRÃO SANDELLA N:10", "38"],
  ["40", "CX MACARRÃO SANDELLA CARNE SECA C/ MANTEIGA ", "20"],
  ["41", "CX MACARRAÃO SANDELLA FRANGO C/ PEQUI N:20", "20"],
  ["42", "CX SABAO TIXAN PRIMAVERA 800G C/ 24 UN", "50"],
  ["43", "CX SABÃO TIXAN PRIMAVERA 9X1,6KG", "25"],
  ["44", "CX SABÃO TIXAN MACIEZ 9X1,6 KG", "40"],
  ["45", "FARDO MIX LOPES 1 KG 20X1", "115"],
  ["46", "CX TAPIOCA HIDRATADA LOPES 1 KG", "60"],
  ["47", "CX TAPIOCA HIDRATADA LOPES 500G", "50"],
  ["48", "CX BISCOITO AGUIA BRANDINI 360G C/20 UN", "140"],
  ["49", "FARDO ARROZ BOM DE MESA TIPO 1 5 KG", "857"],
  ["50", "FARDO ARROZ BENTO 1 KG 30X1", "100"],
  ["51", "FARDO POLVILHO DOCE PINDUCA 1KG C/12", "150"],
  ["52", "FARDO PAPEL HIGIÊNICO MAX 4X1 FOLHA DUPLA", "100"],
  ["53", "CX CAFE PINGO DE OURO A VACUO 250G", "100"],
  ["54", "CX CAFE RANCHEIRO EXTRA FORTE 250G C/20UN", "95"],
  ["55", "CX CAFE RANCHEIRO TRADICIONAL 250GR C/20UN", "395"],
  ["56", "FARDO LEITE PÓ CCGL 200G C/ 50 UN", "130"],
  ["57", "FARDO PAPEL HIGIÊNICO VELUD L12 P11", "133"]
];

export const INITIAL_PRODUCTS: StockProduct[] = RAW_ESTOQUE.map(([numStr, nome, qtdStr]) => {
  const numero = parseInt(numStr, 10);
  const quantidade = parseInt(qtdStr, 10);
  return {
    id: `prod_${numero}`,
    numero,
    nome,
    quantidade,
    estoqueMinimo: 15,
    unidade: inferUnit(nome),
    categoria: inferCategory(nome),
    ultimaAtualizacao: '27/10/2026 11:13'
  };
});

export const RAW_HISTORICO: [string, string, string, string, number][] = [
  ["06/06/2025 08:43", "32", "ARROZ GIRASSOL 5KG", "Entrada", 40],
  ["06/06/2025 08:43", "33", "ARROZ GIRASSOL 1KG", "Entrada", 10],
  ["06/06/2025 14:54", "34", "TRIGO DONA BENTA S/FERMENTO 1KG", "Entrada", 150],
  ["06/06/2025 14:54", "35", "TRIGO DONA BENTA C/FERMENTO 1KG", "Entrada", 70],
  ["06/06/2025 14:58", "8", "Papel higiênico Max 4 rolos", "Entrada", 50],
  ["07/06/2025 10:04", "27", "Arroz Bento 5 kg", "Entrada", 111],
  ["07/06/2025 10:04", "27", "Arroz Bento 5 kg", "Saída", 222],
  ["07/06/2025 10:05", "1", "Soda sol 1 kg", "Saída", 20],
  ["09/06/2025 10:01", "27", "Arroz Bento 5 kg", "Saída", 54],
  ["09/06/2025 10:01", "21", "Fécula Lopes 25kg", "Saída", 22],
  ["09/06/2025 10:01", "22", "Mix Lopes 25kg", "Saída", 12],
  ["10/06/2025 11:32", "32", "ARROZ GIRASSOL 5KG", "Saída", 40],
  ["10/06/2025 11:32", "33", "ARROZ GIRASSOL 1KG", "Entrada", 40],
  ["10/06/2025 11:32", "33", "ARROZ GIRASSOL 1KG", "Saída", 50],
  ["10/06/2025 11:33", "34", "TRIGO DONA BENTA S/FERMENTO 1KG", "Saída", 50],
  ["10/06/2025 11:33", "1", "Soda sol 1 kg", "Saída", 15],
  ["10/06/2025 11:33", "2", "Soda sol 500g", "Saída", 15],
  ["25/06/2025 08:48", "40", "FARDO FEIJÃO KICALDO CARIOCA 10UN", "Entrada", 445],
  ["25/06/2025 08:48", "41", "FARDO FEIJÃO KICALDO PRETO (com 10 und)", "Entrada", 60],
  ["26/06/2025 14:28", "42", "FARDO ACUCAR CRISTAL ECOCUCAR 2KG C/15UN", "Entrada", 200],
  ["24/07/2025 14:50", "45", "CX DETERGENTE YPE MACA 500ML 24UNI", "Entrada", 30],
  ["24/07/2025 14:50", "46", "CX DETERGENTE YPE NEUTRO 500ML 24UN", "Entrada", 120],
  ["30/07/2025 10:08", "27", "FARDO ARROZ BENTO T1 5KG C/6UN", "Saída", 55],
  ["09/08/2025 08:59", "1", "CX SODA SOL POTE 1KG 12UNI", "Saída", 97],
  ["17/08/2025 10:48", "1", "CX SODA SOL POTE 1KG 12UNI", "Entrada", 178],
  ["17/08/2025 10:51", "32", "FARDO ARROZ BUTUI TIPO 1 6X5 KG", "Entrada", 300],
  ["19/08/2025 10:08", "11", "CX CAFE MARATA VACUO 250GR 20UN", "Entrada", 262],
  ["28/08/2025 09:14", "10", "FARDO FECULA DE MANDIOCA LOPES  25 KG", "Entrada", 30],
  ["28/08/2025 09:18", "23", "FARDO MIX LOPES 1KG C/30UN", "Entrada", 100],
  ["28/08/2025 09:19", "24", "FARDO POVILHO DE MANDIOCA MIX LOPES 25 KG", "Entrada", 140],
  ["16/09/2025 08:38", "24", "FARDO ARROZ BRANCO PAINHO 5KG 6X5", "Entrada", 250],
  ["16/09/2025 15:18", "26", "OLEO SOJA VITALIV PET 900ML C/20UN", "Entrada", 470],
  ["27/09/2025 18:18", "26", "FARDO ARROZ BRANCO BENTO 5 KG 6X5", "Entrada", 1380],
  ["17/10/2025 08:52", "19", "FARDO FEIJÃO CARIOCA KICALDO 1 KG 10X1", "Entrada", 800],
  ["28/10/2025 12:09", "1", "CX SODA SOL POTE 1KG 12UNI", "Entrada", 198],
  ["28/10/2025 12:33", "21", "FARDO POLVILHO DOCE LOPES 1 KG 20X1", "Entrada", 135],
  ["28/10/2025 12:34", "23", "FARDO SAL PREMIUM 1 KG 30X1", "Entrada", 300],
  ["28/10/2025 12:38", "26", "CX DETERGENTE YPÊ NEUTRO C/24 UN", "Entrada", 149],
  ["11/11/2025 10:58", "1", "CX SODA SOL POTE 1KG 12UNI", "Entrada", 300],
  ["17/11/2025 15:00", "10", "FARDO ARROZ BRANCO BENTO 5 KG 6X5", "Entrada", 1200],
  ["21/11/2025 07:29", "27", "CX SABÃO EM PÓ PRIMAVERA 1,6KG 9X1", "Entrada", 110],
  ["21/11/2025 07:32", "29", "CX DETERGENTE YPÊ CÔCO C/24UN", "Entrada", 110],
  ["21/11/2025 07:33", "30", "CX DETERGENTE YPÊ NEUTRO C/24UN", "Entrada", 260],
  ["10/12/2025 08:17", "8", "FARDO ARROZ BRANCO PAINHO 5KG 6X5", "Entrada", 600],
  ["29/01/2026 14:16", "23", "FARDO ARROZ BUTUI T1 5KG C/6UN (AZUL)", "Entrada", 600],
  ["29/01/2026 14:16", "24", "FARDO ARROZ PAINHO TP1 5KG C/6UN", "Entrada", 601],
  ["06/02/2026 12:25", "18", "CX MACARRÃO SANDELLA N:2", "Entrada", 150],
  ["06/02/2026 12:25", "19", "CX MACARRÃO SANDELLA N:3", "Entrada", 170],
  ["06/02/2026 12:26", "21", "CX MACARRÃO SANDELLA N:9", "Entrada", 151],
  ["05/03/2026 10:43", "26", "CX SODA SOL POTE 1KG 12UNI", "Entrada", 350],
  ["05/03/2026 10:45", "14", "FARDO ARROZ BUTUI T1 5KG C/6UN (AZUL)", "Entrada", 580],
  ["06/03/2026 17:52", "1", "CX SODA SOL POTE 1KG 12UNI", "Entrada", 361],
  ["11/03/2026 15:03", "27", "CX DETERGENTE YPE NEUTRO 500ML 24UN", "Entrada", 225],
  ["11/03/2026 15:04", "27", "CX DETERGENTE YPE NEUTRO 500ML 24UN", "Entrada", 225],
  ["11/03/2026 15:09", "8", "CX DETERGENTE YPÊ CÔCO C/24UN", "Entrada", 200],
  ["11/03/2026 15:10", "9", "CX DETERGENTE YPÊ MAÇÃ C/24UN", "Entrada", 150],
  ["25/03/2026 11:14", "19", "FARDO ARROZ BENTO 5 KG C/6 UN", "Entrada", 1200],
  ["25/03/2026 11:17", "29", "CX MACARRÃO SANDELLA N: 9", "Entrada", 200],
  ["01/04/2026 17:59", "12", "FARDO ARROZ PAINHO TP1 5KG C/6UN", "Entrada", 500],
  ["17/04/2026 19:03", "34", "FARDO ARRROZ AMERICANO 5 KG 6X5", "Entrada", 300],
  ["25/04/2026 09:42", "30", "FRADO SAL PREMIUM 30X1", "Entrada", 834],
  ["25/04/2026 18:55", "31", "CX MACARRÃO SANDELLA N:2", "Entrada", 300],
  ["25/04/2026 18:57", "34", "CX MACARRÃO SANDELLA N: 9", "Entrada", 295],
  ["27/04/2026 19:20", "34", "FARDO AGUA MINERAL DAFONTE 500ML 12X1", "Entrada", 800],
  ["29/04/2026 09:41", "22", "FARDO FECULA MANDIOCA LOPES 20X1", "Entrada", 150],
  ["29/04/2026 09:42", "12", "FARDO POLVILHO AZEDO 25KG UN", "Entrada", 100],
  ["06/06/2026 15:48", "38", "FARDO ARROZ BENTO 5X6", "Entrada", 1000],
  ["17/06/2026 13:31", "5", "FARDO ARROZ BUTUI T1 5KG C/6UN (AZUL)", "Entrada", 320],
  ["19/06/2026 10:14", "13", "CX MACARRÃO SANDELLA N:2", "Entrada", 327],
  ["19/06/2026 10:15", "16", "CX MACARRÃO SANDELLA N: 9", "Entrada", 250],
  ["19/06/2026 10:19", "27", "CX CAFE RANCHEIRO TRADICIONAL 250G 20X1", "Entrada", 277],
  ["17/07/2026 11:04", "34", "CX DETERGENTE YPÊ NEUTRO 500ML C/ 24 UN", "Entrada", 250],
  ["17/07/2026 11:05", "35", "CX DETERGENTE YPÊ COCO 500ML C/24 UN", "Entrada", 150],
  ["17/07/2026 13:01", "22", "FARDO ARROZ BENTO 5X6", "Entrada", 1100],
  ["23/07/2026 10:04", "1", "CX SODA SOL POTE 1KG 12UNI", "Entrada", 300],
  ["24/07/2026 15:52", "40", "CX CAFE MARATA VACUO 250GR 20UN", "Entrada", 500],
  ["08/09/2026 18:45", "53", "FARDO AÇUCAR ITAJA 2KG C/15UN", "Entrada", 970],
  ["14/09/2026 12:29", "54", "CX OLEO SOJA COMIGO 900ML C/20 UN", "Entrada", 407],
  ["21/09/2026 12:10", "53", "FARDO TRIGO DONA BENTA S/ FERMENTO 1 KG C/10 UN", "Entrada", 250],
  ["21/09/2026 12:11", "55", "FARDO TRIGO DONA BENTA S/ FERMENTO 25 KG", "Entrada", 270],
  ["30/09/2026 09:10", "44", "FARDO ARROZ BUTUI T1 5KG C/6UN (AZUL)", "Entrada", 725],
  ["02/10/2026 12:54", "43", "CX MACARRÃO SANDELLA N:2", "Entrada", 300],
  ["02/10/2026 12:55", "46", "CX MACARRÃO SANDELLA N:9", "Entrada", 250],
  ["17/10/2026 16:51", "50", "FARDO ARROZ BOM DE MESA TIPO 1 5 KG", "Entrada", 857],
  ["20/10/2026 10:56", "13", "FARDO FECULA PINDUCA 1 KG C/ 20 UN", "Entrada", 300],
  ["20/10/2026 10:57", "52", "FARDO POLVILHO DOCE PINDUCA 1KG C/12", "Entrada", 150],
  ["22/10/2026 13:34", "33", "FARDO ARROZ BUTUI T1 5KG C/6UN (AZUL)", "Entrada", 387],
  ["23/10/2026 09:25", "55", "CX CAFE RANCHEIRO TRADICIONAL 250GR C/20UN", "Entrada", 400],
  ["26/10/2026 09:16", "35", "CX MACARRÃO SANDELLA N:2", "Saída", 50],
  ["26/10/2026 09:16", "38", "CX MACARRÃO SANDELLA N:9", "Saída", 50],
  ["26/10/2026 11:58", "6", "FARDO SAL PREMIUM 30X1", "Saída", 10],
  ["26/10/2026 11:59", "55", "CX CAFE RANCHEIRO TRADICIONAL 250GR C/20UN", "Saída", 5],
  ["26/10/2026 12:00", "45", "FARDO MIX LOPES 1 KG 20X1", "Saída", 5],
  ["26/10/2026 18:29", "56", "FARDO LEITE PÓ CCGL 200G C/ 50 UN", "Entrada", 130],
  ["27/10/2026 09:28", "57", "FARDO PAPEL HIGIÊNICO VELUD L12 P11", "Entrada", 154],
  ["27/10/2026 09:28", "57", "FARDO PAPEL HIGIÊNICO VELUD L12 P11", "Saída", 21],
  ["27/10/2026 09:29", "9", "CX COPO DESCARTAVEL 300ML C/20", "Saída", 5],
  ["27/10/2026 09:30", "13", "FARDO FECULA PINDUCA 1 KG C/ 20 UN", "Saída", 6],
  ["27/10/2026 11:12", "24", "CX DETERGENTE YPÊ MAÇÃ C /24 UN", "Saída", 50],
  ["27/10/2026 11:13", "43", "CX SABÃO TIXAN PRIMAVERA 9X1,6KG", "Saída", 16]
];

export const INITIAL_MOVEMENTS: StockMovement[] = RAW_HISTORICO.map(([dataHora, numStr, prod, tipo, qtd], index) => {
  return {
    id: `mov_${index + 1}`,
    dataHora,
    numero: parseInt(numStr, 10),
    produto: prod,
    tipo: (tipo === 'Entrada' ? 'Entrada' : 'Saída') as 'Entrada' | 'Saída',
    quantidade: qtd,
    usuario: index % 2 === 0 ? 'Willian' : 'Operador',
    observacao: 'Registro histórico'
  };
});
