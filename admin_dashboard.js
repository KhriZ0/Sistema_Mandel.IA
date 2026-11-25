// ================= ESTADO GLOBAL Y VARIABLES DE CONTROL =================
const parametrosAcceso = new URLSearchParams(window.location.search);
const usuarioSesion = sessionStorage.getItem('mandel.usuario') || parametrosAcceso.get('usuario') || 'Administrador (Dev)';
const cargoSesion = sessionStorage.getItem('mandel.cargo') || parametrosAcceso.get('cargo') || 'Sv. Comunitario';

document.querySelectorAll('[data-session-user]').forEach(elemento => {
    elemento.textContent = usuarioSesion;
});
document.querySelectorAll('[data-session-role]').forEach(elemento => {
    elemento.textContent = cargoSesion;
});

let temporizadorCargaModulo = null;
let observadorTablaCalificaciones = null;
let seccionesInstitucion = ['1er Año A', '1er Año B', '2do Año A', '3er Año A', '4to Año A', '5to Año A'];
let aplicarFiltroTablaCalificaciones = null;

const estudiantesAdminDemo = [
    {
        cedula: 'V-32.145.890',
        nombre: 'Pérez, María',
        nivel: 'Liceo',
        curso: '1er Año A',
        docente: 'Prof. Carlos Ruiz',
        materias: ['Matemática', 'Lengua y Literatura'],
        estado: true
    },
    {
        cedula: 'V-31.987.654',
        nombre: 'Gómez, Carlos',
        nivel: 'Liceo',
        curso: '1er Año A',
        docente: 'Prof. Elena Mendoza',
        materias: ['Matemática', 'Física'],
        estado: true
    },
    {
        cedula: 'V-30.542.118',
        nombre: 'Rodríguez, Sofía',
        nivel: 'Liceo',
        curso: '3er Año A',
        docente: 'Prof. Carlos Ruiz',
        materias: ['Matemática', 'Química'],
        estado: true
    },
    {
        cedula: 'V-29.874.320',
        nombre: 'Castillo, Andrés',
        nivel: 'Liceo',
        curso: '5to Año A',
        docente: 'Prof. Elena Mendoza',
        materias: ['Física', 'G.H.S.'],
        estado: false
    },
    {
        cedula: 'E-84.210.554',
        nombre: 'Alvarado, Lucía',
        nivel: 'Primaria',
        curso: '2do Grado A',
        docente: 'Prof. Ana García',
        materias: [],
        estado: true
    },
    {
        cedula: 'V-34.612.901',
        nombre: 'Herrera, Mateo',
        nivel: 'Primaria',
        curso: '2do Grado A',
        docente: 'Prof. Ana García',
        materias: [],
        estado: true
    },
    {
        cedula: 'V-35.109.442',
        nombre: 'Suárez, Valentina',
        nivel: 'Primaria',
        curso: '4to Grado B',
        docente: 'Prof. Luis Martínez',
        materias: [],
        estado: true
    }
];

const docentesAdminDemo = [
    {
        cedula: 'V-14.852.369',
        nombre: 'Rojas, María Alejandra',
        nivel: 'Liceo',
        cargo: 'Docente • Media General',
        telefono: '+58 412-1234567',
        estado: true
    },
    {
        cedula: 'V-16.402.881',
        nombre: 'Ruiz, Carlos Alberto',
        nivel: 'Liceo',
        cargo: 'Docente • Media General',
        telefono: '+58 414-2981120',
        estado: true
    },
    {
        cedula: 'V-17.910.204',
        nombre: 'García, Ana Teresa',
        nivel: 'Primaria',
        cargo: 'Maestro(a) de Aula',
        telefono: '+58 424-6703319',
        estado: true
    },
    {
        cedula: 'V-18.334.719',
        nombre: 'Martínez, Luis Eduardo',
        nivel: 'Primaria',
        cargo: 'Maestro(a) de Aula',
        telefono: '+58 416-8092241',
        estado: true
    },
    {
        cedula: 'V-12.609.412',
        nombre: 'Mendoza, Elena Sofía',
        nivel: 'Ambos',
        cargo: 'Coordinador(a) Académico',
        telefono: '+58 412-5540981',
        estado: false
    }
];

const seccionesAdminDemo = [
    { id: 'PRI-2A', nivel: 'Primaria', etapa: '2do Grado', letra: 'A', nombre: '2do Grado A', cupo: 30, habilitada: true },
    { id: 'PRI-4B', nivel: 'Primaria', etapa: '4to Grado', letra: 'B', nombre: '4to Grado B', cupo: 30, habilitada: true },
    { id: 'LIC-1A', nivel: 'Liceo', etapa: '1er Año', letra: 'A', nombre: '1er Año A', cupo: 35, habilitada: true },
    { id: 'LIC-1B', nivel: 'Liceo', etapa: '1er Año', letra: 'B', nombre: '1er Año B', cupo: 35, habilitada: true },
    { id: 'LIC-2A', nivel: 'Liceo', etapa: '2do Año', letra: 'A', nombre: '2do Año A', cupo: 35, habilitada: true },
    { id: 'LIC-3A', nivel: 'Liceo', etapa: '3er Año', letra: 'A', nombre: '3er Año A', cupo: 35, habilitada: true },
    { id: 'LIC-4A', nivel: 'Liceo', etapa: '4to Año', letra: 'A', nombre: '4to Año A', cupo: 35, habilitada: true },
    { id: 'LIC-5A', nivel: 'Liceo', etapa: '5to Año', letra: 'A', nombre: '5to Año A', cupo: 35, habilitada: true }
];

// Materias fijas del plantel (lo que varía es el docente asignado y su horario/bloque por curso)
const materiasFijasLiceo = [
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

const asignacionesMateriasDemo = [
    { id: 'ASG-01', curso: '1er Año A', materia: 'Matemática', docente: 'Ruiz, Carlos Alberto', dia: 'Lunes', bloque: '7:00 – 8:20' },
    { id: 'ASG-02', curso: '1er Año A', materia: 'Lengua y Literatura', docente: 'Rojas, María Alejandra', dia: 'Martes', bloque: '8:30 – 9:50' },
    { id: 'ASG-03', curso: '2do Año A', materia: 'Biología, Ambiente y Tecnología', docente: 'Mendoza, Elena Sofía', dia: 'Miércoles', bloque: '7:00 – 8:20' },
    { id: 'ASG-04', curso: '3er Año A', materia: 'Física', docente: 'Ruiz, Carlos Alberto', dia: 'Jueves', bloque: '10:00 – 11:20' },
    { id: 'ASG-05', curso: '5to Año A', materia: 'G.H.S.', docente: 'Rojas, María Alejandra', dia: 'Viernes', bloque: '8:30 – 9:50' }
];

function sincronizarSeccionesGlobales() {
    seccionesInstitucion = seccionesAdminDemo
        .filter(sec => sec.habilitada)
        .map(sec => sec.nombre);
    renderizarOpcionesSeccion();
    if (aplicarFiltroTablaCalificaciones) aplicarFiltroTablaCalificaciones();
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

// ================= 2. VISTA PRINCIPAL (INICIO) =================
function mostrarInicio(boton) {
    activarBoton(boton);
    const contenedor = document.getElementById('main-content');
    
    mostrarCargaModulo(contenedor, () => {
        contenedor.innerHTML = `
            <div class="welcome-banner course-module-banner home-module-banner">
                <div>
                    <h1>¡Bienvenido(a), <span data-session-user>${usuarioSesion}</span>!</h1>
                    <h2>Gestión Administrativa</h2>
                    <p class="course-module-description">Desde aquí puedes administrar estudiantes, docentes, secciones, horarios y reportes académicos.</p>
                </div>
                <span class="course-catalog-mark home-module-mark" aria-hidden="true">
                    <img src="img/img_inicio.png" alt="">
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
                    <div class="action-buttons action-buttons--shortcuts admin-shortcuts-grid">
                        <button type="button" class="shortcut-button shortcut-button--enroll" data-module="Estudiantes" data-subview="inscribir">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="img/img_estudiante.png" alt="">
                            </span>
                            <span>Inscribir Estudiante</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--assign" data-module="Docentes" data-subview="asignar">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="img/img_profesor.png" alt="">
                            </span>
                            <span>Asignar Materias</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--curriculum" data-module="Materias" data-subview="malla">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="img/img_materias.png" alt="">
                            </span>
                            <span>Malla Curricular</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--search" data-module="Estudiantes" data-subview="consultar">
                            <span class="shortcut-icon" aria-hidden="true">
                                <img src="img/img_reportes.png" alt="">
                            </span>
                            <span>Consultar Estudiantes</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="charts-row">
                <div class="chart-box">Distribución por nivel (Gráfico)</div>
                <div class="chart-box">Distribución por año (Gráfico)</div>
                <div class="chart-box">Distribución por grado (Gráfico)</div>
            </div>
        `;
    });
}

// ================= 3. SELECTORES DE SECCIÓN =================
function renderizarOpcionesSeccion() {
    const listaOpciones = document.getElementById('grade-section-options');
    if (!listaOpciones) return;

    const opcionActual = listaOpciones.querySelector('.section-option-input:checked');
    const seccionActual = opcionActual ? opcionActual.value : '';
    const secciones = [...new Set(seccionesInstitucion.map(s => String(s).trim()).filter(Boolean))];
    const mensajeVacio = document.getElementById('grade-section-empty');
    const etiquetaSeleccion = document.getElementById('grade-section-selected-label');
    
    listaOpciones.replaceChildren();
    mensajeVacio.hidden = secciones.length > 0;

    secciones.forEach((seccion, indice) => {
        const etiqueta = document.createElement('label');
        etiqueta.className = 'section-select-option';

        const casilla = document.createElement('input');
        casilla.className = 'section-option-input';
        casilla.type = 'radio';
        casilla.name = 'grade-section';
        casilla.value = seccion;
        casilla.checked = seccion === seccionActual;
        casilla.id = `grade-section-option-${indice}`;

        const texto = document.createElement('span');
        texto.textContent = seccion;
        etiqueta.append(casilla, texto);
        listaOpciones.appendChild(etiqueta);
    });

    const seccionSeleccionada = listaOpciones.querySelector('.section-option-input:checked');
    etiquetaSeleccion.textContent = seccionSeleccionada ? seccionSeleccionada.value : 'Selecciona una sección';
}

function actualizarSeccionesDesdePython(secciones) {
    if (!Array.isArray(secciones)) return;
    seccionesInstitucion = secciones;
    renderizarOpcionesSeccion();
    if (aplicarFiltroTablaCalificaciones) aplicarFiltroTablaCalificaciones();
}

// ================= MÓDULO ESTUDIANTES (ADMINISTRACIÓN) =================
function normalizarBusquedaAdmin(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function inicializarModuloEstudiantes(contenedor, subvista = '') {
    const pestanas = Array.from(contenedor.querySelectorAll('.students-level-tab'));
    const filaFiltrosPrimaria = contenedor.querySelector('#filters-primaria');
    const filaFiltrosLiceo = contenedor.querySelector('#filters-liceo');
    const filaFiltrosGeneral = contenedor.querySelector('#filters-general');

    const selGradoPrimaria = contenedor.querySelector('#filter-primaria-grado');
    const selDocentePrimaria = contenedor.querySelector('#filter-primaria-docente');
    const inpBuscarPrimaria = contenedor.querySelector('#search-primaria');

    const selAnoLiceo = contenedor.querySelector('#filter-liceo-ano');
    const selMateriaLiceo = contenedor.querySelector('#filter-liceo-materia');
    const selDocenteLiceo = contenedor.querySelector('#filter-liceo-docente');
    const inpBuscarLiceo = contenedor.querySelector('#search-liceo');

    const selNivelGeneral = contenedor.querySelector('#filter-general-nivel');
    const inpBuscarGeneral = contenedor.querySelector('#search-general');

    const theadTabla = contenedor.querySelector('#students-admin-thead');
    const tbodyTabla = contenedor.querySelector('#students-admin-tbody');
    const contadorResultados = contenedor.querySelector('#students-admin-count');
    const panelInscripcion = contenedor.querySelector('#student-enrollment-card');
    const formInscripcion = contenedor.querySelector('#student-enrollment-form');
    const mensajeInscripcion = contenedor.querySelector('#student-enrollment-feedback');

    let nivelActivo = 'general';

    if (subvista === 'inscribir' && panelInscripcion) {
        panelInscripcion.hidden = false;
    }

    function poblarSelectsDinamicos() {
        const gradosPrimaria = [...new Set(estudiantesAdminDemo.filter(e => e.nivel === 'Primaria').map(e => e.curso))];
        const docentesPrimaria = [...new Set(estudiantesAdminDemo.filter(e => e.nivel === 'Primaria').map(e => e.docente))];
        const anosLiceo = [...new Set(estudiantesAdminDemo.filter(e => e.nivel === 'Liceo').map(e => e.curso))];
        const materiasLiceo = [...new Set(estudiantesAdminDemo.filter(e => e.nivel === 'Liceo').flatMap(e => e.materias))];
        const docentesLiceo = [...new Set(estudiantesAdminDemo.filter(e => e.nivel === 'Liceo').map(e => e.docente))];

        selGradoPrimaria.replaceChildren(new Option('Grado y Sección', ''));
        gradosPrimaria.forEach(g => selGradoPrimaria.add(new Option(g, g)));

        selDocentePrimaria.replaceChildren(new Option('Docente de Aula', ''));
        docentesPrimaria.forEach(d => selDocentePrimaria.add(new Option(d, d)));

        selAnoLiceo.replaceChildren(new Option('Año y Sección', ''));
        anosLiceo.forEach(a => selAnoLiceo.add(new Option(a, a)));

        selMateriaLiceo.replaceChildren(new Option('Todas las materias', ''));
        materiasLiceo.forEach(m => selMateriaLiceo.add(new Option(m, m)));

        selDocenteLiceo.replaceChildren(new Option('Docente', ''));
        docentesLiceo.forEach(d => selDocenteLiceo.add(new Option(d, d)));
    }

    function actualizarEncabezadoTabla() {
        if (nivelActivo === 'primaria') {
            theadTabla.innerHTML = `
                <tr>
                    <th style="width: 38px;"><input type="checkbox" aria-label="Seleccionar todos"></th>
                    <th>Cédula</th>
                    <th>Nombres y Apellidos</th>
                    <th>Grado / Sección</th>
                    <th>Docente de Aula</th>
                    <th>Estado</th>
                </tr>
            `;
        } else if (nivelActivo === 'liceo') {
            theadTabla.innerHTML = `
                <tr>
                    <th style="width: 38px;"><input type="checkbox" aria-label="Seleccionar todos"></th>
                    <th>Cédula</th>
                    <th>Nombres y Apellidos</th>
                    <th>Año / Sección</th>
                    <th>Materias / Docente</th>
                    <th>Estado</th>
                </tr>
            `;
        } else {
            theadTabla.innerHTML = `
                <tr>
                    <th style="width: 38px;"><input type="checkbox" aria-label="Seleccionar todos"></th>
                    <th>Cédula</th>
                    <th>Nombres y Apellidos</th>
                    <th>Nivel</th>
                    <th>Grado / Año y Sección</th>
                    <th>Docente / Guía</th>
                    <th>Estado</th>
                </tr>
            `;
        }
    }

    function filtrarEstudiantes() {
        actualizarEncabezadoTabla();

        const filtrados = estudiantesAdminDemo.filter(est => {
            if (nivelActivo === 'primaria') {
                if (est.nivel !== 'Primaria') return false;
                if (selGradoPrimaria.value && est.curso !== selGradoPrimaria.value) return false;
                if (selDocentePrimaria.value && est.docente !== selDocentePrimaria.value) return false;
                const q = normalizarBusquedaAdmin(inpBuscarPrimaria.value);
                if (q && !normalizarBusquedaAdmin(`${est.cedula} ${est.nombre}`).includes(q)) return false;
                return true;
            }

            if (nivelActivo === 'liceo') {
                if (est.nivel !== 'Liceo') return false;
                if (selAnoLiceo.value && est.curso !== selAnoLiceo.value) return false;
                if (selMateriaLiceo.value && !est.materias.includes(selMateriaLiceo.value)) return false;
                if (selDocenteLiceo.value && est.docente !== selDocenteLiceo.value) return false;
                const q = normalizarBusquedaAdmin(inpBuscarLiceo.value);
                if (q && !normalizarBusquedaAdmin(`${est.cedula} ${est.nombre}`).includes(q)) return false;
                return true;
            }

            if (selNivelGeneral.value && est.nivel !== selNivelGeneral.value) return false;
            const q = normalizarBusquedaAdmin(inpBuscarGeneral.value);
            if (q && !normalizarBusquedaAdmin(`${est.cedula} ${est.nombre} ${est.curso} ${est.docente}`).includes(q)) return false;
            return true;
        });

        tbodyTabla.replaceChildren();
        const colspan = nivelActivo === 'general' ? 7 : 6;

        if (!filtrados.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="${colspan}" style="text-align:center; padding: 18px; color: #777;">No se encontraron estudiantes con los filtros seleccionados.</td>`;
            tbodyTabla.appendChild(tr);
        } else {
            filtrados.forEach(est => {
                const tr = document.createElement('tr');
                if (nivelActivo === 'primaria') {
                    tr.innerHTML = `
                        <td><input type="checkbox" aria-label="Seleccionar ${est.nombre}"></td>
                        <td><strong>${est.cedula}</strong></td>
                        <td>${est.nombre}</td>
                        <td>${est.curso}</td>
                        <td>${est.docente}</td>
                        <td>
                            <label class="student-status-switch">
                                <input type="checkbox" class="student-status-toggle" data-cedula="${est.cedula}" ${est.estado ? 'checked' : ''}>
                                <span>${est.estado ? 'Activo' : 'Inactivo'}</span>
                            </label>
                        </td>
                    `;
                } else if (nivelActivo === 'liceo') {
                    const resumenMaterias = est.materias.length ? est.materias.join(', ') : 'Sin materias asignadas';
                    tr.innerHTML = `
                        <td><input type="checkbox" aria-label="Seleccionar ${est.nombre}"></td>
                        <td><strong>${est.cedula}</strong></td>
                        <td>${est.nombre}</td>
                        <td>${est.curso}</td>
                        <td><small>${resumenMaterias}</small><br><strong>${est.docente}</strong></td>
                        <td>
                            <label class="student-status-switch">
                                <input type="checkbox" class="student-status-toggle" data-cedula="${est.cedula}" ${est.estado ? 'checked' : ''}>
                                <span>${est.estado ? 'Activo' : 'Inactivo'}</span>
                            </label>
                        </td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td><input type="checkbox" aria-label="Seleccionar ${est.nombre}"></td>
                        <td><strong>${est.cedula}</strong></td>
                        <td>${est.nombre}</td>
                        <td><span class="student-level-pill student-level-pill--${est.nivel.toLowerCase()}">${est.nivel}</span></td>
                        <td>${est.curso}</td>
                        <td>${est.docente}</td>
                        <td>
                            <label class="student-status-switch">
                                <input type="checkbox" class="student-status-toggle" data-cedula="${est.cedula}" ${est.estado ? 'checked' : ''}>
                                <span>${est.estado ? 'Activo' : 'Inactivo'}</span>
                            </label>
                        </td>
                    `;
                }
                tbodyTabla.appendChild(tr);
            });
        }

        contadorResultados.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'estudiante encontrado' : 'estudiantes encontrados'}`;
    }

    pestanas.forEach(tab => {
        tab.addEventListener('click', () => {
            nivelActivo = tab.dataset.levelTab;
            pestanas.forEach(t => {
                const activa = t === tab;
                t.classList.toggle('is-active', activa);
                t.setAttribute('aria-selected', String(activa));
            });
            filaFiltrosGeneral.hidden = nivelActivo !== 'general';
            filaFiltrosPrimaria.hidden = nivelActivo !== 'primaria';
            filaFiltrosLiceo.hidden = nivelActivo !== 'liceo';
            filtrarEstudiantes();
        });
    });

    [
        selGradoPrimaria, selDocentePrimaria, inpBuscarPrimaria,
        selAnoLiceo, selMateriaLiceo, selDocenteLiceo, inpBuscarLiceo,
        selNivelGeneral, inpBuscarGeneral
    ].forEach(el => {
        if (!el) return;
        el.addEventListener('input', filtrarEstudiantes);
        el.addEventListener('change', filtrarEstudiantes);
    });

    tbodyTabla.addEventListener('change', (e) => {
        if (!e.target.matches('.student-status-toggle')) return;
        const est = estudiantesAdminDemo.find(item => item.cedula === e.target.dataset.cedula);
        if (est) est.estado = e.target.checked;
        const etiquetaEstado = e.target.closest('.student-status-switch')?.querySelector('span');
        if (etiquetaEstado) etiquetaEstado.textContent = e.target.checked ? 'Activo' : 'Inactivo';
    });

    const btnToggleInscripcion = contenedor.querySelector('#btn-toggle-inscripcion');
    if (btnToggleInscripcion && panelInscripcion) {
        btnToggleInscripcion.addEventListener('click', () => {
            panelInscripcion.hidden = !panelInscripcion.hidden;
        });
    }

    if (formInscripcion) {
        formInscripcion.addEventListener('submit', (e) => {
            e.preventDefault();
            const tipoInscripcion = formInscripcion.querySelector('[name="tipo_inscripcion"]').value;
            const nivel = formInscripcion.querySelector('[name="nivel"]').value;
            const cedula = formInscripcion.querySelector('[name="cedula"]').value.trim().toUpperCase();
            const nombre = formInscripcion.querySelector('[name="nombre"]').value.trim();
            const curso = formInscripcion.querySelector('[name="curso"]').value.trim();

            if (!cedula || !nombre || !curso) return;

            const existente = estudiantesAdminDemo.find(item => item.cedula === cedula);
            if (existente) {
                existente.nombre = nombre;
                existente.nivel = nivel;
                existente.curso = curso;
                existente.estado = true;
            } else {
                estudiantesAdminDemo.unshift({
                    cedula,
                    nombre,
                    nivel,
                    curso,
                    docente: nivel === 'Primaria' ? 'Prof. Ana García' : 'Prof. Carlos Ruiz',
                    materias: nivel === 'Liceo' ? ['Matemática', 'Lengua y Literatura'] : [],
                    estado: true
                });
            }

            poblarSelectsDinamicos();
            filtrarEstudiantes();
            mensajeInscripcion.hidden = false;
            mensajeInscripcion.textContent = `Registro ${tipoInscripcion === 'regular' ? 'regular (prosecución)' : 'de nuevo ingreso'} guardado para ${nombre} (${curso}).`;
            formInscripcion.reset();
        });
    }

    poblarSelectsDinamicos();
    filtrarEstudiantes();
}

// ================= MÓDULO DOCENTES (ADMINISTRACIÓN) =================
function inicializarModuloDocentes(contenedor) {
    const selNivel = contenedor.querySelector('#filter-docente-nivel');
    const selEstado = contenedor.querySelector('#filter-docente-estado');
    const inpBuscar = contenedor.querySelector('#search-docente');
    const contador = contenedor.querySelector('#docentes-admin-count');
    const tbody = contenedor.querySelector('#docentes-admin-tbody');

    const btnToggleForm = contenedor.querySelector('#btn-toggle-docente-form');
    const cardForm = contenedor.querySelector('#docente-form-card');
    const tituloForm = contenedor.querySelector('#docente-form-title');
    const formDocente = contenedor.querySelector('#docente-form');
    const btnCancelarEdicion = contenedor.querySelector('#btn-cancel-docente-edit');
    const feedback = contenedor.querySelector('#docente-form-feedback');

    const inpCedula = formDocente.querySelector('[name="cedula"]');
    const inpNombre = formDocente.querySelector('[name="nombre"]');
    const selFormNivel = formDocente.querySelector('[name="nivel"]');
    const inpCargo = formDocente.querySelector('[name="cargo"]');
    const inpTelefono = formDocente.querySelector('[name="telefono"]');
    const selFormEstado = formDocente.querySelector('[name="estado"]');

    let cedulaEditando = null;

    function abrirFormularioNuevo() {
        cedulaEditando = null;
        tituloForm.textContent = 'Registrar Nuevo Docente';
        inpCedula.disabled = false;
        formDocente.reset();
        selFormEstado.value = 'activo';
        btnCancelarEdicion.hidden = true;
        cardForm.hidden = false;
        inpCedula.focus();
    }

    function abrirFormularioEditar(docente) {
        cedulaEditando = docente.cedula;
        tituloForm.textContent = `Ajustar Datos del Docente (${docente.cedula})`;
        inpCedula.value = docente.cedula;
        inpCedula.disabled = true;
        inpNombre.value = docente.nombre;
        selFormNivel.value = docente.nivel;
        inpCargo.value = docente.cargo;
        inpTelefono.value = docente.telefono || '';
        selFormEstado.value = docente.estado ? 'activo' : 'inactivo';
        btnCancelarEdicion.hidden = false;
        cardForm.hidden = false;
        inpNombre.focus();
    }

    function renderizarTablaDocentes() {
        const q = normalizarBusquedaAdmin(inpBuscar.value);
        const nivelFiltro = selNivel.value;
        const estadoFiltro = selEstado.value;

        const filtrados = docentesAdminDemo.filter(doc => {
            if (nivelFiltro && doc.nivel !== nivelFiltro) return false;
            if (estadoFiltro === 'activo' && !doc.estado) return false;
            if (estadoFiltro === 'inactivo' && doc.estado) return false;
            if (q && !normalizarBusquedaAdmin(`${doc.cedula} ${doc.nombre} ${doc.cargo} ${doc.nivel}`).includes(q)) {
                return false;
            }
            return true;
        });

        tbody.replaceChildren();

        if (!filtrados.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="7" style="text-align:center; padding: 18px; color: #777;">No se encontraron docentes con los filtros actuales.</td>';
            tbody.appendChild(tr);
        } else {
            filtrados.forEach(doc => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${doc.cedula}</strong></td>
                    <td>${doc.nombre}</td>
                    <td><span class="docente-level-pill docente-level-pill--${doc.nivel.toLowerCase()}">${doc.nivel}</span></td>
                    <td>${doc.cargo}</td>
                    <td>${doc.telefono || '—'}</td>
                    <td>
                        <label class="student-status-switch">
                            <input type="checkbox" class="docente-status-toggle" data-cedula="${doc.cedula}" ${doc.estado ? 'checked' : ''}>
                            <span>${doc.estado ? 'Activo' : 'Inactivo'}</span>
                        </label>
                    </td>
                    <td>
                        <button type="button" class="docente-edit-btn" data-edit-cedula="${doc.cedula}">Ajustar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        contador.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'docente registrado' : 'docentes registrados'}`;
    }

    [selNivel, selEstado, inpBuscar].forEach(el => {
        el.addEventListener('change', renderizarTablaDocentes);
        el.addEventListener('input', renderizarTablaDocentes);
    });

    btnToggleForm.addEventListener('click', () => {
        if (!cardForm.hidden && !cedulaEditando) {
            cardForm.hidden = true;
        } else {
            abrirFormularioNuevo();
        }
    });

    btnCancelarEdicion.addEventListener('click', () => {
        cedulaEditando = null;
        formDocente.reset();
        inpCedula.disabled = false;
        cardForm.hidden = true;
    });

    tbody.addEventListener('change', (e) => {
        if (!e.target.matches('.docente-status-toggle')) return;
        const doc = docentesAdminDemo.find(item => item.cedula === e.target.dataset.cedula);
        if (!doc) return;
        doc.estado = e.target.checked;
        const etiqueta = e.target.closest('.student-status-switch')?.querySelector('span');
        if (etiqueta) etiqueta.textContent = doc.estado ? 'Activo' : 'Inactivo';
        renderizarTablaDocentes();
    });

    tbody.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('[data-edit-cedula]');
        if (!btnEditar) return;
        const doc = docentesAdminDemo.find(item => item.cedula === btnEditar.dataset.editCedula);
        if (doc) abrirFormularioEditar(doc);
    });

    formDocente.addEventListener('submit', (e) => {
        e.preventDefault();
        const cedula = (cedulaEditando || inpCedula.value).trim().toUpperCase();
        const nombre = inpNombre.value.trim();
        const nivel = selFormNivel.value;
        const cargo = inpCargo.value.trim();
        const telefono = inpTelefono.value.trim();
        const activo = selFormEstado.value === 'activo';

        if (!cedula || !nombre || !cargo) return;

        if (cedulaEditando) {
            const doc = docentesAdminDemo.find(item => item.cedula === cedulaEditando);
            if (doc) {
                doc.nombre = nombre;
                doc.nivel = nivel;
                doc.cargo = cargo;
                doc.telefono = telefono;
                doc.estado = activo;
            }
            feedback.textContent = `Datos actualizados para ${nombre} (${cargo}).`;
        } else {
            const duplicado = docentesAdminDemo.find(item => item.cedula === cedula);
            if (duplicado) {
                duplicado.nombre = nombre;
                duplicado.nivel = nivel;
                duplicado.cargo = cargo;
                duplicado.telefono = telefono;
                duplicado.estado = activo;
                feedback.textContent = `Docente existente actualizado: ${nombre}.`;
            } else {
                docentesAdminDemo.unshift({
                    cedula,
                    nombre,
                    nivel,
                    cargo,
                    telefono,
                    estado: activo
                });
                feedback.textContent = `Docente ${nombre} registrado en el plantel.`;
            }
        }

        feedback.hidden = false;
        renderizarTablaDocentes();
        cedulaEditando = null;
        inpCedula.disabled = false;
        formDocente.reset();
        cardForm.hidden = true;
    });

    renderizarTablaDocentes();
}

// ================= MÓDULO SECCIONES (ADMINISTRACIÓN) =================
function inicializarModuloSecciones(contenedor) {
    const selNivel = contenedor.querySelector('#filter-seccion-nivel');
    const inpBuscar = contenedor.querySelector('#search-seccion');
    const contador = contenedor.querySelector('#secciones-admin-count');
    const tbody = contenedor.querySelector('#secciones-admin-tbody');

    const formNueva = contenedor.querySelector('#seccion-create-form');
    const selNivelNueva = formNueva.querySelector('[name="nivel"]');
    const inpEtapaNueva = formNueva.querySelector('[name="etapa"]');
    const inpLetraNueva = formNueva.querySelector('[name="letra"]');
    const inpCupoNueva = formNueva.querySelector('[name="cupo"]');
    const feedback = contenedor.querySelector('#seccion-feedback');

    const selEstudianteAsignar = contenedor.querySelector('#assign-student-select');
    const selSeccionDestino = contenedor.querySelector('#assign-section-select');
    const btnAsignarEstudiante = contenedor.querySelector('#btn-assign-student-section');

    function contarInscritos(nombreSeccion) {
        return estudiantesAdminDemo.filter(est => est.curso === nombreSeccion).length;
    }

    function poblarSelectAsignacion() {
        selEstudianteAsignar.replaceChildren();
        estudiantesAdminDemo.forEach(est => {
            selEstudianteAsignar.add(
                new Option(`${est.cedula} • ${est.nombre} (${est.nivel} — Actual: ${est.curso})`, est.cedula)
            );
        });

        selSeccionDestino.replaceChildren();
        seccionesAdminDemo
            .filter(sec => sec.habilitada)
            .forEach(sec => {
                selSeccionDestino.add(new Option(`${sec.nombre} (${sec.nivel})`, sec.nombre));
            });
    }

    function renderizarTablaSecciones() {
        const nivelFiltro = selNivel.value;
        const q = normalizarBusquedaAdmin(inpBuscar.value);

        const filtradas = seccionesAdminDemo.filter(sec => {
            if (nivelFiltro && sec.nivel !== nivelFiltro) return false;
            if (q && !normalizarBusquedaAdmin(`${sec.nombre} ${sec.etapa} ${sec.nivel}`).includes(q)) {
                return false;
            }
            return true;
        });

        tbody.replaceChildren();

        if (!filtradas.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="6" style="text-align:center; padding: 18px; color: #777;">No hay secciones que coincidan con el filtro.</td>';
            tbody.appendChild(tr);
        } else {
            filtradas.forEach(sec => {
                const inscritos = contarInscritos(sec.nombre);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${sec.nombre}</strong></td>
                    <td><span class="student-level-pill student-level-pill--${sec.nivel.toLowerCase()}">${sec.nivel}</span></td>
                    <td>${inscritos} / ${sec.cupo} alumnos</td>
                    <td>
                        <span class="secciones-ready-tag ${sec.habilitada ? 'is-ready' : ''}">
                            ${sec.habilitada ? 'Lista para materias / docente' : 'Deshabilitada'}
                        </span>
                    </td>
                    <td>
                        <label class="student-status-switch">
                            <input type="checkbox" class="seccion-enabled-toggle" data-id="${sec.id}" ${sec.habilitada ? 'checked' : ''}>
                            <span>${sec.habilitada ? 'Habilitada' : 'Inactiva'}</span>
                        </label>
                    </td>
                    <td>
                        <button type="button" class="docente-edit-btn" data-filter-curso="${sec.nombre}">Ver alumnos</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        contador.textContent = `${filtradas.length} ${filtradas.length === 1 ? 'sección configurada' : 'secciones configuradas'}`;
        poblarSelectAsignacion();
        sincronizarSeccionesGlobales();
    }

    [selNivel, inpBuscar].forEach(el => {
        el.addEventListener('change', renderizarTablaSecciones);
        el.addEventListener('input', renderizarTablaSecciones);
    });

    formNueva.addEventListener('submit', (e) => {
        e.preventDefault();
        const nivel = selNivelNueva.value;
        const etapa = inpEtapaNueva.value.trim();
        const letra = inpLetraNueva.value.trim().toUpperCase();
        const cupo = Math.max(5, Number(inpCupoNueva.value) || 30);

        if (!etapa || !letra) return;

        const nombre = `${etapa} ${letra}`;
        const existente = seccionesAdminDemo.find(
            s => normalizarBusquedaAdmin(s.nombre) === normalizarBusquedaAdmin(nombre)
        );

        if (existente) {
            existente.nivel = nivel;
            existente.cupo = cupo;
            existente.habilitada = true;
            feedback.textContent = `Sección "${nombre}" actualizada y habilitada.`;
        } else {
            seccionesAdminDemo.push({
                id: `${nivel.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                nivel,
                etapa,
                letra,
                nombre,
                cupo,
                habilitada: true
            });
            feedback.textContent = `Sección "${nombre}" creada y habilitada para asignar estudiantes y materias.`;
        }

        feedback.hidden = false;
        formNueva.reset();
        inpCupoNueva.value = nivel === 'Primaria' ? '30' : '35';
        renderizarTablaSecciones();
    });

    tbody.addEventListener('change', (e) => {
        if (!e.target.matches('.seccion-enabled-toggle')) return;
        const sec = seccionesAdminDemo.find(item => item.id === e.target.dataset.id);
        if (!sec) return;
        sec.habilitada = e.target.checked;
        renderizarTablaSecciones();
    });

    tbody.addEventListener('click', (e) => {
        const btnVer = e.target.closest('[data-filter-curso]');
        if (!btnVer) return;
        const cursoNombre = btnVer.dataset.filterCurso;
        const btnEstudiantes = document.querySelector('.nav-btn[data-module="Estudiantes"]');
        seleccionarModulo('Estudiantes', btnEstudiantes, `curso:${cursoNombre}`);
    });

    btnAsignarEstudiante.addEventListener('click', () => {
        const cedula = selEstudianteAsignar.value;
        const seccionDestino = selSeccionDestino.value;
        const est = estudiantesAdminDemo.find(item => item.cedula === cedula);
        const sec = seccionesAdminDemo.find(item => item.nombre === seccionDestino);

        if (!est || !sec) return;
        est.curso = sec.nombre;
        est.nivel = sec.nivel;
        feedback.hidden = false;
        feedback.textContent = `${est.nombre} (${est.cedula}) asignado(a) a la sección "${sec.nombre}".`;
        renderizarTablaSecciones();
    });

    renderizarTablaSecciones();
}

// ================= MÓDULO MATERIAS (ADMINISTRACIÓN) =================
function inicializarModuloMaterias(contenedor) {
    const selCurso = contenedor.querySelector('#materia-curso-select');
    const selMateria = contenedor.querySelector('#materia-fija-select');
    const selDocente = contenedor.querySelector('#materia-docente-select');
    const selDia = contenedor.querySelector('#materia-dia-select');
    const selBloque = contenedor.querySelector('#materia-bloque-select');
    const formAsignar = contenedor.querySelector('#materia-assign-form');
    const feedback = contenedor.querySelector('#materia-feedback');

    const filtroDocente = contenedor.querySelector('#filter-materia-docente');
    const filtroCurso = contenedor.querySelector('#filter-materia-curso');
    const inpBuscar = contenedor.querySelector('#search-materia');
    const contador = contenedor.querySelector('#materias-admin-count');
    const tbody = contenedor.querySelector('#materias-admin-tbody');

    function poblarSelectsMaterias() {
        const cursosLiceo = seccionesAdminDemo.filter(s => s.habilitada && s.nivel === 'Liceo');
        const docentesActivos = docentesAdminDemo.filter(d => d.estado && d.nivel !== 'Primaria');

        selCurso.replaceChildren();
        cursosLiceo.forEach(c => selCurso.add(new Option(c.nombre, c.nombre)));

        selMateria.replaceChildren();
        materiasFijasLiceo.forEach(m => selMateria.add(new Option(m, m)));

        selDocente.replaceChildren();
        docentesActivos.forEach(d => selDocente.add(new Option(`${d.nombre} (${d.cargo})`, d.nombre)));

        const docentePrev = filtroDocente.value;
        const cursoPrev = filtroCurso.value;

        filtroDocente.replaceChildren(new Option('Todos los docentes', ''));
        [...new Set(asignacionesMateriasDemo.map(a => a.docente))].forEach(d => {
            filtroDocente.add(new Option(d, d));
        });

        filtroCurso.replaceChildren(new Option('Todos los cursos', ''));
        cursosLiceo.forEach(c => filtroCurso.add(new Option(c.nombre, c.nombre)));

        if ([...filtroDocente.options].some(o => o.value === docentePrev)) filtroDocente.value = docentePrev;
        if ([...filtroCurso.options].some(o => o.value === cursoPrev)) filtroCurso.value = cursoPrev;
    }

    function renderizarTablaAsignaciones() {
        const docFiltro = filtroDocente.value;
        const cursoFiltro = filtroCurso.value;
        const q = normalizarBusquedaAdmin(inpBuscar.value);

        const filtradas = asignacionesMateriasDemo.filter(item => {
            if (docFiltro && item.docente !== docFiltro) return false;
            if (cursoFiltro && item.curso !== cursoFiltro) return false;
            if (q && !normalizarBusquedaAdmin(`${item.materia} ${item.curso} ${item.docente} ${item.dia} ${item.bloque}`).includes(q)) {
                return false;
            }
            return true;
        });

        tbody.replaceChildren();

        if (!filtradas.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="6" style="text-align:center; padding: 18px; color: #777;">No hay asignaciones de materias que coincidan con el filtro.</td>';
            tbody.appendChild(tr);
        } else {
            filtradas.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.materia}</strong></td>
                    <td>${item.curso}</td>
                    <td>${item.docente}</td>
                    <td>${item.dia}</td>
                    <td><span class="materia-bloque-tag">${item.bloque}</span></td>
                    <td>
                        <button type="button" class="materia-remove-btn" data-remove-id="${item.id}">Quitar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        contador.textContent = `${filtradas.length} ${filtradas.length === 1 ? 'asignación activa' : 'asignaciones activas'} · ${materiasFijasLiceo.length} materias fijas`;
    }

    formAsignar.addEventListener('submit', (e) => {
        e.preventDefault();
        const curso = selCurso.value;
        const materia = selMateria.value;
        const docente = selDocente.value;
        const dia = selDia.value;
        const bloque = selBloque.value;

        if (!curso || !materia || !docente) return;

        const existente = asignacionesMateriasDemo.find(
            a => a.curso === curso && normalizarBusquedaAdmin(a.materia) === normalizarBusquedaAdmin(materia)
        );

        if (existente) {
            existente.docente = docente;
            existente.dia = dia;
            existente.bloque = bloque;
            feedback.textContent = `Actualizada la asignación de "${materia}" en ${curso} (${docente} · ${dia} ${bloque}).`;
        } else {
            asignacionesMateriasDemo.unshift({
                id: `ASG-${Date.now().toString().slice(-4)}`,
                curso,
                materia,
                docente,
                dia,
                bloque
            });
            feedback.textContent = `Asignada "${materia}" a ${curso} con ${docente} (${dia} ${bloque}).`;
        }

        feedback.hidden = false;
        poblarSelectsMaterias();
        renderizarTablaAsignaciones();
    });

    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-id]');
        if (!btn) return;
        const idx = asignacionesMateriasDemo.findIndex(a => a.id === btn.dataset.removeId);
        if (idx !== -1) {
            asignacionesMateriasDemo.splice(idx, 1);
            poblarSelectsMaterias();
            renderizarTablaAsignaciones();
        }
    });

    [filtroDocente, filtroCurso, inpBuscar].forEach(el => {
        el.addEventListener('change', renderizarTablaAsignaciones);
        el.addEventListener('input', renderizarTablaAsignaciones);
    });

    poblarSelectsMaterias();
    renderizarTablaAsignaciones();
}

// ================= 4. CARGA DINÁMICA DE MÓDULOS =================
function seleccionarModulo(modulo, boton, subvista = '') {
    activarBoton(boton);
    const contenedor = document.getElementById('main-content');

    mostrarCargaModulo(contenedor, () => {
        let contenidoInterno = `
            <div class="widget">
                <p>Espacio de trabajo para <strong>${modulo}</strong>${subvista ? ` (${subvista})` : ''}. Aquí se cargarán los formularios y registros desde PostgreSQL vía Eel.</p>
            </div>
        `;

        if (modulo === 'Notas') {
            contenidoInterno = `
                <div class="widget" style="margin-bottom: 20px;">
                    <div class="admin-filters-grid">
                        <div class="section-select" id="grade-section-select">
                            <span class="admin-label">Filtrar tabla por sección</span>
                            <div class="section-select-control">
                                <button type="button" class="section-select-toggle" id="grade-section-toggle" aria-haspopup="true" aria-expanded="false">
                                    <span id="grade-section-selected-label">Selecciona una sección</span>
                                    <span>▼</span>
                                </button>
                                <div class="section-select-menu" id="grade-section-menu" hidden>
                                    <p class="section-select-empty" id="grade-section-empty">No hay secciones registradas.</p>
                                    <div class="section-select-options" id="grade-section-options"></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="admin-label" for="grade-student-search">Buscar estudiante en la sección</label>
                            <input id="grade-student-search" class="admin-input" type="search" placeholder="Nombre o cédula del estudiante...">
                        </div>
                    </div>
                </div>

                <div class="widget" id="grades-table-panel" hidden>
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Cédula</th>
                                <th>Alumno</th>
                                <th>Momento 1</th>
                                <th>Momento 2</th>
                                <th>Momento 3</th>
                                <th>Definitiva</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr data-section="1er año a">
                                <td>V-32.145.890</td>
                                <td>Pérez, María</td>
                                <td><input type="number" min="1" max="20" class="grade-lapso-input" placeholder="00"></td>
                                <td><input type="number" min="1" max="20" class="grade-lapso-input" placeholder="00"></td>
                                <td><input type="number" min="1" max="20" class="grade-lapso-input" placeholder="00"></td>
                                <td class="grade-final"><strong>—</strong></td>
                            </tr>
                            <tr data-section="1er año a">
                                <td>V-31.987.654</td>
                                <td>Gómez, Carlos</td>
                                <td><input type="number" min="1" max="20" class="grade-lapso-input" placeholder="00"></td>
                                <td><input type="number" min="1" max="20" class="grade-lapso-input" placeholder="00"></td>
                                <td><input type="number" min="1" max="20" class="grade-lapso-input" placeholder="00"></td>
                                <td class="grade-final"><strong>—</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (modulo === 'Materias') {
            contenidoInterno = `
                <section class="materias-admin-module">
                    <div class="widget">
                        <h3>Asignar Materia Fija, Docente y Horario por Curso</h3>
                        <form id="materia-assign-form" class="materias-assign-grid">
                            <div class="students-filter-field">
                                <label class="admin-label" for="materia-curso-select">Curso / Sección</label>
                                <select id="materia-curso-select" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="materia-fija-select">Materia (Malla fija)</label>
                                <select id="materia-fija-select" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="materia-docente-select">Docente asignado</label>
                                <select id="materia-docente-select" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="materia-dia-select">Día</label>
                                <select id="materia-dia-select" class="students-select">
                                    <option value="Lunes">Lunes</option>
                                    <option value="Martes">Martes</option>
                                    <option value="Miércoles">Miércoles</option>
                                    <option value="Jueves">Jueves</option>
                                    <option value="Viernes">Viernes</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="materia-bloque-select">Bloque horario</label>
                                <select id="materia-bloque-select" class="students-select">
                                    <option value="7:00 – 8:20">7:00 – 8:20</option>
                                    <option value="8:30 – 9:50">8:30 – 9:50</option>
                                    <option value="10:00 – 11:20">10:00 – 11:20</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <button type="submit" class="btn-amarillo secciones-submit-btn">Guardar asignación</button>
                            </div>
                        </form>
                        <p id="materia-feedback" class="students-enrollment-feedback" hidden></p>
                    </div>

                    <div class="widget">
                        <div class="materias-filter-bar">
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-materia-docente">Vista por docente</label>
                                <select id="filter-materia-docente" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-materia-curso">Curso / Sección</label>
                                <select id="filter-materia-curso" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="search-materia">Buscar materia, docente o bloque</label>
                                <input id="search-materia" class="admin-input" type="search" placeholder="Ej. Matemática, Ruiz o 7:00...">
                            </div>
                        </div>

                        <div class="students-admin-actions-bar" style="margin-bottom: 12px; border-top: none; padding-top: 0;">
                            <span id="materias-admin-count" class="students-admin-count" role="status" aria-live="polite"></span>
                        </div>

                        <div class="grade-table-scroll">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Materia</th>
                                        <th>Curso / Sección</th>
                                        <th>Docente</th>
                                        <th>Día</th>
                                        <th>Horario / Bloque</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="materias-admin-tbody"></tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;
        }

        if (modulo === 'Secciones') {
            contenidoInterno = `
                <section class="secciones-admin-module">
                    <div class="widget">
                        <h3>Crear o Habilitar Sección (Primaria / Liceo)</h3>
                        <form id="seccion-create-form" class="secciones-create-grid">
                            <div class="students-filter-field">
                                <label class="admin-label">Nivel</label>
                                <select name="nivel" class="students-select">
                                    <option value="Liceo">Media General (Liceo)</option>
                                    <option value="Primaria">Educación Básica (Primaria)</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Grado o Año</label>
                                <input type="text" name="etapa" class="admin-input" placeholder="Ej. 1er Año o 1er Grado" required>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Sección</label>
                                <input type="text" name="letra" class="admin-input" maxlength="3" placeholder="Ej. A, B, C" required>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Cupo / Matrícula</label>
                                <input type="number" name="cupo" class="admin-input" min="5" max="60" value="35" required>
                            </div>
                            <div class="students-filter-field">
                                <button type="submit" class="btn-amarillo secciones-submit-btn">+ Agregar Sección</button>
                            </div>
                        </form>

                        <div class="secciones-assign-student-box">
                            <span class="admin-label">Asignar / mover estudiante registrado a una sección</span>
                            <div class="secciones-assign-row">
                                <select id="assign-student-select" class="students-select"></select>
                                <select id="assign-section-select" class="students-select"></select>
                                <button type="button" class="docente-edit-btn secciones-assign-btn" id="btn-assign-student-section">Asignar a sección</button>
                            </div>
                        </div>

                        <p id="seccion-feedback" class="students-enrollment-feedback" hidden></p>
                    </div>

                    <div class="widget">
                        <div class="secciones-filter-bar">
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-seccion-nivel">Nivel</label>
                                <select id="filter-seccion-nivel" class="students-select">
                                    <option value="">Todos los niveles</option>
                                    <option value="Primaria">Primaria</option>
                                    <option value="Liceo">Liceo</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="search-seccion">Buscar sección</label>
                                <input id="search-seccion" class="admin-input" type="search" placeholder="Ej. 1er Año A o 2do Grado...">
                            </div>
                            <span id="secciones-admin-count" class="students-admin-count" role="status" aria-live="polite"></span>
                        </div>

                        <div class="grade-table-scroll">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Sección</th>
                                        <th>Nivel</th>
                                        <th>Estudiantes</th>
                                        <th>Disponibilidad</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="secciones-admin-tbody"></tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;
        }

        if (modulo === 'Docentes') {
            contenidoInterno = `
                <section class="docentes-admin-module">
                    <div class="widget docentes-admin-toolbar">
                        <div class="docentes-filters-grid">
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-docente-nivel">Nivel</label>
                                <select id="filter-docente-nivel" class="students-select">
                                    <option value="">Todos los niveles</option>
                                    <option value="Primaria">Primaria</option>
                                    <option value="Liceo">Liceo</option>
                                    <option value="Ambos">Ambos niveles</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-docente-estado">Participación</label>
                                <select id="filter-docente-estado" class="students-select">
                                    <option value="">Todos</option>
                                    <option value="activo">Activos</option>
                                    <option value="inactivo">Deshabilitados</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="search-docente">Buscar por nombre, cédula o cargo</label>
                                <input id="search-docente" class="admin-input" type="search" placeholder="Ej. Rojas, V-14.852.369 o Coordinador...">
                            </div>
                        </div>

                        <div class="students-admin-actions-bar">
                            <span id="docentes-admin-count" class="students-admin-count" role="status" aria-live="polite"></span>
                            <button type="button" class="btn-amarillo students-enroll-toggle-btn" id="btn-toggle-docente-form">+ Registrar Docente</button>
                        </div>
                    </div>

                    <div class="widget docentes-form-card" id="docente-form-card" hidden>
                        <h3 id="docente-form-title">Registrar Nuevo Docente</h3>
                        <form id="docente-form" class="docentes-form-grid">
                            <div class="students-filter-field">
                                <label class="admin-label">Cédula de Identidad</label>
                                <input type="text" name="cedula" class="admin-input" placeholder="Ej. V-19.450.123" required>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Apellidos y Nombres</label>
                                <input type="text" name="nombre" class="admin-input" placeholder="Ej. González, Angher" required>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Nivel de desempeño</label>
                                <select name="nivel" class="students-select">
                                    <option value="Liceo">Media General (Liceo)</option>
                                    <option value="Primaria">Educación Básica (Primaria)</option>
                                    <option value="Ambos">Ambos niveles</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Cargo / Rol</label>
                                <input type="text" name="cargo" class="admin-input" placeholder="Ej. Docente • Media General" required>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Teléfono de contacto</label>
                                <input type="text" name="telefono" class="admin-input" placeholder="Ej. +58 412-0000000">
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Estado en el plantel</label>
                                <select name="estado" class="students-select">
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Deshabilitado</option>
                                </select>
                            </div>
                            <div class="docentes-form-actions">
                                <button type="button" class="docente-cancel-btn" id="btn-cancel-docente-edit" hidden>Cancelar</button>
                                <button type="submit" class="btn-amarillo">Guardar docente</button>
                            </div>
                        </form>
                    </div>

                    <p id="docente-form-feedback" class="students-enrollment-feedback" hidden></p>

                    <div class="widget">
                        <div class="grade-table-scroll">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Cédula</th>
                                        <th>Apellidos y Nombres</th>
                                        <th>Nivel</th>
                                        <th>Cargo</th>
                                        <th>Teléfono</th>
                                        <th>Estado</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="docentes-admin-tbody"></tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;
        }

        if (modulo === 'Estudiantes') {
            contenidoInterno = `
                <section class="students-admin-module">
                    <div class="widget students-admin-toolbar-card">
                        <div class="students-level-tabs" role="tablist" aria-label="Nivel educativo">
                            <button type="button" class="students-level-tab is-active" role="tab" aria-selected="true" data-level-tab="general">Todos los Niveles (General)</button>
                            <button type="button" class="students-level-tab" role="tab" aria-selected="false" data-level-tab="primaria">Educación Básica (Primaria)</button>
                            <button type="button" class="students-level-tab" role="tab" aria-selected="false" data-level-tab="liceo">Educación Media (Liceo)</button>
                        </div>

                        <div class="students-filters-row" id="filters-general">
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-general-nivel">Nivel educativo</label>
                                <select id="filter-general-nivel" class="students-select">
                                    <option value="">Todos los niveles</option>
                                    <option value="Primaria">Primaria</option>
                                    <option value="Liceo">Liceo</option>
                                </select>
                            </div>
                            <div class="students-filter-field students-filter-field--wide">
                                <label class="admin-label" for="search-general">Búsqueda individual por Nombre o Cédula</label>
                                <input id="search-general" class="admin-input" type="search" placeholder="Escribe cédula, nombre, grado/año o docente...">
                            </div>
                        </div>

                        <div class="students-filters-row" id="filters-primaria" hidden>
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-primaria-grado">Grado y Sección</label>
                                <select id="filter-primaria-grado" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-primaria-docente">Docente de Aula</label>
                                <select id="filter-primaria-docente" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="search-primaria">Búsqueda por Nombre o Cédula</label>
                                <input id="search-primaria" class="admin-input" type="search" placeholder="Cédula o nombre del estudiante...">
                            </div>
                        </div>

                        <div class="students-filters-row students-filters-row--liceo" id="filters-liceo" hidden>
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-liceo-ano">Año y Sección</label>
                                <select id="filter-liceo-ano" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-liceo-materia">Materia</label>
                                <select id="filter-liceo-materia" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="filter-liceo-docente">Docente</label>
                                <select id="filter-liceo-docente" class="students-select"></select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label" for="search-liceo">Búsqueda por Nombre o Cédula</label>
                                <input id="search-liceo" class="admin-input" type="search" placeholder="Cédula o nombre...">
                            </div>
                        </div>

                        <div class="students-admin-actions-bar">
                            <span id="students-admin-count" class="students-admin-count" role="status" aria-live="polite"></span>
                            <button type="button" class="btn-amarillo students-enroll-toggle-btn" id="btn-toggle-inscripcion">+ Inscribir / Actualizar Estudiante</button>
                        </div>
                    </div>

                    <div class="widget students-enrollment-card" id="student-enrollment-card" hidden>
                        <h3>Inscripción o Prosecución Estudiantil</h3>
                        <form id="student-enrollment-form" class="students-enrollment-grid">
                            <div class="students-filter-field">
                                <label class="admin-label">Tipo de inscripción</label>
                                <select name="tipo_inscripcion" class="students-select">
                                    <option value="nuevo">Nuevo ingreso</option>
                                    <option value="regular">Estudiante regular (cambio de año/grado)</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Nivel</label>
                                <select name="nivel" class="students-select">
                                    <option value="Liceo">Media General (Liceo)</option>
                                    <option value="Primaria">Educación Básica (Primaria)</option>
                                </select>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Cédula (V / E)</label>
                                <input type="text" name="cedula" class="admin-input" placeholder="Ej. V-33.450.120" required>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Apellidos y Nombres</label>
                                <input type="text" name="nombre" class="admin-input" placeholder="Ej. Ramírez, Sofía" required>
                            </div>
                            <div class="students-filter-field">
                                <label class="admin-label">Grado o Año y Sección</label>
                                <input type="text" name="curso" class="admin-input" placeholder="Ej. 2do Año A o 3er Grado A" required>
                            </div>
                            <div class="students-filter-field students-enrollment-submit">
                                <button type="submit" class="btn-amarillo">Guardar inscripción</button>
                            </div>
                        </form>
                        <p id="student-enrollment-feedback" class="students-enrollment-feedback" hidden></p>
                    </div>

                    <div class="widget students-table-card">
                        <div class="grade-table-scroll">
                            <table class="admin-table students-admin-table">
                                <thead id="students-admin-thead"></thead>
                                <tbody id="students-admin-tbody"></tbody>
                            </table>
                        </div>
                    </div>
                </section>
            `;
        }

        const configuracionEncabezadoAdmin = {
            Estudiantes: {
                subtitulo: 'Registro, inscripción y consulta estudiantil',
                descripcion: 'Filtra por nivel educativo, grado/año, docente o materia, y gestiona inscripciones nuevas o regulares.',
                icono: 'img/img_estudiante.png',
                marcaClase: 'home-module-mark'
            },
            Docentes: {
                subtitulo: 'Nómina, cargos y estado del personal docente',
                descripcion: 'Registra nuevos docentes, ajusta nombres o cargos y deshabilita los que ya no participan en el plantel.',
                icono: 'img/img_profesor.png',
                marcaClase: 'grade-module-mark'
            },
            Secciones: {
                subtitulo: 'Organización de grados, años y grupos',
                descripcion: 'Crea secciones de Primaria y Liceo, asigna estudiantes y deja los cursos listos para materias y docentes.',
                icono: 'img/img_secciones.png',
                marcaClase: 'home-module-mark'
            },
            Materias: {
                subtitulo: 'Asignación por docente, curso y bloque horario',
                descripcion: 'Las materias de la malla son fijas; aquí defines qué docente imparte cada asignatura y en qué horario lo ve.',
                icono: 'img/img_materias.png',
                marcaClase: 'schedule-module-mark'
            },
            Notas: {
                subtitulo: 'Supervisión y carga de calificaciones',
                descripcion: 'Filtra por sección o busca estudiantes para revisar y registrar calificaciones por momento.',
                icono: 'img/img_notas.png',
                marcaClase: 'grade-module-mark'
            }
        }[modulo];

        const encabezadoModulo = configuracionEncabezadoAdmin
            ? `
                <div class="welcome-banner course-module-banner">
                    <div>
                        <span class="course-eyebrow">PERÍODO ACADÉMICO 2026–2027</span>
                        <h1>Módulo: ${modulo}</h1>
                        <h2>${configuracionEncabezadoAdmin.subtitulo}</h2>
                        <p class="course-module-description">${configuracionEncabezadoAdmin.descripcion}</p>
                    </div>
                    <span class="course-catalog-mark ${configuracionEncabezadoAdmin.marcaClase || ''}" aria-hidden="true">
                        <img src="${configuracionEncabezadoAdmin.icono}" alt="">
                    </span>
                </div>
            `
            : `
                <div class="welcome-banner course-module-banner">
                    <div>
                        <span class="course-eyebrow">PERÍODO ACADÉMICO 2026–2027</span>
                        <h1>Módulo: ${modulo}</h1>
                        <h2>Administración • C.E.E. Nelson Mandela</h2>
                        <p class="course-module-description">Espacio de gestión administrativa del plantel.</p>
                    </div>
                    <span class="course-catalog-mark home-module-mark" aria-hidden="true">
                        <img src="img/img_inicio.png" alt="">
                    </span>
                </div>
            `;

        contenedor.innerHTML = `
            ${encabezadoModulo}
            ${contenidoInterno}
        `;

        if (modulo === 'Materias') {
            inicializarModuloMaterias(contenedor);
        }

        if (modulo === 'Secciones') {
            inicializarModuloSecciones(contenedor);
        }

        if (modulo === 'Docentes') {
            inicializarModuloDocentes(contenedor);
        }

        if (modulo === 'Estudiantes') {
            inicializarModuloEstudiantes(contenedor, subvista);
        }

        if (modulo === 'Notas') {
            const tabla = contenedor.querySelector('.admin-table');
            const cuerpoTabla = tabla.querySelector('tbody');
            const panelTabla = contenedor.querySelector('#grades-table-panel');
            const btnSecciones = contenedor.querySelector('#grade-section-toggle');
            const menuSecciones = contenedor.querySelector('#grade-section-menu');
            const opcionesSeccion = contenedor.querySelector('#grade-section-options');
            const filtroEstudiante = contenedor.querySelector('#grade-student-search');

            renderizarOpcionesSeccion();

            function normalizar(texto) {
                return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            }

            function filtrarFilas() {
                const filas = Array.from(cuerpoTabla.querySelectorAll('tr')).filter(f => !f.classList.contains('no-results'));
                const consulta = normalizar(filtroEstudiante.value);
                const seleccionada = opcionesSeccion.querySelector('.section-option-input:checked');
                const seccionVal = seleccionada ? normalizar(seleccionada.value) : '';
                let visibles = 0;

                panelTabla.hidden = !seccionVal;

                filas.forEach(fila => {
                    const textoFila = normalizar(fila.textContent);
                    const seccionFila = normalizar(fila.dataset.section || '');
                    const mostrar = textoFila.includes(consulta) && seccionFila === seccionVal;
                    fila.hidden = !mostrar;
                    if (mostrar) visibles++;
                });

                let msgVacio = cuerpoTabla.querySelector('.no-results');
                if (seccionVal && visibles === 0) {
                    if (!msgVacio) {
                        msgVacio = document.createElement('tr');
                        msgVacio.className = 'no-results';
                        msgVacio.innerHTML = '<td colspan="6" style="text-align:center; padding: 15px; color: #777;">No hay estudiantes cargados en esta sección aún.</td>';
                        cuerpoTabla.appendChild(msgVacio);
                    }
                } else if (msgVacio) {
                    msgVacio.remove();
                }
            }

            aplicarFiltroTablaCalificaciones = filtrarFilas;

            btnSecciones.addEventListener('click', () => {
                const abierto = btnSecciones.getAttribute('aria-expanded') === 'true';
                menuSecciones.hidden = abierto;
                btnSecciones.setAttribute('aria-expanded', String(!abierto));
            });

            opcionesSeccion.addEventListener('change', (e) => {
                if (!e.target.matches('.section-option-input')) return;
                contenedor.querySelector('#grade-section-selected-label').textContent = e.target.value;
                menuSecciones.hidden = true;
                btnSecciones.setAttribute('aria-expanded', 'false');
                filtrarFilas();
            });

            filtroEstudiante.addEventListener('input', filtrarFilas);

            tabla.addEventListener('input', (e) => {
                if (!e.target.matches('.grade-lapso-input')) return;
                const fila = e.target.closest('tr');
                const inputs = Array.from(fila.querySelectorAll('.grade-lapso-input'));
                const notas = inputs.map(i => i.value.trim() === '' ? null : Number(i.value));
                const celdaDef = fila.querySelector('.grade-final strong');

                if (notas.some(n => n === null || isNaN(n))) {
                    celdaDef.textContent = '—';
                    return;
                }
                const promedio = notas.reduce((acc, val) => acc + val, 0) / 3;
                celdaDef.textContent = promedio.toFixed(2);
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

function enviarConsultaIA(texto) {
    if (!texto.trim()) return;

    agregarBurbuja(texto, 'user');
    document.getElementById('chat-input').value = '';

    setTimeout(() => {
        agregarBurbuja(`Consultando base de datos local sobre: "<em>${texto}</em>"...`, 'ai');
    }, 400);
}

// ================= 6. EVENTOS GLOBALES =================
document.getElementById('actions-nav').addEventListener('click', (event) => {
    const boton = event.target.closest('.nav-btn');
    if (!boton) return;

    if (boton.dataset.action === 'home') {
        mostrarInicio(boton);
    } else if (boton.dataset.module) {
        seleccionarModulo(boton.dataset.module, boton);
    }
});

document.getElementById('main-content').addEventListener('click', (event) => {
    const botonRapido = event.target.closest('[data-module]');
    if (!botonRapido) return;

    const nombreModulo = botonRapido.dataset.module;
    const subvista = botonRapido.dataset.subview || '';
    const botonLateral = document.querySelector(`.nav-btn[data-module="${nombreModulo}"]`);
    seleccionarModulo(nombreModulo, botonLateral, subvista);
});

document.querySelectorAll('[data-chat-toggle]').forEach(el => {
    el.addEventListener('click', toggleChatIA);
});

document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    enviarConsultaIA(document.getElementById('chat-input').value);
});

document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => enviarConsultaIA(chip.dataset.suggestion));
});

document.addEventListener('click', (event) => {
    const selectorSecciones = document.getElementById('grade-section-select');
    if (selectorSecciones && !selectorSecciones.contains(event.target)) {
        const btn = document.getElementById('grade-section-toggle');
        const menu = document.getElementById('grade-section-menu');
        if (menu) menu.hidden = true;
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

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
        const menuSec = document.getElementById('grade-section-menu');
        const btnSec = document.getElementById('grade-section-toggle');
        if (menuSec && !menuSec.hidden) {
            menuSec.hidden = true;
            btnSec.setAttribute('aria-expanded', 'false');
        }
        const menuCed = document.getElementById('student-id-type-menu');
        const btnCed = document.getElementById('student-id-type');
        if (menuCed && !menuCed.hidden) {
            menuCed.hidden = true;
            btnCed.setAttribute('aria-expanded', 'false');
        }
    }
});