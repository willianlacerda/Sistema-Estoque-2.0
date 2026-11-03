import sys
import sqlite3
from PyQt5.QtWidgets import (
    QApplication, QWidget, QTabWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLineEdit, QLabel, QFormLayout, QMessageBox, QGroupBox, QScrollArea,
    QTableWidget, QTableWidgetItem, QFileDialog, QDateEdit, QComboBox,
    QFrame, QHeaderView, QDialog, QStackedWidget
)
from PyQt5.QtCore import Qt, QDate
from PyQt5.QtGui import QIcon, QColor, QPalette, QFont, QDoubleValidator, QPixmap
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors as pdf_colors
import matplotlib.pyplot as plt
import matplotlib.style as style

# ============================
# CONFIGURAÇÕES DE ESTILO MODERNO
# ============================
STYLESHEET = """
    QWidget {
        background-color: #f3f4f6;
        color: #212529;
        font-family: 'Segoe UI', 'Arial', sans-serif;
    }
    QPushButton {
        background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                                    stop:0 #198754, stop:1 #157347);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 24px;
        font-weight: bold;
        font-size: 14px;
        min-height: 40px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 14px rgba(13,110,253,0.25);
    }
    QPushButton:hover {
        background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                                    stop:0 #157347, stop:1 #198754);
        box-shadow: 0 6px 20px rgba(13,110,253,0.35);
    }
    QPushButton:pressed {
        background-color: #0f5132;
        box-shadow: inset 0 3px 6px rgba(0,0,0,0.2);
    }
    QPushButton.action-primary {
        background-color: #198754;
    }
    QPushButton.action-primary:hover {
        background-color: #146c43;
    }
    QPushButton.action-danger {
        background-color: #20c997;
    }
    QPushButton.action-danger:hover {
        background-color: #bb2d3b;
    }
    QTableWidget {
        background-color: white;
        border: 1px solid #ced4da;
        border-radius: 8px;
        gridline-color: #d3e3d3;
        selection-background-color: #d1e7dd;
        selection-color: #0f5132;
    }
    QHeaderView::section {
        background-color: #198754;
        color: white;
        padding: 8px;
        border: none;
        font-weight: bold;
    }
    QTabWidget::pane {
        border: 1px solid #ced4da;
        border-radius: 8px;
        background: white;
        margin-top: 5px;
    }
    QTabBar::tab {
        background: #f3f4f6;
        color: #495057;
        padding: 8px 16px;
        border: 1px solid #ced4da;
        border-bottom: none;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        margin-right: 2px;
        min-width: 120px;  /* Largura mínima para evitar corte */
        max-width: 300px;  /* Largura máxima para evitar expansão excessiva */
    }
    QTabBar::tab:selected {
        background: white;
        color: #198754;
        font-weight: bold;
        border-bottom: 2px solid #198754;
    }
    QGroupBox, .card {
        border: 1px solid #ced4da;
        border-radius: 16px;
        margin-top: 20px;
        padding-top: 22px;
        background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
                                  stop:0 #f9fafb,
                                  stop:1 #f1f3f7);
        box-shadow: 0 4px 20px 0 rgba(50, 50, 93, 0.08),
                    0 1.5px 5px 0 rgba(0,0,0,0.03);
    }
    QGroupBox::title {
        subcontrol-origin: margin;
        left: 18px;
        padding: 0 8px;
        color: #198754;
        font-weight: bold;
        background: transparent;
        font-size: 16px;
    }
    QLineEdit, QDateEdit, QComboBox {
        border: 1px solid #ced4da;
        border-radius: 8px;
        padding: 8px;
        background: white;
        min-height: 38px;
    }
    QLineEdit:focus, QDateEdit:focus, QComboBox:focus {
        border: 1.5px solid #86b7fe;
        outline: none;
    }
    QScrollArea {
        border: none;
        background: transparent;
    }
    QLabel#statusLabel {
        background-color: #212529;
        color: white;
        padding: 10px;
        font-size: 12px;
    }
    .card {
        background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
                                  stop:0 #f6f7fb,
                                  stop:1 #eceffa);
        border: 1px solid #dde2ea;
        border-radius: 20px;
        padding: 20px 18px;
        margin-bottom: 15px;
        box-shadow: 0 4px 20px 0 rgba(13, 110, 253, 0.06),
                    0 2px 8px 0 rgba(33, 37, 41, 0.04);
        transition: box-shadow 0.2s;
    }
    .card:hover {
        box-shadow: 0 8px 36px 0 rgba(13, 110, 253, 0.10),
                    0 4px 16px 0 rgba(33, 37, 41, 0.06);
    }
    .shadow {
        border: none;
        box-shadow: 0 2px 8px rgba(33,37,41,0.07);
    }
"""

# ============================
# BANCO DE DADOS
# ============================
def create_connection():
    return sqlite3.connect("financeiro.db")

def create_tables():
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lancamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT NOT NULL,
            subcategoria TEXT NOT NULL,
            valor REAL NOT NULL,
            descricao TEXT,
            data TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reset_mensal (
            mes TEXT PRIMARY KEY
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS historico_lancamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT NOT NULL,
            subcategoria TEXT NOT NULL,
            valor REAL NOT NULL,
            descricao TEXT,
            data TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def verificar_reset_mensal():
    conn = create_connection()
    cursor = conn.cursor()
    data_atual = QDate.currentDate().toString("yyyy-MM")
    cursor.execute("SELECT 1 FROM reset_mensal WHERE mes = ?", (data_atual,))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO historico_lancamentos (categoria, subcategoria, valor, descricao, data)
            SELECT categoria, subcategoria, valor, descricao, data FROM lancamentos
            WHERE strftime('%Y-%m', data) < ?
        ''', (data_atual,))
        cursor.execute('''
            DELETE FROM lancamentos
            WHERE strftime('%Y-%m', data) < ?
        ''', (data_atual,))
        cursor.execute("INSERT OR REPLACE INTO reset_mensal (mes) VALUES (?)", (data_atual,))
        conn.commit()
        QMessageBox.information(None, "Novo Mês", "Lançamentos anteriores foram arquivados e tabela limpa.")
    conn.close()

def inserir_lancamento(categoria, subcategoria, valor, descricao, data):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO lancamentos (categoria, subcategoria, valor, descricao, data)
        VALUES (?, ?, ?, ?, ?)
    ''', (categoria, subcategoria, valor, descricao, data))
    conn.commit()
    conn.close()

def listar_lancamentos(filtro_data_inicio=None, filtro_data_fim=None):
    conn = create_connection()
    cursor = conn.cursor()
    if filtro_data_inicio and filtro_data_fim:
        cursor.execute('''
            SELECT * FROM lancamentos WHERE data BETWEEN ? AND ?
            ORDER BY data DESC
        ''', (filtro_data_inicio, filtro_data_fim))
    else:
        cursor.execute('SELECT * FROM lancamentos ORDER BY data DESC')
    registros = cursor.fetchall()
    conn.close()
    return registros

def listar_historico_lancamentos(filtro_data_inicio=None, filtro_data_fim=None):
    conn = create_connection()
    cursor = conn.cursor()
    if filtro_data_inicio and filtro_data_fim:
        cursor.execute('''
            SELECT id, categoria, subcategoria, descricao, valor, data FROM historico_lancamentos
            WHERE date(data) BETWEEN date(?) AND date(?)
            ORDER BY data DESC
        ''', (filtro_data_inicio, filtro_data_fim))
    else:
        cursor.execute('''
            SELECT id, categoria, subcategoria, descricao, valor, data FROM historico_lancamentos
            ORDER BY data DESC
        ''')
    registros = cursor.fetchall()
    conn.close()
    return registros

def listar_historico_item(categoria, subcategoria):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, valor, descricao, data FROM lancamentos 
        WHERE categoria = ? AND subcategoria = ?
        ORDER BY data DESC
    ''', (categoria, subcategoria))
    registros = cursor.fetchall()
    conn.close()
    return registros

def listar_historico_por_periodo(categoria, subcategoria, inicio, fim):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, valor, descricao, data FROM lancamentos 
        WHERE categoria = ? AND subcategoria = ? AND data BETWEEN ? AND ?
        ORDER BY data DESC
    ''', (categoria, subcategoria, inicio, fim))
    registros = cursor.fetchall()
    conn.close()
    return registros

def remover_lancamento(id_lancamento):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM lancamentos WHERE id = ?', (id_lancamento,))
    conn.commit()
    conn.close()

# ============================
# COMPONENTES DA INTERFACE
# ============================
class DateRangeDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Selecionar Período")
        layout = QVBoxLayout(self)
        self.date_start = QDateEdit()
        self.date_end = QDateEdit()
        self.date_start.setCalendarPopup(True)
        self.date_end.setCalendarPopup(True)
        self.date_start.setDisplayFormat("dd/MM/yyyy")
        self.date_end.setDisplayFormat("dd/MM/yyyy")
        self.date_start.setReadOnly(False)
        self.date_end.setReadOnly(False)
        self.date_start.setDate(QDate.currentDate().addMonths(-1))
        self.date_end.setDate(QDate.currentDate())
        layout.addWidget(QLabel("Data Inicial:"))
        layout.addWidget(self.date_start)
        layout.addWidget(QLabel("Data Final:"))
        layout.addWidget(self.date_end)
        btn_layout = QHBoxLayout()
        self.btn_ok = QPushButton("Gerar")
        self.btn_cancel = QPushButton("Cancelar")
        btn_layout.addWidget(self.btn_ok)
        btn_layout.addWidget(self.btn_cancel)
        layout.addLayout(btn_layout)
        self.btn_ok.clicked.connect(self.accept)
        self.btn_cancel.clicked.connect(self.reject)

    def get_dates(self):
        return self.date_start.date().toString("yyyy-MM-dd"), self.date_end.date().toString("yyyy-MM-dd")

class HeaderWidget(QWidget):
    def __init__(self, title):
        super().__init__()
        layout = QHBoxLayout(self)
        layout.setContentsMargins(25, 15, 25, 15)
        logo_label = QLabel()
        pixmap = QPixmap('logo.png')
        pixmap = pixmap.scaledToHeight(90, Qt.SmoothTransformation)
        logo_label.setPixmap(pixmap)
        logo_label.setFixedSize(pixmap.size())
        layout.addWidget(logo_label)
        layout.addSpacing(15)
        title_label = QLabel(f"💰  {title}")
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setStyleSheet("font-size: 30px; font-weight: bold; color: #212529; background: transparent;")
        layout.addStretch()
        layout.addWidget(title_label, alignment=Qt.AlignCenter)
        layout.addStretch()
        theme_button = QPushButton("🌙")
        theme_button.setFixedSize(40, 40)
        theme_button.setStyleSheet("""
            QPushButton {
                border-radius: 20px;
                font-size: 16px;
            }
            QPushButton:hover {
                background-color: #d3e3d3;
            }
        """)
        layout.addWidget(theme_button)
        self.setStyleSheet("background-color: white; border: none;")

class SubcategoriaForm(QDialog):
    def __init__(self, categoria, subcategoria, callback_atualizar_tabela):
        super().__init__()
        self.setWindowTitle(f"{categoria} - {subcategoria}")
        self.setWindowIcon(QIcon("icon.png"))
        self.resize(500, 300)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 15, 25, 20)
        layout.setSpacing(15)
        header = QLabel(f"{categoria} > {subcategoria}")
        header.setStyleSheet("""
            font-size: 16px;
            font-weight: bold;
            color: #212529;
            margin-bottom: 5px;
        """)
        header.setAlignment(Qt.AlignCenter)
        layout.addWidget(header)
        form_container = QWidget()
        form_container.setStyleSheet(".card { padding: 20px; }")
        form_container.setProperty("class", "card")
        form_layout = QFormLayout(form_container)
        form_layout.setSpacing(15)
        form_layout.setContentsMargins(0, 0, 0, 0)
        self.valor_input = QLineEdit()
        self.valor_input.setValidator(QDoubleValidator(0.00, 1000000.00, 2))
        self.valor_input.setPlaceholderText("0,00")
        self.valor_input.setStyleSheet("font-size: 14px;")
        self.descricao_input = QLineEdit()
        self.descricao_input.setPlaceholderText("Descrição detalhada do lançamento")
        self.descricao_input.setStyleSheet("font-size: 14px;")
        self.data_input = QDateEdit()
        self.data_input.setCalendarPopup(True)
        self.data_input.setDate(QDate.currentDate())
        self.data_input.setDisplayFormat("dd/MM/yyyy")
        self.data_input.setStyleSheet("font-size: 14px;")
        form_layout.addRow(QLabel("Valor (R$):"), self.valor_input)
        form_layout.addRow(QLabel("Descrição:"), self.descricao_input)
        form_layout.addRow(QLabel("Data:"), self.data_input)
        layout.addWidget(form_container)
        button_container = QWidget()
        button_layout = QHBoxLayout(button_container)
        button_layout.setContentsMargins(0, 0, 0, 0)
        button_layout.setSpacing(15)
        self.botao_cancelar = QPushButton("Cancelar")
        self.botao_cancelar.setStyleSheet("""
            QPushButton {
                background-color: #dc3545;
                color: white;
                border-radius: 8px;
                padding: 10px 24px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #bb2d3b;
            }
        """)
        self.botao_cancelar.clicked.connect(self.close)
        self.btn_historico = QPushButton("Ver Histórico")
        self.btn_historico.setStyleSheet("""
            QPushButton {
                background-color: #0d6efd;
                color: white;
                border-radius: 8px;
                padding: 10px 24px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #0b5ed7;
            }
        """)
        self.btn_historico.clicked.connect(self.mostrar_historico)
        self.botao_salvar = QPushButton("Salvar Lançamento")
        self.botao_salvar.setStyleSheet("""
            QPushButton {
                background-color: #198754;
                color: white;
                border-radius: 8px;
                padding: 10px 24px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #157347;
            }
        """)
        self.botao_salvar.clicked.connect(self.salvar_lancamento)
        button_layout.addWidget(self.botao_cancelar)
        button_layout.addWidget(self.btn_historico)
        button_layout.addWidget(self.botao_salvar)
        layout.addWidget(button_container)
        self.categoria = categoria
        self.subcategoria = subcategoria
        self.callback_atualizar_tabela = callback_atualizar_tabela
        self.valor_input.setFocus()

    def keyPressEvent(self, event):
        if event.key() in (Qt.Key.Key_Return, Qt.Key.Key_Enter):
            if self.valor_input.hasFocus():
                self.descricao_input.setFocus()
            elif self.descricao_input.hasFocus():
                self.data_input.setFocus()
            elif self.data_input.hasFocus():
                self.botao_salvar.setFocus()
            else:
                super().keyPressEvent(event)
        else:
            super().keyPressEvent(event)

    def mostrar_historico(self):
        historico = HistoricoDialog(self.categoria, self.subcategoria, self)
        historico.exec()

    def salvar_lancamento(self):
        try:
            valor_texto = self.valor_input.text().replace(".", "").replace(",", ".")
            valor = float(valor_texto)
            descricao = self.descricao_input.text()
            data = self.data_input.date().toString("yyyy-MM-dd")
            if valor <= 0:
                QMessageBox.warning(self, "Valor inválido", "O valor deve ser maior que zero.")
                return
            inserir_lancamento(self.categoria, self.subcategoria, valor, descricao, data)
            msg = QMessageBox(self)
            msg.setIcon(QMessageBox.Icon.Information)
            msg.setWindowTitle("Sucesso")
            msg.setText("Lançamento salvo com sucesso!")
            msg.setStandardButtons(QMessageBox.StandardButton.Ok)
            msg.exec()
            self.callback_atualizar_tabela()
            self.close()
        except ValueError:
            QMessageBox.warning(self, "Erro", "Por favor, insira um valor numérico válido.")

class HistoricoDialog(QDialog):
    def __init__(self, categoria, subcategoria, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"Histórico - {categoria} > {subcategoria}")
        self.resize(800, 500)
        self.categoria = categoria
        self.subcategoria = subcategoria
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 25, 30, 20)
        layout.setSpacing(20)
        header = QLabel(f"Histórico - {categoria} > {subcategoria}")
        header.setStyleSheet("""
            font-size: 20px;
            font-weight: bold;
            color: #212529;
            padding: 5px 10px;
            background-color: #f1f3f5;
            border-radius: 8px;
        """)
        header.setAlignment(Qt.AlignCenter)
        layout.addWidget(header)
        self.tabela = QTableWidget()
        self.tabela.setStyleSheet("""
            QTableWidget {
                border: 1px solid #ced4da;
                border-radius: 10px;
                background-color: white;
                font-size: 13px;
            }
            QTableWidget::item {
                padding: 0px;
            }
        """)
        self.tabela.setColumnCount(5)
        self.tabela.setHorizontalHeaderLabels(["ID", "Valor (R$)", "Descrição", "Data", "Ações"])
        header = self.tabela.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(1, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, QHeaderView.Stretch)
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(4, QHeaderView.Fixed)
        self.tabela.setColumnWidth(4, 100)
        self.tabela.verticalHeader().setDefaultSectionSize(50)
        layout.addWidget(self.tabela, 1)
        btn_fechar = QPushButton("Fechar")
        btn_fechar.setStyleSheet("""
            QPushButton {
                background-color: #198754;
                color: white;
                border-radius: 8px;
                padding: 10px 24px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #157347;
            }
        """)
        btn_fechar.clicked.connect(self.accept)
        layout.addWidget(btn_fechar, alignment=Qt.AlignRight)
        self.carregar_dados()

    def carregar_dados(self):
        registros = listar_historico_item(self.categoria, self.subcategoria)
        self.tabela.setRowCount(len(registros))
        for row, (id_, valor, descricao, data) in enumerate(registros):
            item_0 = QTableWidgetItem(str(id_))
            item_0.setFlags(item_0.flags() & ~Qt.ItemIsEditable)
            self.tabela.setItem(row, 0, item_0)
            valor_item = QTableWidgetItem(f"R$ {float(valor):.2f}")
            valor_item.setFlags(valor_item.flags() & ~Qt.ItemIsEditable)
            valor_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.tabela.setItem(row, 1, valor_item)
            item_2 = QTableWidgetItem(descricao if descricao else "-")
            item_2.setFlags(item_2.flags() & ~Qt.ItemIsEditable)
            self.tabela.setItem(row, 2, item_2)
            item_3 = QTableWidgetItem(data)
            item_3.setFlags(item_3.flags() & ~Qt.ItemIsEditable)
            self.tabela.setItem(row, 3, item_3)
            btn_remover = QPushButton("Remover")
            btn_remover.setStyleSheet("""
                QPushButton {
                    background-color: #dc3545;
                    color: white;
                    border-radius: 6px;
                    font-weight: bold;
                    padding: 6px 12px;
                }
                QPushButton:hover {
                    background-color: #bb2d3b;
                }
            """)
            btn_remover.setProperty("id_lancamento", id_)
            btn_remover.clicked.connect(self.remover_lancamento)
            cell_widget = QWidget()
            layout_cell = QVBoxLayout(cell_widget)
            layout_cell.setContentsMargins(0, 0, 0, 0)
            layout_cell.setAlignment(Qt.AlignCenter)
            layout_cell.addWidget(btn_remover)
            cell_widget.setLayout(layout_cell)
            self.tabela.setCellWidget(row, 4, cell_widget)

    def remover_lancamento(self):
        btn = self.sender()
        id_lancamento = btn.property("id_lancamento")
        reply = QMessageBox.question(
            self, 'Confirmar Remoção',
            f'Tem certeza que deseja remover o lançamento ID {id_lancamento}?',
            QMessageBox.Yes | QMessageBox.No,
        )
        if reply == QMessageBox.Yes:
            remover_lancamento(id_lancamento)
            QMessageBox.information(self, "Sucesso", "Lançamento removido com sucesso!")
            self.carregar_dados()

class FinanceiroUI(QWidget):
    def __init__(self):
        super().__init__()
        verificar_reset_mensal()
        self.setWindowTitle("WL System - Financeiro")
        self.setWindowIcon(QIcon("icon.png"))
        self.resize(1280, 800)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        self.header = HeaderWidget("Controle Financeiro")
        layout.addWidget(self.header)
        main_widget = QWidget()
        main_layout = QVBoxLayout(main_widget)
        main_layout.setContentsMargins(25, 0, 25, 20)
        main_layout.setSpacing(20)
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
    QTabBar::tab {
        padding: 10px 20px;
        min-width: 150px;
        max-width: 250px;
    }
    QTabBar {
        qproperty-drawBase: 0;
    }
""")
        self.tabs.tabBar().setElideMode(Qt.ElideNone)
        main_layout.addWidget(self.tabs)
        layout.addWidget(main_widget, 1)
        self.adicionar_abas()
        self.setStyleSheet(STYLESHEET)
        self.current_level = 0

    def adicionar_abas(self):
        abas = {
            "DESPESAS VARIÁVEIS": {
                "CUSTO DAS MERCADORIAS": [
                    "COMPRAS CT", "COMPRAS NC", "COMPRAS BAHIA",
                    "COMPRAS GOIÂNIA", "COMPRAS IMPERATRIZ", "HORTI-FRUIT", "SECOS E MOLHADOS"
                ],
                "DESPESAS COM VENDAS": [
                    "COMISSÕES", "DIARISTA", "AJUDA DE CUSTO (vendedor)",
                    "SIMPLES NACIONAL", "ICMS", "DARF"
                ],
                "DESP. LOGÍSTICA": [
                    "COMBUSTÍVEL ENTREGA", "MANUT./REVISÕES VEÍCULO",
                    "HOSPED./ALIMENT./AJ.CUSTO", "FRETES CAMINHÕES (terceiros)",
                    "SEGUROS CARGAS", "BALSA"
                ]
            },
            "DESPESAS FIXAS": {
                "DESPESAS ADM": [
                    "ALUGUEL", "ENERGIA", "ÁGUA", "INTERNET",
                    "MAT. DE ESCRITÓRIO", "MAT. DE LIMPEZA", "CONSÓRCIO"
                ],
                "DESP. C+ PESSOAL": [
                    "FOLHA DE PAGAMENTO", "DÉCIMO TERCEIRO", "IMPOSTO", "RECISÃO",
                    "FGTS", "INSS", "TREINAMENTOS", "UNIFORMES", "REFEIÇÕES"
                ],
                "LICENÇAS OPERACIONAIS": [
                    "ALVARÁ", "IPTU / IPVA / SEGUROS VEÍC.", "SEGUROS IMÓVEIS"
                ],
                "DESP. FINANCEIRAS": [
                    "TARIFAS BANC.+CARTÕES+JUROS", "PRESTAÇÕES FINANC. IMOBILIZADOS"
                ],
                "MARKETING E COMUNICAÇÃO": [
                    "PROPAG. / REDES SOCIAIS", "MAT. GRÁFICOS / COMUNIC. VISUAL",
                    "MATERIAIS DE VENDAS (equipes)"
                ],
                "MANUTENÇÃO": [
                    "MANUT. PREDIAL", "MÁQUINAS E EQUIPAM."
                ],
                "ASSESSORIA": [
                    "CONTADOR", "SUPORTE SISTEMA", "CONSULTORIAS", "SEGURANÇA"
                ],
                "DIRETORIA": [
                    "PRÓ-LABORE 1", "PRÓ-LABORE 2", "PRÓ-LABORE 3"
                ],
                "RECEITAS NÃO OP.": [
                    "CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "INV. CAP. PRÓPRIO",
                    "RECEITAS DE INVESTIM.", "OUTRAS ENTRADAS"
                ],
                "DESPESAS NÃO OP.": [
                    "CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "RETIRADA CAP. PRÓPRIO",
                    "DESPESAS DE INVESTIM.", "OUTRAS SAÍDAS"
                ]
            }
        }
        for aba, grupos in abas.items():
            tab = QWidget()
            tab_layout = QVBoxLayout(tab)
            scroll = QScrollArea()
            scroll.setWidgetResizable(True)
            scroll.setFrameShape(QFrame.NoFrame)
            content_widget = QWidget()
            content_layout = QVBoxLayout(content_widget)
            content_layout.setSpacing(20)
            content_layout.setContentsMargins(5, 5, 5, 5)
            for grupo, subcats in grupos.items():
                box = QGroupBox(grupo)
                box.setStyleSheet("""
                    QGroupBox {
                        border-radius: 8px;
                    }
                """)
                box_layout = QVBoxLayout(box)
                box_layout.setSpacing(8)
                for sub in subcats:
                    btn = QPushButton(sub)
                    btn.setStyleSheet("""
                        QPushButton {
                            text-align: left;
                            padding: 12px;
                            border-radius: 6px;
                            background-color: white;
                            border: 1px solid #ced4da;
                            color: #212529;
                            font-size: 14px;
                        }
                        QPushButton:hover {
                            background-color: #f3f4f6;
                            border: 1px solid #198754;
                            color: #198754;
                        }
                    """)
                    btn.clicked.connect(lambda _, s=sub, g=grupo, a=aba: self.abrir_formulario_lancamento(a, g, s))
                    box_layout.addWidget(btn)
                content_layout.addWidget(box)
            content_layout.addStretch()
            scroll.setWidget(content_widget)
            tab_layout.addWidget(scroll)
            self.tabs.addTab(tab, aba)
        historico_tab = QWidget()
        historico_layout = QVBoxLayout(historico_tab)
        historico_layout.setSpacing(15)
        filter_group = QGroupBox("Filtrar Lançamentos")
        filter_group.setStyleSheet("""
            QGroupBox {
                padding-top: 25px;
            }
        """)
        filter_layout = QHBoxLayout(filter_group)
        filter_layout.setSpacing(15)
        self.data_inicio = QDateEdit()
        self.data_inicio.setCalendarPopup(True)
        self.data_inicio.setDate(QDate.currentDate().addMonths(-1))
        self.data_inicio.setDisplayFormat("dd/MM/yyyy")
        self.data_fim = QDateEdit()
        self.data_fim.setCalendarPopup(True)
        self.data_fim.setDate(QDate.currentDate())
        self.data_fim.setDisplayFormat("dd/MM/yyyy")
        btn_filtrar = QPushButton("Aplicar Filtro")
        btn_filtrar.setIcon(QIcon("filter.png"))
        btn_filtrar.setObjectName("primaryActionButton")
        btn_filtrar.clicked.connect(self.atualizar_tabela)
        btn_limpar = QPushButton("Limpar Filtro")
        btn_limpar.setIcon(QIcon("clear.png"))
        btn_limpar.setObjectName("secondaryActionButton")
        btn_limpar.clicked.connect(self.limpar_filtros)
        btn_exportar = QPushButton("Exportar CSV")
        btn_exportar.setIcon(QIcon("export.png"))
        btn_exportar.setObjectName("infoActionButton")
        btn_exportar.clicked.connect(self.exportar_dados)
        filter_layout.addWidget(QLabel("Período:"))
        filter_layout.addWidget(self.data_inicio)
        filter_layout.addWidget(QLabel("até"))
        filter_layout.addWidget(self.data_fim)
        filter_layout.addWidget(btn_filtrar)
        filter_layout.addWidget(btn_limpar)
        filter_layout.addWidget(btn_exportar)
        filter_layout.addStretch()
        historico_layout.addWidget(filter_group)
        self.tabela = QTableWidget()
        self.tabela.setObjectName("mainTable")
        self.tabela.setAlternatingRowColors(True)
        self.tabela.setSortingEnabled(True)
        self.tabela.setStyleSheet("""
            QTableWidget {
                border: 1px solid #ced4da;
                border-radius: 10px;
                background-color: white;
                font-size: 13px;
            }
            QTableWidget::item {
                padding: 10px;
            }
        """)
        historico_layout.addWidget(self.tabela, 1)
        self.tabs.addTab(historico_tab, "HISTÓRICO")
        relatorio_hierarquico_tab = QWidget()
        relatorio_hierarquico_layout = QVBoxLayout(relatorio_hierarquico_tab)
        relatorio_hierarquico_layout.setSpacing(15)
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setFrameShape(QFrame.NoFrame)
        container = QWidget()
        container_layout = QVBoxLayout(container)
        container_layout.setContentsMargins(5, 5, 5, 5)
        self.relatorio_tree = QStackedWidget()
        self.tela_nivel_a = self.criar_tela_nivel_a()
        self.relatorio_tree.addWidget(self.tela_nivel_a)
        self.tela_nivel_b = QWidget()
        self.tela_nivel_b_layout = QVBoxLayout(self.tela_nivel_b)
        self.relatorio_tree.addWidget(self.tela_nivel_b)
        self.tela_nivel_c = QWidget()
        self.tela_nivel_c_layout = QVBoxLayout(self.tela_nivel_c)
        self.relatorio_tree.addWidget(self.tela_nivel_c)
        self.btn_voltar = QPushButton("← Voltar")
        self.btn_voltar.setObjectName("secondaryActionButton")
        self.btn_voltar.clicked.connect(self.voltar_nivel_anterior)
        self.btn_voltar.hide()
        container_layout.addWidget(self.btn_voltar)
        container_layout.addWidget(self.relatorio_tree)
        container_layout.addStretch()
        scroll_area.setWidget(container)
        relatorio_hierarquico_layout.addWidget(scroll_area)
        self.tabs.addTab(relatorio_hierarquico_tab, "RELATÓRIO")
        grafico_tab = QWidget()
        grafico_layout = QVBoxLayout(grafico_tab)
        grafico_layout.setSpacing(15)
        self.botao_gerar_grafico = QPushButton("Gerar Gráfico de Barras")
        self.botao_gerar_grafico.setIcon(QIcon("chart.png"))
        self.botao_gerar_grafico.setObjectName("primaryActionButton")
        self.botao_gerar_grafico.clicked.connect(self.gerar_grafico_barras)
        grafico_layout.addWidget(self.botao_gerar_grafico)
        grafico_layout.addStretch()
        self.tabs.addTab(grafico_tab, "GRÁFICOS")
        relatorio_tab = QWidget()
        relatorio_layout = QVBoxLayout(relatorio_tab)
        relatorio_layout.setSpacing(15)
        self.botao_relatorio = QPushButton("Gerar Relatório Completo PDF")
        self.botao_relatorio.setIcon(QIcon("pdf.png"))
        self.botao_relatorio.setObjectName("primaryActionButton")
        self.botao_relatorio.clicked.connect(self.gerar_relatorio)
        self.botao_relatorio_entradas = QPushButton("Gerar Relatório de Entradas PDF")
        self.botao_relatorio_entradas.setIcon(QIcon("pdf.png"))
        self.botao_relatorio_entradas.setObjectName("infoActionButton")
        self.botao_relatorio_entradas.clicked.connect(self.gerar_relatorio_entradas_pdf)
        relatorio_layout.addWidget(self.botao_relatorio)
        relatorio_layout.addWidget(self.botao_relatorio_entradas)
        relatorio_layout.addStretch()
        self.tabs.addTab(relatorio_tab, "PDF")
        self.atualizar_tabela()

    def criar_tela_nivel_a(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(15)
        categorias = ["DESPESAS VARIÁVEIS", "DESPESAS FIXAS"]
        for nome in categorias:
            container = QWidget()
            container.setProperty("class", "card")
            container_layout = QVBoxLayout(container)
            container_layout.setContentsMargins(0, 0, 0, 0)
            container_layout.setSpacing(5)
            btn = QPushButton(nome)
            btn.setStyleSheet("""
                QPushButton {
                    text-align: left;
                    padding: 15px;
                    border-radius: 6px;
                    background-color: white;
                    border: 1px solid #ced4da;
                    font-weight: bold;
                    font-size: 14px;
                    color: #212529;
                }
                QPushButton:hover {
                    background-color: #f3f4f6;
                    border: 1px solid #198754;
                    color: #198754;
                }
            """)
            btn.clicked.connect(lambda _, cat=nome: self.abrir_nivel_b(cat))
            total = 0
            grupos = {
                "DESPESAS VARIÁVEIS": {
                    "CUSTO DAS MERCADORIAS": [
                        "COMPRAS CT", "COMPRAS NC", "COMPRAS BAHIA",
                        "COMPRAS GOIÂNIA", "COMPRAS IMPERATRIZ", "HORTI-FRUIT", "SECOS E MOLHADOS"
                    ],
                    "DESPESAS COM VENDAS": [
                        "COMISSÕES", "DIARISTA", "AJUDA DE CUSTO (vendedor)",
                        "SIMPLES NACIONAL", "ICMS", "DARF"
                    ],
                    "DESP. LOGÍSTICA": [
                        "COMBUSTÍVEL ENTREGA", "MANUT./REVISÕES VEÍCULO",
                        "HOSPED./ALIMENT./AJ.CUSTO", "FRETES CAMINHÕES (terceiros)",
                        "SEGUROS CARGAS", "BALSA"
                    ]
                },
                "DESPESAS FIXAS": {
                    "DESPESAS ADM": [
                        "ALUGUEL", "ENERGIA", "ÁGUA", "INTERNET",
                        "MAT. DE ESCRITÓRIO", "MAT. DE LIMPEZA", "CONSÓRCIO"
                    ],
                    "DESP. C+ PESSOAL": [
                        "FOLHA DE PAGAMENTO", "DÉCIMO TERCEIRO", "IMPOSTO", "RECISÃO",
                        "FGTS", "INSS", "TREINAMENTOS", "UNIFORMES", "REFEIÇÕES"
                    ],
                    "LICENÇAS OPERACIONAIS": [
                        "ALVARÁ", "IPTU / IPVA / SEGUROS VEÍC.", "SEGUROS IMÓVEIS"
                    ],
                    "DESP. FINANCEIRAS": [
                        "TARIFAS BANC.+CARTÕES+JUROS", "PRESTAÇÕES FINANC. IMOBILIZADOS"
                    ],
                    "MARKETING E COMUNICAÇÃO": [
                        "PROPAG. / REDES SOCIAIS", "MAT. GRÁFICOS / COMUNIC. VISUAL",
                        "MATERIAIS DE VENDAS (equipes)"
                    ],
                    "MANUTENÇÃO": [
                        "MANUT. PREDIAL", "MÁQUINAS E EQUIPAM."
                    ],
                    "ASSESSORIA": [
                        "CONTADOR", "SUPORTE SISTEMA", "CONSULTORIAS", "SEGURANÇA"
                    ],
                    "DIRETORIA": [
                        "PRÓ-LABORE 1", "PRÓ-LABORE 2", "PRÓ-LABORE 3"
                    ],
                    "RECEITAS NÃO OP.": [
                        "CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "INV. CAP. PRÓPRIO",
                        "RECEITAS DE INVESTIM.", "OUTRAS ENTRADAS"
                    ],
                    "DESPESAS NÃO OP.": [
                        "CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "RETIRADA CAP. PRÓPRIO",
                        "DESPESAS DE INVESTIM.", "OUTRAS SAÍDAS"
                    ]
                }
            }
            for grupo, subcats in grupos[nome].items():
                for sub in subcats:
                    registros = listar_historico_item(nome, f"{grupo} - {sub}")
                    total += sum(valor for _, valor, _, _ in registros)
            label_valor = QLabel(f"Total: R$ {total:,.2f}")
            label_valor.setStyleSheet("""
                color: #495057; 
                font-size: 13px;
                padding-left: 15px;
                padding-bottom: 5px;
            """)
            container_layout.addWidget(btn)
            container_layout.addWidget(label_valor)
            layout.addWidget(container)
        layout.addStretch()
        return widget

    def abrir_nivel_b(self, categoria_principal):
        self.tela_nivel_b_layout.setContentsMargins(0, 0, 0, 0)
        self.tela_nivel_b_layout.setSpacing(15)
        self.tela_nivel_b_layout.setAlignment(Qt.AlignTop)
        while self.tela_nivel_b_layout.count():
            item = self.tela_nivel_b_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        grupos = {
            "DESPESAS VARIÁVEIS": {
                "CUSTO DAS MERCADORIAS": [
                    "COMPRAS CT", "COMPRAS NC", "COMPRAS BAHIA",
                    "COMPRAS GOIÂNIA", "COMPRAS IMPERATRIZ", "HORTI-FRUIT", "SECOS E MOLHADOS"
                ],
                "DESPESAS COM VENDAS": [
                    "COMISSÕES", "DIARISTA", "AJUDA DE CUSTO (vendedor)",
                    "SIMPLES NACIONAL", "ICMS", "DARF"
                ],
                "DESP. LOGÍSTICA": [
                    "COMBUSTÍVEL ENTREGA", "MANUT./REVISÕES VEÍCULO",
                    "HOSPED./ALIMENT./AJ.CUSTO", "FRETES CAMINHÕES (terceiros)",
                    "SEGUROS CARGAS", "BALSA"
                ]
            },
            "DESPESAS FIXAS": {
                "DESPESAS ADM": [
                    "ALUGUEL", "ENERGIA", "ÁGUA", "INTERNET",
                    "MAT. DE ESCRITÓRIO", "MAT. DE LIMPEZA", "CONSÓRCIO"
                ],
                "DESP. C+ PESSOAL": [
                    "FOLHA DE PAGAMENTO", "DÉCIMO TERCEIRO", "IMPOSTO", "RECISÃO",
                    "FGTS", "INSS", "TREINAMENTOS", "UNIFORMES", "REFEIÇÕES"
                ],
                "LICENÇAS OPERACIONAIS": [
                    "ALVARÁ", "IPTU / IPVA / SEGUROS VEÍC.", "SEGUROS IMÓVEIS"
                ],
                "DESP. FINANCEIRAS": [
                    "TARIFAS BANC.+CARTÕES+JUROS", "PRESTAÇÕES FINANC. IMOBILIZADOS"
                ],
                "MARKETING E COMUNICAÇÃO": [
                    "PROPAG. / REDES SOCIAIS", "MAT. GRÁFICOS / COMUNIC. VISUAL",
                    "MATERIAIS DE VENDAS (equipes)"
                ],
                "MANUTENÇÃO": [
                    "MANUT. PREDIAL", "MÁQUINAS E EQUIPAM."
                ],
                "ASSESSORIA": [
                    "CONTADOR", "SUPORTE SISTEMA", "CONSULTORIAS", "SEGURANÇA"
                ],
                "DIRETORIA": [
                    "PRÓ-LABORE 1", "PRÓ-LABORE 2", "PRÓ-LABORE 3"
                ],
                "RECEITAS NÃO OP.": [
                    "CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "INV. CAP. PRÓPRIO",
                    "RECEITAS DE INVESTIM.", "OUTRAS ENTRADAS"
                ],
                "DESPESAS NÃO OP.": [
                    "CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "RETIRADA CAP. PRÓPRIO",
                    "DESPESAS DE INVESTIM.", "OUTRAS SAÍDAS"
                ]
            }
        }
        grupo_atual = grupos.get(categoria_principal, {})
        for grupo_nome, subcategorias in grupo_atual.items():
            total = 0
            for sub in subcategorias:
                registros = listar_historico_item(categoria_principal, f"{grupo_nome} - {sub}")
                total += sum(valor for _, valor, _, _ in registros)
            container = QWidget()
            container.setProperty("class", "card")
            layout_v = QVBoxLayout(container)
            layout_v.setContentsMargins(0, 0, 0, 0)
            layout_v.setSpacing(5)
            btn = QPushButton(grupo_nome)
            btn.setStyleSheet("""
                QPushButton {
                    text-align: left;
                    padding: 12px;
                    border-radius: 6px;
                    background-color: white;
                    border: 1px solid #ced4da;
                    font-size: 14px;
                    color: #212529;
                }
                QPushButton:hover {
                    background-color: #f3f4f6;
                    border: 1px solid #198754;
                    color: #198754;
                }
            """)
            label_valor = QLabel(f"Total: R$ {total:,.2f}")
            label_valor.setStyleSheet("""
                color: #495057; 
                font-size: 13px;
                padding-left: 12px;
                padding-bottom: 5px;
            """)
            layout_v.addWidget(btn)
            layout_v.addWidget(label_valor)
            btn.clicked.connect(lambda _, g=grupo_nome, c=categoria_principal: self.abrir_nivel_c(g, c))
            self.tela_nivel_b_layout.addWidget(container)
        self.relatorio_tree.setCurrentIndex(1)
        self.btn_voltar.show()
        self.current_level = 1

    def abrir_nivel_c(self, grupo_nome, categoria_principal):
        self.tela_nivel_c_layout.setContentsMargins(0, 0, 0, 0)
        self.tela_nivel_c_layout.setSpacing(15)
        self.tela_nivel_c_layout.setAlignment(Qt.AlignTop)
        while self.tela_nivel_c_layout.count():
            item = self.tela_nivel_c_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        grupos = {
            "DESPESAS VARIÁVEIS": {
                "CUSTO DAS MERCADORIAS": [
                    "COMPRAS CT", "COMPRAS NC", "COMPRAS BAHIA",
                    "COMPRAS GOIÂNIA", "COMPRAS IMPERATRIZ", "HORTI-FRUIT", "SECOS E MOLHADOS"
                ],
                "DESPESAS COM VENDAS": [
                    "COMISSÕES", "DIARISTA", "AJUDA DE CUSTO (vendedor)",
                    "SIMPLES NACIONAL", "ICMS", "DARF"
                ],
                "DESP. LOGÍSTICA": [
                    "COMBUSTÍVEL ENTREGA", "MANUT./REVISÕES VEÍCULO",
                    "HOSPED./ALIMENT./AJ.CUSTO", "FRETES CAMINHÕES (terceiros)",
                    "SEGUROS CARGAS", "BALSA"
                ]
            },
            "DESPESAS FIXAS": {
                "DESPESAS ADM": [
                    "ALUGUEL", "ENERGIA", "ÁGUA", "INTERNET",
                    "MAT. DE ESCRITÓRIO", "MAT. DE LIMPEZA", "CONSÓRCIO"
                ],
                "DESP. C+ PESSOAL": [
                    "FOLHA DE PAGAMENTO", "DÉCIMO TERCEIRO", "IMPOSTO", "RECISÃO",
                    "FGTS", "INSS", "TREINAMENTOS", "UNIFORMES", "REFEIÇÕES"
                ],
                "LICENÇAS OPERACIONAIS": [
                    "ALVARÁ", "IPTU / IPVA / SEGUROS VEÍC.", "SEGUROS IMÓVEIS"
                ],
                "DESP. FINANCEIRAS": [
                    "TARIFAS BANC.+CARTÕES+JUROS", "PRESTAÇÕES FINANC. IMOBILIZADOS"
                ],
                "MARKETING E COMUNICAÇÃO": [
                    "PROPAG. / REDES SOCIAIS", "MAT. GRÁFICOS / COMUNIC. VISUAL",
                    "MATERIAIS DE VENDAS (equipes)"
                ],
                "MANUTENÇÃO": [
                    "MANUT. PREDIAL", "MÁQUINAS E EQUIPAM."
                ],
                "ASSESSORIA": [
                    "CONTADOR", "SUPORTE SISTEMA", "CONSULTORIAS", "SEGURANÇA"
                ],
                "DIRETORIA": [
                    "PRÓ-LABORE 1", "PRÓ-LABORE 2", "PRÓ-LABORE 3"
                ],
                "RECEITAS NÃO OP.": [
                    "CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "INV. CAP. PRÓPRIO",
                    "RECEITAS DE INVESTIM.", "OUTRAS ENTRADAS"
                ],
                "DESPESAS NÃO OP.": [
                    "CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "RETIRADA CAP. PRÓPRIO",
                    "DESPESAS DE INVESTIM.", "OUTRAS SAÍDAS"
                ]
            }
        }
        subcategorias = grupos[categoria_principal].get(grupo_nome, [])
        for subcat in subcategorias:
            container = QWidget()
            container.setProperty("class", "card")
            layout_v = QVBoxLayout(container)
            layout_v.setContentsMargins(0, 0, 0, 0)
            layout_v.setSpacing(5)
            registros = listar_historico_item(categoria_principal, f"{grupo_nome} - {subcat}")
            total = sum(valor for _, valor, _, _ in registros)
            btn = QPushButton(subcat)
            btn.setStyleSheet("""
                QPushButton {
                    text-align: left;
                    padding: 12px;
                    border-radius: 6px;
                    background-color: white;
                    border: 1px solid #ced4da;
                    font-size: 14px;
                    color: #212529;
                }
                QPushButton:hover {
                    background-color: #f3f4f6;
                    border: 1px solid #198754;
                    color: #198754;
                }
            """)
            label_valor = QLabel(f"Total: R$ {total:,.2f}")
            label_valor.setStyleSheet("""
                color: #495057; 
                font-size: 13px;
                padding-left: 12px;
                padding-bottom: 5px;
            """)
            layout_v.addWidget(btn)
            layout_v.addWidget(label_valor)
            btn.clicked.connect(lambda _, s=subcat, g=grupo_nome, a=categoria_principal: self.mostrar_historico(s, g, a))
            self.tela_nivel_c_layout.addWidget(container)
        self.relatorio_tree.setCurrentIndex(2)
        self.current_level = 2

    def mostrar_historico(self, subcategoria, grupo, categoria_principal):
        historico = HistoricoDialog(categoria_principal, f"{grupo} - {subcategoria}", self)
        historico.exec()

    def voltar_nivel_anterior(self):
        if self.current_level == 1:
            self.relatorio_tree.setCurrentIndex(0)
            self.btn_voltar.hide()
        elif self.current_level == 2:
            self.relatorio_tree.setCurrentIndex(1)
        self.current_level -= 1

    def abrir_formulario_lancamento(self, aba, grupo, sub):
        self.form_window = SubcategoriaForm(aba, f"{grupo} - {sub}", self.atualizar_tabela)
        self.form_window.exec()

    def gerar_relatorio(self):
        dialog = DateRangeDialog(self)
        if dialog.exec() == QDialog.Accepted:
            inicio, fim = dialog.get_dates()
            nome, _ = QFileDialog.getSaveFileName(
                self, "Salvar Relatório Completo PDF", "", "Arquivos PDF (*.pdf)"
            )
            if nome:
                if not nome.lower().endswith('.pdf'):
                    nome += '.pdf'
                self.gerar_relatorio_pdf(nome, inicio, fim)
                msg = QMessageBox(self)
                msg.setIcon(QMessageBox.Icon.Information)
                msg.setWindowTitle("Relatório Gerado")
                msg.setText(f"Relatório completo salvo em:\n{nome}")
                msg.setStandardButtons(QMessageBox.StandardButton.Ok)
                msg.exec()

    def gerar_relatorio_pdf(self, nome_arquivo='relatorio_financeiro.pdf', inicio=None, fim=None):
        c = canvas.Canvas(nome_arquivo, pagesize=A4)
        width, height = A4

        # Funções auxiliares para simplificar nomes
        def simplificar_categoria(categoria):
            if categoria == "DESPESAS VARIÁVEIS":
                return "VARIÁVEIS"
            elif categoria == "DESPESAS FIXAS":
                return "FIXAS"
            return categoria

        def simplificar_subcategoria(subcategoria):
            # Divide pelo " - " e pega a última parte
            partes = subcategoria.split(" - ")
            if len(partes) > 1:
                return partes[-1].strip()
            return subcategoria.strip()

        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(pdf_colors.HexColor("#198754"))
        c.drawString(50, height - 50, "Relatório Financeiro")
        c.setFont("Helvetica", 10)
        c.setFillColor(pdf_colors.HexColor("#495057"))
        c.drawString(width - 150, height - 50, f"Gerado em: {QDate.currentDate().toString('dd/MM/yyyy')}")
        c.setStrokeColor(pdf_colors.HexColor("#ced4da"))
        c.line(50, height - 60, width - 50, height - 60)

        lancamentos = (listar_lancamentos(inicio, fim) + listar_historico_lancamentos(inicio, fim)) if inicio and fim else (listar_lancamentos() + listar_historico_lancamentos())
        y = height - 80

        if not lancamentos:
            c.setFont("Helvetica", 12)
            c.drawString(50, y, "Nenhum lançamento encontrado.")
            c.save()
            return

        # Preparar dados para a tabela com nomes simplificados
        data = [["ID", "Categoria", "Subcategoria", "Valor (R$)", "Descrição", "Data"]]
        for lanc in lancamentos:
            data.append([
                str(lanc[0]),
                simplificar_categoria(lanc[1]),  # Categoria simplificada
                simplificar_subcategoria(lanc[2]),  # Subcategoria simplificada
                f"R$ {lanc[3]:,.2f}",
                lanc[4] or "-",
                lanc[5]
            ])

        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), pdf_colors.HexColor("#198754")),
            ('TEXTCOLOR', (0, 0), (-1, 0), pdf_colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), pdf_colors.white),
            ('GRID', (0, 0), (-1, -1), 1, pdf_colors.HexColor("#ced4da")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        # Ajustar largura das colunas para evitar cortes
        col_widths = [40, 80, 120, 80, 150, 80]  # Ajuste conforme necessário
        table._argW = col_widths

        w, h = table.wrap(width - 100, height)
        x = (width - w) / 2
        table.drawOn(c, x, y - h)

        c.setFont("Helvetica", 8)
        c.setFillColor(pdf_colors.HexColor("#495057"))
        c.drawString(50, 30, "WL System - Financeiro © 2025 - Todos os direitos reservados")
        c.save()

    def gerar_relatorio_entradas_pdf(self):
        dialog = DateRangeDialog(self)
        if dialog.exec() == QDialog.Accepted:
            inicio, fim = dialog.get_dates()
            nome, _ = QFileDialog.getSaveFileName(
                self, "Salvar Relatório de Entradas PDF", "", "Arquivos PDF (*.pdf)"
            )
            if nome:
                if not nome.lower().endswith('.pdf'):
                    nome += '.pdf'
                self.gerar_relatorio_entradas(nome, inicio, fim)
                msg = QMessageBox(self)
                msg.setIcon(QMessageBox.Icon.Information)
                msg.setWindowTitle("Relatório Gerado")
                msg.setText(f"Relatório de entradas salvo em:\n{nome}")
                msg.setStandardButtons(QMessageBox.StandardButton.Ok)
                msg.exec()

    def gerar_relatorio_entradas(self, nome_arquivo='relatorio_entradas.pdf', inicio=None, fim=None):
        c = canvas.Canvas(nome_arquivo, pagesize=A4)
        width, height = A4
        # Configurações de layout
        margem = 50
        linha_atual = height - margem
        espacamento_secao = 25
        espacamento_item = 15
        espacamento_linha = 12
        # Estilos
        estilo_titulo = ("Helvetica-Bold", 16, "#198754")
        estilo_subtitulo = ("Helvetica-Bold", 12, "#212529")
        estilo_grupo = ("Helvetica-Bold", 11, "#0d6efd")
        estilo_item = ("Helvetica", 10, "#495057")
        estilo_total = ("Helvetica-Bold", 12, "#ffffff")

        def desenhar_texto(texto, x, y, estilo, alinhamento="left"):
            fonte, tamanho, cor = estilo
            c.setFont(fonte, tamanho)
            c.setFillColor(pdf_colors.HexColor(cor))
            if alinhamento == "right":
                x = width - margem - c.stringWidth(texto, fonte, tamanho)
            c.drawString(x, y, texto)
            return y - espacamento_linha

        # Funções auxiliares para simplificar nomes
        def simplificar_categoria(categoria):
            if categoria == "DESPESAS VARIÁVEIS":
                return "VARIÁVEIS"
            elif categoria == "DESPESAS FIXAS":
                return "FIXAS"
            return categoria

        def simplificar_subcategoria(subcategoria):
            # Divide pelo " - " e pega a última parte
            partes = subcategoria.split(" - ")
            if len(partes) > 1:
                return partes[-1].strip()
            return subcategoria.strip()

        data_relatorio = QDate.currentDate().toString("dd/MM/yyyy")
        linha_atual = desenhar_texto("Relatório Financeiro Detalhado", margem, linha_atual, estilo_titulo)
        linha_atual = desenhar_texto(f"Período: {inicio} a {fim}", margem, linha_atual, estilo_item)
        linha_atual = desenhar_texto(f"Gerado em: {data_relatorio}", width - margem, linha_atual, estilo_item, "right")
        linha_atual -= 5
        c.setStrokeColor(pdf_colors.HexColor("#ced4da"))
        c.line(margem, linha_atual, width - margem, linha_atual)
        linha_atual -= espacamento_secao

        estrutura = {
            "DESPESAS VARIÁVEIS": {
                "CUSTO DAS MERCADORIAS": ["COMPRAS CT", "COMPRAS NC", "COMPRAS BAHIA", "COMPRAS GOIÂNIA", "COMPRAS IMPERATRIZ", "HORTI-FRUIT", "SECOS E MOLHADOS"],
                "DESPESAS COM VENDAS": ["COMISSÕES", "DIARISTA", "AJUDA DE CUSTO (vendedor)", "SIMPLES NACIONAL", "ICMS", "DARF"],
                "DESP. LOGÍSTICA": ["COMBUSTÍVEL ENTREGA", "MANUT./REVISÕES VEÍCULO", "HOSPED./ALIMENT./AJ.CUSTO", "FRETES CAMINHÕES (terceiros)", "SEGUROS CARGAS", "BALSA"]
            },
            "DESPESAS FIXAS": {
                "DESPESAS ADM": ["ALUGUEL", "ENERGIA", "ÁGUA", "INTERNET", "MAT. DE ESCRITÓRIO", "MAT. DE LIMPEZA", "CONSÓRCIO"],
                "DESP. C+ PESSOAL": ["FOLHA DE PAGAMENTO", "DÉCIMO TERCEIRO", "IMPOSTO", "RECISÃO", "FGTS", "INSS", "TREINAMENTOS", "UNIFORMES", "REFEIÇÕES"],
                "LICENÇAS OPERACIONAIS": ["ALVARÁ", "IPTU / IPVA / SEGUROS VEÍC.", "SEGUROS IMÓVEIS"],
                "DESP. FINANCEIRAS": ["TARIFAS BANC.+CARTÕES+JUROS", "PRESTAÇÕES FINANC. IMOBILIZADOS"],
                "MARKETING E COMUNICAÇÃO": ["PROPAG. / REDES SOCIAIS", "MAT. GRÁFICOS / COMUNIC. VISUAL", "MATERIAIS DE VENDAS (equipes)"],
                "MANUTENÇÃO": ["MANUT. PREDIAL", "MÁQUINAS E EQUIPAM."],
                "ASSESSORIA": ["CONTADOR", "SUPORTE SISTEMA", "CONSULTORIAS", "SEGURANÇA"],
                "DIRETORIA": ["PRÓ-LABORE 1", "PRÓ-LABORE 2", "PRÓ-LABORE 3"],
                "RECEITAS NÃO OP.": ["CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "INV. CAP. PRÓPRIO", "RECEITAS DE INVESTIM.", "OUTRAS ENTRADAS"],
                "DESPESAS NÃO OP.": ["CHEQUE DEVOLVIDO", "EMPRÉSTIMOS E FINANC.", "RETIRADA CAP. PRÓPRIO", "DESPESAS DE INVESTIM.", "OUTRAS SAÍDAS"]
            }
        }

        totais = {"DESPESAS FIXAS": 0, "DESPESAS VARIÁVEIS": 0, "TOTAL GERAL": 0}
        for categoria, grupos in estrutura.items():
            linha_atual = desenhar_texto(simplificar_categoria(categoria), margem, linha_atual, estilo_subtitulo)
            total_categoria = 0
            for grupo, subcategorias in grupos.items():
                total_grupo = 0
                itens_grupo = []
                for subcat in subcategorias:
                    registros = listar_historico_por_periodo(categoria, f"{grupo} - {subcat}", inicio, fim)
                    total_subcat = sum(valor for _, valor, _, _ in registros)
                    if total_subcat > 0:
                        total_grupo += total_subcat
                        itens_grupo.append((simplificar_subcategoria(subcat), total_subcat)) # Subcategoria simplificada
                if itens_grupo:
                    linha_atual = desenhar_texto(grupo, margem + 10, linha_atual, estilo_grupo)
                    for item, valor in itens_grupo:
                        texto_item = f"• {item}:"
                        texto_valor = f"R$ {valor:,.2f}"
                        linha_atual = desenhar_texto(texto_item, margem + 20, linha_atual, estilo_item)
                        desenhar_texto(texto_valor, width - margem - 50, linha_atual + espacamento_linha, estilo_item, "right")
                    texto_total_grupo = f"Total {grupo}:"
                    linha_atual = desenhar_texto(texto_total_grupo, margem + 10, linha_atual, ("Helvetica-Bold", 10, "#198754"))
                    desenhar_texto(f"R$ {total_grupo:,.2f}", width - margem - 50, linha_atual + espacamento_linha, ("Helvetica-Bold", 10, "#198754"), "right")
                    linha_atual -= espacamento_item
                    total_categoria += total_grupo
            if categoria == "DESPESAS FIXAS":
                totais["DESPESAS FIXAS"] = total_categoria
            else:
                totais["DESPESAS VARIÁVEIS"] = total_categoria
            totais["TOTAL GERAL"] += total_categoria
            if total_categoria > 0:
                linha_atual = desenhar_texto(f"TOTAL {simplificar_categoria(categoria)}:", margem, linha_atual, ("Helvetica-Bold", 12, "#212529"))
                desenhar_texto(f"R$ {total_categoria:,.2f}", width - margem - 50, linha_atual + espacamento_linha, ("Helvetica-Bold", 12, "#212529"), "right")
                linha_atual -= espacamento_secao
            if linha_atual < margem + 100:
                c.showPage()
                linha_atual = height - margem
                linha_atual = desenhar_texto(f"Relatório Financeiro (Continuação)", margem, linha_atual, estilo_titulo)
                linha_atual -= espacamento_secao

        linha_atual -= 10
        c.setFillColor(pdf_colors.HexColor("#f8f9fa"))
        c.rect(margem, linha_atual - 30, width - 2 * margem, 90, fill=True, stroke=False)
        c.setFillColor(pdf_colors.HexColor("#0d6efd"))
        c.roundRect(margem, linha_atual, width - 2 * margem, 25, 5, fill=True, stroke=False)
        desenhar_texto("TOTAL DESPESAS FIXAS", margem + 10, linha_atual + 7, estilo_total)
        desenhar_texto(f"R$ {totais['DESPESAS FIXAS']:,.2f}", width - margem - 10, linha_atual + 7, estilo_total, "right")
        linha_atual -= 30
        c.setFillColor(pdf_colors.HexColor("#fd7e14"))
        c.roundRect(margem, linha_atual, width - 2 * margem, 25, 5, fill=True, stroke=False)
        desenhar_texto("TOTAL DESPESAS VARIÁVEIS", margem + 10, linha_atual + 7, estilo_total)
        desenhar_texto(f"R$ {totais['DESPESAS VARIÁVEIS']:,.2f}", width - margem - 10, linha_atual + 7, estilo_total, "right")
        linha_atual -= 30
        c.setFillColor(pdf_colors.HexColor("#dc3545"))
        c.roundRect(margem, linha_atual, width - 2 * margem, 25, 5, fill=True, stroke=False)
        desenhar_texto("TOTAL GERAL", margem + 10, linha_atual + 7, estilo_total)
        desenhar_texto(f"R$ {totais['TOTAL GERAL']:,.2f}", width - margem - 10, linha_atual + 7, estilo_total, "right")

        c.setFont("Helvetica", 8)
        c.setFillColor(pdf_colors.HexColor("#6c757d"))
        c.drawCentredString(width / 2, 30, "WL System - Financeiro © 2025 - Todos os direitos reservados")
        c.save()

    def limpar_filtros(self):
        self.data_inicio.setDate(QDate.currentDate().addMonths(-1))
        self.data_fim.setDate(QDate.currentDate())
        self.atualizar_tabela()

    def atualizar_tabela(self):
        inicio = self.data_inicio.date().toString("yyyy-MM-dd")
        fim = self.data_fim.date().toString("yyyy-MM-dd")
        lancamentos = listar_lancamentos(inicio, fim)
        self.tabela.clear()
        self.tabela.setColumnCount(6)
        self.tabela.setRowCount(len(lancamentos))
        self.tabela.setHorizontalHeaderLabels(["ID", "Categoria", "Subcategoria", "Valor (R$)", "Descrição", "Data"])
        header = self.tabela.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(1, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, QHeaderView.Stretch)
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(4, QHeaderView.Stretch)
        header.setSectionResizeMode(5, QHeaderView.ResizeToContents)
        for row, lanc in enumerate(lancamentos):
            for col, item in enumerate(lanc):
                table_item = QTableWidgetItem(str(item))
                table_item.setFlags(table_item.flags() & ~Qt.ItemIsEditable)
                if col == 3:
                    table_item.setText(f"R$ {float(item):,.2f}")
                    table_item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
                self.tabela.setItem(row, col, table_item)

    def exportar_dados(self):
        nome, _ = QFileDialog.getSaveFileName(
            self, "Exportar Dados", "", "Arquivos CSV (*.csv)"
        )
        if nome:
            if not nome.lower().endswith('.csv'):
                nome += '.csv'
            lancamentos = (listar_lancamentos(inicio, fim) + listar_historico_lancamentos(inicio, fim)) if inicio and fim else (listar_lancamentos() + listar_historico_lancamentos()) # type: ignore
            try:
                with open(nome, 'w', encoding='utf-8') as f:
                    f.write("ID;Categoria;Subcategoria;Valor;Descrição;Data\n")
                    for lanc in lancamentos:
                        linha = f"{lanc[0]};{lanc[1]};{lanc[2]};{lanc[3]};{lanc[4] or '-'};{lanc[5]}\n"
                        f.write(linha)
                QMessageBox.information(self, "Exportação Concluída", f"Dados exportados para:\n{nome}")
            except Exception as e:
                QMessageBox.critical(self, "Erro", f"Ocorreu um erro ao exportar os dados:\n{str(e)}")

    def gerar_grafico_barras(self):
        dialog = DateRangeDialog(self)
        if dialog.exec() == QDialog.Accepted:
            inicio, fim = dialog.get_dates()
        else:
            return
        lancamentos = listar_lancamentos(inicio, fim)
        categorias = {}
        for lanc in lancamentos:
            key = lanc[1]
            categorias[key] = categorias.get(key, 0) + lanc[3]
        if not categorias:
            QMessageBox.warning(self, "Aviso", "Nenhum dado disponível para gerar o gráfico.")
            return
        try:
            plt.style.use('seaborn-v0_8')
        except OSError:
            plt.style.use('ggplot')
        sorted_cats = dict(sorted(categorias.items(), key=lambda x: x[1], reverse=True))
        fig, ax = plt.subplots(figsize=(10, 6))
        bars = ax.bar(list(sorted_cats.keys()), list(sorted_cats.values()), edgecolor='white')
        max_val = max(sorted_cats.values())
        for bar in bars:
            yval = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2, yval + max_val*0.01, f"R$ {yval:,.0f}", ha='center', fontsize=10)
        ax.set_title("Comparativo de Despesas", fontsize=16, fontweight='bold')
        ax.set_ylabel("Valor em R$", fontsize=12)
        ax.set_xlabel("Categorias", fontsize=12)
        ax.grid(axis='y', linestyle='--', linewidth=0.5)
        plt.tight_layout()
        plt.show(block=False)

if __name__ == "__main__":
    create_tables()
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    font = QFont()
    font.setFamily("Segoe UI")
    font.setPointSize(10)
    app.setFont(font)
    palette = QPalette()
    palette.setColor(QPalette.Window, QColor(248, 249, 250))
    palette.setColor(QPalette.WindowText, QColor(33, 37, 41))
    palette.setColor(QPalette.Base, QColor(255, 255, 255))
    palette.setColor(QPalette.AlternateBase, QColor(248, 249, 250))
    palette.setColor(QPalette.ToolTipBase, QColor(255, 255, 255))
    palette.setColor(QPalette.ToolTipText, QColor(33, 37, 41))
    palette.setColor(QPalette.Text, QColor(33, 37, 41))
    palette.setColor(QPalette.Button, QColor(248, 249, 250))
    palette.setColor(QPalette.ButtonText, QColor(33, 37, 41))
    palette.setColor(QPalette.BrightText, QColor(255, 255, 255))
    palette.setColor(QPalette.Highlight, QColor(13, 110, 253))
    palette.setColor(QPalette.HighlightedText, QColor(255, 255, 255))
    app.setPalette(palette)
    janela = FinanceiroUI()
    janela.show()
    sys.exit(app.exec())