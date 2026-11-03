import sys
import os
import json
import unicodedata
from datetime import datetime
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QLabel, QLineEdit, QPushButton,
    QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem, QMessageBox,
    QComboBox, QFileDialog, QTabWidget, QHeaderView, QFrame, QInputDialog,
    QAbstractItemView
)
from PyQt5.QtGui import QIcon, QFont, QPixmap, QColor
from PyQt5.QtCore import Qt
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

ARQUIVO_SALVO = "estoque.json"
BACKUP_DIR = "backups"

class EstoqueApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("WL System")
        self.setGeometry(100, 100, 1000, 650)
        # self.salvando_manualmente = False # Flag removido, pois não será mais usado

        self.setStyleSheet("""QMainWindow {
    background-color: #f6f8fa;
}
QPushButton {
    border-radius: 16px;
    padding: 10px 16px; 
    min-width: 160px; 
    font-size: 11pt;
    font-weight: bold;
    color: white;
    background-color: qlineargradient(
        spread:pad, x1:0, y1:0, x2:1, y2:0, 
        stop:0 #00c9ff, stop:1 #92fe9d
    );
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
}
QPushButton:hover {
    background-color: qlineargradient(
        spread:pad, x1:0, y1:0, x2:1, y2:0, 
        stop:0 #00b2e2, stop:1 #7de87c
    );
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
}
QLineEdit, QComboBox {
    border: 1px solid #bbb;
    border-radius: 12px;
    padding: 6px 12px;
    background: white;
    font-size: 11pt;
}
QTabWidget::pane {
    border: 1px solid #ccc;
    border-radius: 12px;
    margin: 10px 8px 4px 8px;
    background-color: white;
}
QTableWidget {
    background: white;
    border: 1px solid #ddd;
    gridline-color: #e0e0e0;
    font-size: 12pt;  /* Aumentado para 12pt */
    border-radius: 10px;
    padding: 4px;
}
QTableWidget::item {
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    padding: 6px;
    border-radius: 6px;
}
QTableWidget::item:last {
    border-right: none;
}
QTableWidget::item:selected {
    background-color: #a5d6a7; /* Verde claro */
    color: black;
    border-radius: 6px;
}
QHeaderView::section {
    background-color: #8bc34a;
    color: #1b5e20;
    font-weight: bold;
    padding: 8px;
    font-size: 12pt;  /* Aumentado para 12pt */
    border-top: 2px solid #dcedc8;
    border-left: 2px solid #dcedc8;
    border-right: 2px solid #33691e;
    border-bottom: 2px solid #33691e;
    border-radius: 6px;
}
QHeaderView::section:last {
    border-right: none;
}
QTabBar::tab {
    padding: 6px 12px;
    font-size: 11pt;
    font-weight: 500;
    min-width: 100px;
    min-height: 32px;
    margin-top: 2px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    background-color: #e8f5e9;
    border: 1px solid #c8e6c9;
}
QTabBar::tab:selected {
    background-color: white;
    border-bottom: 1px solid #f6f8fa;
}
QScrollBar:vertical {
    border-radius: 6px;
    background: #eee;
    width: 10px;
}
QScrollBar::handle:vertical {
    background: #cfd8dc;
    min-height: 20px;
    border-radius: 6px;
}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
    background: none;
}
QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {
    background: none;
}
QFrame {
    border-radius: 10px;
}
QStatusBar QLabel {
    border-radius: 10px;
    padding: 4px 8px;
    background-color: #ffffff;
    border: 1px solid #ddd;
    font-size: 9.5pt;
}
""")
        try:
            self.setWindowIcon(QIcon("estoque.ico"))
        except:
            pass
        self.historico = []
        self.ordem_coluna = {}
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.layout_principal = QVBoxLayout(self.central_widget)
        self._criar_titulo()
        self._configurar_pesquisa()
        self._configurar_abas()
        self._configurar_botoes() # A função de configurar botões agora não inclui o botão de salvar
        self._configurar_status_bar()
        self._carregar_dados()
        self.show()

    def _criar_titulo(self):
        header_frame = QVBoxLayout()
        header_container = QWidget()
        header_container.setStyleSheet("background-color: #f0f4f7;")
        header_container.setLayout(header_frame)
        self.layout_principal.addWidget(header_container)
        linha = QHBoxLayout()
        logo_label = QLabel()
        try:
            pixmap = QPixmap("logo.png").scaled(80, 80, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            logo_label.setPixmap(pixmap)
        except Exception as e:
            print(f"Erro ao carregar a imagem 'logo.png': {e}")
        logo_label.setFixedSize(90, 90)
        linha.addWidget(logo_label, alignment=Qt.AlignLeft)
        titulo_layout = QVBoxLayout()
        titulo_layout.setAlignment(Qt.AlignCenter)
        deco_line = QFrame()
        deco_line.setFixedHeight(4)
        deco_line.setStyleSheet("background-color: #2e7d32; border: none;")
        titulo_label = QLabel("📦 Estoque Galpão")
        titulo_label.setFont(QFont("Segoe UI", 24, QFont.Bold))
        titulo_label.setStyleSheet("color: #2e7d32; background-color: transparent;")
        titulo_label.setAlignment(Qt.AlignCenter)
        subtitulo_label = QLabel("Controle de Estoque")
        subtitulo_label.setFont(QFont("Segoe UI", 10))
        subtitulo_label.setStyleSheet("color: #555; background-color: transparent;")
        subtitulo_label.setAlignment(Qt.AlignCenter)
        titulo_layout.addWidget(deco_line)
        titulo_layout.addWidget(titulo_label)
        titulo_layout.addWidget(subtitulo_label)
        linha.addLayout(titulo_layout, stretch=1)
        header_frame.addLayout(linha)

    def _configurar_pesquisa(self):
        frame_pesquisa = QHBoxLayout()
        pesquisa_container = QWidget()
        pesquisa_container.setStyleSheet("background-color: white; border: 1px solid #ddd; padding: 12px; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);")
        pesquisa_container.setLayout(frame_pesquisa)
        self.layout_principal.addWidget(pesquisa_container)
        self.entry_pesquisa = QLineEdit()
        self.entry_pesquisa.setPlaceholderText("Pesquisar produto...")
        self.entry_pesquisa.setStyleSheet("padding: 6px; border: none; font-size: 11pt; color: #333;")
        self.entry_pesquisa.returnPressed.connect(self._pesquisar_produto)
        frame_pesquisa.addWidget(self.entry_pesquisa, stretch=1)
        self.tipo_pesquisa = QComboBox()
        self.tipo_pesquisa.addItems(["Nome", "Número"])
        self.tipo_pesquisa.setStyleSheet("padding: 6px; border-radius: 10px;")
        frame_pesquisa.addWidget(self.tipo_pesquisa)
        btn_pesquisar = QPushButton("🔍")
        btn_pesquisar.clicked.connect(self._pesquisar_produto)
        btn_pesquisar.setStyleSheet("background-color: #66bb6a; color: white; padding: 4px 10px; min-width: 32px; border-radius: 10px;")
        frame_pesquisa.addWidget(btn_pesquisar)
        btn_limpar = QPushButton("✕")
        btn_limpar.clicked.connect(self._limpar_pesquisa)
        btn_limpar.setStyleSheet("background-color: #90a4ae; color: white; padding: 4px 10px; min-width: 32px; border-radius: 10px;")
        frame_pesquisa.addWidget(btn_limpar)

    def _configurar_abas(self):
        self.tabs = QTabWidget()
        self.layout_principal.addWidget(self.tabs)
        self.tab_estoque = QWidget()
        self.tab_historico = QWidget()
        self.tabs.addTab(self.tab_estoque, "📦 Estoque")
        self.tabs.addTab(self.tab_historico, "📜 Histórico")
        self.tabs.currentChanged.connect(self._on_tab_changed)
        self._configurar_tabela()
        self._configurar_tabela_historico()

    def _configurar_tabela(self):
        self.table = QTableWidget()
        self.table.setSelectionMode(QAbstractItemView.SingleSelection)
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["Nº", "Produto", "Entrada", "Saída", "Quantidade"])
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setAlternatingRowColors(True)
        self.table.setStyleSheet("""
            alternate-background-color: #f8f9fa; 
            background-color: white; 
            font-size: 12pt;
        """)
        self.table.verticalHeader().setVisible(False)
        # Conectar eventos de clique
        self.table.cellDoubleClicked.connect(self._editar_celula)
        self.table.cellClicked.connect(self._limpar_destaques_selecao)
        # Configurar o redimensionamento automático das colunas
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.Fixed)  # Coluna "Nº" fixa
        header.setSectionResizeMode(1, QHeaderView.Stretch)  # Coluna "Produto" esticada
        header.setSectionResizeMode(2, QHeaderView.ResizeToContents)  # Coluna "Entrada"
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)  # Coluna "Saída"
        header.setSectionResizeMode(4, QHeaderView.ResizeToContents)  # Coluna "Quantidade"
        # Configurar largura da coluna "Nº"
        self.table.setColumnWidth(0, 40)
        layout = QVBoxLayout()
        layout.addWidget(self.table)
        self.tab_estoque.setLayout(layout)

    def _configurar_tabela_historico(self):
        self.table_hist = QTableWidget()
        self.table_hist.setSelectionMode(QAbstractItemView.SingleSelection)
        self.table_hist.setColumnCount(5)
        self.table_hist.setHorizontalHeaderLabels(["Nº", "Produto", "Tipo", "Quantidade", "Data/Hora"])
        self.table_hist.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table_hist.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table_hist.setAlternatingRowColors(True)
        # Corrigido: font-size: 12pt em vez de font-size: t;
        self.table_hist.setStyleSheet("alternate-background-color: #f8f9fa; background-color: white; font-size: 12pt;")
        # Estilizar o cabeçalho
        header = self.table_hist.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.Fixed)
        self.table_hist.setColumnWidth(0, 50)      # Nº
        header.setSectionResizeMode(1, QHeaderView.Fixed)
        self.table_hist.setColumnWidth(1, 600)     # Produto
        header.setSectionResizeMode(2, QHeaderView.Fixed)
        self.table_hist.setColumnWidth(2, 300)      # Tipo
        header.setSectionResizeMode(3, QHeaderView.Fixed)
        self.table_hist.setColumnWidth(3, 300)     # Quantidade
        header.setSectionResizeMode(4, QHeaderView.Stretch)  # Data/Hora
        self.table_hist.verticalHeader().setVisible(False)
        layout = QVBoxLayout()
        layout.addWidget(self.table_hist)
        self.tab_historico.setLayout(layout)

    def _configurar_botoes(self):
        botoes_layout = QHBoxLayout()
        botoes_layout.setSpacing(10)
        botoes_layout.setAlignment(Qt.AlignCenter)
        self.botoes_container = QWidget()
        self.botoes_container.setLayout(botoes_layout)
        self.botoes_container.setContentsMargins(0, 4, 0, 2)
        self.layout_principal.addWidget(self.botoes_container)
        self._criar_botao("➕ Adicionar Produto", self._adicionar_produto, "#66bb6a", botoes_layout)
        self._criar_botao("🗑️ Remover Selecionados", self._remover_produto, "#ef5350", botoes_layout)
        # O botão "💾 Salvar Alterações" foi removido
        self._criar_botao("📄 Exportar Relatório", self._exportar_pdf, "#ffb74d", botoes_layout)

    def _criar_botao(self, texto, funcao, cor, layout):
        botao = QPushButton(texto)
        botao.clicked.connect(funcao)
        botao.setStyleSheet(f"""
            QPushButton {{
                background-color: {cor};
                color: white;
                padding: 10px 16px; min-width: 160px; font-size: 11pt;
                font-weight: bold; border-radius: 16px;
                border: none;
            }}
            QPushButton:hover {{
                background-color: {self._escurecer_cor(cor, 20)};
            }}
        """)
        layout.addWidget(botao)

    def _escurecer_cor(self, hex_color, amount=20):
        hex_color = hex_color.lstrip('#')
        rgb = tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
        rgb = tuple(max(0, min(255, x - amount)) for x in rgb)
        return "#%02x%02x%02x" % rgb

    def _configurar_status_bar(self):
        self.status_bar = QLabel("Total de produtos: 0 | Última atualização: --")
        self.status_bar.setStyleSheet("background-color: #ffffff; color: #444; padding: 4px 8px; font-size: 9pt; font-weight: 400; border-radius: 10px; border: 1px solid #ddd;")
        self.layout_principal.addWidget(self.status_bar)

    def _adicionar_produto(self):
        nome, ok = QInputDialog.getText(self, "Novo Produto", "Digite o nome do produto:")
        if not ok or not nome.strip():
            return
        nome = nome.strip().upper()
        linha = self.table.rowCount()
        self.table.insertRow(linha)
        self.table.setItem(linha, 0, QTableWidgetItem(str(linha + 1)))
        self.table.setItem(linha, 1, QTableWidgetItem(nome))
        self.table.setItem(linha, 2, QTableWidgetItem("0"))
        self.table.setItem(linha, 3, QTableWidgetItem("0"))
        self.table.setItem(linha, 4, QTableWidgetItem("0"))
        self.table.scrollToItem(self.table.item(linha, 0), QAbstractItemView.PositionAtCenter)
        self.table.selectRow(linha)
        self._atualizar_status()
        # Salva automaticamente após adicionar
        self._salvar_dados_auto()

    def _editar_celula(self, row, column):
        if column == 0:
            return
        item = self.table.item(row, column)
        if not item:
            return
        antigo = item.text()
        titulo = "Entrada" if column == 2 else "Saída" if column == 3 else "Quantidade" if column == 4 else "Editar"
        dialog = QInputDialog(self)
        dialog.setWindowTitle(titulo)
        dialog.setLabelText(f"Novo valor para {self.table.horizontalHeaderItem(column).text()}:")
        dialog.setTextValue("" if column in [2, 3] else antigo)
        dialog.setOption(QInputDialog.UsePlainTextEditForTextInput, False)
        dialog.setWindowFlags(dialog.windowFlags() & ~Qt.WindowContextHelpButtonHint)
        if dialog.exec_() == QInputDialog.Accepted:
            novo = dialog.textValue()
            try:
                valores = [self.table.item(row, i).text() for i in range(5)]
                dados_alterados = False # Flag para verificar se houve alteração real
                if column == 1:
                    novo_nome = novo.upper()
                    if novo_nome != valores[1]: # Só salva se for diferente
                        self.table.setItem(row, 1, QTableWidgetItem(novo_nome))
                        dados_alterados = True
                elif column == 2:
                    entrada = int(novo)
                    if entrada > 0: # Só registra entrada se for maior que 0
                        atual = int(valores[4]) + entrada
                        self.table.setItem(row, 4, QTableWidgetItem(str(max(0, atual))))
                        self.table.setItem(row, 2, QTableWidgetItem("0")) # Reseta campo entrada
                        self._registrar_historico(valores[0], valores[1], "Entrada", entrada)
                        dados_alterados = True
                elif column == 3:
                    saida = int(novo)
                    if saida > 0: # Só registra saída se for maior que 0
                        atual = int(valores[4])
                        if saida > atual:
                            raise ValueError("Saída maior que o estoque disponível.")
                        self.table.setItem(row, 4, QTableWidgetItem(str(max(0, atual - saida))))
                        self.table.setItem(row, 3, QTableWidgetItem("0")) # Reseta campo saída
                        self._registrar_historico(valores[0], valores[1], "Saída", saida)
                        dados_alterados = True
                elif column == 4:
                    nova_qtd = max(0, int(novo))
                    if nova_qtd != int(valores[4]): # Só salva se for diferente
                        self.table.setItem(row, 4, QTableWidgetItem(str(nova_qtd)))
                        dados_alterados = True

                if dados_alterados:
                    self._atualizar_status()
                    self._atualizar_tabela_historico()
                    # Salva automaticamente após editar
                    self._salvar_dados_auto()
            except Exception as e:
                QMessageBox.critical(self, "Erro", str(e))

    def _remover_produto(self):
        linhas = sorted(set(i.row() for i in self.table.selectedIndexes()), reverse=True)
        if not linhas:
            QMessageBox.warning(self, "Aviso", "Selecione ao menos um produto para remover.")
            return
        if QMessageBox.question(self, "Confirmar", f"Deseja remover {len(linhas)} produto(s)?") == QMessageBox.Yes:
            for row in linhas:
                self.table.removeRow(row)
            self._renumerar()
            self._atualizar_status()
            # Salva automaticamente após remover
            self._salvar_dados_auto()

    def _renumerar(self):
        for i in range(self.table.rowCount()):
            self.table.setItem(i, 0, QTableWidgetItem(str(i + 1)))

    def _registrar_historico(self, numero, produto, tipo, qtd):
        data_hora = datetime.now().strftime("%d/%m/%Y %H:%M")
        self.historico.append((data_hora, numero, produto, tipo, qtd))

    def _atualizar_status(self):
        total = self.table.rowCount()
        agora = datetime.now().strftime("%d/%m/%Y %H:%M")
        self.status_bar.setText(f"Total de produtos: {total} | Última atualização: {agora}")

    def _atualizar_tabela_historico(self):
        self.table_hist.setRowCount(0)
        ultimos = reversed(self.historico[-50:])
        for linha, (data, num, prod, tipo, qtd) in enumerate(ultimos):
            self.table_hist.insertRow(linha)
            cor = QColor("green") if tipo == "Entrada" else QColor("red")
            item_num = QTableWidgetItem(num)
            item_num.setForeground(cor)
            self.table_hist.setItem(linha, 0, item_num)
            item_prod = QTableWidgetItem(prod)
            item_prod.setForeground(cor)
            self.table_hist.setItem(linha, 1, item_prod)
            item_tipo = QTableWidgetItem(tipo)
            item_tipo.setForeground(cor)
            self.table_hist.setItem(linha, 2, item_tipo)
            item_qtd = QTableWidgetItem(str(qtd))
            item_qtd.setForeground(cor)
            self.table_hist.setItem(linha, 3, item_qtd)
            item_data = QTableWidgetItem(data)
            item_data.setForeground(cor)
            self.table_hist.setItem(linha, 4, item_data)

    # Nova função simplificada para salvar dados automaticamente
    def _salvar_dados_auto(self):
        """Salva os dados sem mostrar mensagem."""
        dados = []
        for row in range(self.table.rowCount()):
            num = self.table.item(row, 0).text()
            nome = self.table.item(row, 1).text()
            qtd = self.table.item(row, 4).text()
            dados.append([num, nome, qtd])
        dados_completos = {"estoque": dados, "historico": self.historico}
        try:
            with open(ARQUIVO_SALVO, "w", encoding="utf-8") as f:
                json.dump(dados_completos, f, ensure_ascii=False, indent=4)
            self._salvar_backup(dados_completos)
        except Exception as e:
            # Em caso de erro crítico ao salvar, pode-se optar por mostrar uma mensagem silenciosa ou logar
            # Por enquanto, vamos apenas ignorar para manter a fluidez da UI
            print(f"Erro ao salvar dados automaticamente: {e}") # Pode ser removido ou substituído por log
        # Atualiza o status mesmo em caso de erro (para mostrar a hora da última tentativa)
        self._atualizar_status()

    def _salvar_backup(self, dados):
        """Salva um backup dos dados."""
        if not os.path.exists(BACKUP_DIR):
            os.makedirs(BACKUP_DIR)
        agora = datetime.now().strftime("%Y%m%d_%H%M%S")
        nome_backup = os.path.join(BACKUP_DIR, f"estoque_backup_{agora}.json")
        with open(nome_backup, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=4)

    def _carregar_dados(self):
        """Carrega os dados salvos."""
        if os.path.exists(ARQUIVO_SALVO):
            with open(ARQUIVO_SALVO, "r", encoding="utf-8") as f:
                try:
                    dados_completos = json.load(f)
                    dados = dados_completos.get("estoque", [])
                    self.historico = dados_completos.get("historico", [])
                    for idx, item in enumerate(dados, start=1):
                        num, nome, qtd = item[:3]
                        linha = self.table.rowCount()
                        self.table.insertRow(linha)
                        self.table.setItem(linha, 0, QTableWidgetItem(str(num)))
                        self.table.setItem(linha, 1, QTableWidgetItem(nome))
                        self.table.setItem(linha, 2, QTableWidgetItem("0"))
                        self.table.setItem(linha, 3, QTableWidgetItem("0"))
                        self.table.setItem(linha, 4, QTableWidgetItem(str(qtd)))
                    self._atualizar_tabela_historico()
                except json.JSONDecodeError:
                    QMessageBox.critical(self, "Erro", "Falha ao ler o arquivo de dados.")
        self._atualizar_status()

    def _exportar_pdf(self):
        """Exporta o relatório para PDF."""
        caminho, _ = QFileDialog.getSaveFileName(self, "Salvar PDF", f"relatorio_estoque_{datetime.now().strftime('%Y%m%d')}.pdf", "PDF Files (*.pdf)")
        if not caminho:
            return
        c = canvas.Canvas(caminho, pagesize=letter)
        width, height = letter
        c.setFillColor("#2e7d32")
        c.rect(0, height - 50, width, 50, fill=True, stroke=False)
        c.setFont("Helvetica-Bold", 16)
        c.setFillColorRGB(1, 1, 1)
        c.drawString(50, height - 35, "Relatório de Estoque")
        c.setFont("Helvetica", 10)
        c.setFillColorRGB(0.2, 0.2, 0.2)
        c.drawString(width - 200, height - 35, f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        c.setFont("Helvetica-Bold", 10)
        y = height - 80
        headers = ["Nº", "Produto", "Quantidade"]
        col_widths = [50, 300, 100]
        c.setFillColor("#81c784")
        c.rect(40, y - 25, width - 80, 25, fill=True, stroke=False)
        c.setFillColorRGB(0.1, 0.1, 0.1)
        for i, col in enumerate(headers):
            c.drawString(40 + sum(col_widths[:i]), y - 20, col)
        c.setFont("Helvetica", 9)
        y -= 45
        for row in range(self.table.rowCount()):
            if y < 100:
                c.showPage()
                y = height - 50
            num = self.table.item(row, 0).text()
            nome = self.table.item(row, 1).text()
            qtd = self.table.item(row, 4).text()
            for i, val in enumerate([num, nome, qtd]):
                c.drawString(40 + sum(col_widths[:i]), y, str(val))
            c.setStrokeColorRGB(0.9, 0.9, 0.9)
            c.line(40, y - 10, width - 40, y - 10)
            y -= 25
        c.save()
        QMessageBox.information(self, "Exportado", "Relatório PDF gerado com sucesso!")

    def _remover_acentos(self, texto):
        """Remove acentos de um texto."""
        return ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn').lower()

    def _pesquisar_produto(self):
        """Realiza a pesquisa de produtos."""
        aba_index = self.tabs.currentIndex()
        if aba_index == 0:  # Estoque
            termo = self._remover_acentos(self.entry_pesquisa.text()).strip().lower()
            tipo_pesquisa = self.tipo_pesquisa.currentText()
            if not termo:
                QMessageBox.information(self, "Aviso", "❌ Digite algo para pesquisar.")
                return
            encontrados = []
            if tipo_pesquisa == "Nome":
                palavras = [p for p in termo.split("%") if p.strip()]
                if not palavras:
                    QMessageBox.warning(self, "Erro", "❌ Digite termos válidos para a pesquisa.")
                    return
                for row in range(self.table.rowCount()):
                    nome = self._remover_acentos(self.table.item(row, 1).text()).lower()
                    if all(p in nome for p in palavras):
                        encontrados.append(row)
            elif tipo_pesquisa == "Número":
                try:
                    alvo = int(termo)
                    for row in range(self.table.rowCount()):
                        if int(self.table.item(row, 0).text()) == alvo:
                            encontrados.append(row)
                except ValueError:
                    QMessageBox.warning(self, "Erro", "Digite um número válido para busca por Nº.")
                    return
            self.table.clearSelection()
            for row in encontrados:
                self.table.selectRow(row)
                self.table.scrollToItem(self.table.item(row, 0), QAbstractItemView.PositionAtCenter)
                for col in range(self.table.columnCount()):
                    item = self.table.item(row, col)
                    if item:
                        item.setBackground(QColor("#a5d6a7"))
            if not encontrados:
                QMessageBox.information(self, "Aviso", "❌ Nenhum produto encontrado.")
        else:  # Histórico
            self._pesquisar_historico()

    def _limpar_pesquisa(self):
        """Limpa os campos de pesquisa."""
        self.entry_pesquisa.clear()
        self.tipo_pesquisa.setCurrentText("Nome")
        self.table.clearSelection()

    def _on_tab_changed(self, index):
        """Controla a visibilidade dos botões conforme a aba."""
        aba = self.tabs.tabText(index)
        self.botoes_container.setVisible("Estoque" in aba)

    def closeEvent(self, event):
        """Sobrescreve o evento de fechamento para salvar os dados automaticamente."""
        # Chama o método de salvamento automático ao fechar
        self._salvar_dados_auto()
        # Aceita o evento de fechamento
        event.accept()

    def _limpar_destaques_selecao(self):
        """Limpa os destaques da seleção."""
        for row in range(self.table.rowCount()):
            for col in range(self.table.columnCount()):
                item = self.table.item(row, col)
                if item:
                    item.setBackground(Qt.white)

    def _pesquisar_historico(self):
        """Realiza a pesquisa no histórico."""
        try:
            termo = self._remover_acentos(self.entry_pesquisa.text()).strip().lower()
            tipo_pesquisa = self.tipo_pesquisa.currentText() if hasattr(self, 'tipo_pesquisa') else "Nome"
            if not termo:
                QMessageBox.information(self, "Aviso", "❌ Digite algo para pesquisar no histórico.")
                return
            for row in range(self.table_hist.rowCount()):
                for col in range(self.table_hist.columnCount()):
                    item = self.table_hist.item(row, col)
                    if item:
                        item.setBackground(Qt.white)
            palavras = [p for p in termo.split("%") if p.strip()]
            encontrados = []
            for row in range(self.table_hist.rowCount()):
                if tipo_pesquisa == "Número":
                    try:
                        alvo = int(termo)
                        item = self.table_hist.item(row, 0)
                        if item and int(item.text()) == alvo:
                            encontrados.append(row)
                    except:
                        pass
                else:  # tipo "Nome"
                    texto_linha = ""
                    for col in range(self.table_hist.columnCount()):
                        item = self.table_hist.item(row, col)
                        if item:
                            texto_linha += self._remover_acentos(item.text().lower()) + " "
                    if all(p in texto_linha for p in palavras):
                        encontrados.append(row)
            self.table_hist.clearSelection()
            if not encontrados:
                QMessageBox.information(self, "Aviso", "❌ Nenhum resultado encontrado no histórico.")
                return
            for row in encontrados:
                self.table_hist.selectRow(row)
                self.table_hist.scrollToItem(self.table_hist.item(row, 0), QAbstractItemView.PositionAtCenter)
                for col in range(self.table_hist.columnCount()):
                    item = self.table_hist.item(row, col)
                    if item:
                        item.setBackground(QColor("#a5d6a7"))
        except Exception as e:
            QMessageBox.critical(self, "Erro", f"Ocorreu um erro na pesquisa do histórico: {str(e)}")

# O bloco if __name__ == "__main__" permanece o mesmo
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = EstoqueApp()
    window.show()
    sys.exit(app.exec_())
