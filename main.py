import eel
from pathlib import Path
from database import inicializar_db, validar_credenciales

inicializar_db()

ROOT_DIR = Path(__file__).parent
eel.init(str(ROOT_DIR))


@eel.expose
def autenticar_usuario(usuario: str, password: str, rol: str) -> dict:
    return validar_credenciales(usuario, password, rol)


if __name__ == "__main__":
    eel.start("login/login.html", size=(1280, 800))