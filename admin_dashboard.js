// ================= ESTADO GLOBAL Y VARIABLES DE CONTROL =================
const parametrosAcceso = new URLSearchParams(window.location.search);
const usuarioSesion = parametrosAcceso.get('usuario') || 'Cira Carvajal';
document.querySelectorAll('[data-session-user]').forEach(elemento => {
    elemento.textContent = usuarioSesion;
});

let temporizadorCargaModulo = null;
let observadorTablaCalificaciones = null;
let seccionesInstitucion = ['1er Año A', '1er Año B', '2do Año A', '3er Año A', '4to Año A', '5to Año A'];
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

// ================= 2. VISTA PRINCIPAL (INICIO) =================
function mostrarInicio(boton) {
    activarBoton(boton);
    const contenedor = document.getElementById('main-content');
    
    mostrarCargaModulo(contenedor, () => {
        contenedor.innerHTML = `
            <div class="welcome-banner">
                <h1>Sub directora, ${usuarioSesion}</h1>
                <p>Gestión de datos académicos.<br>Rol: Administrador.</p>
            </div>

            <div class="widgets-row">
                <div class="widget">
                    <h3>Período académico actual</h3>
                    <p>Año escolar: 2026 - 2027 (En curso)</p>
                </div>
                <div class="widget actions">
                    <h3>Acciones rápidas</h3>
                    <div class="action-buttons">
                        <button type="button" data-module="Notas">Cargar Calificaciones</button>
                        <button type="button" data-module="Boletines">Generar Boletas</button>
                        <button type="button" data-module="Horarios">Ver Horarios</button>
                        <button type="button" data-module="Estudiantes">Consultar Estudiantes</button>
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

// ================= 4. CARGA DINÁMICA DE MÓDULOS =================
function seleccionarModulo(modulo, boton) {
    activarBoton(boton);
    const contenedor = document.getElementById('main-content');

    mostrarCargaModulo(contenedor, () => {
        let contenidoInterno = `
            <div class="widget">
                <p>Espacio de trabajo para <strong>${modulo}</strong>. Aquí se cargarán los formularios y registros desde PostgreSQL vía Eel.</p>
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

        if (modulo === 'Estudiantes') {
            contenidoInterno = `
                <div class="widget">
                    <label class="admin-label" for="student-search">Buscar estudiante en el sistema</label>
                    <div class="student-search-control">
                        <div class="student-id-type-picker" id="student-id-type-picker">
                            <button type="button" class="student-id-type" id="student-id-type" data-id-type="V" aria-expanded="false">V</button>
                            <div class="student-id-type-menu" id="student-id-type-menu" hidden>
                                <button type="button" data-id-type-option="V">V</button>
                                <button type="button" data-id-type-option="E">E</button>
                            </div>
                        </div>
                        <input id="student-search" class="admin-input-clean" type="search" placeholder="Número de cédula o nombre completo...">
                        <button type="button" class="btn-amarillo" id="btn-ejecutar-busqueda">Buscar</button>
                    </div>
                    <p style="font-size: 12px; color: #777; margin-top: 8px;">Selecciona <strong>V</strong> para cédula venezolana o <strong>E</strong> para extranjera.</p>
                </div>
            `;
        }

        contenedor.innerHTML = `
            <div class="welcome-banner" style="padding: 20px 30px;">
                <h1>Módulo: ${modulo}</h1>
                <p>Administración • C.E.E. Nelson Mandela</p>
            </div>
            ${contenidoInterno}
        `;

        if (modulo === 'Estudiantes') {
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
    const botonLateral = document.querySelector(`.nav-btn[data-module="${nombreModulo}"]`);
    seleccionarModulo(nombreModulo, botonLateral);
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