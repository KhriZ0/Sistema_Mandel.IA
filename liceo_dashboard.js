// ================= ESTADO GLOBAL Y VARIABLES DE CONTROL =================
const usuarioSesion = new URLSearchParams(window.location.search).get('usuario') || 'Docente';
document.querySelectorAll('[data-session-user]').forEach(elemento => {
    elemento.textContent = usuarioSesion;
});

let temporizadorCargaModulo = null;
let observadorTablaCalificaciones = null;
let seccionesAsignadasDocente = []; // Se llenará desde Python/Eel según el docente logueado
let aplicarFiltroTablaCalificaciones = null;

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
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.75h7l4 4v12.5H7z"/><path d="M14 3.75v4h4M10 12h5M10 16h5"/></svg>
                            </span>
                            <span>Cargar notas</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--schedule" data-module="Ver Horarios">
                            <span class="shortcut-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2"/></svg>
                            </span>
                            <span>Ver Horario</span>
                        </button>
                        <button type="button" class="shortcut-button shortcut-button--courses" data-module="Consultar Estudiantes">
                            <span class="shortcut-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5v15M8 7h8M8 11h8"/></svg>
                            </span>
                            <span>Cursos</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="charts-row">
                <div class="chart-box">
                    <h3>Secciones Asignadas</h3>
                    <p style="margin-top: 8px; font-size: 14px; color: #666;">Cantidad de secciones bajo tu carga académica en Media General.</p>
                </div>
                <div class="chart-box">
                    <h3>Horarios de Clase</h3>
                    <p style="margin-top: 8px; font-size: 14px; color: #666;">Bloques horarios y aulas asignadas para la semana.</p>
                </div>
            </div>
        `;
    });
}

// ================= 3. SELECTORES DE SECCIÓN (LÓGICA DE CHRIS) =================
function renderizarOpcionesSeccion() {
    const listaOpciones = document.getElementById('grade-section-options');
    if (!listaOpciones) return;

    const opcionActual = listaOpciones.querySelector('.section-option-input:checked');
    const seccionActual = opcionActual ? opcionActual.value : '';
    const secciones = [...new Set(seccionesAsignadasDocente.map(s => String(s).trim()).filter(Boolean))];
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

// Función lista para ser llamada desde Python vía Eel: eel.actualizarSeccionesAsignadas(['1er Año A', '3er Año B'])
function actualizarSeccionesAsignadas(secciones) {
    if (!Array.isArray(secciones)) {
        throw new TypeError('Las secciones asignadas deben proporcionarse como una lista.');
    }
    seccionesAsignadasDocente = secciones;
    renderizarOpcionesSeccion();
    if (aplicarFiltroTablaCalificaciones) aplicarFiltroTablaCalificaciones();
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
                <div class="widget" style="margin-bottom: 20px;">
                    <div class="admin-filters-grid">
                        <div class="section-select" id="grade-section-select">
                            <span class="admin-label">Filtrar tabla por sección asignada</span>
                            <div class="section-select-control">
                                <button type="button" class="section-select-toggle" id="grade-section-toggle" aria-haspopup="true" aria-expanded="false">
                                    <span id="grade-section-selected-label">Selecciona una sección</span>
                                    <span>▼</span>
                                </button>
                                <div class="section-select-menu" id="grade-section-menu" hidden>
                                    <p class="section-select-empty" id="grade-section-empty" style="font-size: 13px; color: #777; padding: 6px;">Actualmente no cuentas con una sección asignada.</p>
                                    <div class="section-select-options" id="grade-section-options"></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="admin-label" for="grade-student-search">Buscar estudiante en tu sección</label>
                            <input id="grade-student-search" class="admin-input" type="search" placeholder="Nombre o cédula del estudiante...">
                        </div>
                    </div>
                </div>

                <div class="widget" id="grades-table-panel" hidden>
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
                                <td colspan="7" class="grades-empty-state" style="text-align: center; padding: 15px; color: #777;">Los estudiantes aparecerán aquí al conectar la base de datos.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        // --- MÓDULO: CONSULTAR ESTUDIANTES (Listado de su sección) ---
        if (modulo === 'Consultar Estudiantes') {
            contenidoModulo = `
                <div class="widget">
                    <label class="admin-label" for="student-search">Buscar estudiante en tus secciones</label>
                    <div class="student-search-control">
                        <div class="student-id-type-picker" id="student-id-type-picker">
                            <button type="button" class="student-id-type" id="student-id-type" data-id-type="V" aria-expanded="false">V</button>
                            <div class="student-id-type-menu" id="student-id-type-menu" hidden>
                                <button type="button" data-id-type-option="V">V</button>
                                <button type="button" data-id-type-option="E">E</button>
                            </div>
                        </div>
                        <input id="student-search" class="admin-input-clean" type="search" placeholder="Nombre o cédula del estudiante...">
                        <button type="button" class="btn-amarillo" id="btn-ejecutar-busqueda">Buscar</button>
                    </div>
                    <p style="font-size: 12px; color: #777; margin-top: 8px;">Selecciona <strong>V</strong> para cédula venezolana o <strong>E</strong> para extranjera.</p>
                </div>
            `;
        }

        contenedor.innerHTML = `
            <div class="welcome-banner" style="padding: 20px 30px;">
                <h1>Módulo: ${modulo}</h1>
                <p>Gestión de Liceo • Panel Docente</p>
            </div>
            ${contenidoModulo}
        `;

        // Eventos para Consultar Estudiantes
        if (modulo === 'Consultar Estudiantes') {
            const btnTipo = contenedor.querySelector('#student-id-type');
            const menuTipo = contenedor.querySelector('#student-id-type-menu');
            
            btnTipo.addEventListener('click', () => {
                const abierto = btnTipo.getAttribute('aria-expanded') === 'true';
                menuTipo.hidden = abierto;
                btnTipo.setAttribute('aria-expanded', String(!abierto));
            });

            menuTipo.addEventListener('click', (e) => {
                const opcion = e.target.closest('[data-id-type-option]');
                if (!opcion) return;
                btnTipo.dataset.idType = opcion.dataset.idTypeOption;
                btnTipo.textContent = opcion.dataset.idTypeOption;
                menuTipo.hidden = true;
                btnTipo.setAttribute('aria-expanded', 'false');
            });
        }

        // Eventos para Cargar Calificaciones
        if (modulo === 'Cargar Calificaciones') {
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
                const filas = Array.from(cuerpoTabla.querySelectorAll('tr'))
                    .filter(f => !f.classList.contains('grades-no-results') && !f.querySelector('.grades-empty-state'));
                const consulta = normalizar(filtroEstudiante.value);
                const seleccionada = opcionesSeccion.querySelector('.section-option-input:checked');
                const seccionVal = seleccionada ? normalizar(seleccionada.value) : '';
                const filaVacia = cuerpoTabla.querySelector('.grades-empty-state');
                let coincidencias = 0;

                panelTabla.hidden = !seccionVal;

                filas.forEach(fila => {
                    const cedula = fila.cells[0] ? fila.cells[0].textContent : '';
                    const alumno = fila.cells[1] ? fila.cells[1].textContent : '';
                    const seccionFila = normalizar(fila.dataset.section || '');
                    const coincideEst = normalizar(`${cedula} ${alumno}`).includes(consulta);
                    const coincideSec = seccionVal !== '' && seccionVal === seccionFila;
                    const visible = coincideEst && coincideSec;

                    fila.hidden = !visible;
                    if (visible) coincidencias++;
                });

                if (filas.length > 0 && filaVacia) {
                    filaVacia.closest('tr').remove();
                }

                let filaSinResultados = cuerpoTabla.querySelector('.grades-no-results');
                if (seccionVal && filas.length > 0 && coincidencias === 0) {
                    if (!filaSinResultados) {
                        filaSinResultados = document.createElement('tr');
                        filaSinResultados.className = 'grades-no-results';
                        filaSinResultados.innerHTML = '<td colspan="7" class="grades-empty-state" style="text-align: center; padding: 15px; color: #777;">No se encontraron estudiantes con esos criterios.</td>';
                        cuerpoTabla.appendChild(filaSinResultados);
                    }
                } else if (filaSinResultados) {
                    filaSinResultados.remove();
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