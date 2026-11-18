// ================= ESTADO GLOBAL Y VARIABLES DE CONTROL =================
const usuarioSesion = new URLSearchParams(window.location.search).get('usuario') || 'Docente';
document.querySelectorAll('[data-session-user]').forEach(elemento => {
    elemento.textContent = usuarioSesion;
});

let temporizadorCargaModulo = null;
let observadorTablaCalificaciones = null;
let seccionesAsignadasDocente = []; // Se llenará desde Python/Eel según el docente logueado
let aplicarFiltroTablaCalificaciones = null;
let cursoCalificacionesSeleccionado = null;

let cursosCatalogo = [];

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

cursosCatalogo = [
    { ano: 1, seccion: 'A', materia: 'Lengua y Literatura', docente: '' },
    { ano: 1, seccion: 'A', materia: 'Idiomas', docente: '' },
    { ano: 1, seccion: 'C', materia: 'Matemática', docente: '' },
    { ano: 2, seccion: 'B', materia: 'Biología, Ambiente y Tecnología', docente: '' },
    { ano: 2, seccion: 'B', materia: 'Educación Física', docente: '' },
    { ano: 2, seccion: 'C', materia: 'Química', docente: '' },
    { ano: 3, seccion: 'A', materia: 'Física', docente: '' },
    { ano: 3, seccion: 'C', materia: 'G.H.S.', docente: '' },
    { ano: 3, seccion: 'C', materia: 'Informática Técnica y Práctica', docente: '' },
    { ano: 4, seccion: 'B', materia: 'Orientación Vocacional', docente: '' },
    { ano: 4, seccion: 'B', materia: 'Matemática', docente: '' },
    { ano: 5, seccion: 'A', materia: 'Biología, Ambiente y Tecnología', docente: '' },
    { ano: 5, seccion: 'C', materia: 'Lengua y Literatura', docente: '' },
    { ano: 5, seccion: 'C', materia: 'Física', docente: '' }
];

function etiquetaAnoEscolar(ano) {
    return Number(ano) === 1 ? '1er Año' : `${ano}° Año`;
}

function sincronizarSeccionesConCursos() {
    seccionesAsignadasDocente = [...new Set(cursosCatalogo.map(curso =>
        `${etiquetaAnoEscolar(curso.ano)} ${String(curso.seccion).trim()}`
    ))];
}

sincronizarSeccionesConCursos();

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
            <div class="welcome-banner">
                <h1>Bienvenido(a), <span data-session-user>${usuarioSesion}</span></h1>
                <p>Gestión de Liceo (1ro a 5to Año)</p>
            </div>

            <div class="widgets-row">
                <div class="widget">
                    <h3>Período académico actual</h3>
                    <p>Año escolar: 2026 - 2027 (En curso)</p>
                </div>
                <div class="widget actions">
                    <h3>Accesos directos</h3>
                    <div class="action-buttons action-buttons--shortcuts">
                        <button type="button" class="shortcut-button shortcut-button--grades" data-module="Cargar Calificaciones">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="img/img_notas.png" alt="">
                            </span>
                            <span>Cargar notas</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--schedule" data-module="Ver Horarios">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="img/img_horario.png" alt="">
                            </span>
                            <span>Ver Horario</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--courses" data-module="Cursos">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="img/img_estudiante.png" alt="">
                            </span>
                            <span>Cursos</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="charts-row">
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
                <div class="chart-box">
                    <h3>Horarios de Clase</h3>
                    <p style="margin-top: 8px; font-size: 14px; color: #666;">Bloques horarios y aulas asignadas para la semana.</p>
                </div>
            </div>
        `;
        renderizarResumenCursos();
    });
}

// Función lista para ser llamada desde Python vía Eel: eel.actualizarSeccionesAsignadas(['1er Año A', '3er Año B'])
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
    const normalizar = texto => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

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

    anos.forEach(ano => {
        const bloqueAno = document.createElement('section');
        bloqueAno.className = 'course-year-block';
        bloqueAno.dataset.year = String(ano);
        bloqueAno.setAttribute('aria-labelledby', `course-year-title-${ano}`);

        const encabezadoAno = document.createElement('div');
        encabezadoAno.className = 'course-year-heading';
        const tituloAno = document.createElement('h2');
        tituloAno.id = `course-year-title-${ano}`;
        tituloAno.textContent = etiquetaAnoEscolar(ano);
        const etiquetaNivel = document.createElement('span');
        etiquetaNivel.textContent = 'Educación media general';
        encabezadoAno.append(tituloAno, etiquetaNivel);
        bloqueAno.appendChild(encabezadoAno);

        secciones.forEach(seccion => {
            const cursosSeccion = cursosCatalogo.filter(curso =>
                Number(curso.ano) === ano && String(curso.seccion).trim() === seccion
            );
            if (!cursosSeccion.length) return;

            const grupoSeccion = document.createElement('div');
            grupoSeccion.className = 'course-section-group';
            grupoSeccion.dataset.section = seccion;

            const encabezadoSeccion = document.createElement('div');
            encabezadoSeccion.className = 'course-section-heading';
            const tituloSeccion = document.createElement('h3');
            tituloSeccion.textContent = `Sección ${seccion}`;
            encabezadoSeccion.appendChild(tituloSeccion);

            const tarjetas = document.createElement('div');
            tarjetas.className = 'course-cards';

            cursosSeccion.forEach(curso => {
                const tarjeta = document.createElement('article');
                tarjeta.className = 'course-card';
                tarjeta.dataset.subject = normalizar(curso.materia);
                tarjeta.dataset.year = String(ano);
                tarjeta.dataset.section = String(seccion);

                const materia = document.createElement('h4');
                materia.textContent = curso.materia;
                const detalle = document.createElement('p');
                detalle.className = 'course-card-detail';
                detalle.textContent = 'Asignatura';
                const encabezado = document.createElement('div');
                encabezado.className = 'course-card-heading';
                const textos = document.createElement('div');
                textos.className = 'course-card-copy';
                textos.append(materia, detalle);
                encabezado.append(crearIconoMateria(curso.materia), textos);

                const nombreDocente = String(curso.docente || '').trim();
                tarjeta.appendChild(encabezado);
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
                    tarjeta.appendChild(docente);
                }

                tarjetas.appendChild(tarjeta);
            });

            grupoSeccion.append(encabezadoSeccion, tarjetas);
            bloqueAno.appendChild(grupoSeccion);
        });

        listaCursos.appendChild(bloqueAno);
    });

    function aplicarFiltros() {
        const consulta = normalizar(busquedaMateria.value);
        let resultados = 0;

        listaCursos.querySelectorAll('.course-year-block').forEach(bloqueAno => {
            const coincideAno = !filtroAno.value || bloqueAno.dataset.year === filtroAno.value;
            let hayCursosEnAno = false;

            bloqueAno.querySelectorAll('.course-section-group').forEach(grupo => {
                const coincideSeccion = !filtroSeccion.value || grupo.dataset.section === filtroSeccion.value;
                let hayCursosEnSeccion = false;

                grupo.querySelectorAll('.course-card').forEach(tarjeta => {
                    const visible = coincideAno && coincideSeccion && tarjeta.dataset.subject.includes(consulta);
                    tarjeta.hidden = !visible;
                    if (visible) {
                        resultados++;
                        hayCursosEnSeccion = true;
                    }
                });

                grupo.hidden = !hayCursosEnSeccion;
                if (hayCursosEnSeccion) hayCursosEnAno = true;
            });

            bloqueAno.hidden = !hayCursosEnAno;
        });

        contador.textContent = `${resultados} ${resultados === 1 ? 'asignatura encontrada' : 'asignaturas encontradas'}`;
        estadoVacio.textContent = 'No encontramos asignaturas con esos filtros. Prueba con otra búsqueda.';
        estadoVacio.hidden = resultados > 0;
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

function renderizarResumenCursos() {
    const lista = document.getElementById('assigned-courses-list');
    const resumen = document.getElementById('assigned-courses-summary');
    const contador = document.getElementById('assigned-courses-count');
    if (!lista || !resumen || !contador) return;

    const grupos = new Map();
    cursosCatalogo.forEach(curso => {
        const clave = `${curso.ano}|${curso.seccion}`;
        if (!grupos.has(clave)) {
            grupos.set(clave, { ano: curso.ano, seccion: curso.seccion, materias: [] });
        }
        grupos.get(clave).materias.push(curso.materia);
    });

    const asignaciones = [...grupos.values()].sort((a, b) =>
        a.ano - b.ano || a.seccion.localeCompare(b.seccion, 'es')
    );
    lista.replaceChildren();

    resumen.textContent = `${cursosCatalogo.length} ${cursosCatalogo.length === 1 ? 'materia asignada' : 'materias asignadas'}`;
    contador.textContent = `${asignaciones.length} ${asignaciones.length === 1 ? 'sección' : 'secciones'}`;

    if (!asignaciones.length) {
        const vacio = document.createElement('p');
        vacio.className = 'assigned-courses-empty';
        vacio.textContent = 'Aún no tienes materias asignadas.';
        lista.appendChild(vacio);
        return;
    }

    asignaciones.forEach(asignacion => {
        const grupo = document.createElement('section');
        grupo.className = 'assigned-course-group';
        grupo.setAttribute('role', 'listitem');

        const encabezado = document.createElement('div');
        encabezado.className = 'assigned-course-group-heading';
        const ano = document.createElement('span');
        ano.className = 'assigned-course-year';
        ano.textContent = etiquetaAnoEscolar(asignacion.ano);
        const seccion = document.createElement('span');
        seccion.className = 'assigned-course-section';
        seccion.textContent = `Sección ${asignacion.seccion}`;
        encabezado.append(ano, seccion);

        const materias = document.createElement('div');
        materias.className = 'assigned-course-subjects';
        asignacion.materias.forEach(materia => {
            const etiqueta = document.createElement('span');
            etiqueta.className = 'assigned-course-subject';
            etiqueta.textContent = materia;
            materias.appendChild(etiqueta);
        });

        grupo.append(encabezado, materias);
        lista.appendChild(grupo);
    });
}

renderizarResumenCursos();

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
    const cursosFiltrados = cursosCatalogo
        .map((curso, indice) => ({ ...curso, indice }))
        .filter(curso =>
            (!filtroAno || curso.ano === Number(filtroAno))
            && (!filtroSeccion || curso.seccion === filtroSeccion)
            && curso.materia.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(consulta)
        );
    const anos = [...new Set(cursosFiltrados.map(curso => curso.ano))].sort((a, b) => a - b);

    lista.replaceChildren();
    anos.forEach(ano => {
        const bloqueAno = document.createElement('section');
        bloqueAno.className = 'course-year-block';

        const encabezadoAno = document.createElement('div');
        encabezadoAno.className = 'course-year-heading';
        const tituloAno = document.createElement('h2');
        tituloAno.textContent = etiquetaAnoEscolar(ano);
        const etiquetaNivel = document.createElement('span');
        etiquetaNivel.textContent = 'Educación media general';
        encabezadoAno.append(tituloAno, etiquetaNivel);
        bloqueAno.appendChild(encabezadoAno);

        const secciones = [...new Set(cursosFiltrados
            .filter(curso => curso.ano === ano)
            .map(curso => curso.seccion))].sort((a, b) => a.localeCompare(b, 'es'));

        secciones.forEach(seccion => {
            const grupo = document.createElement('div');
            grupo.className = 'course-section-group';

            const encabezadoSeccion = document.createElement('div');
            encabezadoSeccion.className = 'course-section-heading';
            const tituloSeccion = document.createElement('h3');
            tituloSeccion.textContent = `Sección ${seccion}`;
            encabezadoSeccion.appendChild(tituloSeccion);

            const tarjetas = document.createElement('div');
            tarjetas.className = 'course-cards';
            cursosFiltrados
                .filter(curso => curso.ano === ano && curso.seccion === seccion)
                .forEach(curso => {
                    const tarjeta = document.createElement('button');
                    tarjeta.type = 'button';
                    tarjeta.className = 'course-card grade-assignment-card';
                    tarjeta.dataset.courseIndex = String(curso.indice);
                    const seleccionado = cursoCalificacionesSeleccionado
                        && cursoCalificacionesSeleccionado.ano === curso.ano
                        && cursoCalificacionesSeleccionado.seccion === curso.seccion
                        && cursoCalificacionesSeleccionado.materia === curso.materia;
                    tarjeta.setAttribute('aria-pressed', String(Boolean(seleccionado)));

                    const encabezado = document.createElement('div');
                    encabezado.className = 'course-card-heading';
                    encabezado.appendChild(crearIconoMateria(curso.materia));

                    const copia = document.createElement('div');
                    copia.className = 'course-card-copy';
                    const materia = document.createElement('h4');
                    materia.textContent = curso.materia;
                    const detalle = document.createElement('p');
                    detalle.className = 'course-card-detail';
                    detalle.textContent = 'Asignatura asignada';
                    copia.append(materia, detalle);
                    encabezado.appendChild(copia);

                    const accion = document.createElement('span');
                    accion.className = 'grade-assignment-action';
                    accion.textContent = 'Cargar calificaciones';
                    tarjeta.append(encabezado, accion);
                    tarjetas.appendChild(tarjeta);
                });

            grupo.append(encabezadoSeccion, tarjetas);
            bloqueAno.appendChild(grupo);
        });

        lista.appendChild(bloqueAno);
    });

    contador.textContent = `${cursosFiltrados.length} ${cursosFiltrados.length === 1 ? 'materia asignada' : 'materias asignadas'}`;
    estadoVacio.textContent = cursosCatalogo.length
        ? 'No encontramos materias con esos filtros.'
        : 'No tienes materias asignadas para cargar calificaciones.';
    estadoVacio.hidden = cursosFiltrados.length > 0;
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
        let contenidoModulo = `
            <div class="widget">
                <p>Aquí se mostrará tu horario semanal de clases y salones asignados al conectar la base de datos.</p>
            </div>
        `;

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
                        <span>Listado por año y sección</span>
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
                    </section>
                </div>
            `;
        }

        // --- MÓDULO: CURSOS ---
        if (modulo === 'Cursos') {
            contenidoModulo = `
                <section class="course-catalog" aria-labelledby="course-catalog-title">
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
                </section>
            `;
        }

        const configuracionEncabezado = {
            Cursos: {
                titulo: 'Cursos',
                subtitulo: 'Explora tus cursos',
                descripcion: 'Consulta las asignaturas organizadas por año y sección.',
                icono: 'img/img_estudiante.png',
                tituloId: 'course-catalog-title'
            },
            'Cargar Calificaciones': {
                titulo: 'Cargar Calificaciones',
                subtitulo: 'Materias asignadas',
                descripcion: 'Selecciona una materia de tu carga académica para registrar las calificaciones.',
                icono: 'img/img_notas.png',
                marcaClase: 'grade-module-mark',
                bannerId: 'grade-module-banner'
            },
            'Ver Horarios': {
                titulo: 'Ver Horarios',
                subtitulo: 'Horarios de clase',
                descripcion: 'Consulta tus bloques horarios y aulas asignadas para la semana.',
                icono: 'img/img_horario.png',
                marcaClase: 'schedule-module-mark'
            }
        }[modulo];
        const encabezadoModulo = configuracionEncabezado
            ? `
                <div class="welcome-banner course-module-banner" ${configuracionEncabezado.bannerId ? `id="${configuracionEncabezado.bannerId}"` : ''}>
                    <div>
                        <span class="course-eyebrow">PERÍODO ACADÉMICO 2026–2027</span>
                        <h1>Módulo: ${configuracionEncabezado.titulo}</h1>
                        <h2 ${configuracionEncabezado.tituloId ? `id="${configuracionEncabezado.tituloId}"` : ''}>${configuracionEncabezado.subtitulo}</h2>
                        <p class="course-module-meta">Gestión de Liceo • Panel Docente</p>
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
                    <p>Gestión de Liceo • Panel Docente</p>
                </div>
            `;

        contenedor.innerHTML = `
            ${encabezadoModulo}
            ${contenidoModulo}
        `;

        // Eventos para el catálogo de cursos
        if (modulo === 'Cursos') {
            renderizarCatalogoCursos(contenedor);
        }

        // Eventos para Cargar Calificaciones
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

            // Cálculo automático de definitiva en base a 20
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

    // Punto de conexión para Python / Eel
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