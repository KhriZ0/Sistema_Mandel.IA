import hashlib
import os
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor


def _cargar_env():
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for linea in f:
                linea = linea.strip()
                if linea and not linea.startswith("#") and "=" in linea:
                    clave, valor = linea.split("=", 1)
                    os.environ.setdefault(clave.strip(), valor.strip())


_cargar_env()

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "admin")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "mandelia_db")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def inicializar_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Ejecuta el esquema completo (asignatura, empleados, estudiantes, horario, notas, usuarios)
    schema_path = Path(__file__).parent / "database" / "schema.sql"
    if schema_path.exists():
        sql_script = schema_path.read_text(encoding="utf-8")
        cursor.execute(sql_script)

    # Limpia los usuarios de prueba anteriores y deja solo el usuario genérico de desarrollo
    cursor.execute("""
        DELETE FROM public.usuarios
        WHERE nombre_usuario IN ('cira.admin', 'chris.liceo', 'luis.primaria');
    """)

    cursor.execute("""
        INSERT INTO public.usuarios (nombre_usuario, contrasena, nombre_completo, nivel, estado)
        VALUES (%s, %s, %s, %s, 'ACTIVO')
        ON CONFLICT (nombre_usuario) DO NOTHING;
    """, ("admin", _hash_password("admin"), "Administrador (Dev)", "administracion"))

    conn.commit()
    cursor.close()
    conn.close()


def guardar_boletin_descriptivo(registros: list) -> dict:
    if not isinstance(registros, list):
        return {"ok": False, "mensaje": "Los registros deben proporcionarse como una lista."}

    conn = get_connection()
    cursor = conn.cursor()
    guardados = 0

    try:
        for registro in registros:
            cedula = str(registro.get("cedula", "")).strip()
            grado = str(registro.get("grado", "")).strip()
            seccion = str(registro.get("seccion", "")).strip()
            lapso_texto = str(registro.get("lapso", "")).strip()

            if not cedula or not grado or not seccion:
                continue

            try:
                lapso = int(lapso_texto.rsplit(" ", 1)[-1])
            except (TypeError, ValueError):
                continue

            literal = str(registro.get("literal", "")).strip().upper()
            estado = str(registro.get("estadoAvance", "En proceso")).strip()
            observacion = str(registro.get("observacion", "")).strip()

            if literal not in ("A", "B", "C", "D", "E", "F"):
                continue

            cursor.execute("""
                INSERT INTO public.boletin_descriptivo
                    (cedula, grado_cursando, codigo_grupo, lapso, literal, estado_avance, observacion)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (cedula, grado_cursando, codigo_grupo, lapso)
                DO UPDATE SET
                    literal = EXCLUDED.literal,
                    estado_avance = EXCLUDED.estado_avance,
                    observacion = EXCLUDED.observacion,
                    fecha_registro = CURRENT_DATE;
            """, (cedula, grado, seccion, lapso, literal, estado, observacion))
            guardados += 1

        conn.commit()
        return {"ok": True, "mensaje": f"{guardados} registros cualitativos guardados correctamente."}
    except Exception as error:
        conn.rollback()
        return {"ok": False, "mensaje": f"No fue posible guardar el boletín: {error}"}
    finally:
        cursor.close()
        conn.close()


def validar_credenciales(usuario: str, password: str, rol: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT id_usuario, nombre_usuario, nombre_completo, nivel, estado
        FROM public.usuarios
        WHERE LOWER(nombre_usuario) = LOWER(%s) AND contrasena = %s;
    """, (usuario.strip(), _hash_password(password)))

    fila = cursor.fetchone()
    cursor.close()
    conn.close()

    if not fila:
        return {"ok": False, "mensaje": "Usuario o contraseña incorrectos."}

    if fila["estado"].upper() != "ACTIVO":
        return {"ok": False, "mensaje": "Este usuario está desactivado."}

    rutas = {
        "administracion": "/administracion/admin_dashboard.html",
        "docente": "/liceo/liceo_dashboard.html",
        "docente_primaria": "/primaria/primaria_dashboard.html",
    }

    # El usuario maestro 'admin' entra a cualquiera de las 3 interfaces según el perfil elegido
    if fila["nombre_usuario"].lower() == "admin":
        return {
            "ok": True,
            "usuario": fila["nombre_completo"],
            "rol": rol,
            "cargo": "Sv. Comunitario",
            "destino": rutas[rol],
        }

    # Para usuarios normales sí se valida estrictamente su rol asignado
    if fila["nivel"] != rol:
        return {
            "ok": False,
            "mensaje": "El perfil seleccionado no corresponde a este usuario."
        }

    etiquetas_nivel = {
        "administracion": "Administración",
        "docente": "Docente • Media General",
        "docente_primaria": "Docente • Primaria",
    }

    return {
        "ok": True,
        "usuario": fila["nombre_completo"],
        "rol": fila["nivel"],
        "cargo": etiquetas_nivel.get(fila["nivel"], fila["nivel"]),
        "destino": rutas[fila["nivel"]],
    }