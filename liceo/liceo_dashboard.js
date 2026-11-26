// ================= ESTADO GLOBAL Y VARIABLES DE CONTROL =================
const parametrosAccesoLiceo = new URLSearchParams(window.location.search);
const usuarioSesion = sessionStorage.getItem('mandel.usuario') || parametrosAccesoLiceo.get('usuario') || 'Docente';
const cargoSesion = sessionStorage.getItem('mandel.cargo') || parametrosAccesoLiceo.get('cargo') || 'Docente • Media General';

document.querySelectorAll('[data-session-user]').forEach(elemento => {
    elemento.textContent = usuarioSesion;
});
document.querySelectorAll('[data-session-role]').forEach(elemento => {
    elemento.textContent = cargoSesion;
});

let temporizadorCargaModulo = null;
let observadorTablaCalificaciones = null;
let seccionesAsignadasDocente = [];
let aplicarFiltroTablaCalificaciones = null;
let cursoCalificacionesSeleccionado = null;

let cursosCatalogo = [];
let horarioLiceo = [];

const FRANJAS_HORARIAS_LICEO = [
    { inicio: '07:00', fin: '08:20', etiqueta: '7:00am - 8:20am' },
    { inicio: '08:30', fin: '09:50', etiqueta: '8:30am - 9:50am' },
    { inicio: '10:00', fin: '11:20', etiqueta: '10:00am - 11:20am' }
];

const materiasDelLiceo = [
    'Lengua y Literatura',
    'Idiomas',
    'Matemática',
    'Educación Física',
    'Biología, Ambiente y Tecnología',
    'Física',
    'Química',
    'Orientación Vocacional',
    'G.H.S.',
    'Informática Técnica y Práctica'
];

const iconosMaterias = {
    'lengua y literatura': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 11h8"/></svg>',
    idiomas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    matematica: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
    'educacion fisica': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9v6M3.5 10v4M18 9v6m2.5-5v4M6 12h12"/></svg>',
    'biologia, ambiente y tecnologia': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4c-8 0-13 3.5-13 9a6 6 0 0 0 6 6c5.5 0 7-7 7-15Z"/><path d="M4 21c3-5 6-8 12-12"/></svg>',
    fisica: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1"/></svg>',
    quimica: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7.5 16h9"/></svg>',
    'orientacion vocacional': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.3 4.7-4.7 2.3 2.3-4.7z"/></svg>',
    'g.h.s.': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18L12 4 3 9Zm2 2v7m4-7v7m6-7v7m4-7v7M3 21h18M2 18h20v3H2z"/></svg>',
    'informatica tecnica y practica': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4M8 9l-2 2 2 2m8-4 2 2-2 2m-3-5-2 6"/></svg>'
};

function etiquetaAnoEscolar(ano) {
    return Number(ano) === 1 ? '1er Año' : `${ano}° Año`;
}

function sincronizarSeccionesConCursos() {
    seccionesAsignadasDocente = [...new Set(cursosCatalogo.map(curso =>
        `${etiquetaAnoEscolar(curso.ano)} ${String(curso.seccion).trim()}`
    ))];
}

sincronizarSeccionesConCursos();

function formatearHoraCorta(valorHora) {
    const limpio = String(valorHora || '').trim();
    if (!limpio) return '';
    const partes = limpio.split(':');
    if (partes.length < 2) return limpio;
    const horas = Number(partes[0]);
    const minutos = partes[1].padStart(2, '0');
    if (!Number.isFinite(horas)) return limpio;
    const sufijo = horas >= 12 ? 'pm' : 'am';
    const hora12 = horas % 12 === 0 ? 12 : horas % 12;
    return `${hora12}:${minutos}${sufijo}`;
}

function normalizarRegistroHorarioLiceo(item) {
    const inicioCrudo = String(item.hora_inicio || '').trim();
    const finCrudo = String(item.hora_fin || '').trim();
    const rangoCalculado = (inicioCrudo || finCrudo)
        ? `${formatearHoraCorta(inicioCrudo) || inicioCrudo} - ${formatearHoraCorta(finCrudo) || finCrudo}`
        : '';

    return {
        idHorario: item.id_horario ?? item.idHorario ?? null,
        dia: String(item.dia || '').trim(),
        horaInicio: inicioCrudo,
        horaFin: finCrudo,
        bloque: String(item.bloque || rangoCalculado).trim(),
        gradoCursando: String(item.grado_cursando || item.ano || '').trim(),
        codigoGrupo: String(item.codigo_grupo || item.seccion || '').trim(),
        idAsignatura: item.id_asignatura ?? item.idAsignatura ?? null,
        materia: String(item.materia || item.asignatura || '').trim(),
        aula: String(item.aula || '').trim()
    };
}

function actualizarHorarioLiceo(bloques) {
    if (!Array.isArray(bloques)) {
        throw new TypeError('El horario de liceo debe proporcionarse como una lista.');
    }
    horarioLiceo = bloques.map(normalizarRegistroHorarioLiceo);
    renderizarHorarioDemostracion();
    renderizarHorarioSemanalLiceo();
}

// ================= 1. GESTIÓN DE NAVEGACIÓN LATERAL =================
function activarBoton(botonSeleccionado) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (botonSeleccionado) {
        botonSeleccionado.classList.add('active');
    }
}

function mostrarCargaModulo(contenedor, renderizar) {
    window.clearTimeout(temporizadorCargaModulo);
    if (observadorTablaCalificaciones) {
        observadorTablaCalificaciones.disconnect();
        observadorTablaCalificaciones = null;
    }

    contenedor.style.opacity = '0.5';

    temporizadorCargaModulo = window.setTimeout(() => {
        renderizar();
        contenedor.style.opacity = '1';
        contenedor.style.transition = 'opacity 0.2s ease-in-out';
        temporizadorCargaModulo = null;
    }, 150);
}

// ================= 2. VISTA PRINCIPAL (INICIO DOCENTE) =================
function mostrarInicio(boton) {
    activarBoton(boton);
    const contenedor = document.getElementById('main-content');

    mostrarCargaModulo(contenedor, () => {
        contenedor.innerHTML = `
            <div class="welcome-banner course-module-banner home-module-banner">
                <div>
                    <h1>¡Bienvenido(a), <span data-session-user>${usuarioSesion}</span>!</h1>
                    <h2>Gestión de Educación Media General</h2>
                    <p class="course-module-description">Desde aquí puedes revisar tus asignaciones y acceder rápidamente a cursos, horarios y calificaciones.</p>
                </div>
                <span class="course-catalog-mark home-module-mark" aria-hidden="true">
                    <img src="../img/img_inicio.png" alt="">
                </span>
            </div>

            <div class="widgets-row">
                <section class="widget academic-period-card academic-period-card--centered" aria-labelledby="academic-period-title" data-period-status="in-progress">
                    <div class="academic-period-main">
                        <span class="academic-period-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                                <path d="M16 3v4M8 3v4M3 11h18"></path>
                            </svg>
                        </span>
                        <div class="academic-period-content">
                            <h3 id="academic-period-title">Período académico actual</h3>
                            <p class="academic-period-year" data-academic-period-year>2026 - 2027</p>
                        </div>
                        <span class="academic-period-status" role="status" aria-live="polite">
                            <span class="academic-period-status-dot" aria-hidden="true"></span>
                            <span data-period-status-label>En curso</span>
                        </span>
                    </div>

                    <div class="academic-period-meta">
                        <div class="academic-period-meta-item">
                            <span>Momento / Lapso en curso</span>
                            <strong data-academic-term>I Momento</strong>
                        </div>
                        <div class="academic-period-meta-item">
                            <span>Código DEA del plantel</span>
                            <strong>OD05361512</strong>
                        </div>
                    </div>
                </section>
                <div class="widget actions">
                    <h3>Accesos directos</h3>
                    <div class="action-buttons action-buttons--shortcuts liceo-shortcuts-grid">
                        <button type="button" class="shortcut-button shortcut-button--grades" data-module="Cargar Calificaciones">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="../img/img_notas.png" alt="">
                            </span>
                            <span>Cargar notas</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--schedule" data-module="Ver Horarios">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="../img/img_horario.png" alt="">
                            </span>
                            <span>Ver Horario</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--courses" data-module="Cursos">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="../img/img_estudiante.png" alt="">
                            </span>
                            <span>Cursos</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--sheet" data-module="Subir Planilla">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="../img/img_boletines.png" alt="">
                            </span>
                            <span>Subir planilla</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="charts-row home-charts-row">
                <div class="chart-box assigned-courses-box">
                    <div class="assigned-courses-heading">
                        <div>
                            <h3>Secciones Asignadas</h3>
                            <p id="assigned-courses-summary" aria-live="polite"></p>
                        </div>
                        <span class="assigned-courses-count" id="assigned-courses-count"></span>
                    </div>
                    <div class="assigned-courses-list" id="assigned-courses-list" role="list"></div>
                </div>
                <section class="chart-box schedule-box" aria-labelledby="schedule-title">
                    <div class="schedule-heading">
                        <div>
                            <h3 id="schedule-title">Horarios de Clase</h3>
                            <p>Bloques horarios y materias asignadas para la semana.</p>
                        </div>
                        <span class="schedule-demo-label">Estructura base</span>
                    </div>
                    <div class="schedule-week" id="demo-schedule" aria-label="Horario semanal de clase"></div>
                    <p class="schedule-note">Estructura semanal lista para sincronizar con la base de datos</p>
                </section>
            </div>
        `;
        renderizarResumenCursos();
        renderizarHorarioDemostracion();
    });
}

function actualizarSeccionesAsignadas(secciones) {
    if (!Array.isArray(secciones)) {
        throw new TypeError('Las secciones asignadas deben proporcionarse como una lista.');
    }
    seccionesAsignadasDocente = secciones;
    if (aplicarFiltroTablaCalificaciones) aplicarFiltroTablaCalificaciones();
}

function renderizarCatalogoCursos(contenedor) {
    const filtroAno = contenedor.querySelector('#course-year-filter');
    const filtroSeccion = contenedor.querySelector('#course-section-filter');
    const busquedaMateria = contenedor.querySelector('#course-subject-search');
    const listaCursos = contenedor.querySelector('#course-years');
    const contador = contenedor.querySelector('#course-results-count');
    const estadoVacio = contenedor.querySelector('#course-empty-state');
    const botonLimpiar = contenedor.querySelector('#course-clear-filters');
    const vistaCatalogo = contenedor.querySelector('#course-catalog-view');
    const panelEstudiantes = contenedor.querySelector('#course-students-panel');
    const tituloMateriaSeleccionada = contenedor.querySelector('#course-selected-subject');
    const seccionSeleccionada = contenedor.querySelector('#course-selected-section-name');
    const busquedaEstudiante = contenedor.querySelector('#course-student-search');
    const contadorEstudiantes = contenedor.querySelector('#course-student-count');
    const cuerpoTablaEstudiantes = contenedor.querySelector('#course-students-table-body');
    const botonVolver = contenedor.querySelector('#course-back-to-catalog');
    const dialogoEstudiante = contenedor.querySelector('#course-student-detail-dialog');
    const botonCerrarDialogo = contenedor.querySelector('#course-student-detail-close');
    const normalizar = texto => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    let cursoSeleccionado = null;

    vistaCatalogo.hidden = false;
    panelEstudiantes.hidden = true;
    busquedaEstudiante.value = '';
    if (dialogoEstudiante.open) dialogoEstudiante.close();
    botonCerrarDialogo.onclick = () => dialogoEstudiante.close();

    const anos = [...new Set(cursosCatalogo.map(curso => Number(curso.ano)))].sort((a, b) => a - b);
    const secciones = [...new Set(cursosCatalogo.map(curso => String(curso.seccion).trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'));

    anos.forEach(ano => {
        const opcion = document.createElement('option');
        opcion.value = String(ano);
        opcion.textContent = etiquetaAnoEscolar(ano);
        filtroAno.appendChild(opcion);
    });

    secciones.forEach(seccion => {
        const opcion = document.createElement('option');
        opcion.value = seccion;
        opcion.textContent = `Sección ${seccion}`;
        filtroSeccion.appendChild(opcion);
    });

    const materias = agruparCursosPorMateria(cursosCatalogo);
    materias.forEach(materiaAsignada => {
        const bloqueMateria = document.createElement('section');
        bloqueMateria.className = 'course-subject-block';
        bloqueMateria.dataset.subject = normalizar(materiaAsignada.nombre);

        const encabezado = document.createElement('div');
        encabezado.className = 'course-subject-heading';
        encabezado.appendChild(crearIconoMateria(materiaAsignada.nombre));
        const titulo = document.createElement('h2');
        titulo.textContent = materiaAsignada.nombre;
        encabezado.appendChild(titulo);

        const ubicaciones = document.createElement('div');
        ubicaciones.className = 'course-location-list';
        materiaAsignada.asignaciones.forEach(curso => {
            const ubicacion = document.createElement('button');
            ubicacion.type = 'button';
            ubicacion.className = 'course-location-card';
            ubicacion.dataset.courseIndex = String(curso.indice);
            ubicacion.dataset.year = String(curso.ano);
            ubicacion.dataset.section = String(curso.seccion);

            const etiqueta = document.createElement('span');
            etiqueta.className = 'course-location-label';
            etiqueta.textContent = `${etiquetaAnoEscolar(curso.ano)} • Sección ${curso.seccion}`;
            ubicacion.appendChild(etiqueta);

            const nombreDocente = String(curso.docente || '').trim();
            if (nombreDocente) {
                const docente = document.createElement('div');
                docente.className = 'course-teacher';
                const avatar = document.createElement('span');
                avatar.className = 'course-teacher-avatar';
                avatar.textContent = nombreDocente.charAt(0).toLocaleUpperCase('es');
                avatar.setAttribute('aria-hidden', 'true');
                const nombre = document.createElement('span');
                nombre.textContent = nombreDocente;
                docente.append(avatar, nombre);
                ubicacion.appendChild(docente);
            }

            ubicaciones.appendChild(ubicacion);
        });

        bloqueMateria.append(encabezado, ubicaciones);
        listaCursos.appendChild(bloqueMateria);
    });

    function renderizarEstudiantesSeccion(curso) {
        tituloMateriaSeleccionada.textContent = curso.materia;
        seccionSeleccionada.textContent = `${etiquetaAnoEscolar(curso.ano)} • Sección ${curso.seccion}`;
        contadorEstudiantes.textContent = '0 estudiantes asignados';
        cuerpoTablaEstudiantes.replaceChildren();

        const filaVacia = document.createElement('tr');
        const mensajeVacio = document.createElement('td');
        mensajeVacio.colSpan = 4;
        mensajeVacio.className = 'grades-empty-state';
        mensajeVacio.textContent = 'Los estudiantes aparecerán aquí al conectar con la base de datos.';
        filaVacia.appendChild(mensajeVacio);
        cuerpoTablaEstudiantes.appendChild(filaVacia);
    }

    listaCursos.onclick = event => {
        const ubicacion = event.target.closest('.course-location-card');
        if (!ubicacion || !listaCursos.contains(ubicacion)) return;

        const curso = cursosCatalogo[Number(ubicacion.dataset.courseIndex)];
        if (!curso) return;

        cursoSeleccionado = curso;
        busquedaEstudiante.value = '';
        renderizarEstudiantesSeccion(curso);
        vistaCatalogo.hidden = true;
        panelEstudiantes.hidden = false;
        busquedaEstudiante.focus();
    };

    botonVolver.onclick = () => {
        const indiceCurso = cursoSeleccionado ? cursosCatalogo.indexOf(cursoSeleccionado) : -1;
        cursoSeleccionado = null;
        busquedaEstudiante.value = '';
        panelEstudiantes.hidden = true;
        vistaCatalogo.hidden = false;

        const tarjetaAnterior = indiceCurso >= 0
            ? listaCursos.querySelector(`[data-course-index="${indiceCurso}"]`)
            : null;
        if (tarjetaAnterior) tarjetaAnterior.focus();
    };

    function aplicarFiltros() {
        const consulta = normalizar(busquedaMateria.value);
        let materiasVisibles = 0;
        let asignacionesVisibles = 0;

        listaCursos.querySelectorAll('.course-subject-block').forEach(bloque => {
            const coincideMateria = bloque.dataset.subject.includes(consulta);
            let tieneUbicacionesVisibles = false;
            bloque.querySelectorAll('.course-location-card').forEach(ubicacion => {
                const visible = coincideMateria
                    && (!filtroAno.value || ubicacion.dataset.year === filtroAno.value)
                    && (!filtroSeccion.value || ubicacion.dataset.section === filtroSeccion.value);
                ubicacion.hidden = !visible;
                if (visible) {
                    asignacionesVisibles++;
                    tieneUbicacionesVisibles = true;
                }
            });

            bloque.hidden = !tieneUbicacionesVisibles;
            if (tieneUbicacionesVisibles) materiasVisibles++;
        });

        contador.textContent = `${materiasVisibles} ${materiasVisibles === 1 ? 'materia' : 'materias'} • ${asignacionesVisibles} ${asignacionesVisibles === 1 ? 'asignación' : 'asignaciones'}`;
        estadoVacio.textContent = cursosCatalogo.length
            ? 'No encontramos asignaturas con esos filtros. Prueba con otra búsqueda.'
            : 'Aún no tienes materias asignadas en el catálogo.';
        estadoVacio.hidden = asignacionesVisibles > 0;
        listaCursos.setAttribute('aria-busy', 'false');
    }

    filtroAno.addEventListener('change', aplicarFiltros);
    filtroSeccion.addEventListener('change', aplicarFiltros);
    busquedaMateria.addEventListener('input', aplicarFiltros);
    botonLimpiar.addEventListener('click', () => {
        filtroAno.value = '';
        filtroSeccion.value = '';
        busquedaMateria.value = '';
        aplicarFiltros();
        filtroAno.focus();
    });

    aplicarFiltros();
}

function crearIconoMateria(materia) {
    const icono = document.createElement('span');
    const clave = String(materia).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    icono.className = 'course-subject-icon';
    icono.setAttribute('aria-hidden', 'true');
    icono.innerHTML = iconosMaterias[clave] || iconosMaterias['lengua y literatura'];
    return icono;
}

function agruparCursosPorMateria(cursos) {
    const materias = new Map();
    cursos.forEach((curso, indice) => {
        const nombre = String(curso.materia).trim();
        const claveMateria = nombre.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
        if (!materias.has(claveMateria)) {
            materias.set(claveMateria, { nombre, asignaciones: new Map() });
        }

        const asignaciones = materias.get(claveMateria).asignaciones;
        const claveAsignacion = `${curso.ano}|${curso.seccion}`;
        if (!asignaciones.has(claveAsignacion)) {
            asignaciones.set(claveAsignacion, { ...curso, indice });
        }
    });

    return [...materias.values()]
        .map(materia => ({
            ...materia,
            asignaciones: [...materia.asignaciones.values()].sort((a, b) =>
                a.ano - b.ano || a.seccion.localeCompare(b.seccion, 'es')
            )
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function renderizarResumenCursos() {
    const lista = document.getElementById('assigned-courses-list');
    const resumen = document.getElementById('assigned-courses-summary');
    const contador = document.getElementById('assigned-courses-count');
    if (!lista || !resumen || !contador) return;

    const materiasOrdenadas = agruparCursosPorMateria(cursosCatalogo);
    lista.replaceChildren();

    const cantidadAsignaciones = materiasOrdenadas.reduce(
        (total, materia) => total + materia.asignaciones.length,
        0
    );
    resumen.textContent = `${cantidadAsignaciones} ${cantidadAsignaciones === 1 ? 'asignación académica' : 'asignaciones académicas'}`;
    contador.textContent = `${materiasOrdenadas.length} ${materiasOrdenadas.length === 1 ? 'materia' : 'materias'}`;

    if (!materiasOrdenadas.length) {
        const vacio = document.createElement('p');
        vacio.className = 'assigned-courses-empty';
        vacio.textContent = 'Aún no tienes materias asignadas.';
        lista.appendChild(vacio);
        return;
    }

    materiasOrdenadas.forEach(materiaAsignada => {
        const grupo = document.createElement('section');
        grupo.className = 'assigned-course-group';
        grupo.setAttribute('role', 'listitem');
        grupo.dataset.subject = normalizarTextoHorario(materiaAsignada.nombre);

        const encabezado = document.createElement('div');
        encabezado.className = 'assigned-course-group-heading';
        encabezado.appendChild(crearIconoMateria(materiaAsignada.nombre));
        const nombre = document.createElement('h4');
        nombre.className = 'assigned-course-name';
        nombre.textContent = materiaAsignada.nombre;
        encabezado.appendChild(nombre);
        encabezado.dataset.subject = normalizarTextoHorario(materiaAsignada.nombre);
        encabezado.tabIndex = 0;

        const asignaciones = document.createElement('div');
        asignaciones.className = 'assigned-course-locations';
        materiaAsignada.asignaciones.forEach(asignacion => {
            const etiqueta = document.createElement('span');
            etiqueta.className = 'assigned-course-section';
            etiqueta.textContent = `${etiquetaAnoEscolar(asignacion.ano)} • Sección ${asignacion.seccion}`;
            etiqueta.dataset.subject = normalizarTextoHorario(materiaAsignada.nombre);
            etiqueta.dataset.year = String(asignacion.ano);
            etiqueta.dataset.section = String(asignacion.seccion);
            etiqueta.tabIndex = 0;
            asignaciones.appendChild(etiqueta);
        });

        grupo.append(encabezado, asignaciones);
        lista.appendChild(grupo);
    });
}

function normalizarTextoHorario(texto) {
    return String(texto)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function renderizarHorarioDemostracion() {
    const horario = document.getElementById('demo-schedule');
    if (!horario) return;

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const bloquesBase = FRANJAS_HORARIAS_LICEO.map(f => f.etiqueta);
    horario.replaceChildren();

    const columnas = dias.map(dia => {
        const columna = document.createElement('section');
        columna.className = 'schedule-day';
        columna.setAttribute('aria-label', dia);

        const titulo = document.createElement('h4');
        titulo.textContent = dia;
        columna.appendChild(titulo);

        const bloquesDia = horarioLiceo.filter(
            item => normalizarTextoHorario(item.dia) === normalizarTextoHorario(dia)
        );
        const listaBloques = bloquesDia.length
            ? bloquesDia
            : bloquesBase.map(hora => ({
                dia,
                bloque: hora,
                materia: '',
                ano: '',
                seccion: '',
                aula: ''
            }));

        listaBloques.forEach(item => {
            const bloque = document.createElement('article');
            const tieneMateria = Boolean(String(item.materia || '').trim());
            bloque.className = tieneMateria ? 'schedule-class' : 'schedule-class schedule-class--empty';
            if (tieneMateria) {
                bloque.dataset.subject = normalizarTextoHorario(item.materia);
                if (item.ano) bloque.dataset.year = String(item.ano);
                if (item.seccion) bloque.dataset.section = String(item.seccion);
            }

            const hora = document.createElement('span');
            hora.className = 'schedule-time';
            hora.textContent = item.bloque || '—';

            const nombre = document.createElement('h5');
            nombre.textContent = tieneMateria ? item.materia : '—';

            const seccion = document.createElement('span');
            seccion.className = 'schedule-section';
            const partesDetalle = [];
            if (item.ano && item.seccion) {
                partesDetalle.push(`${etiquetaAnoEscolar(item.ano)} · Sección ${item.seccion}`);
            } else if (item.ano) {
                partesDetalle.push(etiquetaAnoEscolar(item.ano));
            }
            if (item.aula) {
                partesDetalle.push(item.aula);
            }
            seccion.textContent = partesDetalle.length ? partesDetalle.join(' · ') : 'Sin asignar';

            bloque.append(hora, nombre, seccion);
            columna.appendChild(bloque);
        });

        return columna;
    });

    columnas.forEach(columna => horario.appendChild(columna));
    activarResaltadoHorarioDesdeAsignaciones();
}

function renderizarHorarioSemanalLiceo() {
    const contenedor = document.getElementById('liceo-weekly-timetable');
    if (!contenedor) return;

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const registrosNormalizados = horarioLiceo.map(normalizarRegistroHorarioLiceo);

    const franjasExtra = [];
    registrosNormalizados.forEach(reg => {
        const etiqueta = reg.bloque || 'Sin hora';
        const existeEnBase = FRANJAS_HORARIAS_LICEO.some(f =>
            normalizarTextoHorario(f.etiqueta) === normalizarTextoHorario(etiqueta)
            || (reg.horaInicio && f.inicio === reg.horaInicio.slice(0, 5))
        );
        const existeEnExtra = franjasExtra.some(f =>
            normalizarTextoHorario(f.etiqueta) === normalizarTextoHorario(etiqueta)
        );
        if (!existeEnBase && !existeEnExtra) {
            franjasExtra.push({
                inicio: reg.horaInicio.slice(0, 5),
                fin: reg.horaFin.slice(0, 5),
                etiqueta
            });
        }
    });

    const franjas = [...FRANJAS_HORARIAS_LICEO, ...franjasExtra];

    const tabla = document.createElement('table');
    tabla.className = 'liceo-timetable-grid';

    const thead = document.createElement('thead');
    const filaCabecera = document.createElement('tr');
    const thHora = document.createElement('th');
    thHora.className = 'liceo-timetable-hour-col';
    thHora.textContent = 'Hora / Bloque';
    filaCabecera.appendChild(thHora);

    dias.forEach(dia => {
        const thDia = document.createElement('th');
        thDia.textContent = dia;
        filaCabecera.appendChild(thDia);
    });
    thead.appendChild(filaCabecera);
    tabla.appendChild(thead);

    const tbody = document.createElement('tbody');
    franjas.forEach(franja => {
        const fila = document.createElement('tr');
        const celdaHora = document.createElement('td');
        celdaHora.className = 'liceo-timetable-slot-label';
        celdaHora.textContent = franja.etiqueta;
        fila.appendChild(celdaHora);

        dias.forEach(dia => {
            const celda = document.createElement('td');
            const coincidencia = registrosNormalizados.find(reg => {
                const mismoDia = normalizarTextoHorario(reg.dia) === normalizarTextoHorario(dia);
                if (!mismoDia) return false;
                if (franja.inicio && reg.horaInicio) {
                    return reg.horaInicio.slice(0, 5) === franja.inicio;
                }
                return normalizarTextoHorario(reg.bloque) === normalizarTextoHorario(franja.etiqueta);
            });

            const tieneDatos = coincidencia && (
                coincidencia.materia
                || coincidencia.gradoCursando
                || coincidencia.codigoGrupo
                || coincidencia.idAsignatura
            );

            if (!tieneDatos) {
                celda.className = 'liceo-timetable-cell liceo-timetable-cell--empty';
                celda.textContent = '—';
            } else {
                celda.className = 'liceo-timetable-cell';
                const entrada = document.createElement('div');
                entrada.className = 'liceo-timetable-entry';

                const tituloMateria = document.createElement('span');
                tituloMateria.className = 'liceo-timetable-subject';
                tituloMateria.textContent = coincidencia.materia
                    || (coincidencia.idAsignatura ? `Asignatura #${coincidencia.idAsignatura}` : 'Asignatura asignada');
                entrada.appendChild(tituloMateria);

                const partesMeta = [];
                if (coincidencia.gradoCursando) partesMeta.push(coincidencia.gradoCursando);
                if (coincidencia.codigoGrupo) partesMeta.push(`Grupo ${coincidencia.codigoGrupo}`);
                if (coincidencia.aula) partesMeta.push(coincidencia.aula);

                if (partesMeta.length) {
                    const meta = document.createElement('span');
                    meta.className = 'liceo-timetable-meta';
                    meta.textContent = partesMeta.join(' · ');
                    entrada.appendChild(meta);
                }

                if (coincidencia.bloque) {
                    const horaDetalle = document.createElement('span');
                    horaDetalle.className = 'liceo-timetable-time';
                    horaDetalle.textContent = coincidencia.bloque;
                    entrada.appendChild(horaDetalle);
                }

                celda.appendChild(entrada);
            }

            fila.appendChild(celda);
        });

        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    contenedor.replaceChildren(tabla);
}

function activarResaltadoHorarioDesdeAsignaciones() {
    const lista = document.getElementById('assigned-courses-list');
    const horario = document.getElementById('demo-schedule');
    if (!lista || !horario) return;

    const limpiar = () => {
        horario.classList.remove('has-schedule-highlight');
        horario.querySelectorAll('.schedule-class').forEach(bloque => {
            bloque.classList.remove('is-schedule-highlight');
        });
    };

    const resaltar = elemento => {
        limpiar();
        const materia = elemento.dataset.subject || '';
        const ano = elemento.dataset.year || '';
        const seccion = elemento.dataset.section || '';
        let coincidencias = 0;

        horario.querySelectorAll('.schedule-class').forEach(bloque => {
            if (!bloque.dataset.subject) return;
            const coincideMateria = bloque.dataset.subject === materia;
            const coincideAsignacion = !ano
                || (bloque.dataset.year === ano && bloque.dataset.section === seccion);

            if (coincideMateria && coincideAsignacion) {
                bloque.classList.add('is-schedule-highlight');
                coincidencias++;
            }
        });

        if (coincidencias > 0) {
            horario.classList.add('has-schedule-highlight');
        }
    };

    lista.querySelectorAll('.assigned-course-group').forEach(grupo => {
        grupo.addEventListener('mouseenter', () => resaltar(grupo));
        grupo.addEventListener('mouseleave', limpiar);
    });

    lista.querySelectorAll('.assigned-course-group-heading, .assigned-course-section').forEach(elemento => {
        const grupo = elemento.closest('.assigned-course-group');
        elemento.addEventListener('mouseenter', () => resaltar(elemento));
        elemento.addEventListener('mouseleave', () => resaltar(grupo));
        elemento.addEventListener('focus', () => resaltar(elemento));
        elemento.addEventListener('blur', limpiar);
    });
}

renderizarResumenCursos();
renderizarHorarioDemostracion();

// ================= DETECCIÓN AUTOMÁTICA EN PLANILLAS SUBIDAS =================
function detectarMateriaYCursoEnTexto(textoPlano, nombreArchivo = '') {
    const normTexto = normalizarTextoHorario(`${nombreArchivo} ${textoPlano}`);
    let materiaDetectada = 'Por detectar en planilla';

    for (const materia of materiasDelLiceo) {
        if (normTexto.includes(normalizarTextoHorario(materia))) {
            materiaDetectada = materia;
            break;
        }
    }

    if (materiaDetectada === 'Por detectar en planilla') {
        const aliases = [
            { clave: 'matematica', nombre: 'Matemática' },
            { clave: 'lengua', nombre: 'Lengua y Literatura' },
            { clave: 'biologia', nombre: 'Biología, Ambiente y Tecnología' },
            { clave: 'fisica', nombre: 'Física' },
            { clave: 'quimica', nombre: 'Química' },
            { clave: 'educacion fisica', nombre: 'Educación Física' },
            { clave: 'orientacion', nombre: 'Orientación Vocacional' },
            { clave: 'informatica', nombre: 'Informática Técnica y Práctica' },
            { clave: 'ghs', nombre: 'G.H.S.' },
            { clave: 'idioma', nombre: 'Idiomas' }
        ];
        const matchAlias = aliases.find(a => normTexto.includes(a.clave));
        if (matchAlias) materiaDetectada = matchAlias.nombre;
    }

    const matchAno = normTexto.match(/\b([1-5])\s*(?:er|do|er\.|°|o)?\s*(?:ano|año)\b/);
    const matchSec = normTexto.match(/\b(?:seccion|sección|sec\.?)\s*[:\-]?\s*([a-e])\b/);
    const matchCompacto = normTexto.match(/\b([1-5])\s*([a-e])\b/);

    const ano = matchAno ? Number(matchAno[1]) : (matchCompacto ? Number(matchCompacto[1]) : null);
    const seccion = matchSec ? matchSec[1].toUpperCase() : (matchCompacto ? matchCompacto[2].toUpperCase() : '');

    const cursoLabel = ano && seccion
        ? `${etiquetaAnoEscolar(ano)} • Sección ${seccion}`
        : (ano ? etiquetaAnoEscolar(ano) : 'Por detectar en planilla');

    return {
        materia: materiaDetectada,
        curso: cursoLabel,
        ano,
        seccion
    };
}

function parsearFilasPlanillaCSV(textoCSV) {
    const lineas = textoCSV
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

    const filasEstudiantes = [];
    lineas.forEach(linea => {
        const celdas = linea.split(/[,;\t]/).map(c => c.replace(/^["']|["']$/g, '').trim());
        const cedulaIdx = celdas.findIndex(c => /^(?:[VE]-?)?\d{6,9}$/i.test(c));
        if (cedulaIdx !== -1) {
            const cedula = celdas[cedulaIdx].toUpperCase();
            const nombre = celdas[cedulaIdx + 1] || 'Estudiante sin nombre';
            const m1 = celdas[cedulaIdx + 2] ?? '';
            const m2 = celdas[cedulaIdx + 3] ?? '';
            const m3 = celdas[cedulaIdx + 4] ?? '';
            filasEstudiantes.push({ cedula, nombre, m1, m2, m3 });
        }
    });

    return filasEstudiantes;
}

function renderizarModuloSubirPlanilla(contenedor) {
    const inputArchivo = contenedor.querySelector('#sheet-file-input');
    const zonaDrop = contenedor.querySelector('#sheet-dropzone');
    const botonSeleccionar = contenedor.querySelector('#sheet-select-file-btn');
    const panelResultado = contenedor.querySelector('#sheet-parsed-panel');
    const estadoCarga = contenedor.querySelector('#sheet-upload-status');
    const nombreArchivoEl = contenedor.querySelector('#sheet-file-name');
    const materiaDetectadaEl = contenedor.querySelector('#sheet-detected-subject');
    const cursoDetectadoEl = contenedor.querySelector('#sheet-detected-course');
    const cuerpoTabla = contenedor.querySelector('#sheet-preview-tbody');
    const botonGuardar = contenedor.querySelector('#sheet-save-btn');
    const botonLimpiar = contenedor.querySelector('#sheet-reset-btn');

    function calcularDefinitivaFila(fila) {
        const inputs = Array.from(fila.querySelectorAll('.grade-lapso-input'));
        const notas = inputs.map(inp => inp.value.trim() === '' ? null : Number(inp.value));
        const celdaDef = fila.querySelector('.grade-final');
        if (notas.length !== 3 || notas.some(n => n === null || !Number.isFinite(n) || n < 1 || n > 20)) {
            celdaDef.textContent = '—';
            return;
        }
        const promedio = notas.reduce((acc, v) => acc + v, 0) / 3;
        celdaDef.innerHTML = `<strong>${promedio.toFixed(2)}</strong>`;
    }

    function poblarTabla(estudiantes) {
        cuerpoTabla.replaceChildren();
        estudiantes.forEach(est => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${est.cedula}</td>
                <td>${est.nombre}</td>
                <td><input type="number" min="1" max="20" step="0.01" class="grade-lapso-input" value="${est.m1}" placeholder="00"></td>
                <td><input type="number" min="1" max="20" step="0.01" class="grade-lapso-input" value="${est.m2}" placeholder="00"></td>
                <td><input type="number" min="1" max="20" step="0.01" class="grade-lapso-input" value="${est.m3}" placeholder="00"></td>
                <td class="grade-final">—</td>
            `;
            cuerpoTabla.appendChild(tr);
            calcularDefinitivaFila(tr);
        });
    }

    async function procesarArchivo(archivo) {
        if (!archivo) return;

        nombreArchivoEl.textContent = archivo.name;
        estadoCarga.hidden = false;
        estadoCarga.textContent = `Analizando "${archivo.name}" para identificar materia y curso...`;

        let textoCrudo = '';
        try {
            textoCrudo = await archivo.text();
        } catch (_err) {
            textoCrudo = '';
        }

        const deteccion = detectarMateriaYCursoEnTexto(textoCrudo, archivo.name);
        const filas = parsearFilasPlanillaCSV(textoCrudo);

        materiaDetectadaEl.textContent = deteccion.materia;
        cursoDetectadoEl.textContent = deteccion.curso;
        poblarTabla(filas);
        panelResultado.hidden = false;

        if (window.eel && typeof window.eel.procesar_planilla_docente === 'function') {
            try {
                const respuestaEel = await window.eel.procesar_planilla_docente(archivo.name, textoCrudo)();
                if (respuestaEel && respuestaEel.materia) {
                    materiaDetectadaEl.textContent = respuestaEel.materia;
                }
                if (respuestaEel && respuestaEel.curso) {
                    cursoDetectadoEl.textContent = respuestaEel.curso;
                }
                if (respuestaEel && Array.isArray(respuestaEel.estudiantes)) {
                    poblarTabla(respuestaEel.estudiantes);
                }
            } catch (_e) {
                // Mantiene la lectura local si aún no está conectado el backend
            }
        }

        estadoCarga.textContent = `Planilla analizada: ${materiaDetectadaEl.textContent} · ${cursoDetectadoEl.textContent}.`;
    }

    botonSeleccionar.addEventListener('click', () => inputArchivo.click());
    inputArchivo.addEventListener('change', (e) => {
        const archivo = e.target.files && e.target.files[0];
        procesarArchivo(archivo);
    });

    zonaDrop.addEventListener('dragover', (e) => {
        e.preventDefault();
        zonaDrop.classList.add('is-dragover');
    });
    zonaDrop.addEventListener('dragleave', () => zonaDrop.classList.remove('is-dragover'));
    zonaDrop.addEventListener('drop', (e) => {
        e.preventDefault();
        zonaDrop.classList.remove('is-dragover');
        const archivo = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        procesarArchivo(archivo);
    });

    cuerpoTabla.addEventListener('input', (e) => {
        if (!e.target.matches('.grade-lapso-input')) return;
        const fila = e.target.closest('tr');
        if (fila) calcularDefinitivaFila(fila);
    });

    botonGuardar.addEventListener('click', () => {
        estadoCarga.hidden = false;
        estadoCarga.textContent = `Calificaciones listas para "${materiaDetectadaEl.textContent}" (${cursoDetectadoEl.textContent}). Guardado en PostgreSQL pendiente de conexión.`;
    });

    botonLimpiar.addEventListener('click', () => {
        inputArchivo.value = '';
        panelResultado.hidden = true;
        estadoCarga.hidden = true;
        cuerpoTabla.replaceChildren();
    });
}

function renderizarFiltrosAsignaciones(contenedor) {
    const filtroAno = contenedor.querySelector('#grade-assignment-year');
    const filtroSeccion = contenedor.querySelector('#grade-assignment-section');
    if (!filtroAno || !filtroSeccion) return;

    const anoAnterior = filtroAno.value;
    const seccionAnterior = filtroSeccion.value;
    filtroAno.replaceChildren(new Option('Todos los años', ''));
    filtroSeccion.replaceChildren(new Option('Todas las secciones', ''));

    [...new Set(cursosCatalogo.map(curso => curso.ano))]
        .sort((a, b) => a - b)
        .forEach(ano => filtroAno.add(new Option(etiquetaAnoEscolar(ano), String(ano))));
    [...new Set(cursosCatalogo.map(curso => curso.seccion))]
        .sort((a, b) => a.localeCompare(b, 'es'))
        .forEach(seccion => filtroSeccion.add(new Option(`Sección ${seccion}`, seccion)));

    if ([...filtroAno.options].some(opcion => opcion.value === anoAnterior)) filtroAno.value = anoAnterior;
    if ([...filtroSeccion.options].some(opcion => opcion.value === seccionAnterior)) filtroSeccion.value = seccionAnterior;
}

function renderizarAsignacionesCalificaciones(contenedor) {
    const lista = contenedor.querySelector('#grade-assigned-courses');
    if (!lista) return;

    const filtroAno = contenedor.querySelector('#grade-assignment-year').value;
    const filtroSeccion = contenedor.querySelector('#grade-assignment-section').value;
    const consulta = contenedor.querySelector('#grade-assignment-search').value
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const contador = contenedor.querySelector('#grade-assignment-count');
    const estadoVacio = contenedor.querySelector('#grade-assignment-empty');
    const materiasFiltradas = agruparCursosPorMateria(cursosCatalogo)
        .map(materia => ({
            ...materia,
            asignaciones: materia.asignaciones.filter(curso =>
                (!filtroAno || curso.ano === Number(filtroAno))
                && (!filtroSeccion || curso.seccion === filtroSeccion)
            )
        }))
        .filter(materia =>
            materia.asignaciones.length > 0
            && materia.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(consulta)
        );

    lista.replaceChildren();
    materiasFiltradas.forEach(materiaAsignada => {
        const bloqueMateria = document.createElement('section');
        bloqueMateria.className = 'course-subject-block';

        const encabezado = document.createElement('div');
        encabezado.className = 'course-subject-heading';
        encabezado.appendChild(crearIconoMateria(materiaAsignada.nombre));
        const titulo = document.createElement('h2');
        titulo.textContent = materiaAsignada.nombre;
        encabezado.appendChild(titulo);

        const ubicaciones = document.createElement('div');
        ubicaciones.className = 'course-location-list';
        materiaAsignada.asignaciones.forEach(curso => {
            const tarjeta = document.createElement('button');
            tarjeta.type = 'button';
            tarjeta.className = 'course-location-card grade-assignment-card';
            tarjeta.dataset.courseIndex = String(curso.indice);
            const seleccionado = cursoCalificacionesSeleccionado
                && cursoCalificacionesSeleccionado.ano === curso.ano
                && cursoCalificacionesSeleccionado.seccion === curso.seccion
                && cursoCalificacionesSeleccionado.materia === curso.materia;
            tarjeta.setAttribute('aria-pressed', String(Boolean(seleccionado)));
            tarjeta.setAttribute('aria-label', `Cargar calificaciones de ${materiaAsignada.nombre}, ${etiquetaAnoEscolar(curso.ano)}, Sección ${curso.seccion}`);

            const etiqueta = document.createElement('span');
            etiqueta.className = 'course-location-label';
            etiqueta.textContent = `${etiquetaAnoEscolar(curso.ano)} • Sección ${curso.seccion}`;

            const accion = document.createElement('span');
            accion.className = 'grade-assignment-action';
            accion.textContent = 'Cargar notas';
            tarjeta.append(etiqueta, accion);
            ubicaciones.appendChild(tarjeta);
        });

        bloqueMateria.append(encabezado, ubicaciones);
        lista.appendChild(bloqueMateria);
    });

    const asignacionesVisibles = materiasFiltradas.reduce(
        (total, materia) => total + materia.asignaciones.length,
        0
    );
    contador.textContent = `${materiasFiltradas.length} ${materiasFiltradas.length === 1 ? 'materia' : 'materias'} • ${asignacionesVisibles} ${asignacionesVisibles === 1 ? 'asignación' : 'asignaciones'}`;
    estadoVacio.textContent = cursosCatalogo.length
        ? 'No encontramos materias con esos filtros.'
        : 'No tienes materias asignadas para cargar calificaciones.';
    estadoVacio.hidden = asignacionesVisibles > 0;
    lista.setAttribute('aria-busy', 'false');
}

function actualizarCatalogoCursos(cursos) {
    if (!Array.isArray(cursos)) {
        throw new TypeError('El catálogo de cursos debe proporcionarse como una lista.');
    }

    cursosCatalogo = cursos.map(curso => {
        const ano = Number(curso && curso.ano);
        const seccion = String(curso && curso.seccion || '').trim();
        const materia = String(curso && curso.materia || '').trim();
        if (!Number.isInteger(ano) || ano < 1 || ano > 5 || !seccion || !materia) {
            throw new TypeError('Cada curso debe incluir un año entre 1 y 5, una sección y una materia.');
        }
        return {
            ano,
            seccion,
            materia,
            docente: curso.docente ? String(curso.docente).trim() : ''
        };
    });

    sincronizarSeccionesConCursos();
    renderizarResumenCursos();
    renderizarHorarioDemostracion();

    const moduloCursos = document.querySelector('#course-years');
    if (moduloCursos) {
        const contenedor = document.getElementById('main-content');
        contenedor.querySelector('#course-year-filter').replaceChildren(
            Object.assign(document.createElement('option'), { value: '', textContent: 'Todos los años' })
        );
        contenedor.querySelector('#course-section-filter').replaceChildren(
            Object.assign(document.createElement('option'), { value: '', textContent: 'Todas las secciones' })
        );
        moduloCursos.replaceChildren();
        renderizarCatalogoCursos(contenedor);
    }

    const listaCalificaciones = document.querySelector('#grade-assigned-courses');
    if (listaCalificaciones) {
        cursoCalificacionesSeleccionado = null;
        const contenedor = document.getElementById('main-content');
        contenedor.querySelector('#grade-student-search').value = '';
        renderizarFiltrosAsignaciones(contenedor);
        renderizarAsignacionesCalificaciones(contenedor);
        if (aplicarFiltroTablaCalificaciones) aplicarFiltroTablaCalificaciones();
    }
}

// ================= 4. CARGA DINÁMICA DE MÓDULOS DOCENTE =================
function seleccionarAccion(modulo, boton) {
    activarBoton(boton);
    const contenedor = document.getElementById('main-content');

    mostrarCargaModulo(contenedor, () => {
        let contenidoModulo = '';

        if (modulo === 'Ver Horarios') {
            contenidoModulo = `
                <section class="liceo-timetable-card" aria-label="Horario semanal por horas académicas">
                    <div class="liceo-timetable-header">
                        <div>
                            <h3>Horario semanal por bloques</h3>
                            <p>Franjas horarias de lunes a viernes listas para los registros de la tabla horario.</p>
                        </div>
                        <span class="schedule-demo-label">Horas académicas</span>
                    </div>
                    <div class="liceo-timetable-scroll" id="liceo-weekly-timetable"></div>
                </section>
            `;
        }

        // --- MÓDULO: SUBIR PLANILLA (Detección automática de materia y curso) ---
        if (modulo === 'Subir Planilla') {
            contenidoModulo = `
                <section class="sheet-upload-section" aria-label="Carga de planilla de calificaciones">
                    <div class="widget sheet-dropzone" id="sheet-dropzone">
                        <input type="file" id="sheet-file-input" accept=".xlsx,.xls,.csv" hidden>
                        <div class="sheet-dropzone-icon" aria-hidden="true">📄</div>
                        <h3>Sube tu planilla de evaluación</h3>
                        <p>No necesitas seleccionar sección ni materia previamente: el sistema leerá los campos asignados en la planilla para identificar la asignatura y el curso.</p>
                        <div class="sheet-dropzone-actions">
                            <button type="button" class="grade-save-button" id="sheet-select-file-btn">Seleccionar archivo de planilla</button>
                            <span class="sheet-formats-hint">Formatos admitidos: .xlsx, .xls, .csv</span>
                        </div>
                    </div>

                    <p id="sheet-upload-status" class="grade-save-status" role="status" aria-live="polite" hidden></p>

                    <div class="grade-record-panel sheet-parsed-panel" id="sheet-parsed-panel" hidden>
                        <div class="grade-record-toolbar">
                            <div class="sheet-detected-badges">
                                <span class="sheet-badge"><strong>Archivo:</strong> <span id="sheet-file-name">—</span></span>
                                <span class="sheet-badge sheet-badge--accent"><strong>Materia detectada:</strong> <span id="sheet-detected-subject">—</span></span>
                                <span class="sheet-badge sheet-badge--accent"><strong>Curso detectado:</strong> <span id="sheet-detected-course">—</span></span>
                            </div>
                            <div class="grade-record-actions">
                                <button type="button" class="grade-back-button" id="sheet-reset-btn">Limpiar</button>
                                <button type="button" class="grade-save-button" id="sheet-save-btn">Guardar calificaciones</button>
                            </div>
                        </div>
                        <div class="grade-table-scroll">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Cédula</th>
                                        <th>Estudiante</th>
                                        <th>Momento 1</th>
                                        <th>Momento 2</th>
                                        <th>Momento 3</th>
                                        <th>Definitiva</th>
                                    </tr>
                                </thead>
                                <tbody id="sheet-preview-tbody"></tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;
        }

        // --- MÓDULO: CARGAR CALIFICACIONES (Escala 1 a 20 por Momentos) ---
        if (modulo === 'Cargar Calificaciones') {
            contenidoModulo = `
                <section class="grade-selection-panel" id="grade-selection-view" aria-label="Listado de materias asignadas">
                    <div class="course-filter-panel" aria-label="Filtros de asignaturas asignadas">
                        <div class="course-filter-field">
                            <label for="grade-assignment-year">Año escolar</label>
                            <select id="grade-assignment-year">
                                <option value="">Todos los años</option>
                            </select>
                        </div>
                        <div class="course-filter-field">
                            <label for="grade-assignment-section">Sección</label>
                            <select id="grade-assignment-section">
                                <option value="">Todas las secciones</option>
                            </select>
                        </div>
                        <div class="course-filter-field">
                            <label for="grade-assignment-search">Buscar materia</label>
                            <input id="grade-assignment-search" type="search" placeholder="Ej. Matemática" autocomplete="off">
                        </div>
                        <button type="button" class="course-clear-button" id="grade-clear-assignment-filters">Limpiar filtros</button>
                    </div>
                    <div class="course-results-heading">
                        <span id="grade-assignment-count" role="status" aria-live="polite"></span>
                        <span>Materias agrupadas por asignación</span>
                    </div>
                    <div id="grade-assigned-courses" class="course-years" aria-busy="true"></div>
                    <p id="grade-assignment-empty" class="course-empty-state" hidden></p>
                </section>

                <section class="grade-record-panel" id="grades-table-panel" hidden aria-labelledby="grade-selected-subject">
                    <div class="grade-record-toolbar">
                        <button type="button" class="grade-back-button" id="grade-back-to-assignments">
                            <span aria-hidden="true">←</span>
                            Volver a materias
                        </button>
                        <div class="grade-record-actions">
                            <button type="button" class="grade-import-button">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 15v5h16v-5"/></svg>
                                Importar archivo de Excel
                            </button>
                            <button type="button" class="grade-save-button" id="grade-save-button">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-7h10v7"/></svg>
                                Guardar
                            </button>
                        </div>
                    </div>
                    <div class="grade-record-heading">
                        <div>
                            <span class="grade-record-eyebrow">CARGA DE CALIFICACIONES</span>
                            <h2 id="grade-selected-subject">Estudiantes</h2>
                            <p id="grade-selected-section-name"></p>
                        </div>
                        <div class="grade-record-tools">
                            <span class="grade-scale-badge">Escala de 1 a 20</span>
                            <label class="sr-only" for="grade-student-search">Buscar estudiante</label>
                            <input id="grade-student-search" class="admin-input grade-record-search" type="search" placeholder="Buscar estudiante..." autocomplete="off" disabled>
                        </div>
                    </div>
                    <p id="grade-save-status" class="grade-save-status" role="status" aria-live="polite" hidden></p>
                    <div class="grade-table-scroll">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Cédula</th>
                                    <th>Alumnos</th>
                                    <th>Momento 1</th>
                                    <th>Momento 2</th>
                                    <th>Momento 3</th>
                                    <th>Definitiva</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="7" class="grades-empty-state">Los estudiantes aparecerán aquí al conectar la base de datos.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            `;
        }

        // --- MÓDULO: CURSOS ---
        if (modulo === 'Cursos') {
            contenidoModulo = `
                <section class="course-catalog" aria-labelledby="course-catalog-title">
                    <div id="course-catalog-view">
                        <div class="course-filter-panel" aria-label="Filtros de cursos">
                            <div class="course-filter-field">
                                <label for="course-year-filter">Año escolar</label>
                                <select id="course-year-filter">
                                    <option value="">Todos los años</option>
                                </select>
                            </div>
                            <div class="course-filter-field">
                                <label for="course-section-filter">Sección</label>
                                <select id="course-section-filter">
                                    <option value="">Todas las secciones</option>
                                </select>
                            </div>
                            <div class="course-filter-field course-filter-search">
                                <label for="course-subject-search">Buscar materia</label>
                                <input id="course-subject-search" type="search" placeholder="Ej. Matemática" autocomplete="off">
                            </div>
                            <button type="button" class="course-clear-button" id="course-clear-filters">Limpiar filtros</button>
                        </div>

                        <div class="course-results-heading">
                            <span id="course-results-count" role="status" aria-live="polite"></span>
                            <span>Catálogo de asignaturas</span>
                        </div>
                        <div id="course-years" class="course-years" aria-busy="true"></div>
                        <p id="course-empty-state" class="course-empty-state" hidden>No encontramos asignaturas con esos filtros. Prueba con otra búsqueda.</p>
                    </div>

                    <section class="grade-record-panel course-students-panel" id="course-students-panel" hidden aria-labelledby="course-selected-subject">
                        <div class="grade-record-toolbar">
                            <button type="button" class="grade-back-button" id="course-back-to-catalog">
                                <span aria-hidden="true">←</span>
                                Volver a cursos
                            </button>
                        </div>
                        <div class="grade-record-heading">
                            <div>
                                <span class="grade-record-eyebrow">ESTUDIANTES DEL CURSO</span>
                                <h2 id="course-selected-subject">Estudiantes</h2>
                                <p id="course-selected-section-name"></p>
                            </div>
                            <div class="grade-record-tools">
                                <label class="sr-only" for="course-student-search">Buscar estudiante</label>
                                <input id="course-student-search" class="admin-input grade-record-search" type="search" placeholder="Buscar estudiante..." autocomplete="off">
                            </div>
                        </div>
                        <div class="course-results-heading">
                            <span id="course-student-count" role="status" aria-live="polite"></span>
                            <span>Listado de estudiantes</span>
                        </div>
                        <div class="grade-table-scroll">
                            <table class="admin-table course-students-table">
                                <thead>
                                    <tr>
                                        <th>Cédula</th>
                                        <th>Estudiante</th>
                                        <th>Última observación</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="course-students-table-body"></tbody>
                            </table>
                        </div>
                        <dialog class="course-student-dialog" id="course-student-detail-dialog" aria-labelledby="course-student-detail-title">
                            <div class="course-student-dialog-content">
                                <header class="course-student-profile">
                                    <div class="course-student-avatar" id="course-student-detail-avatar" aria-hidden="true">ED</div>
                                    <div class="course-student-profile-info">
                                        <div class="course-student-profile-title">
                                            <h2 id="course-student-detail-title"></h2>
                                            <span class="course-student-section-badge" id="course-student-detail-section"></span>
                                        </div>
                                        <div class="course-student-identity-details">
                                            <div>
                                                <span>Cédula de Identidad</span>
                                                <strong id="course-student-detail-id"></strong>
                                            </div>
                                            <div>
                                                <span>Fecha de Nacimiento</span>
                                                <strong id="course-student-detail-birth"></strong>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" class="course-student-dialog-close" id="course-student-detail-close" aria-label="Cerrar">×</button>
                                </header>
                                <section class="course-student-support" aria-labelledby="course-student-support-title">
                                    <span class="course-student-support-icon" aria-hidden="true">!</span>
                                    <div>
                                        <h3 id="course-student-support-title">Información de apoyo</h3>
                                        <p id="course-student-detail-support"></p>
                                    </div>
                                </section>
                                <div class="course-student-info-grid">
                                    <section aria-labelledby="course-student-subjects-title">
                                        <h3 id="course-student-subjects-title">Materias Asignadas</h3>
                                        <div class="course-student-subjects" id="course-student-detail-subjects"></div>
                                    </section>
                                    <section aria-labelledby="course-student-guardian-title">
                                        <h3 id="course-student-guardian-title">Datos del Representante</h3>
                                        <div class="course-student-representative-card">
                                            <div>
                                                <span>Nombre y Apellido</span>
                                                <strong id="course-student-detail-guardian"></strong>
                                            </div>
                                            <div>
                                                <span>Número de Teléfono</span>
                                                <strong id="course-student-detail-phone"></strong>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                                <section class="course-student-reports" aria-labelledby="course-student-reports-title">
                                    <h3 id="course-student-reports-title">Observaciones y Reportes</h3>
                                    <ol id="course-student-detail-reports"></ol>
                                </section>
                            </div>
                        </dialog>
                    </section>
                </section>
            `;
        }

        const configuracionEncabezado = {
            Cursos: {
                titulo: 'Cursos',
                subtitulo: 'Explora tus cursos',
                descripcion: 'Selecciona una sección para consultar los estudiantes inscritos en la materia.',
                icono: '../img/img_estudiante.png',
                tituloId: 'course-catalog-title'
            },
            'Cargar Calificaciones': {
                titulo: 'Cargar Calificaciones',
                subtitulo: 'Materias asignadas',
                descripcion: 'Selecciona una materia de tu carga académica para registrar las calificaciones.',
                icono: '../img/img_notas.png',
                marcaClase: 'grade-module-mark',
                bannerId: 'grade-module-banner'
            },
            'Ver Horarios': {
                titulo: 'Ver Horarios',
                subtitulo: 'Horarios de clase',
                descripcion: 'Consulta tus bloques horarios y aulas asignadas para la semana.',
                icono: '../img/img_horario.png',
                marcaClase: 'schedule-module-mark'
            },
            'Subir Planilla': {
                titulo: 'Subir Planilla',
                subtitulo: 'Carga directa desde archivo',
                descripcion: 'Sube la planilla sin elegir sección ni materia; el sistema detectará el campo asignado para identificar la materia y el curso.',
                icono: '../img/img_boletines.png',
                marcaClase: 'sheet-module-mark'
            }
        }[modulo];
        const encabezadoModulo = configuracionEncabezado
            ? `
                <div class="welcome-banner course-module-banner" ${configuracionEncabezado.bannerId ? `id="${configuracionEncabezado.bannerId}"` : ''}>
                    <div>
                        <span class="course-eyebrow">PERÍODO ACADÉMICO 2026–2027</span>
                        <h1>Módulo: ${configuracionEncabezado.titulo}</h1>
                        <h2 ${configuracionEncabezado.tituloId ? `id="${configuracionEncabezado.tituloId}"` : ''}>${configuracionEncabezado.subtitulo}</h2>
                        <p class="course-module-description">${configuracionEncabezado.descripcion}</p>
                    </div>
                    <span class="course-catalog-mark ${configuracionEncabezado.marcaClase || ''}" aria-hidden="true">
                        <img src="${configuracionEncabezado.icono}" alt="">
                    </span>
                </div>
            `
            : `
                <div class="welcome-banner" style="padding: 20px 30px;">
                    <h1>Módulo: ${modulo}</h1>
                </div>
            `;

        contenedor.innerHTML = `
            ${encabezadoModulo}
            ${contenidoModulo}
        `;

        if (modulo === 'Ver Horarios') {
            renderizarHorarioSemanalLiceo();
        }

        if (modulo === 'Subir Planilla') {
            renderizarModuloSubirPlanilla(contenedor);
        }

        if (modulo === 'Cursos') {
            renderizarCatalogoCursos(contenedor);
        }

        if (modulo === 'Cargar Calificaciones') {
            const tabla = contenedor.querySelector('.admin-table');
            const cuerpoTabla = tabla.querySelector('tbody');
            const panelTabla = contenedor.querySelector('#grades-table-panel');
            const vistaListado = contenedor.querySelector('#grade-selection-view');
            const encabezadoModuloNotas = contenedor.querySelector('#grade-module-banner');
            const listaAsignaciones = contenedor.querySelector('#grade-assigned-courses');
            const filtroAno = contenedor.querySelector('#grade-assignment-year');
            const filtroSeccion = contenedor.querySelector('#grade-assignment-section');
            const busquedaMateria = contenedor.querySelector('#grade-assignment-search');
            const filtroEstudiante = contenedor.querySelector('#grade-student-search');
            const tituloMateria = contenedor.querySelector('#grade-selected-subject');
            const nombreSeccion = contenedor.querySelector('#grade-selected-section-name');
            const estadoGuardado = contenedor.querySelector('#grade-save-status');

            function normalizar(texto) {
                return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            }

            cursoCalificacionesSeleccionado = null;
            renderizarFiltrosAsignaciones(contenedor);
            renderizarAsignacionesCalificaciones(contenedor);

            function filtrarFilas() {
                const filas = Array.from(cuerpoTabla.querySelectorAll('tr'))
                    .filter(f => !f.classList.contains('grades-no-results') && !f.querySelector('.grades-empty-state'));
                const consulta = normalizar(filtroEstudiante.value);
                const curso = cursoCalificacionesSeleccionado;
                const seccionVal = curso
                    ? normalizar(`${etiquetaAnoEscolar(curso.ano)} ${curso.seccion}`)
                    : '';
                const filaVacia = cuerpoTabla.querySelector('.grades-empty-state');
                let coincidencias = 0;

                vistaListado.hidden = Boolean(curso);
                panelTabla.hidden = !curso;
                encabezadoModuloNotas.hidden = Boolean(curso);
                tituloMateria.textContent = curso ? curso.materia : 'Estudiantes';
                nombreSeccion.textContent = curso
                    ? `${etiquetaAnoEscolar(curso.ano)} • Sección ${curso.seccion}`
                    : '';
                filtroEstudiante.disabled = !curso;
                if (!curso) estadoGuardado.hidden = true;

                filas.forEach(fila => {
                    const cedula = fila.cells[0] ? fila.cells[0].textContent : '';
                    const alumno = fila.cells[1] ? fila.cells[1].textContent : '';
                    const seccionFila = normalizar(fila.dataset.section || '');
                    const materiaFila = normalizar(fila.dataset.subject || '');
                    const coincideEst = normalizar(`${cedula} ${alumno}`).includes(consulta);
                    const coincideSec = seccionVal !== '' && seccionVal === seccionFila;
                    const coincideMateria = !materiaFila || materiaFila === normalizar(curso ? curso.materia : '');
                    const visible = coincideEst && coincideSec && coincideMateria;

                    fila.hidden = !visible;
                    if (visible) coincidencias++;
                });

                if (filas.length > 0 && filaVacia) {
                    filaVacia.closest('tr').remove();
                }

                let filaSinResultados = cuerpoTabla.querySelector('.grades-no-results');
                if (curso && filas.length > 0 && coincidencias === 0) {
                    if (!filaSinResultados) {
                        filaSinResultados = document.createElement('tr');
                        filaSinResultados.className = 'grades-no-results';
                        const celda = document.createElement('td');
                        celda.colSpan = 7;
                        celda.className = 'grades-empty-state';
                        celda.textContent = 'No se encontraron estudiantes con esos criterios.';
                        filaSinResultados.appendChild(celda);
                        cuerpoTabla.appendChild(filaSinResultados);
                    }
                } else if (filaSinResultados) {
                    filaSinResultados.remove();
                }
            }

            aplicarFiltroTablaCalificaciones = filtrarFilas;

            function actualizarListadoAsignaciones() {
                const curso = cursoCalificacionesSeleccionado;
                const consulta = normalizar(busquedaMateria.value);
                const sigueVisible = curso
                    && (!filtroAno.value || curso.ano === Number(filtroAno.value))
                    && (!filtroSeccion.value || curso.seccion === filtroSeccion.value)
                    && normalizar(curso.materia).includes(consulta);

                if (curso && !sigueVisible) {
                    cursoCalificacionesSeleccionado = null;
                    filtroEstudiante.value = '';
                    filtrarFilas();
                }
                renderizarAsignacionesCalificaciones(contenedor);
            }

            listaAsignaciones.addEventListener('click', event => {
                const tarjeta = event.target.closest('.grade-assignment-card');
                if (!tarjeta || !listaAsignaciones.contains(tarjeta)) return;
                const curso = cursosCatalogo[Number(tarjeta.dataset.courseIndex)];
                if (!curso) return;

                cursoCalificacionesSeleccionado = curso;
                listaAsignaciones.querySelectorAll('.grade-assignment-card').forEach(opcion => {
                    const cursoTarjeta = cursosCatalogo[Number(opcion.dataset.courseIndex)];
                    const seleccionado = cursoTarjeta
                        && cursoTarjeta.ano === curso.ano
                        && cursoTarjeta.seccion === curso.seccion
                        && cursoTarjeta.materia === curso.materia;
                    opcion.setAttribute('aria-pressed', String(Boolean(seleccionado)));
                });
                filtroEstudiante.value = '';
                filtrarFilas();
                panelTabla.querySelector('#grade-back-to-assignments').focus();
            });

            panelTabla.querySelector('#grade-back-to-assignments').addEventListener('click', () => {
                const indiceCurso = cursosCatalogo.indexOf(cursoCalificacionesSeleccionado);
                cursoCalificacionesSeleccionado = null;
                filtroEstudiante.value = '';
                filtrarFilas();
                renderizarAsignacionesCalificaciones(contenedor);
                const tarjetaAnterior = indiceCurso >= 0
                    ? listaAsignaciones.querySelector(`[data-course-index="${indiceCurso}"]`)
                    : null;
                if (tarjetaAnterior) tarjetaAnterior.focus();
            });

            panelTabla.querySelector('#grade-save-button').addEventListener('click', () => {
                const filasConNotas = Array.from(cuerpoTabla.querySelectorAll('tr'))
                    .filter(fila => !fila.hidden && fila.querySelector('.grade-lapso-input'));
                estadoGuardado.textContent = filasConNotas.length
                    ? 'El guardado todavía no está conectado al sistema.'
                    : 'No hay calificaciones cargadas para guardar.';
                estadoGuardado.hidden = false;
            });

            filtroAno.addEventListener('change', actualizarListadoAsignaciones);
            filtroSeccion.addEventListener('change', actualizarListadoAsignaciones);
            busquedaMateria.addEventListener('input', actualizarListadoAsignaciones);
            contenedor.querySelector('#grade-clear-assignment-filters').addEventListener('click', () => {
                filtroAno.value = '';
                filtroSeccion.value = '';
                busquedaMateria.value = '';
                actualizarListadoAsignaciones();
                filtroAno.focus();
            });
            filtroEstudiante.addEventListener('input', filtrarFilas);

            observadorTablaCalificaciones = new MutationObserver(filtrarFilas);
            observadorTablaCalificaciones.observe(cuerpoTabla, { childList: true });

            tabla.addEventListener('input', (e) => {
                if (!e.target.matches('.grade-lapso-input')) return;
                const fila = e.target.closest('tr');
                const inputs = Array.from(fila.querySelectorAll('.grade-lapso-input'));
                const notas = inputs.map(i => i.value.trim() === '' ? null : Number(i.value));
                const celdaDef = fila.querySelector('.grade-final');

                if (notas.length !== 3 || notas.some(n => n === null || !Number.isFinite(n))) {
                    celdaDef.textContent = '—';
                    return;
                }
                const promedio = notas.reduce((acc, val) => acc + val, 0) / 3;
                celdaDef.innerHTML = `<strong>${promedio.toFixed(2)}</strong>`;
            });
        }
    });
}

// ================= 5. CAJÓN DESPLEGABLE DE MANDEL.IA =================
function toggleChatIA() {
    const drawer = document.getElementById('ai-chat-drawer');
    const backdrop = document.getElementById('chat-backdrop');
    const isOpen = drawer.classList.contains('open');

    if (isOpen) {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
    } else {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        setTimeout(() => document.getElementById('chat-input').focus(), 200);
    }
}

function agregarBurbuja(htmlTexto, remitente) {
    const contenedor = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `msg-bubble ${remitente === 'user' ? 'msg-user' : 'msg-ai'}`;

    if (remitente === 'ai') {
        div.innerHTML = `<strong>MandellA</strong>${htmlTexto}`;
    } else {
        div.textContent = htmlTexto;
    }

    contenedor.appendChild(div);
    contenedor.scrollTop = contenedor.scrollHeight;
}

function enviarMensaje(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;

    agregarBurbuja(texto, 'user');
    input.value = '';

    setTimeout(() => {
        agregarBurbuja(`Procesando consulta en la base de datos local sobre: "<em>${texto}</em>"...`, 'ai');
    }, 450);
}

// ================= 6. EVENTOS GLOBALES =================
document.getElementById('actions-nav').addEventListener('click', (event) => {
    const boton = event.target.closest('.nav-btn');
    if (!boton) return;

    if (boton.dataset.action === 'home') {
        mostrarInicio(boton);
    } else if (boton.dataset.module) {
        seleccionarAccion(boton.dataset.module, boton);
    }
});

document.getElementById('main-content').addEventListener('click', (event) => {
    const botonRapido = event.target.closest('[data-module]');
    if (!botonRapido) return;

    const nombreModulo = botonRapido.dataset.module;
    const botonLateral = document.querySelector(`.nav-btn[data-module="${nombreModulo}"]`);
    seleccionarAccion(nombreModulo, botonLateral);
});

document.querySelectorAll('[data-chat-toggle]').forEach(el => {
    el.addEventListener('click', toggleChatIA);
});

document.getElementById('chat-form').addEventListener('submit', enviarMensaje);

document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.getElementById('chat-input').value = chip.dataset.suggestion;
        enviarMensaje(new Event('submit'));
    });
});

document.addEventListener('click', (event) => {
    const selectorCedula = document.getElementById('student-id-type-picker');
    if (selectorCedula && !selectorCedula.contains(event.target)) {
        const btn = document.getElementById('student-id-type');
        const menu = document.getElementById('student-id-type-menu');
        if (menu) menu.hidden = true;
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const drawer = document.getElementById('ai-chat-drawer');
        if (drawer && drawer.classList.contains('open')) {
            toggleChatIA();
        }
        const menuCed = document.getElementById('student-id-type-menu');
        const btnCed = document.getElementById('student-id-type');
        if (menuCed && !menuCed.hidden) {
            menuCed.hidden = true;
            btnCed.setAttribute('aria-expanded', 'false');
        }
    }
});