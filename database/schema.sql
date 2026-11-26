-- Esquema Oficial Base de Datos - C.E.E. Nelson Mandela (mandelia_db)

CREATE TABLE IF NOT EXISTS public.asignatura (
    id_asignatura SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS public.empleados (
    cedula VARCHAR(10) PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    direccion VARCHAR NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    tiempo_de_servicio NUMERIC(5,0),
    cargo VARCHAR(50) NOT NULL,
    condicion_de_salud VARCHAR(100),
    sexo TEXT NOT NULL,
    grado_academico VARCHAR(50),
    foto VARCHAR,
    estado_laboral VARCHAR(100),
    asignatura_impartida VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS public.estudiantes (
    cedula VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    direccion TEXT,
    grado_cursando VARCHAR(20),
    codigo_grupo VARCHAR(10),
    foto VARCHAR,
    sexo VARCHAR(50),
    telefono_representante VARCHAR(50),
    telefono_estudiante VARCHAR(50),
    estado_estudiante VARCHAR(20),
    asignatura_pendiente VARCHAR(20)
    representante VARCHAR(100),
    inasistencias NUMERIC(4, 2),
);

CREATE TABLE IF NOT EXISTS public.horario (
    id_horario SERIAL PRIMARY KEY,
    dia VARCHAR(15) NOT NULL,
    hora_inicio TIME WITHOUT TIME ZONE NOT NULL,
    hora_fin TIME WITHOUT TIME ZONE NOT NULL,
    grado_cursando VARCHAR(20) NOT NULL,
    codigo_grupo VARCHAR(10) NOT NULL,
    id_asignatura INTEGER NOT NULL REFERENCES public.asignatura(id_asignatura)
);

CREATE TABLE IF NOT EXISTS public.notas (
    id_nota SERIAL PRIMARY KEY,
    cedula VARCHAR(20) NOT NULL REFERENCES public.estudiantes(cedula),
    id_asignatura INTEGER NOT NULL REFERENCES public.asignatura(id_asignatura),
    lapso SMALLINT NOT NULL,
    nota NUMERIC(4,2) NOT NULL,
    observaciones VARCHAR(500),
    fecha_registro DATE
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    nivel VARCHAR(30) NOT NULL CHECK (nivel IN ('administracion', 'docente', 'docente_primaria')),
    estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO'
);

-- Datos semilla iniciales del respaldo
INSERT INTO public.asignatura (id_asignatura, nombre, descripcion)
VALUES (1, 'Matematica', NULL)
ON CONFLICT (id_asignatura) DO NOTHING;

SELECT pg_catalog.setval('public.asignatura_id_asignatura_seq', 1, true);

INSERT INTO public.estudiantes (cedula, nombre, apellido, fecha_nacimiento, direccion, grado_cursando, codigo_grupo, foto)
VALUES
    ('31264026', 'johnny', 'gomez', '2006-03-29', 'charallave', '3er año', '1A', NULL),
    ('31886704', 'ayer', 'Gonzale', '2005-05-11', 'cua', '2año', '1a', NULL)
ON CONFLICT (cedula) DO NOTHING;

INSERT INTO public.notas (id_nota, cedula, id_asignatura, lapso, nota, observaciones, fecha_registro)
VALUES (1, '31264026', 1, 1, 18.50, NULL, NULL)
ON CONFLICT (id_nota) DO NOTHING;

SELECT pg_catalog.setval('public.notas_id_nota_seq', 2, true);