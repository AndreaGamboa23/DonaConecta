# Backend — DonaConecta

Esta carpeta alojará la API REST del proyecto. Su responsabilidad es exponer las
operaciones de negocio, validarlas y persistirlas en SQL Server. El frontend **nunca**
accederá directamente a la base de datos.

## Arquitectura prevista

- `main.py`: punto de entrada de FastAPI y configuración global (CORS, errores).
- `core/`: configuración, seguridad y dependencias compartidas.
- `routers/`: endpoints REST por módulo funcional.
- `services/`: reglas de negocio y transiciones de estado.
- `repositories/`: consultas T-SQL parametrizadas con `pyodbc`.
- `models/`: entidades internas.
- `schemas/`: modelos Pydantic de entrada y salida.
- `database/`: conexión y manejo transaccional.
- `tests/`: pruebas unitarias y de integración.

## Tecnologías previstas

Python 3.13, FastAPI, Uvicorn, Pydantic, pyodbc y Microsoft SQL Server 2025 Express.

## Estado real

Carpeta preparada. **No hay dependencias instaladas, no hay entorno virtual, no hay
endpoints ni se ha creado la base de datos.** Su implementación corresponde a una fase
posterior autorizada. Consultar `AGENTS.md` antes de escribir código.
