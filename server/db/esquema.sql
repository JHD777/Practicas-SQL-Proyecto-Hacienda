-- =============================================================================
-- SISTEMA DE GESTIÓN GANADERA - HACIENDA LAS PIÑAS
-- ESQUEMA DEFINITIVO MASTER (26 TABLAS) - PostgreSQL 16 / Supabase
-- Arquitectura: 100% 3FN, Integridad Relacional y Optimizado para Django MVT
-- =============================================================================

BEGIN;

-- Limpieza segura previa (permite re-ejecutar el script en Supabase o local sin errores)
DROP VIEW IF EXISTS v_resumen_grupos CASCADE;
DROP VIEW IF EXISTS v_ganancia_peso CASCADE;
DROP VIEW IF EXISTS v_kardex CASCADE;

DROP TABLE IF EXISTS 
    cuadre_inventario, detalle_venta, venta, detalle_sanidad, programacion_sanitaria, evento_sanidad,
    reasignacion_grupo, pesaje, animal_caracteristica, animal, traslado, grupo,
    trabajo_mantenimiento, potrero_cerca, potrero_distribucion, potrero_pasto, potrero,
    comprador, causa_muerte, caracteristica_fisica, tipo_labor, tipo_sanidad, tipo_cerca, tipo_terreno, tipo_pasto, raza 
CASCADE;

-- =============================================================================
-- 1. CATÁLOGOS BASE (Tablas maestras paramétricas)
-- =============================================================================

CREATE TABLE raza (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipo_pasto (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipo_terreno (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipo_cerca (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipo_sanidad (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL,
    es_vacuna BOOLEAN NOT NULL DEFAULT FALSE,
    activo    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipo_labor (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE caracteristica_fisica (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE comprador (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(150) NOT NULL,
    telefono       VARCHAR(50),
    observaciones  TEXT,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE causa_muerte (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. GESTIÓN DE POTREROS E INFRAESTRUCTURA
-- =============================================================================

CREATE TABLE potrero (
    id                SERIAL PRIMARY KEY,
    codigo            VARCHAR(30) NOT NULL,
    hectareas         NUMERIC(8,2) NOT NULL,
    cantidad_atajados INT NOT NULL DEFAULT 0,
    comentario        TEXT,
    activo            BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro    DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE potrero_pasto (
    id            SERIAL PRIMARY KEY,
    id_potrero    INT NOT NULL,
    id_tipo_pasto INT NOT NULL
);

CREATE TABLE potrero_distribucion (
    id              SERIAL PRIMARY KEY,
    id_potrero      INT NOT NULL,
    id_tipo_terreno INT NOT NULL,
    porcentaje      NUMERIC(5,2) NOT NULL
);

CREATE TABLE potrero_cerca (
    id            SERIAL PRIMARY KEY,
    id_potrero    INT NOT NULL,
    id_tipo_cerca INT NOT NULL,
    estado_cerca  VARCHAR(10) NOT NULL DEFAULT 'Bueno'
);

CREATE TABLE trabajo_mantenimiento (
    id            SERIAL PRIMARY KEY,
    id_potrero    INT NOT NULL,
    id_tipo_labor INT NOT NULL,
    responsable   VARCHAR(120),
    fecha_inicio  DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin     DATE,
    observaciones TEXT
);

-- =============================================================================
-- 3. ORGANIZACIÓN DEL GANADO (GRUPOS Y ROTACIONES)
-- =============================================================================

CREATE TABLE grupo (
    id                    SERIAL PRIMARY KEY,
    nombre                VARCHAR(80) NOT NULL,
    id_potrero            INT,
    fecha_ingreso_potrero DATE,
    activo                BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_baja            TIMESTAMPTZ
);

CREATE TABLE traslado (
    id                 SERIAL PRIMARY KEY,
    id_grupo           INT NOT NULL,
    id_potrero_origen  INT,
    id_potrero_destino INT NOT NULL,
    fecha              DATE NOT NULL DEFAULT CURRENT_DATE,
    cabezas_movidas    INT CHECK (cabezas_movidas >= 0),
    motivo             TEXT
);

-- =============================================================================
-- 4. GESTIÓN INDIVIDUAL DEL ANIMAL
-- =============================================================================

CREATE TABLE animal (
    id                  SERIAL PRIMARY KEY,
    numero_arete        VARCHAR(20) NOT NULL,
    nombre              VARCHAR(80), 
    id_raza             INT NOT NULL,
    sexo                CHAR(1) NOT NULL,
    fecha_ingreso       DATE NOT NULL DEFAULT CURRENT_DATE,
    origen              VARCHAR(12) NOT NULL, -- 'Nacimiento' / 'Compra'
    
    -- Específicos de Nacimiento (id_madre permite NULL para terneros huérfanos sin madre conocida)
    fecha_nacimiento    DATE,
    peso_nacimiento_kg  NUMERIC(6,2),
    id_madre            INT,
    
    -- Específicos de Compra
    procedencia         VARCHAR(150),
    edad_estimada_meses INT,
    peso_inicial_kg     NUMERIC(6,2),
    
    estado              VARCHAR(10) NOT NULL DEFAULT 'Activo', -- 'Activo', 'Vendido', 'Muerto'
    id_grupo            INT,
    
    -- Congelación histórica al salir del inventario activo
    fecha_salida        DATE,
    causa_salida        VARCHAR(255),
    id_causa_muerte     INT,
    ultimo_grupo_id     INT,
    ultimo_potrero_id   INT,
    
    comentario          TEXT,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_baja          TIMESTAMPTZ
);

CREATE TABLE animal_caracteristica (
    id                SERIAL PRIMARY KEY,
    id_animal         INT NOT NULL,
    id_caracteristica INT NOT NULL
);

CREATE TABLE pesaje (
    id         SERIAL PRIMARY KEY,
    id_animal  INT NOT NULL,
    fecha      DATE NOT NULL DEFAULT CURRENT_DATE,
    peso_kg    NUMERIC(6,2) NOT NULL,
    comentario TEXT
);

CREATE TABLE reasignacion_grupo (
    id                SERIAL PRIMARY KEY,
    id_animal         INT NOT NULL,
    id_grupo_anterior INT,
    id_grupo_nuevo    INT NOT NULL,
    fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo            VARCHAR(200)
);

-- =============================================================================
-- 5. SANIDAD Y CONTROL CLÍNICO
-- =============================================================================

CREATE TABLE evento_sanidad (
    id              SERIAL PRIMARY KEY,
    id_tipo_sanidad INT NOT NULL,
    modalidad       VARCHAR(12) NOT NULL DEFAULT 'Individual', -- 'Individual', 'Grupo', 'Tropa'
    id_grupo        INT,
    fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
    comentario      TEXT
);

CREATE TABLE detalle_sanidad (
    id                 SERIAL PRIMARY KEY,
    id_evento          INT NOT NULL,
    id_animal          INT NOT NULL,
    peso_al_momento_kg NUMERIC(6,2)
);

CREATE TABLE programacion_sanitaria (
    id              SERIAL PRIMARY KEY,
    id_tipo_sanidad INT NOT NULL,
    id_grupo        INT,
    fecha_programada DATE NOT NULL,
    titulo          VARCHAR(120),
    observaciones   TEXT,
    estado          VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_prog_sanidad_estado
        CHECK (estado IN ('Pendiente', 'Completada', 'Cancelada'))
);

-- =============================================================================
-- 6. VENTAS Y CUADRE DE INVENTARIO
-- =============================================================================

CREATE TABLE venta (
    id           SERIAL PRIMARY KEY,
    fecha        DATE NOT NULL DEFAULT CURRENT_DATE,
    id_comprador INT NOT NULL,
    precio_total NUMERIC(12,2),
    comentario   TEXT
);

CREATE TABLE detalle_venta (
    id              SERIAL PRIMARY KEY,
    id_venta        INT NOT NULL,
    id_animal       INT NOT NULL,
    precio_unitario NUMERIC(10,2)
);

CREATE TABLE cuadre_inventario (
    id            SERIAL PRIMARY KEY,
    id_evento     INT, -- FK opcional vinculada a jornada sanitaria
    fecha_cuadre  DATE NOT NULL DEFAULT CURRENT_DATE,
    total_sistema INT NOT NULL CHECK (total_sistema >= 0),
    total_contado INT NOT NULL CHECK (total_contado >= 0),
    diferencia    INT GENERATED ALWAYS AS (total_contado - total_sistema) STORED,
    observaciones TEXT
);

-- =============================================================================
-- 7. INTEGRIDAD REFERENCIAL (LLAVES FORÁNEAS)
-- =============================================================================

ALTER TABLE potrero_pasto
    ADD CONSTRAINT fk_pp_potrero FOREIGN KEY (id_potrero) REFERENCES potrero(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_pp_tipo_pasto FOREIGN KEY (id_tipo_pasto) REFERENCES tipo_pasto(id) ON DELETE RESTRICT;

ALTER TABLE potrero_distribucion
    ADD CONSTRAINT fk_pd_potrero FOREIGN KEY (id_potrero) REFERENCES potrero(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_pd_tipo_terreno FOREIGN KEY (id_tipo_terreno) REFERENCES tipo_terreno(id) ON DELETE RESTRICT;

ALTER TABLE potrero_cerca
    ADD CONSTRAINT fk_pc_potrero FOREIGN KEY (id_potrero) REFERENCES potrero(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_pc_tipo_cerca FOREIGN KEY (id_tipo_cerca) REFERENCES tipo_cerca(id) ON DELETE RESTRICT;

ALTER TABLE trabajo_mantenimiento
    ADD CONSTRAINT fk_tm_potrero FOREIGN KEY (id_potrero) REFERENCES potrero(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_tm_tipo_labor FOREIGN KEY (id_tipo_labor) REFERENCES tipo_labor(id) ON DELETE RESTRICT;

ALTER TABLE grupo
    ADD CONSTRAINT fk_grupo_potrero FOREIGN KEY (id_potrero) REFERENCES potrero(id) ON DELETE RESTRICT;

ALTER TABLE traslado
    ADD CONSTRAINT fk_traslado_grupo FOREIGN KEY (id_grupo) REFERENCES grupo(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_traslado_origen FOREIGN KEY (id_potrero_origen) REFERENCES potrero(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_traslado_destino FOREIGN KEY (id_potrero_destino) REFERENCES potrero(id) ON DELETE RESTRICT;

ALTER TABLE animal
    ADD CONSTRAINT fk_animal_raza FOREIGN KEY (id_raza) REFERENCES raza(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_animal_madre FOREIGN KEY (id_madre) REFERENCES animal(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_animal_causa_muerte FOREIGN KEY (id_causa_muerte) REFERENCES causa_muerte(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_animal_grupo FOREIGN KEY (id_grupo) REFERENCES grupo(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_animal_ult_grupo FOREIGN KEY (ultimo_grupo_id) REFERENCES grupo(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_animal_ult_potrero FOREIGN KEY (ultimo_potrero_id) REFERENCES potrero(id) ON DELETE RESTRICT;

ALTER TABLE animal_caracteristica
    ADD CONSTRAINT fk_ac_animal FOREIGN KEY (id_animal) REFERENCES animal(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ac_caracteristica FOREIGN KEY (id_caracteristica) REFERENCES caracteristica_fisica(id) ON DELETE RESTRICT;

ALTER TABLE pesaje
    ADD CONSTRAINT fk_pesaje_animal FOREIGN KEY (id_animal) REFERENCES animal(id) ON DELETE RESTRICT;

ALTER TABLE reasignacion_grupo
    ADD CONSTRAINT fk_rg_animal FOREIGN KEY (id_animal) REFERENCES animal(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_rg_anterior FOREIGN KEY (id_grupo_anterior) REFERENCES grupo(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_rg_nuevo FOREIGN KEY (id_grupo_nuevo) REFERENCES grupo(id) ON DELETE RESTRICT;

ALTER TABLE evento_sanidad
    ADD CONSTRAINT fk_es_tipo FOREIGN KEY (id_tipo_sanidad) REFERENCES tipo_sanidad(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_es_grupo FOREIGN KEY (id_grupo) REFERENCES grupo(id) ON DELETE RESTRICT;

ALTER TABLE detalle_sanidad
    ADD CONSTRAINT fk_ds_evento FOREIGN KEY (id_evento) REFERENCES evento_sanidad(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_ds_animal FOREIGN KEY (id_animal) REFERENCES animal(id) ON DELETE RESTRICT;

ALTER TABLE programacion_sanitaria
    ADD CONSTRAINT fk_prog_sanidad_tipo FOREIGN KEY (id_tipo_sanidad) REFERENCES tipo_sanidad(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_prog_sanidad_grupo FOREIGN KEY (id_grupo) REFERENCES grupo(id) ON DELETE RESTRICT;

ALTER TABLE venta
    ADD CONSTRAINT fk_venta_comprador FOREIGN KEY (id_comprador) REFERENCES comprador(id) ON DELETE RESTRICT;

ALTER TABLE detalle_venta
    ADD CONSTRAINT fk_dv_venta FOREIGN KEY (id_venta) REFERENCES venta(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_dv_animal FOREIGN KEY (id_animal) REFERENCES animal(id) ON DELETE RESTRICT;

ALTER TABLE cuadre_inventario
    ADD CONSTRAINT fk_cuadre_evento FOREIGN KEY (id_evento) REFERENCES evento_sanidad(id) ON DELETE RESTRICT;

-- =============================================================================
-- 8. REGLAS DE VALIDEZ (CHECK) Y UNICIDAD
-- =============================================================================

-- Validaciones de Dominio en Animal
ALTER TABLE animal ADD CONSTRAINT ck_animal_sexo CHECK (sexo IN ('M', 'H'));
ALTER TABLE animal ADD CONSTRAINT ck_animal_estado CHECK (estado IN ('Activo', 'Vendido', 'Muerto'));
ALTER TABLE animal ADD CONSTRAINT ck_animal_origen CHECK (origen IN ('Nacimiento', 'Compra'));
ALTER TABLE animal ADD CONSTRAINT ck_animal_no_es_su_madre CHECK (id_madre IS NULL OR id_madre <> id);
ALTER TABLE animal ADD CONSTRAINT ck_animal_fechas CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= fecha_ingreso);

-- Coherencia de Nacimiento vs Compra
ALTER TABLE animal ADD CONSTRAINT ck_animal_datos_nacimiento CHECK (
    origen <> 'Nacimiento' OR (fecha_nacimiento IS NOT NULL AND peso_nacimiento_kg IS NOT NULL)
);
ALTER TABLE animal ADD CONSTRAINT ck_animal_datos_compra CHECK (
    origen <> 'Compra' OR (peso_inicial_kg IS NOT NULL)
);

-- Coherencia de Bajas
ALTER TABLE animal ADD CONSTRAINT ck_animal_salida_coherente CHECK (
    (estado = 'Activo' AND fecha_salida IS NULL AND causa_salida IS NULL)
    OR (estado <> 'Activo' AND fecha_salida IS NOT NULL AND id_grupo IS NULL)
);

-- Validaciones operativas
ALTER TABLE potrero ADD CONSTRAINT ck_potrero_hectareas CHECK (hectareas > 0);
ALTER TABLE potrero ADD CONSTRAINT ck_potrero_atajados CHECK (cantidad_atajados >= 0);
ALTER TABLE potrero_distribucion ADD CONSTRAINT ck_pd_porcentaje CHECK (porcentaje > 0 AND porcentaje <= 100);
ALTER TABLE potrero_cerca ADD CONSTRAINT ck_pc_estado CHECK (estado_cerca IN ('Bueno', 'Medio', 'Malo'));
ALTER TABLE trabajo_mantenimiento ADD CONSTRAINT ck_tm_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);
ALTER TABLE pesaje ADD CONSTRAINT ck_pesaje_rango CHECK (peso_kg > 0 AND peso_kg < 2500);
ALTER TABLE evento_sanidad ADD CONSTRAINT ck_es_modalidad CHECK (modalidad IN ('Individual', 'Grupo', 'Tropa'));
ALTER TABLE evento_sanidad ADD CONSTRAINT ck_es_grupo_check CHECK (modalidad <> 'Grupo' OR id_grupo IS NOT NULL);
ALTER TABLE venta ADD CONSTRAINT ck_venta_total CHECK (precio_total IS NULL OR precio_total >= 0);
ALTER TABLE detalle_venta ADD CONSTRAINT ck_dv_precio CHECK (precio_unitario IS NULL OR precio_unitario >= 0);

-- Validaciones de traslado y reasignación lógica
ALTER TABLE traslado ADD CONSTRAINT ck_traslado_distintos 
    CHECK (id_potrero_origen IS NULL OR id_potrero_origen <> id_potrero_destino);

ALTER TABLE reasignacion_grupo ADD CONSTRAINT ck_rg_distintos 
    CHECK (id_grupo_anterior IS NULL OR id_grupo_anterior <> id_grupo_nuevo);

-- Unicidad Relacional en tablas intermedias
ALTER TABLE potrero_pasto ADD CONSTRAINT uq_potrero_pasto UNIQUE (id_potrero, id_tipo_pasto);
ALTER TABLE potrero_distribucion ADD CONSTRAINT uq_potrero_terreno UNIQUE (id_potrero, id_tipo_terreno);
ALTER TABLE potrero_cerca ADD CONSTRAINT uq_potrero_cerca UNIQUE (id_potrero, id_tipo_cerca);
ALTER TABLE animal_caracteristica ADD CONSTRAINT uq_animal_caracteristica UNIQUE (id_animal, id_caracteristica);
ALTER TABLE detalle_sanidad ADD CONSTRAINT uq_detalle_sanidad UNIQUE (id_evento, id_animal);
ALTER TABLE detalle_venta ADD CONSTRAINT uq_dv_animal UNIQUE (id_animal);

-- Prevención de doble toque de pesaje en celular
ALTER TABLE pesaje ADD CONSTRAINT uq_pesaje_animal_fecha UNIQUE (id_animal, fecha);

-- Unicidades lógicas (Insensibles a mayúsculas)
CREATE UNIQUE INDEX uq_potrero_codigo ON potrero (LOWER(codigo)) WHERE activo;
CREATE UNIQUE INDEX uq_grupo_nombre ON grupo (LOWER(nombre)) WHERE activo;
CREATE UNIQUE INDEX uq_animal_arete ON animal (LOWER(numero_arete)) WHERE activo;
CREATE UNIQUE INDEX uq_comprador_nombre ON comprador (LOWER(nombre)) WHERE activo;
CREATE UNIQUE INDEX uq_causa_muerte_nombre ON causa_muerte (LOWER(nombre)) WHERE activo;

CREATE UNIQUE INDEX uq_raza_nombre ON raza (LOWER(nombre)) WHERE activo;
CREATE UNIQUE INDEX uq_pasto_nombre ON tipo_pasto (LOWER(nombre)) WHERE activo;
CREATE UNIQUE INDEX uq_terreno_nombre ON tipo_terreno (LOWER(nombre)) WHERE activo;
CREATE UNIQUE INDEX uq_cerca_nombre ON tipo_cerca (LOWER(nombre)) WHERE activo;
CREATE UNIQUE INDEX uq_sanidad_nombre ON tipo_sanidad (LOWER(nombre)) WHERE activo;
CREATE UNIQUE INDEX uq_labor_nombre ON tipo_labor (LOWER(nombre)) WHERE activo;
CREATE UNIQUE INDEX uq_caracteristica_nombre ON caracteristica_fisica (LOWER(nombre)) WHERE activo;

-- Co-ocupación de Potreros: Permite que 2 o más grupos compartan potrero (ej. Paridas + Terneros, Vacas + Vaquillas)
CREATE INDEX idx_grupo_potrero ON grupo (id_potrero) WHERE id_potrero IS NOT NULL AND activo;

-- =============================================================================
-- 9. ÍNDICES DE RENDIMIENTO PARA DISPOSITIVOS MÓVILES
-- =============================================================================

CREATE INDEX idx_pesaje_ultimo ON pesaje (id_animal, fecha DESC);
CREATE INDEX idx_animal_grupo_activo ON animal (id_grupo) WHERE estado = 'Activo' AND activo;
CREATE INDEX idx_animal_causa_muerte ON animal (id_causa_muerte);
CREATE INDEX idx_traslado_historial ON traslado (id_grupo, fecha DESC);
CREATE INDEX idx_detalle_sanidad_historial ON detalle_sanidad (id_animal);
CREATE INDEX idx_evento_sanidad_fecha ON evento_sanidad (fecha DESC);
CREATE INDEX idx_prog_sanitaria_alerta ON programacion_sanitaria (fecha_programada)
    WHERE activo AND estado = 'Pendiente';
CREATE INDEX idx_prog_sanitaria_grupo ON programacion_sanitaria (id_grupo) WHERE activo;
CREATE INDEX idx_venta_fecha ON venta (fecha DESC);
CREATE INDEX idx_mantenimiento_fecha ON trabajo_mantenimiento (fecha_inicio DESC);

-- =============================================================================
-- 10. DISPARADORES (TRIGGERS DE INTEGRIDAD)
-- =============================================================================

-- A. Asignación automática de fecha_baja al hacer borrado lógico
CREATE OR REPLACE FUNCTION fn_auto_fecha_baja()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.activo = FALSE AND OLD.activo = TRUE THEN
        NEW.fecha_baja = CURRENT_TIMESTAMP;
    ELSIF NEW.activo = TRUE AND OLD.activo = FALSE THEN
        NEW.fecha_baja = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_animal_fecha_baja 
BEFORE UPDATE ON animal 
FOR EACH ROW EXECUTE FUNCTION fn_auto_fecha_baja();

CREATE TRIGGER tg_grupo_fecha_baja 
BEFORE UPDATE ON grupo 
FOR EACH ROW EXECUTE FUNCTION fn_auto_fecha_baja();

-- B. Bloqueo de animales dados de baja (RF-C06)
CREATE OR REPLACE FUNCTION fn_bloquear_animal_inactivo()
RETURNS TRIGGER AS $$
DECLARE 
    v_estado VARCHAR(10); 
    v_arete VARCHAR(20);
BEGIN
    SELECT estado, numero_arete INTO v_estado, v_arete FROM animal WHERE id = NEW.id_animal;
    IF v_estado <> 'Activo' THEN
        RAISE EXCEPTION 'Operación denegada: El animal % tiene estado "%". No se le pueden registrar pesajes ni tratamientos médicos.', v_arete, v_estado;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_pesaje_bloqueo 
BEFORE INSERT ON pesaje 
FOR EACH ROW EXECUTE FUNCTION fn_bloquear_animal_inactivo();

CREATE TRIGGER tg_sanidad_bloqueo 
BEFORE INSERT ON detalle_sanidad 
FOR EACH ROW EXECUTE FUNCTION fn_bloquear_animal_inactivo();

-- =============================================================================
-- 11. VISTAS ANALÍTICAS (CONSULTAS OFICIALES DEL SISTEMA)
-- =============================================================================

-- VISTA 1: Ficha Kárdex (Muestra grupo/potrero actual si está Activo, o el último si está Muerto/Vendido)
CREATE OR REPLACE VIEW v_kardex AS
SELECT 
    a.id,
    a.numero_arete,
    a.nombre AS nombre_animal,
    a.sexo,
    r.nombre AS raza,
    a.estado,
    COALESCE(g.nombre, ug.nombre) AS grupo_actual,
    COALESCE(p.codigo, up.codigo) AS potrero_actual,
    madre.numero_arete AS arete_madre,
    COALESCE(
        (SELECT pe.peso_kg FROM pesaje pe WHERE pe.id_animal = a.id ORDER BY pe.fecha DESC, pe.id DESC LIMIT 1),
        a.peso_inicial_kg,
        a.peso_nacimiento_kg
    ) AS peso_actual_kg,
    (SELECT MAX(pe.fecha) FROM pesaje pe WHERE pe.id_animal = a.id) AS fecha_ultimo_pesaje,
    a.fecha_nacimiento,
    DATE_PART('year', AGE(CURRENT_DATE, a.fecha_nacimiento)) * 12 + DATE_PART('month', AGE(CURRENT_DATE, a.fecha_nacimiento)) AS edad_meses_calculada
FROM animal a
JOIN raza r ON r.id = a.id_raza
LEFT JOIN grupo g ON g.id = a.id_grupo
LEFT JOIN potrero p ON p.id = g.id_potrero
LEFT JOIN grupo ug ON ug.id = a.ultimo_grupo_id
LEFT JOIN potrero up ON up.id = a.ultimo_potrero_id
LEFT JOIN animal madre ON madre.id = a.id_madre
WHERE a.activo;

-- VISTA 2: Ganancia Diaria de Peso (GDP calculada mediante LAG)
CREATE OR REPLACE VIEW v_ganancia_peso AS
SELECT 
    p.id AS id,
    p.id_animal,
    a.numero_arete,
    p.fecha,
    p.peso_kg,
    p.peso_kg - LAG(p.peso_kg) OVER w AS ganancia_kg,
    p.fecha - LAG(p.fecha) OVER w AS dias,
    ROUND(((p.peso_kg - LAG(p.peso_kg) OVER w) / NULLIF(p.fecha - LAG(p.fecha) OVER w, 0))::numeric, 3) AS ganancia_diaria_kg
FROM pesaje p
JOIN animal a ON a.id = p.id_animal
WINDOW w AS (PARTITION BY p.id_animal ORDER BY p.fecha ASC);

-- VISTA 3: Resumen de Grupos con subdivisión automática de Machos y Hembras (Estilo Excel del cliente)
CREATE OR REPLACE VIEW v_resumen_grupos AS
SELECT 
    g.id AS id_grupo,
    g.nombre AS nombre_grupo,
    p.codigo AS potrero_actual,
    g.fecha_ingreso_potrero,
    COUNT(a.id) AS total_cabezas,
    COUNT(a.id) FILTER (WHERE a.sexo = 'M') AS total_machos,
    COUNT(a.id) FILTER (WHERE a.sexo = 'H') AS total_hembras
FROM grupo g
LEFT JOIN potrero p ON p.id = g.id_potrero
LEFT JOIN animal a ON a.id_grupo = g.id AND a.estado = 'Activo' AND a.activo = TRUE
WHERE g.activo = TRUE
GROUP BY g.id, g.nombre, p.codigo, g.fecha_ingreso_potrero
ORDER BY g.nombre;

-- =============================================================================
-- 12. DATOS SEMILLA (CATÁLOGOS Y GRUPOS OPERATIVOS INICIALES)
-- =============================================================================

INSERT INTO tipo_terreno (nombre) VALUES 
('Pasto'), ('Monte'), ('Barbecho'), ('Arenal'), ('Atajado');

INSERT INTO tipo_cerca (nombre) VALUES 
('Alambre de púas'), ('Cerca eléctrica');

INSERT INTO tipo_sanidad (nombre, es_vacuna) VALUES 
('Vacuna antirrábica', TRUE), 
('Vacuna contra fiebre aftosa', TRUE),
('Desparasitación', FALSE),
('Curación de herida', FALSE);

INSERT INTO tipo_labor (nombre) VALUES 
('Desbrozado'), ('Desbarbechado'), ('Limpieza'), ('Siembra de pasto'), ('Fumigación');

INSERT INTO caracteristica_fisica (nombre) VALUES 
('Mocha'), ('Pintada'), ('Chuta');

INSERT INTO raza (nombre) VALUES 
('Nelore'), ('Brahman'), ('Brangus'), ('Cruce');

INSERT INTO tipo_pasto (nombre) VALUES 
('Brachiaria'), ('Buffel'), ('Guinea');

INSERT INTO causa_muerte (nombre) VALUES 
('Picadura de serpiente / Intoxicación'),
('Enfermedad infecciosa / Neumonía'),
('Accidente / Traumatismo en campo'),
('Complicación de parto (Distocia)'),
('Timpanismo / Afección digestiva'),
('Vejez / Causa natural'),
('Causa desconocida');

INSERT INTO grupo (nombre) VALUES 
('Paridas'),
('Vacas'),
('Vaquillas'),
('Vacas Lecheras'),
('Terneros'),
('Terneros Huérfanos'),
('Destetes'),
('Toros'),
('Descartes');

COMMIT;
-- =============================================================================
-- FIN DEL ESQUEMA OFICIAL (26 TABLAS + 3 VISTAS)
-- =============================================================================