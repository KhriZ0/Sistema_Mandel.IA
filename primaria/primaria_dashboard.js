// ================= ESTADO GLOBAL Y VARIABLES DE CONTROL =================
const parametrosAccesoPrimaria = new URLSearchParams(window.location.search);
const usuarioSesion = sessionStorage.getItem('mandel.usuario') || parametrosAccesoPrimaria.get('usuario') || 'Docente';
const cargoSesion = sessionStorage.getItem('mandel.cargo') || parametrosAccesoPrimaria.get('cargo') || 'Docente • Primaria';

document.querySelectorAll('[data-session-user]').forEach(elemento => {
    elemento.textContent = usuarioSesion;
});
document.querySelectorAll('[data-session-role]').forEach(elemento => {
    elemento.textContent = cargoSesion;
});

let temporizadorCargaModulo = null;
let seccionesAsignadasDocente = [];
let seccionesPrimaria = [];
let horarioPrimaria = [];
let alumnosDescriptivos = [];

function etiquetaGradoEscolar(grado) {
    const nombres = { 1: '1er', 2: '2do', 3: '3er', 4: '4to', 5: '5to', 6: '6to' };
    return `${nombres[Number(grado)] || grado} Grado`;
}

function normalizarTexto(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function sincronizarSeccionesConCursos() {
    seccionesAsignadasDocente = [...new Set(seccionesPrimaria.map(seccion =>
        `${etiquetaGradoEscolar(seccion.grado)} • Sección ${seccion.seccion}`
    ))];
}

// Funciones expuestas/listas para poblar desde Python (PostgreSQL vía Eel)
function actualizarSeccionesPrimaria(secciones) {
    if (!Array.isArray(secciones)) {
        throw new TypeError('Las secciones de primaria deben proporcionarse como una lista.');
    }
    seccionesPrimaria = secciones.map(item => ({
        grado: Number(item.grado),
        seccion: String(item.seccion || '').trim(),
        maestroGuia: String(item.maestroGuia || item.maestro_guia || 'Por asignar').trim(),
        aula: String(item.aula || 'Por asignar').trim(),
        alumnos: Number(item.alumnos || 0)
    }));
    sincronizarSeccionesConCursos();
    renderizarResumenSecciones();
}

function actualizarHorarioPrimaria(bloques) {
    if (!Array.isArray(bloques)) {
        throw new TypeError('El horario de primaria debe proporcionarse como una lista.');
    }
    horarioPrimaria = bloques.map(item => ({
        dia: String(item.dia || '').trim(),
        bloque: String(item.bloque || '').trim(),
        grado: Number(item.grado),
        seccion: String(item.seccion || '').trim(),
        maestroGuia: String(item.maestroGuia || item.maestro_guia || 'Por asignar').trim(),
        aula: String(item.aula || 'Por asignar').trim(),
        actividad: String(item.actividad || '').trim()
    }));
    renderizarHorarioPrimaria();
}

function actualizarAlumnosDescriptivos(alumnos) {
    if (!Array.isArray(alumnos)) {
        throw new TypeError('Los alumnos descriptivos deben proporcionarse como una lista.');
    }
    alumnosDescriptivos = alumnos.map(item => ({
        cedula: String(item.cedula || '').trim(),
        nombre: String(item.nombre || '').trim(),
        grado: Number(item.grado),
        seccion: String(item.seccion || '').trim(),
        lapso: String(item.lapso || 'Lapso 1').trim(),
        literal: String(item.literal || 'B').trim(),
        estadoAvance: String(item.estadoAvance || item.estado_avance || 'En proceso').trim(),
        observacion: String(item.observacion || '').trim()
    }));
}

function actualizarSeccionesAsignadas(secciones) {
    if (!Array.isArray(secciones)) {
        throw new TypeError('Las secciones asignadas deben proporcionarse como una lista.');
    }
    seccionesAsignadasDocente = secciones;
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
                    <h2>Gestión de Educación Básica (1ro a 6to Grado)</h2>
                    <p class="course-module-description">Consulta tus secciones asignadas, registra boletines descriptivos y revisa el horario del aula.</p>
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
                            <span>Lapso / Momento en curso</span>
                            <strong data-academic-term>I Lapso</strong>
                        </div>
                        <div class="academic-period-meta-item">
                            <span>Código DEA del plantel</span>
                            <strong>OD05361512</strong>
                        </div>
                    </div>
                </section>
                <div class="widget actions">
                    <h3>Accesos directos</h3>
                    <div class="action-buttons action-buttons--shortcuts primaria-shortcuts-grid">
                        <button type="button" class="shortcut-button shortcut-button--grades" data-module="Boletín Descriptivo">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="../img/img_notas.png" alt="">
                            </span>
                            <span>Boletín Descriptivo</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--schedule" data-module="Ver Horarios">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="../img/img_horario.png" alt="">
                            </span>
                            <span>Ver Horario</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--courses" data-module="Secciones">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="../img/img_estudiante.png" alt="">
                            </span>
                            <span>Secciones</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="charts-row home-charts-row">
                <div class="chart-box assigned-courses-box">
                    <div class="assigned-courses-heading">
                        <div>
                            <h3>Secciones de Aula Asignadas</h3>
                            <p id="assigned-courses-summary" aria-live="polite"></p>
                        </div>
                        <span class="assigned-courses-count" id="assigned-courses-count"></span>
                    </div>
                    <div class="assigned-courses-list" id="assigned-courses-list" role="list"></div>
                </div>
                <section class="chart-box schedule-box" aria-labelledby="schedule-title">
                    <div class="schedule-heading">
                        <div>
                            <h3 id="schedule-title">Horario Semanal</h3>
                            <p>Grado, sección, Maestro Guía, aula y bloque de actividad.</p>
                        </div>
                    </div>
                    <div class="schedule-week" id="demo-schedule" aria-label="Horario semanal de Primaria"></div>
                </section>
            </div>
        `;
        renderizarResumenSecciones();
        renderizarHorarioPrimaria();
    });
}

function renderizarResumenSecciones() {
    const lista = document.getElementById('assigned-courses-list');
    const resumen = document.getElementById('assigned-courses-summary');
    const contador = document.getElementById('assigned-courses-count');
    if (!lista || !resumen || !contador) return;

    lista.replaceChildren();
    const totalAlumnos = seccionesPrimaria.reduce((total, item) => total + Number(item.alumnos || 0), 0);
    resumen.textContent = `${seccionesPrimaria.length} ${seccionesPrimaria.length === 1 ? 'sección asignada' : 'secciones asignadas'}`;
    contador.textContent = `${totalAlumnos} ${totalAlumnos === 1 ? 'alumno' : 'alumnos'}`;

    if (!seccionesPrimaria.length) {
        const vacio = document.createElement('p');
        vacio.className = 'assigned-courses-empty';
        vacio.textContent = 'No hay secciones de Primaria asignadas desde Administración.';
        lista.appendChild(vacio);
        return;
    }

    seccionesPrimaria.forEach(item => {
        const grupo = document.createElement('section');
        grupo.className = 'assigned-course-group';
        grupo.setAttribute('role', 'listitem');
        grupo.innerHTML = `
            <div class="assigned-course-group-heading">
                <h4 class="assigned-course-name">${etiquetaGradoEscolar(item.grado)} • Sección ${item.seccion}</h4>
            </div>
            <div class="assigned-course-locations">
                <span class="assigned-course-section">Maestro Guía: ${item.maestroGuia}</span>
                <span class="assigned-course-section">${item.aula} • ${item.alumnos} alumnos</span>
            </div>
        `;
        lista.appendChild(grupo);
    });
}

function renderizarHorarioPrimaria() {
    const contenedor = document.getElementById('demo-schedule');
    if (!contenedor) return;

    contenedor.replaceChildren();

    if (!horarioPrimaria.length) {
        const vacio = document.createElement('p');
        vacio.className = 'schedule-empty';
        vacio.textContent = 'No hay bloques horarios asignados para Primaria.';
        contenedor.appendChild(vacio);
        return;
    }

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    dias.forEach(dia => {
        const columna = document.createElement('section');
        columna.className = 'schedule-day';
        columna.setAttribute('aria-label', dia);

        const titulo = document.createElement('h4');
        titulo.textContent = dia;
        columna.appendChild(titulo);

        const bloquesDia = horarioPrimaria.filter(item => normalizarTexto(item.dia) === normalizarTexto(dia));
        if (!bloquesDia.length) {
            const sinBloque = document.createElement('p');
            sinBloque.className = 'course-module-description';
            sinBloque.textContent = 'Sin bloques asignados';
            columna.appendChild(sinBloque);
        } else {
            bloquesDia.forEach(item => {
                const bloque = document.createElement('article');
                bloque.className = 'schedule-class';
                bloque.innerHTML = `
                    <span class="schedule-time">${item.bloque}</span>
                    <h5>${etiquetaGradoEscolar(item.grado)} • Sección ${item.seccion}</h5>
                    <span class="schedule-section">Maestro Guía: ${item.maestroGuia}</span>
                    <span class="schedule-section">${item.aula}</span>
                    <p class="course-module-description">${item.actividad}</p>
                `;
                columna.appendChild(bloque);
            });
        }

        contenedor.appendChild(columna);
    });
}

// ================= 3. CARGA DINÁMICA DE MÓDULOS DOCENTE =================
function seleccionarAccion(modulo, boton) {
    activarBoton(boton);
    const contenedor = document.getElementById('main-content');

    mostrarCargaModulo(contenedor, () => {
        let contenidoModulo = '';

        if (modulo === 'Boletín Descriptivo') {
            const opcionesGrado = [...new Set(seccionesPrimaria.map(item => item.grado))].sort((a, b) => a - b);
            const opcionesSeccion = [...new Set(seccionesPrimaria.map(item => item.seccion))].sort((a, b) => a.localeCompare(b, 'es'));

            contenidoModulo = `
                <section class="grade-selection-panel" aria-label="Boletín descriptivo por sección">
                    <div class="course-filter-panel">
                        <div class="course-filter-field">
                            <label for="grade-assignment-year">Grado</label>
                            <select id="grade-assignment-year">
                                <option value="">Todos los grados</option>
                                ${opcionesGrado.map(grado => `<option value="${grado}">${etiquetaGradoEscolar(grado)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="course-filter-field">
                            <label for="grade-assignment-section">Sección</label>
                            <select id="grade-assignment-section">
                                <option value="">Todas las secciones</option>
                                ${opcionesSeccion.map(seccion => `<option value="${seccion}">Sección ${seccion}</option>`).join('')}
                            </select>
                        </div>
                        <div class="course-filter-field">
                            <label for="grade-assignment-search">Buscar alumno</label>
                            <input id="grade-assignment-search" type="search" placeholder="Nombre o cédula" autocomplete="off">
                        </div>
                        <button type="button" class="course-clear-button" id="grade-clear-assignment-filters">Limpiar filtros</button>
                    </div>
                    <div class="course-results-heading">
                        <span id="grade-assignment-count" role="status" aria-live="polite"></span>
                        <span>Secciones de Educación Básica</span>
                    </div>
                    <div id="grade-assigned-courses" class="course-years" aria-busy="false"></div>
                </section>

                <section class="grade-record-panel" id="grades-table-panel" hidden>
                    <div class="grade-record-toolbar">
                        <button type="button" class="grade-back-button" id="grade-back-to-assignments">← Volver a secciones</button>
                        <button type="button" class="grade-save-button" id="grade-save-button">Guardar registro cualitativo</button>
                    </div>
                    <div class="grade-record-heading">
                        <div>
                            <span class="grade-record-eyebrow">BOLETÍN DESCRIPTIVO</span>
                            <h2 id="grade-selected-subject">Alumnos</h2>
                            <p id="grade-selected-section-name"></p>
                        </div>
                        <div class="grade-record-tools">
                            <span class="grade-scale-badge">Escala cualitativa A–E</span>
                        </div>
                    </div>
                    <p id="grade-save-status" class="grade-save-status" role="status" aria-live="polite" hidden></p>
                    <div class="grade-table-scroll">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Cédula</th>
                                    <th>Alumno</th>
                                    <th>Lapso</th>
                                    <th>Literal</th>
                                    <th>Estado de avance</th>
                                    <th>Observación descriptiva</th>
                                </tr>
                            </thead>
                            <tbody id="descriptive-grades-body"></tbody>
                        </table>
                    </div>
                </section>
            `;
        }

        if (modulo === 'Secciones') {
            const grados = [...new Set(seccionesPrimaria.map(item => item.grado))].sort((a, b) => a - b);
            const secciones = [...new Set(seccionesPrimaria.map(item => item.seccion))].sort((a, b) => a.localeCompare(b, 'es'));
            const tarjetas = seccionesPrimaria.map((item, indice) => `
                <article class="course-location-card" data-seccion-index="${indice}">
                    <span class="course-location-label">${etiquetaGradoEscolar(item.grado)} • Sección ${item.seccion}</span>
                    <div class="course-teacher">
                        <span class="course-teacher-avatar">${item.maestroGuia.charAt(0).toLocaleUpperCase('es')}</span>
                        <span>Maestro Guía: ${item.maestroGuia}</span>
                    </div>
                    <div class="assigned-course-locations">
                        <span class="assigned-course-section">Aula: ${item.aula}</span>
                        <span class="assigned-course-section">${item.alumnos} alumnos</span>
                    </div>
                </article>
            `).join('');

            contenidoModulo = `
                <section class="course-catalog">
                    <div class="course-filter-panel">
                        <div class="course-filter-field">
                            <label for="section-grade-filter">Grado</label>
                            <select id="section-grade-filter">
                                <option value="">Todos los grados</option>
                                ${grados.map(grado => `<option value="${grado}">${etiquetaGradoEscolar(grado)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="course-filter-field">
                            <label for="section-name-filter">Sección</label>
                            <select id="section-name-filter">
                                <option value="">Todas las secciones</option>
                                ${secciones.map(seccion => `<option value="${seccion}">Sección ${seccion}</option>`).join('')}
                            </select>
                        </div>
                        <div class="course-filter-field">
                            <label for="section-teacher-search">Maestro Guía</label>
                            <input id="section-teacher-search" type="search" placeholder="Buscar docente de aula" autocomplete="off">
                        </div>
                        <button type="button" class="course-clear-button" id="section-clear-filters">Limpiar filtros</button>
                    </div>
                    <div class="course-results-heading">
                        <span id="section-results-count"></span>
                        <span>Secciones de aula</span>
                    </div>
                    <div class="course-years" id="primary-sections-list">${tarjetas}</div>
                </section>
            `;
        }

        if (modulo === 'Ver Horarios') {
            contenidoModulo = `
                <section class="chart-box schedule-box">
                    <div class="schedule-heading">
                        <div>
                            <h3>Horario semanal</h3>
                            <p>Actividades y organización del aula por grado y sección.</p>
                        </div>
                    </div>
                    <div class="schedule-week" id="demo-schedule"></div>
                </section>
            `;
        }

        const configuracionEncabezado = {
            Secciones: {
                titulo: 'Secciones',
                subtitulo: 'Secciones de Educación Básica',
                descripcion: 'Consulta los grados, secciones, maestros guías y aulas asignadas.',
                icono: '../img/img_estudiante.png',
                marcaClase: ''
            },
            'Boletín Descriptivo': {
                titulo: 'Boletín Descriptivo',
                subtitulo: 'Registro cualitativo por sección',
                descripcion: 'Selecciona una sección para revisar y registrar literales y observaciones descriptivas.',
                icono: '../img/img_notas.png',
                marcaClase: 'grade-module-mark',
                bannerId: 'grade-module-banner'
            },
            'Ver Horarios': {
                titulo: 'Ver Horarios',
                subtitulo: 'Horario semanal del aula',
                descripcion: 'Consulta los bloques de actividad asignados para la semana.',
                icono: '../img/img_horario.png',
                marcaClase: 'schedule-module-mark'
            }
        }[modulo] || {
            titulo: modulo,
            subtitulo: 'Educación Básica',
            descripcion: 'Gestión de secciones y registro cualitativo descriptivo.',
            icono: '../img/img_notas.png',
            marcaClase: ''
        };

        contenedor.innerHTML = `
            <div class="welcome-banner course-module-banner" ${configuracionEncabezado.bannerId ? `id="${configuracionEncabezado.bannerId}"` : ''}>
                <div>
                    <span class="course-eyebrow">PERÍODO ACADÉMICO 2026–2027</span>
                    <h1>Módulo: ${configuracionEncabezado.titulo}</h1>
                    <h2>${configuracionEncabezado.subtitulo}</h2>
                    <p class="course-module-description">${configuracionEncabezado.descripcion}</p>
                </div>
                <span class="course-catalog-mark ${configuracionEncabezado.marcaClase}" aria-hidden="true">
                    <img src="${configuracionEncabezado.icono}" alt="">
                </span>
            </div>
            ${contenidoModulo}
        `;

        if (modulo === 'Ver Horarios') {
            renderizarHorarioPrimaria();
        }

        if (modulo === 'Secciones') {
            const lista = contenedor.querySelector('#primary-sections-list');
            const grado = contenedor.querySelector('#section-grade-filter');
            const seccion = contenedor.querySelector('#section-name-filter');
            const maestro = contenedor.querySelector('#section-teacher-search');
            const contador = contenedor.querySelector('#section-results-count');

            const filtrar = () => {
                let visibles = 0;
                lista.querySelectorAll('[data-seccion-index]').forEach(tarjeta => {
                    const item = seccionesPrimaria[Number(tarjeta.dataset.seccionIndex)];
                    const visible = item
                        && (!grado.value || item.grado === Number(grado.value))
                        && (!seccion.value || item.seccion === seccion.value)
                        && normalizarTexto(item.maestroGuia).includes(normalizarTexto(maestro.value));
                    tarjeta.hidden = !visible;
                    if (visible) visibles++;
                });
                contador.textContent = `${visibles} ${visibles === 1 ? 'sección' : 'secciones'} de aula`;
            };

            grado.addEventListener('change', filtrar);
            seccion.addEventListener('change', filtrar);
            maestro.addEventListener('input', filtrar);
            contenedor.querySelector('#section-clear-filters').addEventListener('click', () => {
                grado.value = '';
                seccion.value = '';
                maestro.value = '';
                filtrar();
            });
            filtrar();
        }

        if (modulo === 'Boletín Descriptivo') {
            const listado = contenedor.querySelector('#grade-assigned-courses');
            const panel = contenedor.querySelector('#grades-table-panel');
            const gradoFiltro = contenedor.querySelector('#grade-assignment-year');
            const seccionFiltro = contenedor.querySelector('#grade-assignment-section');
            const alumnoFiltro = contenedor.querySelector('#grade-assignment-search');
            const contador = contenedor.querySelector('#grade-assignment-count');
            const cuerpo = contenedor.querySelector('#descriptive-grades-body');
            let seleccionActual = null;

            const renderizarSecciones = () => {
                const filtradas = seccionesPrimaria.filter(item =>
                    (!gradoFiltro.value || item.grado === Number(gradoFiltro.value))
                    && (!seccionFiltro.value || item.seccion === seccionFiltro.value)
                );
                contador.textContent = `${filtradas.length} ${filtradas.length === 1 ? 'sección' : 'secciones'}`;
                listado.innerHTML = filtradas.map(item => `
                    <button type="button" class="course-location-card grade-assignment-card" data-grado="${item.grado}" data-seccion="${item.seccion}">
                        <span class="course-location-label">${etiquetaGradoEscolar(item.grado)} • Sección ${item.seccion}</span>
                        <span class="grade-assignment-action">Abrir boletín descriptivo</span>
                        <span class="course-teacher">Maestro Guía: ${item.maestroGuia}</span>
                    </button>
                `).join('') || '<p class="course-empty-state">No hay secciones asignadas para este filtro.</p>';
            };

            const renderizarAlumnos = (grado, seccion) => {
                seleccionActual = { grado, seccion };
                const aula = seccionesPrimaria.find(item => item.grado === grado && item.seccion === seccion);
                const consulta = normalizarTexto(alumnoFiltro.value);
                const alumnos = alumnosDescriptivos.filter(item =>
                    item.grado === grado
                    && item.seccion === seccion
                    && (!consulta || normalizarTexto(`${item.cedula} ${item.nombre}`).includes(consulta))
                );
                contenedor.querySelector('#grade-selected-subject').textContent = `${etiquetaGradoEscolar(grado)} • Sección ${seccion}`;
                contenedor.querySelector('#grade-selected-section-name').textContent = aula
                    ? `Maestro Guía: ${aula.maestroGuia} • ${aula.aula}`
                    : '';
                cuerpo.innerHTML = alumnos.map(alumno => `
                    <tr>
                        <td>${alumno.cedula}</td>
                        <td>${alumno.nombre}</td>
                        <td>
                            <select>
                                <option ${alumno.lapso === 'Lapso 1' ? 'selected' : ''}>Lapso 1</option>
                                <option ${alumno.lapso === 'Lapso 2' ? 'selected' : ''}>Lapso 2</option>
                                <option ${alumno.lapso === 'Lapso 3' ? 'selected' : ''}>Lapso 3</option>
                            </select>
                        </td>
                        <td>
                            <select>
                                ${['A', 'B', 'C', 'D', 'E'].map(literal => `<option ${literal === alumno.literal ? 'selected' : ''}>${literal}</option>`).join('')}
                            </select>
                        </td>
                        <td>
                            <select>
                                ${['Consolidado', 'En proceso', 'Iniciado', 'En refuerzo pedagógico'].map(estado => `<option ${estado === alumno.estadoAvance ? 'selected' : ''}>${estado}</option>`).join('')}
                            </select>
                        </td>
                        <td>
                            <input class="admin-input" value="${alumno.observacion}" aria-label="Observación descriptiva">
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="6" class="grades-empty-state">Los alumnos aparecerán aquí al sincronizar con la base de datos.</td></tr>';
                listado.parentElement.hidden = true;
                panel.hidden = false;
            };

            listado.addEventListener('click', event => {
                const tarjeta = event.target.closest('[data-grado]');
                if (tarjeta) renderizarAlumnos(Number(tarjeta.dataset.grado), tarjeta.dataset.seccion);
            });

            gradoFiltro.addEventListener('change', renderizarSecciones);
            seccionFiltro.addEventListener('change', renderizarSecciones);
            alumnoFiltro.addEventListener('input', () => {
                if (!panel.hidden && seleccionActual) {
                    renderizarAlumnos(seleccionActual.grado, seleccionActual.seccion);
                }
            });

            contenedor.querySelector('#grade-clear-assignment-filters').addEventListener('click', () => {
                gradoFiltro.value = '';
                seccionFiltro.value = '';
                alumnoFiltro.value = '';
                renderizarSecciones();
            });

            contenedor.querySelector('#grade-back-to-assignments').addEventListener('click', () => {
                seleccionActual = null;
                panel.hidden = true;
                listado.parentElement.hidden = false;
                renderizarSecciones();
            });

            contenedor.querySelector('#grade-save-button').addEventListener('click', () => {
                const estado = contenedor.querySelector('#grade-save-status');
                estado.textContent = 'El registro cualitativo está listo para guardarse en PostgreSQL.';
                estado.hidden = false;
            });

            renderizarSecciones();
        }
    });
}

// ================= 4. CAJÓN DESPLEGABLE DE MANDEL.IA =================
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

// ================= 5. EVENTOS GLOBALES =================
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

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const drawer = document.getElementById('ai-chat-drawer');
        if (drawer && drawer.classList.contains('open')) {
            toggleChatIA();
        }
    }
});

// ================= 6. INICIALIZACIÓN =================
sincronizarSeccionesConCursos();
renderizarResumenSecciones();
renderizarHorarioPrimaria();