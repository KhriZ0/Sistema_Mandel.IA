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
let seccionesPrimaria = [{
    grado: 1,
    seccion: 'A',
    maestroGuia: 'Por asignar',
    aula: 'Por asignar',
    alumnos: 1
}];
let horarioPrimaria = [];
let alumnosDescriptivos = [{
    numeroLista: '1',
    cedula: 'DEMO-001',
    nombre: 'Alumno de ejemplo',
    grado: 1,
    seccion: 'A',
    lapso: 'Lapso 1',
    momento: 1,
    fechaDesde: '',
    fechaHasta: '',
    asistencia: 0,
    inasistencias: 0,
    justificadas: 0,
    literal: 'B',
    estadoAvance: 'En proceso',
    esEjemplo: true,
    observacion: 'Participa con interés y demuestra avances en las actividades.',
    historial: [
        {
            periodo: '2025 - 2026',
            lapso: 2,
            momento: 3,
            fechaDesde: '2026-01-12',
            fechaHasta: '2026-04-10',
            asistencia: 53,
            inasistencias: 2,
            justificadas: 1,
            observacion: 'Consolida aprendizajes y participa en actividades grupales.',
            fechaRegistro: '10/04/2026'
        },
        {
            periodo: '2025 - 2026',
            lapso: 1,
            momento: 2,
            fechaDesde: '2025-09-15',
            fechaHasta: '2025-12-12',
            asistencia: 55,
            inasistencias: 3,
            justificadas: 2,
            observacion: 'Muestra interés y avances en las actividades del aula.',
            fechaRegistro: '12/12/2025'
        }
    ]
}];

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

function escaparHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function crearPdfVistaPrevia(alumno, numeroLista, datosBoletin) {
    const textoPlano = texto => String(texto ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '');
    const escaparTextoPdf = texto => textoPlano(texto)
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
    const envolverTexto = texto => {
        const palabras = textoPlano(texto).split(/\s+/).filter(Boolean);
        const lineas = [];
        let linea = '';

        palabras.forEach(palabra => {
            const candidata = linea ? `${linea} ${palabra}` : palabra;
            if (candidata.length > 78 && linea) {
                lineas.push(linea);
                linea = palabra;
            } else {
                linea = candidata;
            }
        });
        if (linea) lineas.push(linea);
        return lineas;
    };

    const lineasObservacion = envolverTexto(datosBoletin.observacion);
    const lineas = [
        'VISTA PREVIA - BOLETIN DESCRIPTIVO',
        'Formato institucional final pendiente de diseno.',
        '',
        `Numero de lista: ${numeroLista}`,
        `Cedula escolar: ${alumno.cedula}`,
        `Nombre del alumno: ${alumno.nombre}`,
        `Grado y seccion: ${etiquetaGradoEscolar(alumno.grado)} - ${alumno.seccion}`,
        `Momento: ${datosBoletin.momento}`,
        `Fecha desde: ${datosBoletin.fechaDesde || 'No indicada'}`,
        `Fecha hasta: ${datosBoletin.fechaHasta || 'No indicada'}`,
        `Asistencia: ${datosBoletin.asistencia}`,
        `Inasistencias: ${datosBoletin.inasistencias}`,
        `Justificadas: ${datosBoletin.justificadas}`,
        '',
        'Informacion de la actuacion integral del estudiante:',
        ...(lineasObservacion.length ? lineasObservacion : ['Sin observaciones.'])
    ];
    const comandos = ['BT'];
    lineas.forEach((linea, indice) => {
        const tamano = indice === 0 ? 18 : 12;
        const y = 742 - indice * 24;
        comandos.push(`/F1 ${tamano} Tf 1 0 0 1 50 ${y} Tm (${escaparTextoPdf(linea)}) Tj`);
    });
    comandos.push('ET');

    const contenido = comandos.join('\n');
    const objetos = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objetos.forEach((objeto, indice) => {
        offsets.push(pdf.length);
        pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
    });

    const posicionXref = pdf.length;
    pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${posicionXref}\n%%EOF`;
    return pdf;
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
        numeroLista: String(item.numeroLista || item.numero_lista || '').trim(),
        cedula: String(item.cedula || '').trim(),
        nombre: String(item.nombre || '').trim(),
        grado: Number(item.grado),
        seccion: String(item.seccion || '').trim(),
        esEjemplo: false,
        lapso: String(item.lapso || 'Lapso 1').trim(),
        momento: Number(item.momento || 1),
        fechaDesde: String(item.fechaDesde || item.fecha_desde || '').trim(),
        fechaHasta: String(item.fechaHasta || item.fecha_hasta || '').trim(),
        asistencia: Number(item.asistencia || 0),
        inasistencias: Number(item.inasistencias || 0),
        justificadas: Number(item.justificadas || 0),
        literal: ['A', 'B', 'C', 'D', 'E', 'F'].includes(String(item.literal || 'B').trim().toUpperCase())
            ? String(item.literal).trim().toUpperCase()
            : 'B',
        estadoAvance: String(item.estadoAvance || item.estado_avance || 'En proceso').trim(),
        observacion: String(item.observacion || '').trim(),
        historial: Array.isArray(item.historial) ? item.historial.map(registro => ({
            periodo: String(registro.periodo || '').trim(),
            lapso: Number(registro.lapso || 0),
            momento: Number(registro.momento || 1),
            fechaDesde: String(registro.fechaDesde || registro.fecha_desde || '').trim(),
            fechaHasta: String(registro.fechaHasta || registro.fecha_hasta || '').trim(),
            asistencia: Number(registro.asistencia || 0),
            inasistencias: Number(registro.inasistencias || 0),
            justificadas: Number(registro.justificadas || 0),
            observacion: String(registro.observacion || '').trim(),
            fechaRegistro: String(registro.fechaRegistro || '').trim()
        })) : []
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
            contenidoModulo = `
                <section class="grade-record-panel" id="grades-table-panel">
                    <div class="grade-record-toolbar">
                        <div class="course-filter-field">
                            <label for="grade-table-student-search">Buscar alumno</label>
                            <div class="grade-search-actions">
                                <input id="grade-table-student-search" class="admin-input grade-record-search" type="search" placeholder="Nombre o cédula escolar" autocomplete="off">
                                <button type="button" class="course-clear-button" id="grade-clear-assignment-filters">Limpiar filtros</button>
                            </div>
                        </div>
                    </div>
                    <div class="grade-record-heading">
                        <div>
                            <span class="grade-record-eyebrow">BOLETÍN DESCRIPTIVO</span>
                            <h2 id="grade-selected-subject">Sección asignada</h2>
                            <p id="grade-selected-section-name"></p>
                        </div>
                        <span id="grade-assignment-count" class="grade-scale-badge" role="status" aria-live="polite"></span>
                    </div>
                    <div class="grade-table-scroll">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Número de lista</th>
                                    <th>Cédula escolar</th>
                                    <th>Nombre del alumno</th>
                                    <th>Boletines anteriores</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="descriptive-grades-body"></tbody>
                        </table>
                    </div>
                    <dialog class="descriptive-report-dialog descriptive-editor-dialog" id="descriptive-report-dialog" aria-labelledby="descriptive-report-title">
                        <div class="descriptive-report-content">
                            <header class="descriptive-report-header">
                                <div>
                                    <span class="grade-record-eyebrow">BOLETÍN DESCRIPTIVO</span>
                                    <h2 id="descriptive-report-title">Generar boletín descriptivo</h2>
                                </div>
                                <button type="button" class="descriptive-report-close" id="descriptive-report-close" aria-label="Cerrar">×</button>
                            </header>
                            <div class="descriptive-student-details">
                                <div><span>Número de lista</span><strong id="descriptive-report-list-number"></strong></div>
                                <div><span>Cédula escolar</span><strong id="descriptive-report-cedula"></strong></div>
                                <div><span>Nombre del alumno</span><strong id="descriptive-report-name"></strong></div>
                                <div><span>Grado y sección</span><strong id="descriptive-report-section"></strong></div>
                            </div>
                            <div class="descriptive-report-fields">
                                <div class="descriptive-report-field">
                                    <label for="descriptive-report-moment">Momento</label>
                                    <select class="admin-input" id="descriptive-report-moment">
                                        <option value="1">Momento 1</option>
                                        <option value="2">Momento 2</option>
                                        <option value="3">Momento 3</option>
                                    </select>
                                </div>
                                <div class="descriptive-report-field">
                                    <label for="descriptive-report-date-from">Fecha desde</label>
                                    <input class="admin-input" id="descriptive-report-date-from" type="date">
                                </div>
                                <div class="descriptive-report-field">
                                    <label for="descriptive-report-date-to">Fecha hasta</label>
                                    <input class="admin-input" id="descriptive-report-date-to" type="date">
                                </div>
                                <div class="descriptive-report-field">
                                    <label for="descriptive-report-attendance">Asistencia</label>
                                    <input class="admin-input" id="descriptive-report-attendance" type="number" min="0" step="1" value="0">
                                </div>
                                <div class="descriptive-report-field">
                                    <label for="descriptive-report-absences">Inasistencias</label>
                                    <input class="admin-input" id="descriptive-report-absences" type="number" min="0" step="1" value="0">
                                </div>
                                <div class="descriptive-report-field">
                                    <label for="descriptive-report-justified">Justificadas</label>
                                    <input class="admin-input" id="descriptive-report-justified" type="number" min="0" step="1" value="0">
                                </div>
                            </div>
                            <label class="descriptive-report-label" for="descriptive-report-observations">Información de la actuación integral del estudiante</label>
                            <textarea class="admin-input descriptive-report-observations" id="descriptive-report-observations" maxlength="500" rows="7"></textarea>
                            <p class="descriptive-report-status" id="descriptive-report-status" role="status" aria-live="polite" hidden></p>
                            <footer class="descriptive-report-actions">
                                <input type="file" id="descriptive-report-file" accept=".txt,text/plain" hidden>
                                <button type="button" class="grade-back-button" id="descriptive-report-import" title="Importar información desde un archivo de texto">Importar</button>
                                <button type="button" class="grade-back-button" id="descriptive-report-export">Exportar</button>
                                <button type="button" class="grade-back-button" id="descriptive-report-preview">Vista previa</button>
                                <button type="button" class="grade-save-button" id="descriptive-report-save">Guardar</button>
                            </footer>
                        </div>
                    </dialog>
                    <dialog class="descriptive-report-dialog descriptive-history-dialog" id="descriptive-history-dialog" aria-labelledby="descriptive-history-title">
                        <div class="descriptive-report-content">
                            <header class="descriptive-report-header">
                                <div>
                                    <span class="grade-record-eyebrow">HISTORIAL ACADÉMICO</span>
                                    <h2 id="descriptive-history-title">Boletines anteriores</h2>
                                    <p class="descriptive-history-student" id="descriptive-history-student"></p>
                                </div>
                                <button type="button" class="descriptive-report-close" id="descriptive-history-close" aria-label="Cerrar">×</button>
                            </header>
                            <p class="descriptive-report-status" id="descriptive-history-status" role="status" aria-live="polite" hidden></p>
                            <div class="grade-table-scroll">
                                <table class="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Lapso</th>
                                            <th>Período</th>
                                            <th>Momento</th>
                                            <th>Desde</th>
                                            <th>Hasta</th>
                                            <th>Asistencia</th>
                                            <th>Inasistencias</th>
                                            <th>Justificadas</th>
                                            <th>Información de actuación integral</th>
                                            <th>Fecha de registro</th>
                                        </tr>
                                    </thead>
                                    <tbody id="descriptive-history-body"></tbody>
                                </table>
                            </div>
                        </div>
                    </dialog>
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
                descripcion: 'Consulta y registra la descripción de cada alumno.',
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
            const cuerpo = contenedor.querySelector('#descriptive-grades-body');
            const filtro = contenedor.querySelector('#grade-table-student-search');
            const contador = contenedor.querySelector('#grade-assignment-count');
            const seccionAsignada = seccionesPrimaria[0];

            const obtenerNumeroLista = alumno => {
                const alumnosSeccion = seccionAsignada
                    ? alumnosDescriptivos.filter(item =>
                        item.grado === seccionAsignada.grado
                        && item.seccion === seccionAsignada.seccion
                    )
                    : [];
                return alumno.numeroLista || String(alumnosSeccion.indexOf(alumno) + 1);
            };

            const renderizarTabla = () => {
                const consulta = normalizarTexto(filtro.value);
                const alumnosSeccion = seccionAsignada
                    ? alumnosDescriptivos.filter(alumno =>
                        alumno.grado === seccionAsignada.grado
                        && alumno.seccion === seccionAsignada.seccion
                    )
                    : [];
                const alumnosVisibles = alumnosSeccion.filter(alumno =>
                    !consulta || normalizarTexto(`${alumno.cedula} ${alumno.nombre}`).includes(consulta)
                );

                contador.textContent = `${alumnosVisibles.length} ${alumnosVisibles.length === 1 ? 'alumno' : 'alumnos'}`;
                cuerpo.innerHTML = alumnosVisibles.map(alumno => `
                    <tr data-cedula="${escaparHtml(alumno.cedula)}">
                        <td>${escaparHtml(obtenerNumeroLista(alumno))}</td>
                        <td>${escaparHtml(alumno.cedula)}</td>
                        <td>${escaparHtml(alumno.nombre)}</td>
                        <td>
                            <button type="button" class="grade-back-button grade-history-action">Ver anteriores</button>
                        </td>
                        <td>
                            <button type="button" class="grade-save-button grade-row-action">Generar boletín</button>
                        </td>
                    </tr>
                `).join('') || `
                    <tr>
                        <td colspan="5" class="grades-empty-state">
                            No hay alumnos registrados en la sección asignada.
                        </td>
                    </tr>
                `;
            };

            const dialogo = contenedor.querySelector('#descriptive-report-dialog');
            const campoObservaciones = contenedor.querySelector('#descriptive-report-observations');
            const campoMomento = contenedor.querySelector('#descriptive-report-moment');
            const campoFechaDesde = contenedor.querySelector('#descriptive-report-date-from');
            const campoFechaHasta = contenedor.querySelector('#descriptive-report-date-to');
            const campoAsistencia = contenedor.querySelector('#descriptive-report-attendance');
            const campoInasistencias = contenedor.querySelector('#descriptive-report-absences');
            const campoJustificadas = contenedor.querySelector('#descriptive-report-justified');
            const estadoDialogo = contenedor.querySelector('#descriptive-report-status');
            const botonGuardar = contenedor.querySelector('#descriptive-report-save');
            const dialogoHistorial = contenedor.querySelector('#descriptive-history-dialog');
            const cuerpoHistorial = contenedor.querySelector('#descriptive-history-body');
            const estadoHistorial = contenedor.querySelector('#descriptive-history-status');
            let alumnoSeleccionado = null;

            const mostrarEstadoDialogo = (mensaje, esError) => {
                estadoDialogo.textContent = mensaje;
                estadoDialogo.classList.toggle('is-error', Boolean(esError));
                estadoDialogo.hidden = !mensaje;
            };

            const obtenerDatosBoletin = () => ({
                momento: Number(campoMomento.value),
                fechaDesde: campoFechaDesde.value,
                fechaHasta: campoFechaHasta.value,
                asistencia: Number(campoAsistencia.value),
                inasistencias: Number(campoInasistencias.value),
                justificadas: Number(campoJustificadas.value),
                observacion: campoObservaciones.value.trim()
            });

            if (seccionAsignada) {
                contenedor.querySelector('#grade-selected-subject').textContent =
                    `${etiquetaGradoEscolar(seccionAsignada.grado)} • Sección ${seccionAsignada.seccion}`;
                contenedor.querySelector('#grade-selected-section-name').textContent =
                    `Maestro Guía: ${seccionAsignada.maestroGuia} • ${seccionAsignada.aula}`;
            }

            filtro.addEventListener('input', renderizarTabla);

            contenedor.querySelector('#grade-clear-assignment-filters').addEventListener('click', () => {
                filtro.value = '';
                renderizarTabla();
                filtro.focus();
            });

            cuerpo.addEventListener('click', event => {
                const boton = event.target.closest('.grade-row-action');
                if (!boton) return;

                const fila = boton.closest('tr[data-cedula]');
                const alumno = alumnosDescriptivos.find(item => item.cedula === fila.dataset.cedula);
                if (!alumno) return;

                alumnoSeleccionado = alumno;
                contenedor.querySelector('#descriptive-report-list-number').textContent =
                    obtenerNumeroLista(alumno);
                contenedor.querySelector('#descriptive-report-cedula').textContent = alumno.cedula;
                contenedor.querySelector('#descriptive-report-name').textContent = alumno.nombre;
                contenedor.querySelector('#descriptive-report-section').textContent =
                    `${etiquetaGradoEscolar(alumno.grado)} • Sección ${alumno.seccion}`;
                campoObservaciones.value = alumno.observacion;
                campoMomento.value = String(alumno.momento || 1);
                campoFechaDesde.value = alumno.fechaDesde || '';
                campoFechaHasta.value = alumno.fechaHasta || '';
                campoAsistencia.value = String(alumno.asistencia || 0);
                campoInasistencias.value = String(alumno.inasistencias || 0);
                campoJustificadas.value = String(alumno.justificadas || 0);
                mostrarEstadoDialogo('', false);
                dialogo.showModal();
            });

            const mostrarHistorial = alumno => {
                contenedor.querySelector('#descriptive-history-student').textContent =
                    `${alumno.nombre} • ${alumno.cedula}`;
                const registros = Array.isArray(alumno.historial) ? alumno.historial : [];
                estadoHistorial.textContent = registros.length
                    ? 'Datos de ejemplo almacenados solo en la memoria de esta sesión.'
                    : 'No hay registros visuales anteriores para este alumno.';
                estadoHistorial.classList.remove('is-error');
                estadoHistorial.hidden = false;
                cuerpoHistorial.innerHTML = registros.map(registro => `
                    <tr>
                        <td>Lapso ${escaparHtml(registro.lapso)}</td>
                        <td>${escaparHtml(registro.periodo || 'Período anterior')}</td>
                        <td>${escaparHtml(registro.momento)}</td>
                        <td>${escaparHtml(registro.fechaDesde || '—')}</td>
                        <td>${escaparHtml(registro.fechaHasta || '—')}</td>
                        <td>${escaparHtml(registro.asistencia)}</td>
                        <td>${escaparHtml(registro.inasistencias)}</td>
                        <td>${escaparHtml(registro.justificadas)}</td>
                        <td>${escaparHtml(registro.observacion || 'Sin información')}</td>
                        <td>${escaparHtml(registro.fechaRegistro || '—')}</td>
                    </tr>
                `).join('') || `
                    <tr><td colspan="10" class="grades-empty-state">No hay boletines de lapsos anteriores para este alumno.</td></tr>
                `;
                dialogoHistorial.showModal();
            };

            cuerpo.addEventListener('click', event => {
                const boton = event.target.closest('.grade-history-action');
                if (!boton) return;

                const fila = boton.closest('tr[data-cedula]');
                const alumno = alumnosDescriptivos.find(item => item.cedula === fila.dataset.cedula);
                if (alumno) mostrarHistorial(alumno);
            });

            contenedor.querySelector('#descriptive-history-close').addEventListener('click', () => dialogoHistorial.close());
            contenedor.querySelector('#descriptive-report-close').addEventListener('click', () => dialogo.close());
            contenedor.querySelector('#descriptive-report-import').addEventListener('click', () => {
                contenedor.querySelector('#descriptive-report-file').click();
            });
            contenedor.querySelector('#descriptive-report-file').addEventListener('change', async event => {
                const archivo = event.target.files[0];
                if (!archivo) return;

                try {
                    const texto = await archivo.text();
                    if (texto.length > 500) {
                        throw new Error('La información importada supera el límite de 500 caracteres.');
                    }
                    campoObservaciones.value = texto;
                    mostrarEstadoDialogo('Información importada. Pulsa Guardar para aplicar los cambios.', false);
                } catch (error) {
                    mostrarEstadoDialogo(error.message || 'No se pudo importar el archivo.', true);
                } finally {
                    event.target.value = '';
                }
            });
            contenedor.querySelector('#descriptive-report-export').addEventListener('click', () => {
                if (!alumnoSeleccionado) return;

                const datosBoletin = obtenerDatosBoletin();
                const contenido = [
                    'Boletín descriptivo',
                    `Número de lista: ${obtenerNumeroLista(alumnoSeleccionado)}`,
                    `Cédula escolar: ${alumnoSeleccionado.cedula}`,
                    `Nombre del alumno: ${alumnoSeleccionado.nombre}`,
                    `Sección: ${etiquetaGradoEscolar(alumnoSeleccionado.grado)} • ${alumnoSeleccionado.seccion}`,
                    `Momento: ${datosBoletin.momento}`,
                    `Fecha desde: ${datosBoletin.fechaDesde || 'No indicada'}`,
                    `Fecha hasta: ${datosBoletin.fechaHasta || 'No indicada'}`,
                    `Asistencia: ${datosBoletin.asistencia}`,
                    `Inasistencias: ${datosBoletin.inasistencias}`,
                    `Justificadas: ${datosBoletin.justificadas}`,
                    '',
                    'Información de la actuación integral del estudiante:',
                    datosBoletin.observacion
                ].join('\r\n');
                const archivo = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(archivo);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = `boletin-${alumnoSeleccionado.cedula.replace(/[^a-zA-Z0-9._-]/g, '_')}.txt`;
                enlace.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            });
            contenedor.querySelector('#descriptive-report-preview').addEventListener('click', () => {
                if (!alumnoSeleccionado) return;

                let url = '';
                try {
                    const contenido = crearPdfVistaPrevia(
                        alumnoSeleccionado,
                        obtenerNumeroLista(alumnoSeleccionado),
                        obtenerDatosBoletin()
                    );
                    url = URL.createObjectURL(new Blob([contenido], { type: 'application/pdf' }));
                    const ventana = window.open(url, '_blank');
                    if (!ventana) {
                        URL.revokeObjectURL(url);
                        throw new Error('El navegador bloqueó la ventana de vista previa. Permite las ventanas emergentes para abrir el PDF.');
                    }
                    ventana.opener = null;
                    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
                    mostrarEstadoDialogo('Vista previa PDF abierta. El formato final se añadirá más adelante.', false);
                } catch (error) {
                    mostrarEstadoDialogo(error.message || 'No se pudo generar la vista previa PDF.', true);
                }
            });
            botonGuardar.addEventListener('click', () => {
                if (!alumnoSeleccionado) return;

                const datosBoletin = obtenerDatosBoletin();
                if (!Number.isInteger(datosBoletin.momento) || datosBoletin.momento < 1 || datosBoletin.momento > 3) {
                    mostrarEstadoDialogo('Selecciona un momento válido.', true);
                    return;
                }
                if (![datosBoletin.asistencia, datosBoletin.inasistencias, datosBoletin.justificadas]
                    .every(valor => Number.isInteger(valor) && valor >= 0)) {
                    mostrarEstadoDialogo('Asistencia, inasistencias y justificadas deben ser números enteros no negativos.', true);
                    return;
                }
                if (datosBoletin.fechaDesde && datosBoletin.fechaHasta
                    && datosBoletin.fechaDesde > datosBoletin.fechaHasta) {
                    mostrarEstadoDialogo('La fecha Desde no puede ser posterior a la fecha Hasta.', true);
                    return;
                }
                if (datosBoletin.observacion.length > 500) {
                    mostrarEstadoDialogo('La información no puede superar los 500 caracteres.', true);
                    return;
                }

                Object.assign(alumnoSeleccionado, datosBoletin);
                renderizarTabla();
                mostrarEstadoDialogo(
                    'Boletín guardado en la memoria de esta sesión; no se envió a la base de datos.',
                    false
                );
            });

            renderizarTabla();
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