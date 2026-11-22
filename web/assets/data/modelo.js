/* ==========================================================================
   Modelo de datos — descripción en español de las 26 tablas del esquema.
   La estructura (columnas y tipos) se lee en vivo del catálogo de PostgreSQL;
   aquí solo viven los propósitos y las notas que no están en el DDL.
   ========================================================================== */
window.MODELO = {
  grupos: [
    { id: 'catalogos', titulo: 'Catálogos', emoji: '📚', descripcion: 'Tablas maestras paramétricas: valores que se usan como referencia y que el usuario mantiene.' },
    { id: 'potreros', titulo: 'Potreros e infraestructura', emoji: '🌿', descripcion: 'El terreno: superficie, pastos, cercas, distribución y mantenimiento.' },
    { id: 'ganado', titulo: 'Ganado', emoji: '🐄', descripcion: 'El núcleo: grupos, animales, pesajes, movimientos y características.' },
    { id: 'sanidad', titulo: 'Sanidad', emoji: '💉', descripcion: 'Eventos clínicos realizados y la agenda de los que faltan.' },
    { id: 'ventas', titulo: 'Ventas e inventario', emoji: '💰', descripcion: 'Salidas de animales, compradores y cuadre físico contra sistema.' },
  ],

  tablas: [
    // ------------------------------- Catálogos -------------------------------
    {
      nombre: 'raza', grupo: 'catalogos',
      proposito: 'Catálogo de razas bovinas del hato. Se referencia desde animal.',
      notas: {
        nombre: 'Único entre las razas activas (índice parcial sobre LOWER(nombre)).',
        activo: 'Borrado lógico: una raza en desuso se desactiva, no se borra.',
      },
    },
    {
      nombre: 'tipo_pasto', grupo: 'catalogos',
      proposito: 'Especies forrajeras disponibles (Brachiaria, Buffel, Guinea).',
      notas: { nombre: 'Único entre los activos.' },
    },
    {
      nombre: 'tipo_terreno', grupo: 'catalogos',
      proposito: 'Tipos de suelo o cobertura de un potrero: Pasto, Monte, Barbecho, Arenal, Atajado.',
      notas: {},
    },
    {
      nombre: 'tipo_cerca', grupo: 'catalogos',
      proposito: 'Material o tipo de cerca: alambre de púas, cerca eléctrica.',
      notas: {},
    },
    {
      nombre: 'tipo_sanidad', grupo: 'catalogos',
      proposito: 'Tipos de evento sanitario: vacunas, desparasitaciones, curaciones.',
      notas: { es_vacuna: 'Distingue vacunas de tratamientos; útil para informes de cobertura.' },
    },
    {
      nombre: 'tipo_labor', grupo: 'catalogos',
      proposito: 'Tipos de trabajo de mantenimiento de potreros.',
      notas: {},
    },
    {
      nombre: 'caracteristica_fisica', grupo: 'catalogos',
      proposito: 'Señas particulares del animal: Mocha, Pintada, Chuta.',
      notas: {},
    },
    {
      nombre: 'comprador', grupo: 'catalogos',
      proposito: 'Personas o empresas que compran animales.',
      notas: {
        nombre: 'Único entre los compradores activos, sin distinguir mayúsculas.',
        telefono: 'Texto libre; admite formatos distintos.',
      },
    },
    {
      nombre: 'causa_muerte', grupo: 'catalogos',
      proposito: 'Motivos de muerte tipificados, para no escribir texto libre en cada baja.',
      notas: { nombre: 'Único entre las causas activas.' },
    },

    // ------------------------------- Potreros -------------------------------
    {
      nombre: 'potrero', grupo: 'potreros',
      proposito: 'Cada potrero físico de la hacienda, con su superficie y sus atajados de agua.',
      notas: {
        codigo: 'Identificador legible (P-01, P-02…). Único entre los activos.',
        hectareas: 'CHECK > 0. Se usa para calcular la carga animal.',
        cantidad_atajados: 'Número de reservorios de agua; CHECK >= 0.',
      },
    },
    {
      nombre: 'potrero_pasto', grupo: 'potreros',
      proposito: 'Relación muchos-a-muchos entre potreros y tipos de pasto sembrados.',
      notas: {
        id_potrero: 'ON DELETE CASCADE: si se borra el potrero, se borran sus pastos.',
        _unique: 'UNIQUE (id_potrero, id_tipo_pasto): el mismo pasto no se repite en un potrero.',
      },
    },
    {
      nombre: 'potrero_distribucion', grupo: 'potreros',
      proposito: 'Qué porcentaje de cada potrero es pasto, monte, barbecho, arenal o atajado.',
      notas: {
        porcentaje: 'CHECK entre 0 y 100. Lo coherente es que la suma por potrero dé 100.',
      },
    },
    {
      nombre: 'potrero_cerca', grupo: 'potreros',
      proposito: 'Cercas de cada potrero y su estado de conservación.',
      notas: {
        estado_cerca: "CHECK IN ('Bueno','Medio','Malo') — la señal para programar mantenimiento.",
      },
    },
    {
      nombre: 'trabajo_mantenimiento', grupo: 'potreros',
      proposito: 'Registro de labores realizadas o en curso en los potreros.',
      notas: {
        fecha_fin: 'NULL mientras el trabajo está en curso. CHECK fecha_fin >= fecha_inicio.',
        id_potrero: 'ON DELETE RESTRICT: no se puede borrar un potrero con trabajos registrados.',
      },
    },

    // -------------------------------- Ganado --------------------------------
    {
      nombre: 'grupo', grupo: 'ganado',
      proposito: 'Agrupación operativa de animales (Vacas, Terneros, Toros…) que se mueve junta entre potreros.',
      notas: {
        nombre: 'Único entre los grupos activos.',
        id_potrero: 'Puede ser NULL: un grupo puede no estar asignado. Varios grupos pueden compartir potrero.',
        fecha_ingreso_potrero: 'Cuándo entró al potrero actual; base para calcular días de ocupación.',
      },
    },
    {
      nombre: 'traslado', grupo: 'ganado',
      proposito: 'Histórico de movimientos de un grupo entre potreros.',
      notas: {
        id_potrero_origen: 'NULL en el primer traslado (no venía de ningún potrero).',
        _check: 'CHECK origen <> destino — no se registra un traslado al mismo sitio.',
      },
    },
    {
      nombre: 'animal', grupo: 'ganado',
      proposito: 'Una fila por cabeza de ganado. Es la tabla central del sistema.',
      notas: {
        numero_arete: 'Único entre los activos, sin distinguir mayúsculas. Se puede reutilizar tras una baja lógica.',
        origen: "CHECK IN ('Nacimiento','Compra'). Determina qué campos son obligatorios.",
        fecha_nacimiento: 'Obligatoria si origen = Nacimiento; NULL si fue comprado.',
        id_madre: 'Self-referencia a animal. NULL en huérfanos. CHECK id_madre <> id.',
        estado: "CHECK IN ('Activo','Vendido','Muerto').",
        ultimo_grupo_id: 'Congela el grupo al salir del inventario activo, para que el kárdex siga mostrando dónde estaba.',
        activo: 'Borrado lógico. Un trigger rellena fecha_baja automáticamente.',
      },
    },
    {
      nombre: 'animal_caracteristica', grupo: 'ganado',
      proposito: 'Relación muchos-a-muchos entre animales y características físicas.',
      notas: {
        _unique: 'UNIQUE (id_animal, id_caracteristica).',
        id_animal: 'ON DELETE CASCADE: al borrar el animal se borran sus marcas.',
      },
    },
    {
      nombre: 'pesaje', grupo: 'ganado',
      proposito: 'Cada medición de peso de un animal. La serie temporal que alimenta la ganancia diaria.',
      notas: {
        _unique: 'UNIQUE (id_animal, fecha): un pesaje por animal y día (evita el doble toque en el celular).',
        peso_kg: 'CHECK > 0 AND < 2500.',
        _trigger: 'Un trigger impide insertar pesajes de animales que no están activos.',
      },
    },
    {
      nombre: 'reasignacion_grupo', grupo: 'ganado',
      proposito: 'Histórico de cambios de grupo de un animal, con su motivo.',
      notas: {
        id_grupo_anterior: 'NULL si es la primera asignación.',
        _check: 'CHECK anterior <> nuevo.',
      },
    },

    // -------------------------------- Sanidad --------------------------------
    {
      nombre: 'evento_sanidad', grupo: 'sanidad',
      proposito: 'Jornada sanitaria: una vacunación a toda la tropa, una desparasitación de un grupo o una curación individual.',
      notas: {
        modalidad: "CHECK IN ('Individual','Grupo','Tropa').",
        id_grupo: 'Obligatorio cuando la modalidad es Grupo (CHECK).',
      },
    },
    {
      nombre: 'detalle_sanidad', grupo: 'sanidad',
      proposito: 'Qué animal recibió qué evento sanitario, con su peso en ese momento.',
      notas: {
        _unique: 'UNIQUE (id_evento, id_animal): un animal no se repite en el mismo evento.',
        id_evento: 'ON DELETE CASCADE.',
        _trigger: 'Bloquea el registro si el animal no está activo.',
      },
    },
    {
      nombre: 'programacion_sanitaria', grupo: 'sanidad',
      proposito: 'Agenda de actividades sanitarias futuras, con su estado.',
      notas: {
        estado: "CHECK IN ('Pendiente','Completada','Cancelada').",
        fecha_programada: 'Tiene un índice parcial para las alertas: solo Pendiente y activo.',
      },
    },

    // --------------------------------- Ventas --------------------------------
    {
      nombre: 'venta', grupo: 'ventas',
      proposito: 'Cabecera de una operación de venta: fecha, comprador y total.',
      notas: {
        precio_total: 'CHECK >= 0. Debería coincidir con la suma de detalle_venta (no lo garantiza la base).',
      },
    },
    {
      nombre: 'detalle_venta', grupo: 'ventas',
      proposito: 'Animales incluidos en cada venta, con su precio unitario.',
      notas: {
        _unique: 'UNIQUE (id_animal): un animal solo puede venderse una vez.',
        id_venta: 'ON DELETE CASCADE.',
        id_animal: 'ON DELETE RESTRICT: no se borra un animal que tiene venta.',
      },
    },
    {
      nombre: 'cuadre_inventario', grupo: 'ventas',
      proposito: 'Conteo físico contra el total del sistema, para detectar faltantes o sobrantes.',
      notas: {
        diferencia: 'Columna GENERATED ALWAYS AS (total_contado - total_sistema) STORED: la calcula la base.',
        id_evento: 'Opcional; vincula el cuadre con la jornada sanitaria en la que se contó.',
      },
    },
  ],

  // Vistas del esquema, para la ficha de modelo
  vistas: [
    { nombre: 'v_kardex', proposito: 'Ficha completa de cada animal activo: raza, grupo y potrero actuales (o los últimos), peso actual y edad en meses.', usada: 'Pantalla de ficha del animal.' },
    { nombre: 'v_ganancia_peso', proposito: 'Cada pesaje con la diferencia respecto al anterior, los días transcurridos y la ganancia diaria (LAG + NULLIF).', usada: 'Indicador de engorde.' },
    { nombre: 'v_resumen_grupos', proposito: 'Cabezas por grupo, separando machos y hembras con FILTER.', usada: 'Panel de resumen del hato.' },
  ],

  // Reglas de negocio que viven en la base (triggers y checks)
  reglas: [
    { nombre: 'Borrado lógico con fecha', detalle: 'Al pasar activo a FALSE, el trigger tg_animal_fecha_baja rellena fecha_baja. Al reactivarlo, la limpia.', objeto: 'tg_animal_fecha_baja' },
    { nombre: 'Animales inactivos bloqueados', detalle: 'No se pueden registrar pesajes ni tratamientos sobre animales con estado distinto de Activo.', objeto: 'tg_pesaje_bloqueo / tg_sanidad_bloqueo' },
    { nombre: 'Un pesaje por día', detalle: 'UNIQUE (id_animal, fecha) evita el doble registro desde el celular.', objeto: 'uq_pesaje_animal_fecha' },
    { nombre: 'Códigos reutilizables', detalle: 'Los índices únicos parciales solo aplican a filas activas, así que un arete puede reutilizarse tras una baja lógica.', objeto: 'uq_animal_arete' },
    { nombre: 'Coherencia de salida', detalle: 'Si el estado no es Activo, debe haber fecha_salida y el animal no puede seguir en un grupo.', objeto: 'ck_animal_salida_coherente' },
  ],
};
