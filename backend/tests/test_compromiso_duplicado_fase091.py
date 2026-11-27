"""El doble clic secuencial no crea dos compromisos vigentes (Fase 09.1).

La comprobación previa devuelve un 409 comprensible y el frontend bloquea envíos
mientras la petición está en curso. El procedimiento almacenado actual **no** aplica
esta regla por donante: la simultaneidad real requiere cambiar el SP y su índice,
fuera del alcance autorizado de esta fase.
"""

import pytest

from app.core.errores import ErrorNegocio
from app.repositories import donaciones_repo


class _FilaVigente:
    total = 1


class _CursorFalso:
    def execute(self, _sql, _parametros):
        return self

    def fetchone(self):
        return _FilaVigente()


class _ConexionFalsa:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def cursor(self):
        return _CursorFalso()


def test_compromiso_vigente_devuelve_error_409(monkeypatch):
    monkeypatch.setattr(
        donaciones_repo, "get_connection", lambda **_kwargs: _ConexionFalsa()
    )

    with pytest.raises(ErrorNegocio) as resultado:
        donaciones_repo.registrar_compromiso(
            7,
            {
                "id_necesidad": 9,
                "lineas": [{"producto_id": 3, "unidad_id": 1, "cantidad": 1}],
            },
        )

    error = resultado.value
    assert error.estado == 409
    assert error.codigo == "COMPROMISO_VIGENTE"
