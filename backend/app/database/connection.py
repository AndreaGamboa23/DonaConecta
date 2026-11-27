"""Gestión de conexiones a SQL Server.

La Fase 06 definió que los procedimientos ``dbo.usp_*`` son dueños de su
transacción. Por eso ``get_connection`` expone un context manager que siempre
cierra la conexión y sólo hace ``commit``/``rollback`` cuando el llamador no
activó ``autocommit``.
"""

from contextlib import contextmanager
from typing import Iterator

import pyodbc

from app.core.config import settings


def _connection_string() -> str:
    return (
        f"DRIVER={{{settings.DB_DRIVER}}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NAME};"
        f"Trusted_Connection={settings.DB_TRUSTED_CONNECTION};"
        f"Encrypt={settings.DB_ENCRYPT};"
        f"TrustServerCertificate={settings.DB_TRUST_CERT};"
    )


@contextmanager
def get_connection(autocommit: bool = False, escritura: bool = False) -> Iterator[pyodbc.Connection]:
    """Devuelve una conexión que se cierra siempre al salir del bloque ``with``.

    ``autocommit=True`` se reserva para invocar los procedimientos
    transaccionales de ``007_procedimientos_almacenados.sql``; con ese modo no
    se abre una transacción externa que pueda entrar en conflicto con el
    ``BEGIN TRANSACTION`` interno del procedimiento.

    ``escritura=True`` identifica las operaciones que modifican datos. Las
    consultas de lectura en la base principal siguen permitidas.
    """

    if (
        escritura
        and settings.DB_NAME.strip().casefold() == "donaconectadb"
        and not settings.ALLOW_MAIN_DB_WRITES
    ):
        raise RuntimeError(
            "Escritura bloqueada en DonaConectaDB. Configure DB_NAME=DonaConectaDB_Pruebas "
            "para pruebas o ALLOW_MAIN_DB_WRITES=yes de forma explícita en producción."
        )

    conn = pyodbc.connect(_connection_string(), autocommit=autocommit)
    try:
        yield conn
        if not autocommit:
            conn.commit()
    except Exception:
        if not autocommit:
            conn.rollback()
        raise
    finally:
        conn.close()
