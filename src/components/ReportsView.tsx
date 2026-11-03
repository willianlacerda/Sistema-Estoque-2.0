import React, { useState, useMemo, useEffect } from 'react';
import { useStock } from '../context/StockContext';
import {
  FileSpreadsheet,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Boxes,
  Calendar,
  User,
  RotateCw,
  FileText,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsView: React.FC = () => {
  const { products, lastUpdatedTime, currentUser, categories: contextCategories } = useStock();

  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'em_estoque' | 'baixo' | 'zerados' | 'inativos'>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<'numero' | 'nome' | 'quantidade_desc' | 'quantidade_asc'>('numero');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>(contextCategories);
    products.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set).sort();
  }, [products, contextCategories]);

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search term (name or number)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesName = p.nome.toLowerCase().includes(term);
          const matchesNum = p.numero.toString().includes(term);
          if (!matchesName && !matchesNum) return false;
        }

        // Status filter
        if (statusFilter === 'inativos') {
          if (!p.inativo) return false;
        } else {
          if (p.inativo) return false;
          if (statusFilter === 'em_estoque' && p.quantidade <= 0) return false;
          if (statusFilter === 'zerados' && p.quantidade > 0) return false;
          if (statusFilter === 'baixo' && (p.quantidade <= 0 || p.quantidade > p.estoqueMinimo)) return false;
        }

        // Category filter
        if (selectedCategory !== 'todas' && p.categoria !== selectedCategory) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'numero') return a.numero - b.numero;
        if (sortBy === 'nome') return a.nome.localeCompare(b.nome);
        if (sortBy === 'quantidade_desc') return b.quantidade - a.quantidade;
        if (sortBy === 'quantidade_asc') return a.quantidade - b.quantidade;
        return 0;
      });
  }, [products, searchTerm, statusFilter, selectedCategory, sortBy]);

  // Summary Metrics
  const totalItens = filteredProducts.length;
  const totalUnidades = filteredProducts.reduce((acc, p) => acc + p.quantidade, 0);
  const totalZerados = filteredProducts.filter((p) => p.quantidade <= 0).length;
  const totalBaixos = filteredProducts.filter((p) => p.quantidade > 0 && p.quantidade <= 10).length;

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5500);
  };

  const [circularLogoUrl, setCircularLogoUrl] = useState<string | null>(null);

  const getLogoDataUrl = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 512;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Measurements of the green circle inside the 1392x1130 image:
            // x: 212, y: 81, w: 969, h: 973
            const nw = img.naturalWidth || 1392;
            const nh = img.naturalHeight || 1130;
            const sx = (212 / 1392) * nw;
            const sy = (81 / 1130) * nh;
            const sw = (969 / 1392) * nw;
            const sh = (973 / 1130) * nh;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch {
          // ignore
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = '/assets/aistudio/Emblema_circular_verde_e_amarelo_recortado_851a632b.png';
    });
  };

  useEffect(() => {
    getLogoDataUrl().then((dataUrl) => {
      if (dataUrl) setCircularLogoUrl(dataUrl);
    });
  }, []);

  const handleGeneratePdf = async () => {
    try {
      setIsGeneratingPdf(true);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
      const margin = 12;
      const contentWidth = pageWidth - margin * 2; // 186mm

      // 1. Top Header Background (Deep Midnight Navy Slate - Cor Oficial do Sistema #0f172a)
      doc.setFillColor(15, 23, 42); // #0f172a
      doc.rect(0, 0, pageWidth, 35, 'F');

      // Top Header System Brand Accent Stripes (Emerald Green #10b981 + Amber Yellow #f59e0b)
      doc.setFillColor(16, 185, 129); // #10b981 Emerald
      doc.rect(0, 35, pageWidth, 1.4, 'F');
      doc.setFillColor(245, 158, 11); // #f59e0b Amber / Gold
      doc.rect(0, 36.4, pageWidth, 0.8, 'F');

      // 2. Logo Branding (Aspecto 1:1 Perfeitamente Redondo)
      const logoData = circularLogoUrl || (await getLogoDataUrl());
      if (logoData) {
        try {
          doc.addImage(logoData, 'PNG', margin, 6, 22, 22);
        } catch {
          // fallback if addImage fails
        }
      } else {
        // Fallback Circular Emblem
        doc.setFillColor(16, 185, 129);
        doc.circle(margin + 11, 17, 11, 'F');
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.6);
        doc.circle(margin + 11, 17, 10.2, 'D');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('WL', margin + 11, 20.5, { align: 'center' });
      }

      const textStartX = margin + 26; // 38mm

      // Header Brand Titles (Nome completo sem cortes)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14.5);
      doc.text('WL SYSTEM', textStartX, 12);

      // Badge PRO
      doc.setFillColor(245, 158, 11); // amber-500
      doc.roundedRect(textStartX + 31, 8.5, 9.5, 4.2, 0.8, 0.8, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('PRO', textStartX + 35.75, 11.6, { align: 'center' });

      // Subtítulo completo oficial
      doc.setFontSize(7.1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 211, 153); // emerald-400 do sistema
      doc.text('DM SANTOS EMPREENDIMENTOS · GESTÃO INTEGRADA DE ESTOQUE', textStartX, 17.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(251, 191, 36); // amber-400 do sistema
      doc.text('RELATÓRIO OFICIAL DE INVENTÁRIO FÍSICO', textStartX, 25);

      // Metadata Box (Top Right Card - Estilo Card do Sistema #0b0f19)
      const metaBoxW = 70;
      const metaBoxH = 26;
      const metaBoxX = pageWidth - margin - metaBoxW; // 210 - 12 - 70 = 128mm (sobra mais de 15mm até o título da esquerda)
      const metaBoxY = 4.5;

      doc.setFillColor(11, 15, 25); // #0b0f19
      doc.setDrawColor(51, 65, 85); // border-slate-700
      doc.setLineWidth(0.3);
      doc.roundedRect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, 2.2, 2.2, 'FD');

      // Nomes de cima legíveis, nítidos e proporcionais
      doc.setFontSize(7.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(241, 245, 249); // slate-100 alto contraste

      doc.text(`EMISSÃO: ${lastUpdatedTime}`, metaBoxX + 3.5, metaBoxY + 5.6);
      doc.text(
        `RESPONSÁVEL: ${currentUser?.username || 'Willian'} (${currentUser?.roleName || 'Administrador'})`,
        metaBoxX + 3.5,
        metaBoxY + 11.0,
        { maxWidth: metaBoxW - 6 }
      );
      doc.text('LOCAL: Galpão DM Santos (Central)', metaBoxX + 3.5, metaBoxY + 16.0);

      const filterLabel =
        statusFilter === 'todos'
          ? 'CATÁLOGO ATIVO'
          : statusFilter === 'baixo'
          ? 'ESTOQUE BAIXO'
          : statusFilter === 'zerados'
          ? 'ZERADOS'
          : 'INATIVOS';
      const catLabel = selectedCategory === 'todas' ? 'TODAS AS CATEGORIAS' : selectedCategory.toUpperCase();

      // Linha sutil separadora interna
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.2);
      doc.line(metaBoxX + 3, metaBoxY + 18.2, metaBoxX + metaBoxW - 3, metaBoxY + 18.2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(251, 191, 36); // amber-400
      doc.text(`FILTRO: ${filterLabel} · ${catLabel}`, metaBoxX + 3.5, metaBoxY + 22.8, {
        maxWidth: metaBoxW - 6,
      });

      // 3. 4 Executive Summary Metric Cards (Alinhados com as cores dos cartões do sistema)
      const cardY = 40;
      const cardH = 14;
      const cardW = 44;
      const gap = (contentWidth - cardW * 4) / 3; // ~3.33mm

      const cardsData = [
        {
          label: 'CATÁLOGO ATIVO',
          val: `${totalItens}`,
          sub: 'itens listados',
          bg: [236, 253, 245], // emerald-50
          border: [167, 243, 208], // emerald-200
          accent: [16, 185, 129], // emerald-500 (#10b981)
          valColor: [5, 150, 105], // emerald-600
          labelColor: [4, 120, 87], // emerald-700
        },
        {
          label: 'SALDO FÍSICO TOTAL',
          val: `${totalUnidades.toLocaleString('pt-BR')}`,
          sub: 'unidades no galpão',
          bg: [240, 253, 250], // teal-50
          border: [153, 246, 228], // teal-200
          accent: [13, 148, 136], // teal-600 (#0d9488)
          valColor: [15, 118, 110], // teal-600
          labelColor: [17, 94, 89], // teal-700
        },
        {
          label: 'ESTOQUE BAIXO',
          val: `${totalBaixos}`,
          sub: 'precisam reposição',
          bg: [255, 251, 235], // amber-50
          border: [253, 230, 138], // amber-200
          accent: [245, 158, 11], // amber-500 (#f59e0b)
          valColor: [217, 119, 6], // amber-600
          labelColor: [180, 83, 9], // amber-700
        },
        {
          label: 'SALDO ZERADO (FALTA)',
          val: `${totalZerados}`,
          sub: 'itens em falta',
          bg: [255, 241, 242], // rose-50
          border: [254, 205, 211], // rose-200
          accent: [244, 63, 94], // rose-500 (#f43f5e)
          valColor: [225, 29, 72], // rose-600
          labelColor: [190, 18, 60], // rose-700
        },
      ];

      cardsData.forEach((c, idx) => {
        const cX = margin + idx * (cardW + gap);
        doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
        doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
        doc.roundedRect(cX, cardY, cardW, cardH, 1.8, 1.8, 'FD');

        doc.setFillColor(c.accent[0], c.accent[1], c.accent[2]);
        doc.rect(cX, cardY, cardW, 1, 'F');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(c.labelColor[0], c.labelColor[1], c.labelColor[2]);
        doc.text(c.label, cX + 3.5, cardY + 4.5);

        doc.setFontSize(11.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(c.valColor[0], c.valColor[1], c.valColor[2]);
        doc.text(c.val, cX + 3.5, cardY + 9.8);

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(c.sub, cX + 3.5, cardY + 12.8);
      });

      // 4. Table Construction
      const tableHead = [
        ['Nº', 'DESCRIÇÃO DO PRODUTO', 'CATEGORIA', 'UNID', 'MÍN.', 'SALDO FÍSICO', 'SITUAÇÃO'],
      ];

      const tableBody = filteredProducts.map((p) => {
        let statusLabel = 'REGULAR';
        if (p.inativo) {
          statusLabel = 'INATIVO';
        } else if (p.quantidade <= 0) {
          statusLabel = 'ZERADO';
        } else if (p.quantidade <= p.estoqueMinimo) {
          statusLabel = 'BAIXO';
        }

        return [
          String(p.numero),
          p.nome.toUpperCase(),
          (p.categoria || 'Geral').toUpperCase(),
          p.unidade || 'UN',
          `${p.estoqueMinimo} ${p.unidade || 'UN'}`,
          `${p.quantidade.toLocaleString('pt-BR')} ${p.unidade || 'UN'}`,
          statusLabel,
        ];
      });

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 57.5,
        margin: { left: margin, right: margin, bottom: 22 },
        theme: 'grid',
        headStyles: {
          fillColor: [22, 32, 54], // #162036 (Cor exata do cabeçalho da tabela de estoque do sistema)
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.8,
          halign: 'left',
          cellPadding: 2.5,
          lineWidth: 0.2,
          lineColor: [16, 185, 129], // #10b981 Emerald
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [15, 23, 42],
          cellPadding: 2.2,
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', textColor: [71, 85, 105] },
          1: { cellWidth: 'auto', fontStyle: 'bold' },
          2: { cellWidth: 26, textColor: [71, 85, 105] },
          3: { cellWidth: 14, halign: 'center', textColor: [100, 116, 139] },
          4: { cellWidth: 18, halign: 'right', textColor: [148, 163, 184] },
          5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
          6: { cellWidth: 24, halign: 'center' },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6) {
            const rawVal = String(data.cell.raw);
            if (rawVal === 'ZERADO') {
              data.cell.styles.fillColor = [255, 241, 242]; // rose-50
              data.cell.styles.textColor = [190, 18, 60]; // rose-700
              data.cell.styles.fontStyle = 'bold';
            } else if (rawVal === 'BAIXO') {
              data.cell.styles.fillColor = [255, 251, 235]; // amber-50
              data.cell.styles.textColor = [180, 83, 9]; // amber-700
              data.cell.styles.fontStyle = 'bold';
            } else if (rawVal === 'INATIVO') {
              data.cell.styles.fillColor = [241, 245, 249]; // slate-100
              data.cell.styles.textColor = [100, 116, 139]; // slate-500
              data.cell.styles.fontStyle = 'normal';
            } else {
              data.cell.styles.fillColor = [236, 253, 245]; // emerald-50
              data.cell.styles.textColor = [5, 150, 105]; // emerald-600
              data.cell.styles.fontStyle = 'bold';
            }
          }
          if (data.section === 'body' && data.column.index === 5) {
            const rawVal = String(data.row.raw ? (data.row.raw as any)[6] : '');
            if (rawVal === 'ZERADO') {
              data.cell.styles.textColor = [190, 18, 60];
            } else if (rawVal === 'BAIXO') {
              data.cell.styles.textColor = [180, 83, 9];
            }
          }
        },
        didDrawPage: () => {
          const currentPage = (doc as any).internal.getNumberOfPages();

          // Top Header for Pages > 1 (Cor do sistema #0f172a)
          if (currentPage > 1) {
            doc.setFillColor(15, 23, 42); // #0f172a
            doc.rect(0, 0, pageWidth, 8, 'F');
            doc.setFillColor(16, 185, 129); // #10b981
            doc.rect(0, 8, pageWidth, 0.4, 'F');
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('WL SYSTEM · DM SANTOS EMPREENDIMENTOS · RELATÓRIO OFICIAL DE ESTOQUE', margin, 5.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(110, 231, 183);
            doc.text(`Página ${currentPage}`, pageWidth - margin, 5.5, { align: 'right' });
          }

          // Bottom Running Footer on every page
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

          doc.setFontSize(6.8);
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          doc.text(
            'WL System Galpão · DM Santos Empreendimentos · Documento Oficial para Inventário e Conferência Física',
            margin,
            pageHeight - 7
          );

          const hashVal = Math.abs(filteredProducts.length * 7919 + 104729).toString(16).toUpperCase();
          doc.text(
            `Página ${currentPage} · Cód. Verificação: WL-${hashVal}`,
            pageWidth - margin,
            pageHeight - 7,
            { align: 'right' }
          );
        },
      });

      // 5. Signatures & Official Audit Section
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      let signatureY = finalY + 12;

      if (signatureY + 34 > pageHeight - 15) {
        doc.addPage();
        signatureY = 25;
      }

      // Total Consolidated Box above signatures
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, signatureY - 6, contentWidth, 8, 1.5, 1.5, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`TOTAL CONSOLIDADO DO RELATÓRIO:`, margin + 4, signatureY - 1);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${filteredProducts.length} itens listados · ${totalUnidades.toLocaleString('pt-BR')} unidades no galpão`,
        margin + 62,
        signatureY - 1
      );

      // Signatures Side-by-Side Boxes
      const sigBoxW = (contentWidth - 10) / 2; // ~88mm
      const sig1X = margin;
      const sig2X = margin + sigBoxW + 10;
      const sigBoxY = signatureY + 6;

      // Box 1: Conferente
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(sig1X, sigBoxY, sigBoxW, 20, 1.5, 1.5, 'D');

      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(sig1X + 10, sigBoxY + 12, sig1X + sigBoxW - 10, sigBoxY + 12);
      doc.setLineDashPattern([], 0); // reset

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Conferente / Responsável pelo Estoque', sig1X + sigBoxW / 2, sigBoxY + 15.5, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Conferência Física de Galpão · Data: ____/____/________', sig1X + sigBoxW / 2, sigBoxY + 18.5, {
        align: 'center',
      });

      // Box 2: Gerência
      doc.roundedRect(sig2X, sigBoxY, sigBoxW, 20, 1.5, 1.5, 'D');

      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(sig2X + 10, sigBoxY + 12, sig2X + sigBoxW - 10, sigBoxY + 12);
      doc.setLineDashPattern([], 0); // reset

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Gerência Operacional / Visto DM Santos', sig2X + sigBoxW / 2, sigBoxY + 15.5, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Homologação e Balanço Patrimonial · Visto: __________________', sig2X + sigBoxW / 2, sigBoxY + 18.5, {
        align: 'center',
      });

      // Save PDF file
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `relatorio_estoque_wl_${dateStr}.pdf`;
      doc.save(filename);

      showToast(`Relatório PDF executivo emitido com sucesso! O arquivo "${filename}" foi baixado.`);
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      showToast('Ocorreu um erro ao gerar o PDF. Tentando acionar a impressão do navegador...', 'error');
      try {
        window.print();
      } catch {
        showToast('Não foi possível abrir a janela de impressão no navegador.', 'error');
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg border animate-in fade-in duration-150 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-300'
              : toastMessage.type === 'info'
              ? 'bg-amber-950/90 border-amber-800 text-amber-300'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header Card (Controls - Hidden on Print) */}
      <div className="no-print bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-slate-800 text-emerald-400 border border-slate-700/60 rounded-2xl shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Relatório Geral de Estoque
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                  PDF / A4 Pronto
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Emita relatórios oficiais em PDF para inventário físico, balanço e auditoria de galpão
              </p>
            </div>
          </div>

          {/* Action Button: Emitir / Baixar PDF (Destaque Principal) */}
          <div className="flex items-center w-full sm:w-auto">
            <button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-70 rounded-2xl shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-400/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Gerar e baixar o relatório oficial em formato PDF para o galpão"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
                  <span>Gerando Relatório PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-emerald-100 shrink-0" />
                  <span>Emitir / Baixar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código ou nome..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0b0f19] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#0b0f19] border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            >
              <option value="todos">Catálogo Ativo ({products.filter(p => !p.inativo).length})</option>
              <option value="em_estoque">Apenas com Saldo Positivo</option>
              <option value="baixo">Apenas Estoque Baixo (≤ Mínimo)</option>
              <option value="zerados">Apenas Zerados (0)</option>
              <option value="inativos">Apenas Produtos Inativos ({products.filter(p => p.inativo).length})</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#0b0f19] border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            >
              <option value="todas">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#0b0f19] border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            >
              <option value="numero">Ordenar por Nº (Código)</option>
              <option value="nome">Ordenar por Nome (A-Z)</option>
              <option value="quantidade_desc">Maior Quantidade</option>
              <option value="quantidade_asc">Menor Quantidade</option>
            </select>
          </div>
        </div>

        {/* Quick KPI badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400 font-medium">Resumo do filtro:</span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0b0f19] text-white border border-slate-800 font-semibold font-mono">
            {totalItens} produtos listados
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-semibold font-mono">
            {totalUnidades.toLocaleString('pt-BR')} unidades no total
          </span>
          {totalZerados > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-800/40 font-semibold font-mono">
              {totalZerados} zerados
            </span>
          )}
          {totalBaixos > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/40 font-semibold font-mono">
              {totalBaixos} em nível baixo
            </span>
          )}
        </div>
      </div>

      {/* 2. Document Preview Area (Styled as High-Quality White Sheet for PDF Print) */}
      <div className="bg-[#0f172a] p-4 sm:p-6 lg:p-8 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4 no-print">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Pré-visualização do Documento PDF
          </p>
          <span className="text-xs text-slate-400 font-mono">
            Formato: Folha A4 Padrão Galpão
          </span>
        </div>

        {/* Printable Sheet (com scroll horizontal suave em telas pequenas) */}
        <div className="overflow-x-auto pb-4 -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="min-w-[680px] sm:min-w-0 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-w-4xl mx-auto print:border-none print:shadow-none print:rounded-none print:max-w-none print:m-0">
            {/* Executive Header Bar (Cores Oficiais do Sistema WL System #0f172a / #131d33) */}
            <div className="bg-gradient-to-r from-[#131d33] via-[#0f172a] to-[#0c1322] text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-900/80 p-0.5 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md overflow-hidden aspect-square">
                <img
                  src={circularLogoUrl || '/assets/aistudio/Emblema_circular_verde_e_amarelo_recortado_851a632b.png'}
                  alt="WL Logo"
                  className="w-full h-full object-contain filter drop-shadow-md aspect-square select-none"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('Emblema_circular_verde_e_amarelo_recortado_851a632b.png')) {
                      target.src = '/assets/aistudio/Emblema_circular_verde_e_amarelo_recortado_851a632b.png';
                    }
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-wider leading-none uppercase text-white">
                    WL SYSTEM
                  </h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#f59e0b] text-slate-950 rounded shadow-xs">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  DM Santos Empreendimentos · Gestão Integrada de Estoque
                </p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wide">
                  Relatório Oficial de Inventário Físico
                </span>
              </div>
            </div>

            <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-700/80 font-mono space-y-1.5 text-left sm:text-right shrink-0 shadow-inner max-w-full sm:max-w-md">
              <div className="text-slate-200 text-xs sm:text-[13px]">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] sm:text-xs">EMISSÃO:</span>{' '}
                <strong className="text-white font-bold">{lastUpdatedTime}</strong>
              </div>
              <div className="text-slate-200 text-xs sm:text-[13px]">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] sm:text-xs">RESPONSÁVEL:</span>{' '}
                <strong className="text-white font-bold">
                  {currentUser?.username || 'Willian'} ({currentUser?.roleName || 'Administrador'})
                </strong>
              </div>
              <div className="text-slate-200 text-xs sm:text-[13px]">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] sm:text-xs">LOCAL:</span>{' '}
                <strong className="text-slate-100 font-medium">Galpão DM Santos (Central)</strong>
              </div>
              <div className="text-amber-400 font-bold text-xs sm:text-[12.5px] pt-1.5 border-t border-slate-800 break-words tracking-wide">
                FILTRO: {statusFilter.toUpperCase()} · {selectedCategory.toUpperCase()}
              </div>
            </div>

            {/* Accent Stripes at bottom of header (Verde Esmeralda e Amarelo Dourado do Sistema) */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#10b981]" />
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#f59e0b]" />
          </div>

          {/* Document Content */}
          <div className="p-6 sm:p-8 pt-7">
            {/* 4 Executive Metric Cards (Cores dos cartões do sistema) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                  Catálogo Ativo
                </span>
                <span className="text-xl font-black text-emerald-600 font-mono tabular-nums block mt-0.5">
                  {totalItens}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">itens listados</span>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border-2 border-teal-200 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                  Saldo Físico Total
                </span>
                <span className="text-xl font-black text-teal-600 font-mono tabular-nums block mt-0.5">
                  {totalUnidades.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">unidades no galpão</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-200 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                  Estoque Baixo
                </span>
                <span className="text-xl font-black text-amber-600 font-mono tabular-nums block mt-0.5">
                  {totalBaixos}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">precisam reposição</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-200 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">
                  Saldo Zerado (Falta)
                </span>
                <span className="text-xl font-black text-rose-600 font-mono tabular-nums block mt-0.5">
                  {totalZerados}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">em falta no galpão</span>
              </div>
            </div>

            {/* Table Header (Cor exata do cabeçalho da tabela do sistema: #162036 com borda esmeralda) */}
            <div className="bg-[#162036] text-white font-bold text-xs uppercase grid grid-cols-12 py-3 px-3.5 rounded-xl mb-2 shadow-sm items-center border-b-2 border-emerald-500">
              <div className="col-span-1 text-center font-mono">Nº</div>
              <div className="col-span-5 sm:col-span-4">Descrição do Produto</div>
              <div className="col-span-2 hidden sm:block text-slate-300 text-xs">Categoria</div>
              <div className="col-span-1 text-center text-emerald-200">Unid</div>
              <div className="col-span-1 text-right text-emerald-200 hidden sm:block">Mín.</div>
              <div className="col-span-3 sm:col-span-2 text-right">Saldo Físico</div>
              <div className="col-span-2 sm:col-span-1 text-center">Situação</div>
            </div>

            {/* Table Rows */}
            {filteredProducts.length === 0 ? (
              <div className="py-14 text-center text-slate-400 font-medium text-sm border border-dashed border-slate-200 rounded-2xl">
                Nenhum produto encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {filteredProducts.map((p, idx) => {
                  const isZero = p.quantidade <= 0;
                  const isLow = p.quantidade > 0 && p.quantidade <= p.estoqueMinimo;
                  const isInactive = Boolean(p.inativo);

                  return (
                    <div
                      key={p.id}
                      className={`grid grid-cols-12 py-2.5 px-3.5 items-center transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                      }`}
                    >
                      {/* Código / Nº */}
                      <div className="col-span-1 text-center font-mono font-bold text-slate-500">
                        {p.numero}
                      </div>

                      {/* Nome do Produto */}
                      <div className="col-span-5 sm:col-span-4 font-bold text-slate-900 pr-2 uppercase">
                        {p.nome}
                      </div>

                      {/* Categoria */}
                      <div className="col-span-2 hidden sm:block text-slate-600 font-medium text-[11px] truncate">
                        {p.categoria || 'Geral'}
                      </div>

                      {/* Unidade */}
                      <div className="col-span-1 text-center font-mono text-slate-500 text-[11px]">
                        {p.unidade || 'UN'}
                      </div>

                      {/* Estoque Mínimo */}
                      <div className="col-span-1 text-right font-mono text-slate-400 text-[11px] hidden sm:block">
                        {p.estoqueMinimo}
                      </div>

                      {/* Saldo Físico */}
                      <div className="col-span-3 sm:col-span-2 text-right font-mono font-bold tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            isZero
                              ? 'text-rose-700 font-black'
                              : isLow
                              ? 'text-amber-800 font-bold'
                              : 'text-slate-900 font-bold'
                          }`}
                        >
                          {p.quantidade.toLocaleString('pt-BR')} {p.unidade || 'UN'}
                        </span>
                      </div>

                      {/* Situação Badge */}
                      <div className="col-span-2 sm:col-span-1 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isInactive
                              ? 'bg-slate-100 text-slate-600 border border-slate-300'
                              : isZero
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isInactive ? 'Inativo' : isZero ? 'Zerado' : isLow ? 'Baixo' : 'Regular'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Footer Summary */}
            <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-800 gap-2">
              <div>
                Total de itens listados no relatório:{' '}
                <span className="font-mono text-emerald-800 font-extrabold text-sm">
                  {filteredProducts.length} produtos
                </span>
              </div>
              <div className="text-right">
                Saldo Total Consolidado:{' '}
                <span className="text-base font-mono text-emerald-800 font-extrabold">
                  {totalUnidades.toLocaleString('pt-BR')} unidades
                </span>
              </div>
            </div>

            {/* Signatures block for audit / physical conference */}
            <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs text-slate-700">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="border-b border-dashed border-slate-400 mx-auto w-4/5 pb-2 mb-2 h-7" />
                <p className="font-bold text-slate-900">Conferente / Responsável pelo Estoque</p>
                <p className="text-[11px] text-slate-500">Conferência Física do Galpão · Data: ___/___/______</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="border-b border-dashed border-slate-400 mx-auto w-4/5 pb-2 mb-2 h-7" />
                <p className="font-bold text-slate-900">Gerência Operacional / Visto DM Santos</p>
                <p className="text-[11px] text-slate-500">Homologação e Balanço Patrimonial · Visto: _________</p>
              </div>
            </div>

            {/* Document Bottom Stamp */}
            <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-1 font-mono">
              <span>WL System · Sistema Oficial de Gestão e Controle Operacional de Galpão</span>
              <span>Cód. Verificação: AUT-WL-{Math.abs(filteredProducts.length * 7919 + 104729).toString(16).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
