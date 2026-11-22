# -*- coding: utf-8 -*-
"""
Genera datos semilla realistas y DETERMINISTAS para la base de datos
'Hacienda Las Piñas'. El resultado es server/db/seed_datos.sql

Los ids son explícitos para que las referencias sean reproducibles y para
que el alumno pueda razonar sobre ellos. Al final se reajustan las
secuencias (SERIAL) con setval().
"""
import random
from datetime import date, timedelta

rnd = random.Random(42)

HOY = date(2026, 11, 20)
OUT = []
def w(s=""):
    OUT.append(s)

def q(s):
    """Escapa un literal de texto para SQL."""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def d(x):
    return f"DATE '{x.isoformat()}'" if x else "NULL"

# ---------------------------------------------------------------------------
# POTREROS
# ---------------------------------------------------------------------------
potreros = [
    # id, codigo, hectareas, atajados, comentario, fecha_registro
    (1,  "P-01", 42.50, 2, "Potrero plano, pasto Brachiaria, buena disponibilidad de agua.", date(2019, 3, 12)),
    (2,  "P-02", 28.00, 1, "Suelo algo salino en el sector norte; rotar con frecuencia.", date(2019, 3, 12)),
    (3,  "P-03", 35.75, 0, "Ladera con monte; sirve para época seca.", date(2020, 1, 20)),
    (4,  "P-04", 51.20, 3, "El más grande. Dividido por cerca eléctrica interna.", date(2020, 5, 2)),
    (5,  "P-05", 18.40, 1, "Potrero pequeño, ideal para terneros y animales en observación.", date(2020, 5, 2)),
    (6,  "P-06", 62.00, 2, "Pasto Buffel, resistente a sequía. Revisar cercas cada mes.", date(2021, 2, 15)),
    (7,  "P-07", 24.30, 1, "Cerca perimetral antigua, pendiente de renovación.", date(2021, 2, 15)),
    (8,  "P-08", 15.60, 0, "Arenal, pasto Guinea; se inunda en verano.", date(2022, 8, 1)),
    (9,  "P-09", 47.80, 2, "Buena sombra natural para el ganado en horas de calor.", date(2022, 8, 1)),
    (10, "P-10", 33.10, 1, "Destinado a toros y animales de descarte.", date(2023, 4, 18)),
]

w("-- =============================================================================")
w("-- DATOS SEMILLA - HACIENDA LAS PIÑAS")
w("-- Generado automáticamente. NO EDITAR A MANO: usa tools/generar_datos.py")
w("-- Fecha de referencia de los datos: 2026-11-20")
w("-- =============================================================================")
w("")
w("BEGIN;")
w("")
w("-- ---------------------------------------------------------------------------")
w("-- 1. POTREROS E INFRAESTRUCTURA")
w("-- ---------------------------------------------------------------------------")
w("INSERT INTO potrero (id, codigo, hectareas, cantidad_atajados, comentario, activo, fecha_registro) VALUES")
vals = []
for p in potreros:
    vals.append(f"  ({p[0]}, {q(p[1])}, {p[2]:.2f}, {p[3]}, {q(p[4])}, TRUE, {d(p[5])})")
w(",\n".join(vals) + ";")
w("")

# --- potrero_pasto
pasto_por_potrero = {
    1: [1], 2: [1], 3: [2], 4: [1, 3], 5: [1],
    6: [2], 7: [3], 8: [3], 9: [1, 2], 10: [2],
}
w("INSERT INTO potrero_pasto (id, id_potrero, id_tipo_pasto) VALUES")
vals, i = [], 0
for pid in sorted(pasto_por_potrero):
    for tp in pasto_por_potrero[pid]:
        i += 1
        vals.append(f"  ({i}, {pid}, {tp})")
w(",\n".join(vals) + ";")
w("")

# --- potrero_distribucion (porcentajes suman 100)
distrib = {
    1: [(1, 85.00), (2, 10.00), (5, 5.00)],
    2: [(1, 70.00), (4, 20.00), (5, 10.00)],
    3: [(1, 40.00), (2, 55.00), (3, 5.00)],
    4: [(1, 90.00), (2, 10.00)],
    5: [(1, 80.00), (5, 20.00)],
    6: [(1, 65.00), (3, 25.00), (2, 10.00)],
    7: [(1, 75.00), (4, 15.00), (5, 10.00)],
    8: [(1, 60.00), (4, 30.00), (5, 10.00)],
    9: [(1, 88.00), (2, 12.00)],
    10: [(1, 72.00), (2, 18.00), (3, 10.00)],
}
w("INSERT INTO potrero_distribucion (id, id_potrero, id_tipo_terreno, porcentaje) VALUES")
vals, i = [], 0
for pid in sorted(distrib):
    for tt, pct in distrib[pid]:
        i += 1
        vals.append(f"  ({i}, {pid}, {tt}, {pct:.2f})")
w(",\n".join(vals) + ";")
w("")

# --- potrero_cerca
cercas = [
    (1, 1, 1, "Bueno"), (2, 1, 2, "Medio"), (3, 2, 1, "Bueno"), (4, 3, 1, "Malo"),
    (5, 3, 2, "Bueno"), (6, 4, 1, "Bueno"), (7, 4, 2, "Bueno"), (8, 5, 1, "Bueno"),
    (9, 6, 1, "Medio"), (10, 6, 2, "Malo"), (11, 7, 1, "Malo"), (12, 8, 1, "Bueno"),
    (13, 9, 1, "Bueno"), (14, 10, 1, "Bueno"), (15, 10, 2, "Medio"),
]
w("INSERT INTO potrero_cerca (id, id_potrero, id_tipo_cerca, estado_cerca) VALUES")
w(",\n".join(f"  ({c[0]}, {c[1]}, {c[2]}, {q(c[3])})" for c in cercas) + ";")
w("")

# --- trabajo_mantenimiento
mantenimientos = [
    (1, 1, 1, "Eusebio Choque", date(2026, 3, 2), date(2026, 3, 6), "Desbroce completo del potrero."),
    (2, 2, 3, "Eusebio Choque", date(2026, 3, 9), date(2026, 3, 11), "Limpieza de atajado y bebederos."),
    (3, 3, 2, "Marcos Quispe", date(2026, 4, 14), date(2026, 4, 20), "Habilitar área de monte para pastoreo."),
    (4, 4, 5, "Marcos Quispe", date(2026, 5, 4), date(2026, 5, 5), "Fumigación contra garrapata en el pasto."),
    (5, 5, 1, "Eusebio Choque", date(2026, 5, 18), date(2026, 5, 19), "Mantenimiento de divisiones internas."),
    (6, 6, 4, "Rosa Villca", date(2026, 6, 1), date(2026, 6, 8), "Siembra de Buffel en 8 hectáreas."),
    (7, 7, 1, "Rosa Villca", date(2026, 6, 15), date(2026, 6, 18), "Desbroce de malezas."),
    (8, 8, 3, "Nicolás Arroyo", date(2026, 7, 6), date(2026, 7, 7), "Limpieza de canal de drenaje."),
    (9, 9, 5, "Nicolás Arroyo", date(2026, 8, 3), date(2026, 8, 4), "Control de malezas de hoja ancha."),
    (10, 10, 2, "Eusebio Choque", date(2026, 9, 1), date(2026, 9, 12), "Desbarbechado para renovar pastura."),
    (11, 1, 3, "Rosa Villca", date(2026, 10, 5), date(2026, 10, 6), "Limpieza general."),
    (12, 4, 1, "Marcos Quispe", date(2026, 10, 19), None, "Trabajo en curso."),
    (13, 6, 3, "Nicolás Arroyo", date(2026, 11, 2), None, "Limpieza pendiente de conclusión."),
    (14, 2, 4, "Rosa Villca", date(2026, 11, 9), None, "Resiembra parcial por sequía."),
]
w("INSERT INTO trabajo_mantenimiento (id, id_potrero, id_tipo_labor, responsable, fecha_inicio, fecha_fin, observaciones) VALUES")
w(",\n".join(
    f"  ({m[0]}, {m[1]}, {m[2]}, {q(m[3])}, {d(m[4])}, {d(m[5])}, {q(m[6])})" for m in mantenimientos
) + ";")
w("")

# ---------------------------------------------------------------------------
# GRUPOS: asignación de potrero
# ---------------------------------------------------------------------------
# ids de grupo (según el orden de inserción del esquema):
# 1 Paridas, 2 Vacas, 3 Vaquillas, 4 Vacas Lecheras, 5 Terneros,
# 6 Terneros Huérfanos, 7 Destetes, 8 Toros, 9 Descartes
w("-- ---------------------------------------------------------------------------")
w("-- 2. ASIGNACIÓN DE POTREROS A LOS GRUPOS")
w("-- ---------------------------------------------------------------------------")
w("UPDATE grupo SET id_potrero = 1, fecha_ingreso_potrero = DATE '2026-10-12' WHERE id = 1;")
w("UPDATE grupo SET id_potrero = 4, fecha_ingreso_potrero = DATE '2026-10-15' WHERE id = 2;")
w("UPDATE grupo SET id_potrero = 9, fecha_ingreso_potrero = DATE '2026-09-28' WHERE id = 3;")
w("UPDATE grupo SET id_potrero = 5, fecha_ingreso_potrero = DATE '2026-11-01' WHERE id = 4;")
w("UPDATE grupo SET id_potrero = 5, fecha_ingreso_potrero = DATE '2026-11-01' WHERE id = 5;")
w("UPDATE grupo SET id_potrero = 7, fecha_ingreso_potrero = DATE '2026-10-20' WHERE id = 6;")
w("UPDATE grupo SET id_potrero = 2, fecha_ingreso_potrero = DATE '2026-10-05' WHERE id = 7;")
w("UPDATE grupo SET id_potrero = 10, fecha_ingreso_potrero = DATE '2026-08-14' WHERE id = 8;")
w("UPDATE grupo SET id_potrero = 8, fecha_ingreso_potrero = DATE '2026-11-06' WHERE id = 9;")
w("")

# ---------------------------------------------------------------------------
# ANIMALES
# ---------------------------------------------------------------------------
NOMBRES_H = [
    "La Negra", "Manchada", "Estrella", "Lucero", "Canela", "Pinta", "Paloma",
    "La Chola", "Morocha", "Golondrina", "Rosita", "La Flaca", "Tordilla",
    "Mantequilla", "Nube", "Ceniza", "Chispita", "La Mona", "Vainilla", "Tigresa",
    "Azucena", "Clarita", "La Vieja", "Pequeña", "Zafiro", "Camelia", "Sombra",
    "Bellota", "Aurora", "La Bonita",
]
NOMBRES_M = [
    "El Toro", "Bravo", "Choco", "Trueno", "Relámpago", "Capitán", "El Colorado",
    "Tornado", "Banderas", "Rayo", "Rambo", "Titán", "El Zurdo", "Centella",
    "Güero", "Picaso", "El Grande", "Negro", "Bandido", "Duque",
]
PROCEDENCIAS = [
    "Feria de Camargo", "Estancia El Recreo", "Remate de Monterrey",
    "Hacienda San José", "Feria Ganadera de Santa Cruz", "Criadero Los Tajibos",
]

animales = []   # dicts
aid = 0

def nuevo_animal(**kw):
    global aid
    aid += 1
    animales.append(kw)

# ---- Vacas adultas (madres) ----
vacas = []
for i in range(18):
    aid += 1
    sexo = "H"
    nace = date(2019, 1, 1) + timedelta(days=rnd.randint(0, 1500))
    raza = rnd.choice([1, 2, 2, 3, 4])
    peso_n = rnd.randint(28, 38)
    animales.append(dict(
        id=aid, arete=f"A-{100+aid}", nombre=rnd.choice(NOMBRES_H), raza=raza,
        sexo=sexo, ingreso=nace, origen="Nacimiento", nacimiento=nace,
        peso_n=peso_n, madre=None, procedencia=None, edad_est=None, peso_ini=None,
        estado="Activo", grupo=2, fecha_salida=None, causa_salida=None, causa_muerte=None,
        ult_grupo=None, ult_potrero=None, comentario=None,
    ))
    vacas.append(aid)

# tres vacas viejas pasan al grupo de descarte
for _v in vacas[:3]:
    animales[_v - 1]["grupo"] = 9

# ---- Toros ----
toros = []
for i in range(4):
    aid += 1
    compra = date(2023, 3, 10) + timedelta(days=rnd.randint(0, 400))
    animales.append(dict(
        id=aid, arete=f"A-{100+aid}", nombre=rnd.choice(NOMBRES_M), raza=rnd.choice([1, 2]),
        sexo="M", ingreso=compra, origen="Compra", nacimiento=None,
        peso_n=None, madre=None, procedencia=rnd.choice(PROCEDENCIAS),
        edad_est=rnd.randint(26, 40), peso_ini=rnd.randint(480, 620),
        estado="Activo", grupo=8, fecha_salida=None, causa_salida=None, causa_muerte=None,
        ult_grupo=None, ult_potrero=None, comentario="Reproductor adquirido para el hato.",
    ))
    toros.append(aid)

# ---- Crías nacidas en la hacienda (hijas de las vacas) ----
for i in range(36):
    aid += 1
    madre = rnd.choice(vacas)
    nace = date(2023, 6, 1) + timedelta(days=rnd.randint(0, 1200))
    if nace > date(2026, 10, 15):
        nace = date(2026, 10, 15) - timedelta(days=rnd.randint(0, 40))
    sexo = rnd.choice(["H", "H", "M"])
    peso_n = rnd.randint(24, 40)
    grupo = rnd.choice([1, 5, 6, 7])
    animales.append(dict(
        id=aid, arete=f"A-{100+aid}", nombre=rnd.choice(NOMBRES_H + NOMBRES_M) if rnd.random() < 0.6 else None,
        raza=rnd.choice([1, 2, 3, 4]), sexo=sexo, ingreso=nace, origen="Nacimiento",
        nacimiento=nace, peso_n=peso_n, madre=madre, procedencia=None, edad_est=None,
        peso_ini=None, estado="Activo", grupo=grupo, fecha_salida=None,
        causa_salida=None, causa_muerte=None, ult_grupo=None, ult_potrero=None,
        comentario=None,
    ))

# ---- Compras de vaquillas / novillos ----
for i in range(22):
    aid += 1
    compra = date(2025, 2, 1) + timedelta(days=rnd.randint(0, 500))
    sexo = rnd.choice(["H", "H", "M"])
    edad = rnd.randint(14, 30)
    animales.append(dict(
        id=aid, arete=f"A-{100+aid}", nombre=None, raza=rnd.choice([1, 2, 3, 4]),
        sexo=sexo, ingreso=compra, origen="Compra", nacimiento=None, peso_n=None,
        madre=None, procedencia=rnd.choice(PROCEDENCIAS), edad_est=edad,
        peso_ini=rnd.randint(220, 340), estado="Activo",
        grupo=3 if sexo == "H" else 7, fecha_salida=None, causa_salida=None,
        causa_muerte=None, ult_grupo=None, ult_potrero=None,
        comentario="Compra para reposición de hato.",
    ))

total_activos = len(animales)

# ---- Bajas: 5 vendidos y 3 muertos ----
candidatos = [a for a in animales if a["grupo"] in (2, 3, 7)]
rnd.shuffle(candidatos)
vendidos, muertos = [], []
for a in candidatos[:5]:
    a["estado"] = "Vendido"
    a["fecha_salida"] = date(2026, 4, 1) + timedelta(days=rnd.randint(0, 200))
    a["ult_grupo"] = a["grupo"]
    a["ult_potrero"] = {1: 1, 2: 4, 3: 9, 7: 2}.get(a["grupo"], 4)
    a["grupo"] = None
    a["causa_salida"] = "Venta en feria"
    vendidos.append(a)

muertes = [
    ("Picadura de serpiente / Intoxicación", "Mordedura de serpiente en el monte del P-03."),
    ("Enfermedad infecciosa / Neumonía", "Cuadro respiratorio agudo, no respondió al tratamiento."),
    ("Complicación de parto (Distocia)", "Distocia con ternero mal posicionado."),
]
for a, (causa, obs) in zip(candidatos[5:8], muertes):
    a["estado"] = "Muerto"
    a["fecha_salida"] = date(2026, 5, 1) + timedelta(days=rnd.randint(0, 150))
    a["ult_grupo"] = a["grupo"]
    a["ult_potrero"] = {1: 1, 2: 4, 3: 9, 7: 2}.get(a["grupo"], 4)
    a["grupo"] = None
    a["causa_salida"] = causa
    a["causa_muerte"] = [
        "Picadura de serpiente / Intoxicación",
        "Enfermedad infecciosa / Neumonía",
        "Complicación de parto (Distocia)",
    ].index(causa) + 1
    a["comentario"] = obs
    muertos.append(a)

# ---------------------------------------------------------------------------
# ESCRITURA DE ANIMALES
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 3. ANIMALES (80 cabezas: 72 activas, 5 vendidas y 3 muertas)")
w("-- ---------------------------------------------------------------------------")
cols = ("id, numero_arete, nombre, id_raza, sexo, fecha_ingreso, origen, "
        "fecha_nacimiento, peso_nacimiento_kg, id_madre, procedencia, "
        "edad_estimada_meses, peso_inicial_kg, estado, id_grupo, fecha_salida, "
        "causa_salida, id_causa_muerte, ultimo_grupo_id, ultimo_potrero_id, "
        "comentario, activo")
w(f"INSERT INTO animal ({cols}) VALUES")
filas = []
for a in sorted(animales, key=lambda x: x["id"]):
    peso_n = f"{a['peso_n']:.2f}" if a["peso_n"] is not None else "NULL"
    peso_ini = f"{a['peso_ini']:.2f}" if a["peso_ini"] is not None else "NULL"
    filas.append(
        f"  ({a['id']}, {q(a['arete'])}, {q(a['nombre'])}, {a['raza']}, {q(a['sexo'])}, "
        f"{d(a['ingreso'])}, {q(a['origen'])}, {d(a['nacimiento'])}, {peso_n}, "
        f"{a['madre'] if a['madre'] else 'NULL'}, {q(a['procedencia'])}, "
        f"{a['edad_est'] if a['edad_est'] else 'NULL'}, {peso_ini}, "
        f"'Activo', {a['grupo'] if a['grupo'] else a['ult_grupo']}, "
        f"NULL, NULL, "
        f"NULL, "
        f"{a['ult_grupo'] if a['ult_grupo'] else 'NULL'}, "
        f"{a['ult_potrero'] if a['ult_potrero'] else 'NULL'}, {q(a['comentario'])}, TRUE)"
    )
w(",\n".join(filas) + ";")
w("")

# ---------------------------------------------------------------------------
# PESAJE
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 4. PESAJES (histórico de ~14 meses para calcular GDP)")
w("-- ---------------------------------------------------------------------------")
pesajes = []   # (id, animal, fecha, peso, comentario)
_activos = [a for a in animales if a["estado"] == "Activo"]
SIN_PESAJE = {a["id"] for a in sorted(_activos, key=lambda x: x["ingreso"], reverse=True)[:4]}
pid = 0
peso_final = {}
for a in animales:
    # los animales que acaban de llegar o de nacer todavía no se han pesado;
    # es un dato realista y alimenta los ejercicios de "animales sin pesajes".
    if a["id"] in SIN_PESAJE:
        peso_final[a["id"]] = a["peso_ini"] or a["peso_n"]
        continue
    if a["estado"] != "Activo":
        # pesajes solo hasta antes de la salida
        fin = a["fecha_salida"] - timedelta(days=rnd.randint(10, 40))
    else:
        fin = HOY - timedelta(days=rnd.randint(1, 30))

    if a["origen"] == "Nacimiento":
        base = a["peso_n"] or 30
        inicio = a["nacimiento"] + timedelta(days=2)
        gdp = rnd.uniform(0.45, 0.85) if a["edad_est"] is None else 0.5
        if a["sexo"] == "M":
            gdp *= 1.08
        techo = rnd.randint(740, 880) if a["sexo"] == "M" else rnd.randint(465, 615)
    else:
        base = a["peso_ini"] or 250
        inicio = a["ingreso"] + timedelta(days=rnd.randint(3, 15))
        gdp = rnd.uniform(0.35, 0.75)
        if a["sexo"] == "M":
            gdp *= 1.1
        techo = rnd.randint(760, 900) if a["sexo"] == "M" else rnd.randint(470, 620)

    if inicio > fin:
        inicio = max(fin - timedelta(days=rnd.randint(3, 10)), a["ingreso"])
    peso = float(base)
    t = inicio
    # primer pesaje
    pid += 1
    pesajes.append((pid, a["id"], t, round(peso, 2), "Pesaje de ingreso" if a["origen"] == "Compra" else "Pesaje inicial"))
    while True:
        t = t + timedelta(days=rnd.randint(28, 46))
        if t > fin:
            break
        peso = min(peso + gdp * rnd.uniform(0.55, 1.45) * 30, techo)
        # pequeños retrocesos por sequía
        if rnd.random() < 0.08:
            peso -= rnd.uniform(4, 14)
        pid += 1
        comentario = None
        if rnd.random() < 0.10:
            comentario = rnd.choice([
                "Baja de peso por sequía.", "Pesaje de control mensual.",
                "Animal en buen estado.", "Se observa cojera leve.",
            ])
        pesajes.append((pid, a["id"], t, round(peso, 2), comentario))
    peso_final[a["id"]] = round(peso, 2)

w("INSERT INTO pesaje (id, id_animal, fecha, peso_kg, comentario) VALUES")
w(",\n".join(f"  ({p[0]}, {p[1]}, {d(p[2])}, {p[3]:.2f}, {q(p[4])})" for p in pesajes) + ";")
w("")

# ---------------------------------------------------------------------------
# CARACTERÍSTICAS FÍSICAS
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 5. CARACTERÍSTICAS FÍSICAS")
w("-- ---------------------------------------------------------------------------")
chars = []
cid = 0
for a in animales:
    # los animales que acaban de llegar o de nacer todavía no se han pesado;
    # es un dato realista y alimenta los ejercicios de "animales sin pesajes".
    if a["id"] in SIN_PESAJE:
        peso_final[a["id"]] = a["peso_ini"] or a["peso_n"]
        continue
    if a["estado"] != "Activo":
        continue
    if rnd.random() < 0.30:
        for c in rnd.sample([1, 2, 3], rnd.randint(1, 2)):
            cid += 1
            chars.append((cid, a["id"], c))
w("INSERT INTO animal_caracteristica (id, id_animal, id_caracteristica) VALUES")
w(",\n".join(f"  ({c[0]}, {c[1]}, {c[2]})" for c in chars) + ";")
w("")

# ---------------------------------------------------------------------------
# REASIGNACIONES DE GRUPO
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 6. REASIGNACIONES DE GRUPO (histórico de cambios)")
w("-- ---------------------------------------------------------------------------")
reas = []
rid = 0
cambios = [
    (1, 5, "Nacimiento: pasa con su madre al grupo de paridas."),
    (5, 7, "Destete."),
    (7, 3, "Crecimiento: pasa a vaquillas."),
    (3, 2, "Primer servicio: ingresa al grupo de vacas."),
    (2, 9, "Descarte por edad."),
]
for a in animales:
    if a["estado"] != "Activo" or a["origen"] != "Nacimiento":
        continue
    if rnd.random() < 0.45:
        actual = a["grupo"]
        prev = {1: 5, 5: 7, 7: 3, 3: 2, 2: 6, 6: 7, 8: 8}.get(actual)
        # elegimos un par coherente de la cadena
        cadena = [1, 5, 7, 3, 2, 9]
        if actual in cadena:
            idx = cadena.index(actual)
            if idx > 0:
                prev = cadena[idx - 1]
                rid += 1
                reas.append((rid, a["id"], prev, actual,
                             a["ingreso"] + timedelta(days=rnd.randint(90, 400)),
                             rnd.choice([c[2] for c in cambios])))
w("INSERT INTO reasignacion_grupo (id, id_animal, id_grupo_anterior, id_grupo_nuevo, fecha, motivo) VALUES")
if reas:
    w(",\n".join(f"  ({r[0]}, {r[1]}, {r[2]}, {r[3]}, {d(r[4])}, {q(r[5])})" for r in reas) + ";")
else:
    w("  (1, 1, 1, 2, DATE '2026-01-01', 'Sin datos');")
w("")

# ---------------------------------------------------------------------------
# TRASLADOS
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 7. TRASLADOS DE GRUPOS ENTRE POTREROS")
w("-- ---------------------------------------------------------------------------")
traslados = [
    (1, 1, 3, 1, date(2026, 1, 15), 18, "Rotación por sequía."),
    (2, 1, 1, 4, date(2026, 4, 3), 18, "Rotación programada."),
    (3, 2, 9, 6, date(2026, 2, 10), 22, "Mejorar disponibilidad de pasto."),
    (4, 2, 6, 9, date(2026, 5, 22), 22, "Rotación."),
    (5, 2, 9, 4, date(2026, 10, 15), 21, "Entrada de lluvias."),
    (6, 3, 2, 4, date(2026, 3, 8), 15, "Separar vaquillas para servicio."),
    (7, 3, 4, 9, date(2026, 9, 28), 16, "Rotación."),
    (8, 7, 1, 2, date(2026, 6, 12), 14, "Destete completado."),
    (9, 7, 2, 2, date(2026, 10, 5), 12, "Sin movimiento real, ajuste de registro."),
    (10, 8, 9, 10, date(2026, 7, 1), 4, "Ajuste interno."),
    (11, 4, 6, 5, date(2026, 11, 1), 9, "Entrada de vacas lecheras."),
    (12, 5, 5, 7, date(2026, 11, 1), 11, "Terneros al destete."),
    (13, 6, 9, 7, date(2026, 10, 20), 3, "Terneros huérfanos."),
    (14, 9, 8, 10, date(2026, 11, 6), 6, "Animales de descarte."),
]
# id 9 tiene origen=destino -> viola el CHECK; lo corregimos
traslados[8] = (9, 7, 2, 3, date(2026, 10, 5), 12, "Paso a vaquillas.")
w("INSERT INTO traslado (id, id_grupo, id_potrero_origen, id_potrero_destino, fecha, cabezas_movidas, motivo) VALUES")
w(",\n".join(
    f"  ({t[0]}, {t[1]}, {t[2]}, {t[3]}, {d(t[4])}, {t[5]}, {q(t[6])})" for t in traslados
) + ";")
w("")

# ---------------------------------------------------------------------------
# SANIDAD
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 8. EVENTOS SANITARIOS")
w("-- ---------------------------------------------------------------------------")
activos = [a for a in animales if a["estado"] == "Activo"]
eventos = []   # (id, tipo, modalidad, grupo, fecha, comentario, [animales])
eid = 0

def add_evento(tipo, modalidad, grupo, fecha, comentario, animales_sel):
    global eid
    eid += 1
    eventos.append((eid, tipo, modalidad, grupo, fecha, comentario, animales_sel))

add_evento(2, "Tropa", None, date(2026, 3, 15), "Campaña de vacunación contra fiebre aftosa (todo el hato).", list(activos))
add_evento(1, "Tropa", None, date(2026, 4, 20), "Vacunación antirrábica anual.", list(activos))
add_evento(3, "Grupo", 1, date(2026, 5, 10), "Desparasitación de vacas paridas.", [a for a in activos if a["grupo"] == 1])
add_evento(3, "Grupo", 5, date(2026, 5, 12), "Desparasitación de terneros.", [a for a in activos if a["grupo"] == 5])
add_evento(4, "Individual", None, date(2026, 6, 3), "Curación de herida en la pierna derecha.", [activos[3]] )
add_evento(2, "Grupo", 3, date(2026, 7, 8), "Refuerzo de aftosa en vaquillas.", [a for a in activos if a["grupo"] == 3])
add_evento(3, "Grupo", 8, date(2026, 7, 22), "Desparasitación de toros.", [a for a in activos if a["grupo"] == 8])
add_evento(4, "Individual", None, date(2026, 8, 14), "Tratamiento de cojera.", [activos[7]])
add_evento(1, "Grupo", 7, date(2026, 9, 2), "Antirrábica para destetes.", [a for a in activos if a["grupo"] == 7])
add_evento(3, "Tropa", None, date(2026, 9, 25), "Desparasitación general de fin de invierno.", list(activos))
add_evento(4, "Individual", None, date(2026, 10, 6), "Curación de absceso.", [activos[11]])
add_evento(2, "Grupo", 2, date(2026, 10, 18), "Aftosa: segunda dosis del año.", [a for a in activos if a["grupo"] == 2])
add_evento(3, "Grupo", 6, date(2026, 10, 27), "Desparasitación de terneros huérfanos.", [a for a in activos if a["grupo"] == 6])
add_evento(1, "Tropa", None, date(2026, 11, 8), "Antirrábica de refuerzo.", list(activos))
add_evento(4, "Individual", None, date(2026, 11, 14), "Revisión de herida ya curada.", [activos[15]])

w("INSERT INTO evento_sanidad (id, id_tipo_sanidad, modalidad, id_grupo, fecha, comentario) VALUES")
w(",\n".join(
    f"  ({e[0]}, {e[1]}, {q(e[2])}, {e[3] if e[3] else 'NULL'}, {d(e[4])}, {q(e[5])})" for e in eventos
) + ";")
w("")

detalles = []
did = 0
for e in eventos:
    for a in e[6]:
        did += 1
        peso = peso_final.get(a["id"])
        peso = round(peso * rnd.uniform(0.95, 1.02), 2) if peso else None
        detalles.append((did, e[0], a["id"], peso))
w("INSERT INTO detalle_sanidad (id, id_evento, id_animal, peso_al_momento_kg) VALUES")
w(",\n".join(
    f"  ({x[0]}, {x[1]}, {x[2]}, {x[3] if x[3] else 'NULL'})" for x in detalles
) + ";")
w("")

# ---------------------------------------------------------------------------
# PROGRAMACIÓN SANITARIA
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 9. PROGRAMACIÓN SANITARIA (agenda)")
w("-- ---------------------------------------------------------------------------")
prog = [
    (1, 2, None, date(2026, 12, 5), "Campaña de aftosa - dosis anual", "Coordinar con SENASAG.", "Pendiente"),
    (2, 3, 1, date(2026, 12, 12), "Desparasitación de paridas", None, "Pendiente"),
    (3, 1, 5, date(2026, 11, 28), "Antirrábica de terneros", "Faltan 4 terneros por nacer.", "Pendiente"),
    (4, 3, 8, date(2026, 11, 25), "Desparasitación de toros", None, "Pendiente"),
    (5, 4, None, date(2026, 11, 30), "Revisión de animales con cojera", "Revisar P-04 y P-09.", "Pendiente"),
    (6, 2, 3, date(2026, 10, 10), "Refuerzo de aftosa en vaquillas", None, "Completada"),
    (7, 3, 5, date(2026, 9, 1), "Desparasitación programada de terneros", "Se adelantó por lluvias.", "Completada"),
    (8, 1, None, date(2026, 8, 15), "Antirrábica general", "Se canceló por falta de vacunas.", "Cancelada"),
]
w("INSERT INTO programacion_sanitaria (id, id_tipo_sanidad, id_grupo, fecha_programada, titulo, observaciones, estado, activo) VALUES")
w(",\n".join(
    f"  ({p[0]}, {p[1]}, {p[2] if p[2] else 'NULL'}, {d(p[3])}, {q(p[4])}, {q(p[5])}, {q(p[6])}, TRUE)"
    for p in prog
) + ";")
w("")

# ---------------------------------------------------------------------------
# BAJAS: los animales salen del inventario activo DESPUÉS de registrar su
# historial (pesajes, sanidad). Así funcionan los triggers reales.
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 10. BAJAS DE ANIMALES (ventas y muertes)")
w("-- ---------------------------------------------------------------------------")
w("-- Se hace al final para conservar el historial de pesajes y sanidad.")
for a in vendidos + muertos:
    w(f"UPDATE animal SET estado = {q(a['estado'])}, id_grupo = NULL, "
      f"fecha_salida = {d(a['fecha_salida'])}, causa_salida = {q(a['causa_salida'])}, "
      f"id_causa_muerte = {a['causa_muerte'] if a['causa_muerte'] else 'NULL'}, "
      f"ultimo_grupo_id = {a['ult_grupo']}, ultimo_potrero_id = {a['ult_potrero']}, "
      f"comentario = {q(a['comentario'])} WHERE id = {a['id']};")
w("")

# ---------------------------------------------------------------------------
# VENTAS
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 10. COMPRADORES Y VENTAS")
w("-- ---------------------------------------------------------------------------")
compradores = [
    (1, "Feria Ganadera de Santa Cruz", "3-3456789", "Compra en pie para remate.", date(2021, 5, 10)),
    (2, "Frigorífico FRIGOR S.A.", "3-3344556", "Exige animales de más de 400 kg.", date(2022, 2, 18)),
    (3, "Juan Pérez Mamani", "71234567", "Comprador particular de la zona.", date(2023, 7, 4)),
    (4, "Estancia El Recreo", "3-3987654", "Compra vaquillas para reposición.", date(2024, 1, 22)),
    (5, "Remate La Paz", "2-2456789", "Pago a 30 días.", date(2025, 3, 9)),
]
w("INSERT INTO comprador (id, nombre, telefono, observaciones, activo, fecha_registro) VALUES")
w(",\n".join(
    f"  ({c[0]}, {q(c[1])}, {q(c[2])}, {q(c[3])}, TRUE, {d(c[4])})" for c in compradores
) + ";")
w("")

ventas_def = []
dvid = 0
detalles_venta = []
venta_id = 0
for a in vendidos:
    venta_id += 1
    fecha_v = a["fecha_salida"]
    comprador = [1, 2, 3, 4, 5][venta_id % 5]
    peso = peso_final.get(a["id"], 400)
    precio_kg = rnd.choice([13.5, 14.0, 15.2, 12.8])
    precio = round(peso * precio_kg, 2)
    ventas_def.append((venta_id, fecha_v, comprador, precio, rnd.choice([
        "Venta en pie por kilo.", "Venta directa a frigorífico.", "Remate mensual.", None,
    ])))
    dvid += 1
    detalles_venta.append((dvid, venta_id, a["id"], precio))

# dos ventas agrupan varios animales
w("INSERT INTO venta (id, fecha, id_comprador, precio_total, comentario) VALUES")
w(",\n".join(
    f"  ({v[0]}, {d(v[1])}, {v[2]}, {v[3]:.2f}, {q(v[4])})" for v in ventas_def
) + ";")
w("")
w("INSERT INTO detalle_venta (id, id_venta, id_animal, precio_unitario) VALUES")
w(",\n".join(
    f"  ({x[0]}, {x[1]}, {x[2]}, {x[3]:.2f})" for x in detalles_venta
) + ";")
w("")

# ---------------------------------------------------------------------------
# CUADRES DE INVENTARIO
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 11. CUADRES DE INVENTARIO")
w("-- ---------------------------------------------------------------------------")
w("INSERT INTO cuadre_inventario (id, id_evento, fecha_cuadre, total_sistema, total_contado, observaciones) VALUES")
w("  (1, 1, DATE '2026-03-15', 74, 74, 'Cuadre tras la campaña de aftosa. Todo conforme.'),")
w("  (2, 3, DATE '2026-05-10', 74, 73, 'Falta una vaca; apareció luego en el P-06.'),")
w("  (3, NULL, DATE '2026-09-30', 73, 73, 'Cuadre trimestral sin novedades.');")
w("")

# ---------------------------------------------------------------------------
# RECALCULAR SECUENCIAS
# ---------------------------------------------------------------------------
w("-- ---------------------------------------------------------------------------")
w("-- 12. REAJUSTE DE SECUENCIAS (para que los próximos INSERT no choquen)")
w("-- ---------------------------------------------------------------------------")
tablas = ["potrero", "potrero_pasto", "potrero_distribucion", "potrero_cerca",
          "trabajo_mantenimiento", "grupo", "traslado", "animal",
          "animal_caracteristica", "pesaje", "reasignacion_grupo",
          "evento_sanidad", "detalle_sanidad", "programacion_sanitaria",
          "comprador", "venta", "detalle_venta", "cuadre_inventario"]
for t in tablas:
    w(f"SELECT setval(pg_get_serial_sequence('{t}', 'id'), "
      f"COALESCE((SELECT MAX(id) FROM {t}), 1), TRUE);")
w("")
w("COMMIT;")

with open("server/db/seed_datos.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(OUT) + "\n")

print(f"OK  animales={len(animales)} pesajes={len(pesajes)} eventos={len(eventos)} "
      f"detalles={len(detalles)} reasignaciones={len(reas)} ventas={len(ventas_def)}")
