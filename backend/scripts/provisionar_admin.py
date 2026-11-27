#!/usr/bin/env python3
"""Aprovisiona localmente una cuenta ADMINISTRADOR sintética en DonaConectaDB_Pruebas.

SECRETO: la contraseña NUNCA se escribe en este archivo ni en el repositorio.
Guárdala fuera del proyecto, por ejemplo en ``C:\\Users\\ANDREA\\AppData\\Local\\Temp\\opencode\\admin-pruebas.txt``,
y pásala con ``--password-file``. También puede leerse de la variable de entorno
``DONACONECTA_ADMIN_PASSWORD`` o solicitarse por consola con ``getpass``.
No existe opción para pasar la contraseña como argumento de línea de comandos
(quedaría visible en el historial y en la lista de procesos) y jamás se imprime.

Ejecución desde la raíz del repositorio, sin instalar dependencias nuevas:

    uv run python backend/scripts/provisionar_admin.py --confirmar-base-pruebas --password-file <ruta-fuera-del-repo>

La ejecución exige el flag ``--confirmar-base-pruebas`` y comprueba dos veces el
nombre de la base (configuración y ``SELECT DB_NAME()``) antes de cualquier
escritura. No ejecuta DDL. Todo el aprovisionamiento, incluida la auditoría,
ocurre en una sola transacción gestionada por ``get_connection``.
"""

from __future__ import annotations

import argparse
import getpass
import os
import sys
from pathlib import Path

import pyodbc

# ``uv run python backend/scripts/...`` desde la raíz coloca scripts/ en sys.path,
# no backend/. Se añade backend/ para reutilizar la configuración y el hasher reales.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

# Cargar el .env local antes de importar settings: la configuración de la fase
# 08.2 se lee una sola vez al importar app.core.config.
load_dotenv(BACKEND_DIR / ".env", override=False)

from app.core.config import settings  # noqa: E402
from app.core.security import HASH_VERSION_ARGON2ID, hashear_password  # noqa: E402
from app.database.connection import get_connection  # noqa: E402

BASE_PRUEBAS = "DonaConectaDB_Pruebas"
VARIABLE_PASSWORD = "DONACONECTA_ADMIN_PASSWORD"
EMAIL_SINTETICO = "admin.sintetico@ejemplo.com"
NOMBRES = "Administrador"
APELLIDOS = "Sintético"
CODIGO_ROL = "ADMINISTRADOR"
LONGITUD_MINIMA_PASSWORD = 12
TIPO_EVENTO = "CUENTA_ADMIN_PROVISIONADA"


class ErrorProvisionamiento(Exception):
    """Validación fallida; su mensaje nunca contiene la contraseña."""


def _parsear_argumentos(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crea o reactiva el administrador sintético en la base de pruebas.",
        epilog=(
            "La contraseña se lee de --password-file, de " + VARIABLE_PASSWORD
            + " o de la consola. Nunca se acepta como argumento."
        ),
    )
    parser.add_argument(
        "--confirmar-base-pruebas",
        action="store_true",
        help="Confirmación obligatoria de que el destino es " + BASE_PRUEBAS + ".",
    )
    parser.add_argument(
        "--password-file",
        metavar="RUTA",
        help="Archivo local fuera del repositorio con la contraseña en la primera línea.",
    )
    return parser.parse_args(argv)


def _leer_password(args: argparse.Namespace) -> str:
    """Obtiene el secreto sin eco, sin argumentos visibles y sin guardarlo."""

    if args.password_file:
        ruta = Path(args.password_file).expanduser()
        try:
            primera_linea = ruta.read_text(encoding="utf-8-sig").splitlines()
        except OSError as error:
            raise ErrorProvisionamiento(
                "No se pudo leer el archivo de contraseña indicado."
            ) from error
        if not primera_linea or not primera_linea[0].strip():
            raise ErrorProvisionamiento("El archivo de contraseña indicado está vacío.")
        valor = primera_linea[0].strip()
    elif VARIABLE_PASSWORD in os.environ:
        valor = os.environ[VARIABLE_PASSWORD].strip()
        if not valor:
            raise ErrorProvisionamiento(
                "La variable " + VARIABLE_PASSWORD + " está vacía."
            )
    else:
        if not sys.stdin.isatty():
            raise ErrorProvisionamiento(
                "No hay terminal interactiva: use --password-file o la variable "
                + VARIABLE_PASSWORD
                + "."
            )
        valor = getpass.getpass("Contraseña de la cuenta administrativa sintética: ")
        repeticion = getpass.getpass("Repita la contraseña: ")
        if valor != repeticion:
            raise ErrorProvisionamiento("Las contraseñas introducidas no coinciden.")

    if len(valor) < LONGITUD_MINIMA_PASSWORD:
        raise ErrorProvisionamiento(
            "La contraseña debe tener al menos "
            + str(LONGITUD_MINIMA_PASSWORD)
            + " caracteres."
        )
    return valor


def _validar_destino(args: argparse.Namespace) -> None:
    if not args.confirmar_base_pruebas:
        raise ErrorProvisionamiento(
            "Se requiere --confirmar-base-pruebas para escribir datos sintéticos."
        )
    if settings.DB_NAME.strip().casefold() != BASE_PRUEBAS.casefold():
        raise ErrorProvisionamiento(
            "DB_NAME debe ser " + BASE_PRUEBAS + "; configuración actual: "
            + settings.DB_NAME + ". No se realizaron escrituras."
        )


def aprovisionar(password: str) -> dict:
    """Crea o actualiza la cuenta, asegura el rol y registra la auditoría."""

    # HASH_VERSION_ARGON2ID = 19: versión del formato PHC de Argon2id 1.3 que
    # ya usa el registro real (backend/app/core/security.py).
    password_hash = hashear_password(password)

    with get_connection(escritura=True) as conn:
        cursor = conn.cursor()

        nombre_bd = cursor.execute("SELECT DB_NAME();").fetchone()[0]
        if str(nombre_bd).strip().casefold() != BASE_PRUEBAS.casefold():
            raise ErrorProvisionamiento(
                "La conexión abierta no apunta a " + BASE_PRUEBAS
                + ". No se realizó ninguna escritura."
            )

        fila_rol = cursor.execute(
            "SELECT rol_id FROM dbo.roles WHERE codigo = ? AND activo = 1;",
            (CODIGO_ROL,),
        ).fetchone()
        if fila_rol is None:
            raise ErrorProvisionamiento(
                "No existe el rol " + CODIGO_ROL + " activo en el catálogo real."
            )
        rol_id = int(fila_rol.rol_id)

        fila_usuario = cursor.execute(
            "SELECT usuario_id FROM dbo.usuarios WHERE email = ?;",
            (EMAIL_SINTETICO,),
        ).fetchone()

        if fila_usuario is None:
            accion = "creada"
            usuario_id = int(
                cursor.execute(
                    """
                    INSERT INTO dbo.usuarios (
                        email, password_hash, hash_version, nombres, apellidos, estado_cuenta
                    )
                    OUTPUT INSERTED.usuario_id
                    VALUES (?, ?, ?, ?, ?, N'ACTIVO');
                    """,
                    (
                        EMAIL_SINTETICO,
                        password_hash,
                        HASH_VERSION_ARGON2ID,
                        NOMBRES,
                        APELLIDOS,
                    ),
                ).fetchone().usuario_id
            )
        else:
            accion = "actualizada"
            usuario_id = int(fila_usuario.usuario_id)
            cursor.execute(
                """
                UPDATE dbo.usuarios
                SET password_hash = ?, hash_version = ?, nombres = ?, apellidos = ?,
                    estado_cuenta = N'ACTIVO', intentos_fallidos = 0,
                    bloqueado_hasta = NULL, fecha_baja = NULL
                WHERE usuario_id = ?;
                """,
                (
                    password_hash,
                    HASH_VERSION_ARGON2ID,
                    NOMBRES,
                    APELLIDOS,
                    usuario_id,
                ),
            )

        fila_rol_usuario = cursor.execute(
            """
            SELECT estado FROM dbo.usuario_roles
            WHERE usuario_id = ? AND rol_id = ?;
            """,
            (usuario_id, rol_id),
        ).fetchone()

        if fila_rol_usuario is None:
            cursor.execute(
                """
                INSERT INTO dbo.usuario_roles (usuario_id, rol_id, estado)
                VALUES (?, ?, N'ACTIVO');
                """,
                (usuario_id, rol_id),
            )
        elif str(fila_rol_usuario.estado) != "ACTIVO":
            cursor.execute(
                """
                UPDATE dbo.usuario_roles
                SET estado = N'ACTIVO'
                WHERE usuario_id = ? AND rol_id = ?;
                """,
                (usuario_id, rol_id),
            )

        cursor.execute(
            """
            INSERT INTO dbo.auditoria_eventos (
                usuario_id, tipo_evento, modulo, recurso_tipo, recurso_id,
                origen, resultado, descripcion
            )
            VALUES (?, ?, N'USUARIOS', N'USUARIO', ?, N'SISTEMA', N'OK', ?);
            """,
            (
                usuario_id,
                TIPO_EVENTO,
                str(usuario_id),
                "Cuenta administrativa sintética " + accion + " en la base de pruebas.",
            ),
        )

        total_roles = int(
            cursor.execute(
                """
                SELECT COUNT(*) AS Total
                FROM dbo.usuario_roles ur
                INNER JOIN dbo.roles r ON r.rol_id = ur.rol_id
                WHERE ur.usuario_id = ? AND r.codigo = ?
                  AND ur.estado = N'ACTIVO' AND r.activo = 1;
                """,
                (usuario_id, CODIGO_ROL),
            ).fetchone().Total
        )

    return {"usuario_id": usuario_id, "accion": accion, "roles_activos": total_roles}


def main(argv: list[str] | None = None) -> int:
    args = _parsear_argumentos(argv)
    try:
        _validar_destino(args)
        password = _leer_password(args)
        resultado = aprovisionar(password)
    except ErrorProvisionamiento as error:
        print("Error: " + str(error), file=sys.stderr)
        return 2
    except pyodbc.Error:
        print(
            "Error: SQL Server no pudo completar la operación. Revise DB_NAME, "
            "el controlador ODBC y los permisos. No se mostraron credenciales.",
            file=sys.stderr,
        )
        return 1
    except Exception as error:  # nunca se muestra str(error): puede contener secretos
        print(
            "Error inesperado (" + type(error).__name__
            + "). No se mostraron credenciales.",
            file=sys.stderr,
        )
        return 1

    print(
        "Cuenta " + resultado["accion"] + " en " + BASE_PRUEBAS
        + ": id=" + str(resultado["usuario_id"])
        + ", correo=" + EMAIL_SINTETICO
        + ", rol=" + CODIGO_ROL
        + " activo=" + str(resultado["roles_activos"])
        + ". Contraseña no mostrada ni almacenada en el repositorio."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
