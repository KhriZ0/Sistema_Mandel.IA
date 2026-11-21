import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://postgres:admin@localhost:5432/mandelia_db"


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def inicializar_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            usuario VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(64) NOT NULL,
            nombre_completo VARCHAR(120) NOT NULL,
            rol VARCHAR(30) NOT NULL CHECK (rol IN ('administracion', 'docente', 'docente_primaria')),
            activo BOOLEAN NOT NULL DEFAULT TRUE
        );
    """)

    usuarios_demo = [
        ("cira.admin", _hash_password("admin123"), "Cira Carvajal", "administracion"),
        ("chris.liceo", _hash_password("liceo123"), "Christian", "docente"),
        ("luis.primaria", _hash_password("primaria123"), "Luis", "docente_primaria"),
    ]

    for usuario, pwd_hash, nombre, rol in usuarios_demo:
        cursor.execute("""
            INSERT INTO usuarios (usuario, password_hash, nombre_completo, rol)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (usuario) DO NOTHING;
        """, (usuario, pwd_hash, nombre, rol))

    conn.commit()
    cursor.close()
    conn.close()


def validar_credenciales(usuario: str, password: str, rol: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT id, usuario, nombre_completo, rol, activo
        FROM usuarios
        WHERE LOWER(usuario) = LOWER(%s) AND password_hash = %s;
    """, (usuario.strip(), _hash_password(password)))

    fila = cursor.fetchone()
    cursor.close()
    conn.close()

    if not fila:
        return {"ok": False, "mensaje": "Usuario o contraseña incorrectos."}

    if not fila["activo"]:
        return {"ok": False, "mensaje": "Este usuario está desactivado."}

    if fila["rol"] != rol:
        return {
            "ok": False,
            "mensaje": "El perfil seleccionado no corresponde a este usuario."
        }

    rutas = {
        "administracion": "../admin_dashboard.html",
        "docente": "../liceo_dashboard.html",
        "docente_primaria": "../primaria_dashboard.html",
    }

    return {
        "ok": True,
        "usuario": fila["nombre_completo"],
        "rol": fila["rol"],
        "destino": rutas[fila["rol"]],
    }