import sys
import os
import json
import qtawesome as qta
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QLabel, QLineEdit,
    QPushButton, QGraphicsDropShadowEffect, QHBoxLayout, QFrame, QMessageBox,
    QTableWidget, QTableWidgetItem, QFormLayout, QSpinBox, QInputDialog,
    QHeaderView, QTabWidget
)
from PyQt5.QtGui import QFont, QColor, QIcon
from PyQt5.QtCore import Qt

# ➤ Importa os sistemas existentes
from financeiro import FinanceiroUI      # classe principal do financeiro
from estoque_app import EstoqueApp       # classe principal do estoque

USERS_FILE = 'users.json'
if os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'r') as f:
        USERS = json.load(f)
else:
    USERS = {'user1': ['pass1', 1], 'admin': ['admin', 2], 'super': ['superpass', 3]}
    with open(USERS_FILE, 'w') as f:
        json.dump(USERS, f, indent=4)

class CardFrame(QFrame):
    def __init__(self):
        super().__init__()
        self.setStyleSheet("background-color: white; border-radius: 20px;")
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(20)
        shadow.setOffset(0, 4)
        shadow.setColor(QColor(0, 0, 0, 60))
        self.setGraphicsEffect(shadow)

class TelaLogin(QWidget):
    def __init__(self, login_callback):
        super().__init__()
        self.login_callback = login_callback
        self.setStyleSheet("""
            QWidget {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 #3A7BD5, stop:1 #00d2FF);
            }
        """)

        main_layout = QVBoxLayout(self)
        main_layout.setAlignment(Qt.AlignCenter)

        card = CardFrame()
        card.setFixedSize(360, 400)
        card_layout = QVBoxLayout(card)
        card_layout.setContentsMargins(40, 40, 40, 40)
        card_layout.setSpacing(20)

        lbl_title = QLabel("LOGIN")
        lbl_title.setFont(QFont("Segoe UI", 24, QFont.Bold))
        lbl_title.setAlignment(Qt.AlignCenter)
        lbl_title.setStyleSheet("color: #212529;")

        lbl_user = QLabel("Usuário")
        lbl_user.setFont(QFont("Segoe UI", 10))
        lbl_user.setStyleSheet("color: #212529;")

        # --- Alteração: Torna txt_user um atributo da instância (self.txt_user) ---
        self.txt_user = QLineEdit()
        self.txt_user.setFixedHeight(40)
        self.txt_user.setFont(QFont("Segoe UI", 12))
        self.txt_user.setStyleSheet("QLineEdit { border: 1px solid #ced4da; border-radius: 5px; padding: 0 10px; }")

        lbl_pass = QLabel("Senha")
        lbl_pass.setFont(QFont("Segoe UI", 10))
        lbl_pass.setStyleSheet("color: #212529;")

        # --- Alteração: Torna txt_pass um atributo da instância (self.txt_pass) ---
        self.txt_pass = QLineEdit()
        self.txt_pass.setEchoMode(QLineEdit.Password)
        self.txt_pass.setFixedHeight(40)
        self.txt_pass.setStyleSheet(self.txt_user.styleSheet())

        btn_login = QPushButton("Entrar")
        btn_login.setFixedHeight(50)
        btn_login.setFont(QFont("Segoe UI", 12, QFont.Bold))
        btn_login.setStyleSheet(
            "QPushButton { background-color: #3366FF; color: white; border-radius: 10px; }"
            "QPushButton:hover { background-color: #274BDB; }"
            "QPushButton:pressed { background-color: #1E3DB3; }"
        )
        btn_login.clicked.connect(lambda: self.verificar_login(self.txt_user.text(), self.txt_pass.text()))

        # --- Nova funcionalidade: Navegação com Enter ---
        # Ao pressionar Enter no campo Usuário, vai para o campo Senha
        self.txt_user.returnPressed.connect(self.txt_pass.setFocus)
        # Ao pressionar Enter no campo Senha, aciona o login
        self.txt_pass.returnPressed.connect(lambda: self.verificar_login(self.txt_user.text(), self.txt_pass.text()))
        # ----------------------------------------------------

        # Adiciona os widgets ao layout do card
        for w in (lbl_title, lbl_user, self.txt_user, lbl_pass, self.txt_pass, btn_login):
            card_layout.addWidget(w)

        main_layout.addWidget(card)

    def verificar_login(self, user_input, pwd_input):
        # compara usuário e senha sem diferenciar maiúsculas/minúsculas
        matched_user = None
        for stored_user in USERS:
            if stored_user.lower() == user_input.lower():
                matched_user = stored_user
                break
        if matched_user and USERS[matched_user][0].lower() == pwd_input.lower():
            nivel = USERS[matched_user][1]
            self.login_callback(nivel)
        else:
            msg = QMessageBox(self)
            msg.setWindowTitle("Erro")
            msg.setIcon(QMessageBox.Warning)
            msg.setText("Usuário ou senha incorretos.")
            msg.exec_()

class TelaMenu(QWidget):
    def __init__(self, abrir_estoque, abrir_financeiro, abrir_usuarios, nivel):
        super().__init__()
        self.nivel = nivel
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setContentsMargins(0, 20, 0, 20)
        layout.setSpacing(20)
        lbl = QLabel("MENU")
        lbl.setFont(QFont("Segoe UI", 26, QFont.Bold))
        lbl.setStyleSheet("color: #1F2937; background: transparent;")
        lbl.setAlignment(Qt.AlignCenter)
        layout.addWidget(lbl)
        if nivel >= 1:
            btn_estoque = self.criar_botao("Estoque", abrir_estoque)
            layout.addWidget(btn_estoque)
        if nivel >= 1:
            if nivel == 1:
                btn_financeiro = self.criar_botao("Financeiro", self.sem_acesso_financeiro)
            else:
                btn_financeiro = self.criar_botao("Financeiro", abrir_financeiro)
            layout.addWidget(btn_financeiro)
        if nivel == 3:
            btn_usuarios = self.criar_botao("Usuários", abrir_usuarios)
            layout.addWidget(btn_usuarios)
    def sem_acesso_financeiro(self):
        QMessageBox.warning(self, "Acesso negado", "Você não tem acesso ao financeiro")
    def criar_botao(self, texto, func):
        frame = CardFrame()
        frame.setFixedSize(360, 80)
        h = QHBoxLayout(frame)
        h.setContentsMargins(15, 15, 15, 15)
        h.setSpacing(10)
        if texto.lower() == 'estoque':
            icon_key, color = 'fa5s.box', '#10B981'
        elif texto.lower() == 'financeiro':
            icon_key, color = 'fa5s.chart-line', '#3B82F6'
        else:
            icon_key, color = 'fa5s.user', '#EF4444'
        lbl_icon = QLabel()
        lbl_icon.setFixedSize(40, 40)
        icon = qta.icon(icon_key, color=color)
        lbl_icon.setPixmap(icon.pixmap(32, 32))
        lbl_icon.setAlignment(Qt.AlignCenter)
        lbl_text = QLabel(texto)
        lbl_text.setFont(QFont("Segoe UI", 14))
        lbl_text.setStyleSheet("color: #1F2937;")
        h.addWidget(lbl_icon)
        h.addWidget(lbl_text)
        frame.mousePressEvent = lambda e: func()
        return frame

class TelaUsuarios(QWidget):
    def __init__(self, voltar_callback):
        super().__init__()
        self.setObjectName("userPage")
        self.voltar_callback = voltar_callback
        self.setStyleSheet("""
            QWidget#userPage { background-color: #ffffff; }
            QLabel#sectionTitle { color: #111827; font-size: 18pt; font-weight: bold; margin-bottom: 8px; }
            QTableWidget { background-color: #ffffff; gridline-color: #d1d5db; }
            QLineEdit, QSpinBox { background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px; }
        """)
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignTop)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(15)
        lbl = QLabel("Cadastro de Usuários", self)
        lbl.setObjectName("sectionTitle")
        layout.addWidget(lbl)
        self.table = QTableWidget()
        self.table.setColumnCount(3)
        self.table.setHorizontalHeaderLabels(["Usuário", "Nível", "Ações"])
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Fixed)
        self.table.setColumnWidth(2, 260)
        layout.addWidget(self.table)
        self.carregar_usuarios()
        form = QFormLayout()
        self.input_user = QLineEdit()
        self.input_pass = QLineEdit()
        self.input_pass.setEchoMode(QLineEdit.Password)
        self.input_level = QSpinBox()
        self.input_level.setRange(1, 3)
        form.addRow("Usuário:", self.input_user)
        form.addRow("Senha:", self.input_pass)
        form.addRow("Nível (1-3):", self.input_level)
        layout.addLayout(form)
        btn_add = QPushButton("Adicionar Usuário")
        btn_add.setFixedHeight(40)
        btn_add.setStyleSheet("QPushButton { background-color: #10B981; color: white; border-radius: 6px; padding: 6px; }")
        btn_add.clicked.connect(self.adicionar_usuario)
        layout.addWidget(btn_add)
        btn_back = QPushButton("Voltar")
        btn_back.setFixedHeight(40)
        btn_back.setStyleSheet("QPushButton { background-color: #3B82F6; color: white; border-radius: 6px; padding: 6px; }")
        btn_back.clicked.connect(self.voltar_callback)
        layout.addWidget(btn_back)
    def carregar_usuarios(self):
        self.table.setRowCount(len(USERS))
        for row, (user, (pwd, nivel)) in enumerate(USERS.items()):
            self.table.setItem(row, 0, QTableWidgetItem(user))
            self.table.setItem(row, 1, QTableWidgetItem(str(nivel)))
            if self.voltar_callback.__self__.user_level == 3:
                cell_widget = QWidget()
                cell_layout = QHBoxLayout(cell_widget)
                cell_layout.setContentsMargins(0, 0, 0, 0)
                cell_layout.setSpacing(5)
                btn_edit = QPushButton("Alterar Senha")
                btn_edit.setStyleSheet("QPushButton { background-color: #10B981; color: white; border-radius: 6px; padding: 6px; }")
                btn_edit.clicked.connect(lambda _, u=user: self.alterar_senha(u))
                cell_layout.addWidget(btn_edit)
                btn_level = QPushButton("Alterar Nível")
                btn_level.setStyleSheet("QPushButton { background-color: #F59E0B; color: white; border-radius: 6px; padding: 6px; }")
                btn_level.clicked.connect(lambda _, u=user: self.alterar_nivel(u))
                cell_layout.addWidget(btn_level)
                btn_remove = QPushButton("Remover Usuário")
                btn_remove.setStyleSheet("QPushButton { background-color: #dc2626; color: white; border-radius: 6px; padding: 6px; }")
                btn_remove.clicked.connect(lambda _, u=user: self.remover_usuario(u))
                cell_layout.addWidget(btn_remove)
                self.table.setCellWidget(row, 2, cell_widget)
            else:
                self.table.setCellWidget(row, 2, QWidget())
    def adicionar_usuario(self):
        user = self.input_user.text().strip()
        pwd = self.input_pass.text().strip()
        nivel = self.input_level.value()
        if not user or not pwd:
            QMessageBox.warning(self, "Erro", "Preencha todos os campos.")
            return
        if user in USERS:
            QMessageBox.warning(self, "Erro", "Usuário já existe.")
            return
        if self.voltar_callback.__self__.user_level != 3:
            QMessageBox.warning(self, "Erro", "Apenas nível 3 pode adicionar usuários.")
            return
        USERS[user] = [pwd, nivel]
        with open(USERS_FILE, 'w') as f:
            json.dump(USERS, f, indent=4)
        self.carregar_usuarios()
        self.input_user.clear()
        self.input_pass.clear()
        self.input_level.setValue(1)
    def alterar_senha(self, user):
        new_pwd, ok = QInputDialog.getText(self, "Alterar Senha", f"Nova senha para {user}:", QLineEdit.Password)
        if ok and new_pwd:
            USERS[user][0] = new_pwd
            with open(USERS_FILE, 'w') as f:
                json.dump(USERS, f, indent=4)
            QMessageBox.information(self, "Sucesso", f"Senha de {user} atualizada.")
            self.carregar_usuarios()
    def alterar_nivel(self, user):
        current_level = USERS[user][1]
        new_level, ok = QInputDialog.getInt(
            self, "Alterar Nível", f"Nível para {user} (1-3):",
            value=current_level, min=1, max=3
        )
        if ok and new_level != current_level:
            USERS[user][1] = new_level
            with open(USERS_FILE, 'w') as f:
                json.dump(USERS, f, indent=4)
            QMessageBox.information(self, "Sucesso", f"Nível de {user} atualizado para {new_level}.")
            self.carregar_usuarios()
    def remover_usuario(self, user):
        confirm = QMessageBox.question(
            self, "Remover Usuário",
            f"Deseja remover o usuário '{user}'?",
            QMessageBox.Yes | QMessageBox.No
        )
        if confirm == QMessageBox.Yes:
            USERS.pop(user, None)
            with open(USERS_FILE, 'w') as f:
                json.dump(USERS, f, indent=4)
            QMessageBox.information(self, "Sucesso", f"Usuário '{user}' removido.")
            self.carregar_usuarios()

class SistemaPrincipal(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("WL System")
        self.setWindowIcon(QIcon('icon.png'))
        self.setGeometry(100, 100, 600, 700)
        self.center()
        self.tabs = None
        self.login = TelaLogin(self.mostrar_menu)
        self.setCentralWidget(self.login)
        self.user_level = 1 # Inicializa com um valor padrão
    def center(self):
        qr = self.frameGeometry()
        cp = self.screen().availableGeometry().center()
        qr.moveCenter(cp)
        self.move(qr.topLeft())
    def mostrar_menu(self, nivel):
        self.user_level = nivel # Armazena o nível do usuário logado
        self.menu = TelaMenu(
            self.abrir_estoque,
            self.abrir_financeiro,
            self.mostrar_usuarios,
            nivel
        )
        if self.tabs is None:
            self.tabs = QTabWidget()
            self.tabs.setTabsClosable(True)
            self.tabs.tabCloseRequested.connect(self.fechar_aba)
            self.tabs.currentChanged.connect(self.on_tab_changed)
            self.setCentralWidget(self.tabs)
        self.tabs.clear()
        self.tabs.addTab(self.menu, "Menu")
        self.on_tab_changed(self.tabs.currentIndex())
    def fechar_aba(self, index):
        if self.tabs.tabText(index) != "Menu":
            self.tabs.removeTab(index)
    def mostrar_usuarios(self):
        for i in range(self.tabs.count()):
            if self.tabs.tabText(i) == "Usuários":
                self.tabs.setCurrentIndex(i)
                return
        usr = TelaUsuarios(self.voltar_para_menu)
        self.tabs.addTab(usr, "Usuários")
        self.tabs.setCurrentWidget(usr)
    def voltar_para_menu(self):
        for i in range(self.tabs.count()):
            if self.tabs.tabText(i) == "Menu":
                self.tabs.setCurrentIndex(i)
                return
    def abrir_estoque(self):
        for i in range(self.tabs.count()):
            if self.tabs.tabText(i) == "Estoque":
                self.tabs.setCurrentIndex(i)
                return
        est = EstoqueApp()
        self.tabs.addTab(est, "Estoque")
        self.tabs.setCurrentWidget(est)
    def abrir_financeiro(self):
        for i in range(self.tabs.count()):
            if self.tabs.tabText(i) == "Financeiro":
                self.tabs.setCurrentIndex(i)
                return
        fin = FinanceiroUI()
        self.tabs.addTab(fin, "Financeiro")
        self.tabs.setCurrentWidget(fin)
    def on_tab_changed(self, index):
        tab_name = self.tabs.tabText(index)
        self.setWindowTitle(f"WL System - {tab_name}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    win = SistemaPrincipal()
    win.showMaximized()  # Inicia maximizado sem ocultar a barra de tarefas
    sys.exit(app.exec_())
