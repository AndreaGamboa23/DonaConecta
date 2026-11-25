from app.database.connection import get_connection

def listar_necesidades_activas() -> list[dict]:
    sql = """
        SELECT n.id_necesidad, n.titulo, n.descripcion, n.cantidad_requerida,
               n.prioridad, n.estado, n.fecha_limite,
               i.id_institucion, i.nombre_comercial AS institucion, i.distrito,
               c.id_categoria, c.nombre AS categoria, c.unidad_medida_base,
               p.id_punto_acopio, p.nombre_punto, p.direccion AS direccion_acopio,
               v.cantidad_comprometida, v.cantidad_recibida
        FROM necesidades n
        INNER JOIN instituciones i ON i.id_institucion = n.id_institucion
        INNER JOIN categorias_bien c ON c.id_categoria = n.id_categoria
        INNER JOIN puntos_acopio p ON p.id_punto_acopio = n.id_punto_acopio
        INNER JOIN vw_necesidades_progreso v ON v.id_necesidad = n.id_necesidad
        WHERE n.activo = 1 AND n.estado = 'ACTIVA' AND i.estado_verificacion = 'VERIFICADA'
        ORDER BY CASE n.prioridad WHEN 'ALTA' THEN 1 WHEN 'MEDIA' THEN 2 ELSE 3 END, n.creado_en DESC;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql).fetchall()
        return [
            {
                "id_necesidad": r.id_necesidad,
                "titulo": r.titulo,
                "descripcion": r.descripcion,
                "cantidad_requerida": float(r.cantidad_requerida),
                "cantidad_comprometida": float(r.cantidad_comprometida),
                "cantidad_recibida": float(r.cantidad_recibida),
                "unidad_medida_base": r.unidad_medida_base,
                "prioridad": r.prioridad,
                "estado": r.estado,
                "fecha_limite": str(r.fecha_limite) if r.fecha_limite else None,
                "institucion": r.institucion,
                "distrito": r.distrito,
                "categoria": r.categoria,
                "punto_acopio": r.nombre_punto,
                "direccion_acopio": r.direccion_acopio,
            }
            for r in rows
        ]

def crear_necesidad(id_representante: int, datos: dict) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        inst = cursor.execute(
            """
            SELECT id_institucion, estado_verificacion
            FROM instituciones
            WHERE id_institucion = ? AND id_representante = ? AND activo = 1;
            """,
            (datos["id_institucion"], id_representante),
        ).fetchone()
        if not inst:
            raise ValueError("La institucion no existe o no pertenece a tu cuenta")
        if inst.estado_verificacion != "VERIFICADA":
            raise ValueError("La institucion debe estar VERIFICADA para publicar necesidades")

        row = cursor.execute(
            """
            INSERT INTO necesidades (
                id_institucion, id_categoria, id_punto_acopio,
                titulo, descripcion, cantidad_requerida, prioridad, fecha_limite
            )
            OUTPUT INSERTED.id_necesidad, INSERTED.estado
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                datos["id_institucion"],
                datos["id_categoria"],
                datos["id_punto_acopio"],
                datos["titulo"],
                datos["descripcion"],
                datos["cantidad_requerida"],
                datos["prioridad"],
                datos.get("fecha_limite"),
            ),
        ).fetchone()
        conn.commit()
        return {
            "id_necesidad": int(row.id_necesidad),
            "titulo": datos["titulo"],
            "cantidad_requerida": datos["cantidad_requerida"],
            "prioridad": datos["prioridad"],
            "estado": row.estado,
        }

def crear_compromiso(id_donante: int, datos: dict) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        nec = cursor.execute(
            "SELECT id_necesidad, titulo, estado FROM necesidades WHERE id_necesidad = ? AND activo = 1;",
            (datos["id_necesidad"],),
        ).fetchone()
        if not nec or nec.estado != "ACTIVA":
            raise ValueError("La necesidad no existe o ya no se encuentra activa")

        row = cursor.execute(
            """
            INSERT INTO compromisos_donacion (id_necesidad, id_donante, cantidad_comprometida, comentario)
            OUTPUT INSERTED.id_compromiso, INSERTED.estado
            VALUES (?, ?, ?, ?);
            """,
            (datos["id_necesidad"], id_donante, datos["cantidad_comprometida"], datos.get("comentario")),
        ).fetchone()
        conn.commit()
        return {
            "id_compromiso": int(row.id_compromiso),
            "id_necesidad": datos["id_necesidad"],
            "necesidad": nec.titulo,
            "cantidad_comprometida": datos["cantidad_comprometida"],
            "estado": row.estado,
        }

def listar_compromisos_donante(id_donante: int) -> list[dict]:
    sql = """
        SELECT c.id_compromiso, c.cantidad_comprometida, c.comentario, c.estado, c.creado_en,
               n.titulo AS necesidad, cat.unidad_medida_base, i.nombre_comercial AS institucion,
               p.nombre_punto, p.direccion AS direccion_acopio
        FROM compromisos_donacion c
        INNER JOIN necesidades n ON n.id_necesidad = c.id_necesidad
        INNER JOIN categorias_bien cat ON cat.id_categoria = n.id_categoria
        INNER JOIN instituciones i ON i.id_institucion = n.id_institucion
        INNER JOIN puntos_acopio p ON p.id_punto_acopio = n.id_punto_acopio
        WHERE c.id_donante = ?
        ORDER BY c.creado_en DESC;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql, (id_donante,)).fetchall()
        return [
            {
                "id_compromiso": r.id_compromiso,
                "necesidad": r.necesidad,
                "institucion": r.institucion,
                "cantidad_comprometida": float(r.cantidad_comprometida),
                "unidad_medida_base": r.unidad_medida_base,
                "comentario": r.comentario,
                "estado": r.estado,
                "punto_acopio": r.nombre_punto,
                "direccion_acopio": r.direccion_acopio,
                "creado_en": str(r.creado_en),
            }
            for r in rows
        ]

def listar_compromisos_representante(id_representante: int) -> list[dict]:
    sql = """
        SELECT c.id_compromiso, c.cantidad_comprometida, c.comentario, c.estado, c.creado_en,
               n.titulo AS necesidad, cat.unidad_medida_base, i.nombre_comercial AS institucion,
               u.nombres + ' ' + u.apellidos AS donante, u.telefono AS telefono_donante
        FROM compromisos_donacion c
        INNER JOIN necesidades n ON n.id_necesidad = c.id_necesidad
        INNER JOIN categorias_bien cat ON cat.id_categoria = n.id_categoria
        INNER JOIN instituciones i ON i.id_institucion = n.id_institucion
        INNER JOIN usuarios u ON u.id_usuario = c.id_donante
        WHERE i.id_representante = ?
        ORDER BY c.creado_en DESC;
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        rows = cursor.execute(sql, (id_representante,)).fetchall()
        return [
            {
                "id_compromiso": r.id_compromiso,
                "necesidad": r.necesidad,
                "institucion": r.institucion,
                "donante": r.donante,
                "telefono_donante": r.telefono_donante,
                "cantidad_comprometida": float(r.cantidad_comprometida),
                "unidad_medida_base": r.unidad_medida_base,
                "comentario": r.comentario,
                "estado": r.estado,
                "creado_en": str(r.creado_en),
            }
            for r in rows
        ]

def confirmar_recepcion_entrega(id_compromiso: int, id_representante: int) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        comp = cursor.execute(
            """
            SELECT c.id_compromiso, c.cantidad_comprometida, c.estado
            FROM compromisos_donacion c
            INNER JOIN necesidades n ON n.id_necesidad = c.id_necesidad
            INNER JOIN instituciones i ON i.id_institucion = n.id_institucion
            WHERE c.id_compromiso = ? AND i.id_representante = ?;
            """,
            (id_compromiso, id_representante),
        ).fetchone()
        if not comp:
            raise ValueError("Compromiso no encontrado o no pertenece a tu institucion")
        if comp.estado == "COMPLETADO":
            raise ValueError("Esta entrega ya fue confirmada anteriormente")

        cursor.execute(
            """
            INSERT INTO entregas (id_compromiso, cantidad_entregada, fecha_recepcion, confirmada_por, estado)
            VALUES (?, ?, SYSDATETIME(), ?, 'CONFIRMADA');
            """,
            (id_compromiso, comp.cantidad_comprometida, id_representante),
        )
        cursor.execute(
            """
            UPDATE compromisos_donacion
            SET estado = 'COMPLETADO', actualizado_en = SYSDATETIME()
            WHERE id_compromiso = ?;
            """,
            (id_compromiso,),
        )
        conn.commit()
        return {"id_compromiso": id_compromiso, "estado": "COMPLETADO"}
