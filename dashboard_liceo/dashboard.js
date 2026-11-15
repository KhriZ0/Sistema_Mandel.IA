// Reloj en tiempo real 100% offline
    function actualizarReloj() {
      const elemento = document.getElementById('live-datetime');
      if (!elemento) return;

      const ahora = new Date();
      const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
      const fechaFormateada = ahora.toLocaleDateString('es-ES', opcionesFecha);
      const horaFormateada = ahora.toLocaleTimeString('es-ES');

      elemento.textContent = `${fechaFormateada} • ${horaFormateada}`;
    }

    setInterval(actualizarReloj, 1000);
    actualizarReloj();

    // Gestión de estado activo en los botones
    function activarBoton(botonSeleccionado) {
      const botones = document.querySelectorAll('.action-btn');
      botones.forEach(btn => btn.classList.remove('active'));
      if (botonSeleccionado) {
        botonSeleccionado.classList.add('active');
      }
    }

    let temporizadorCargaModulo = null;
    let observadorTablaCalificaciones = null;
    let seccionesAsignadasDocente = [];
    let aplicarFiltroTablaCalificaciones = null;

    function renderizarOpcionesSeccion() {
      const listaOpciones = document.getElementById('grade-section-options');
      if (!listaOpciones) return;

      const opcionActual = listaOpciones.querySelector('.section-option-input:checked');
      const seccionActual = opcionActual ? opcionActual.value : '';
      const secciones = [...new Set(seccionesAsignadasDocente.map(seccion => String(seccion).trim()).filter(Boolean))];
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

    function actualizarSeccionesAsignadas(secciones) {
      if (!Array.isArray(secciones)) {
        throw new TypeError('Las secciones asignadas deben proporcionarse como una lista.');
      }

      seccionesAsignadasDocente = secciones;
      renderizarOpcionesSeccion();
      if (aplicarFiltroTablaCalificaciones) aplicarFiltroTablaCalificaciones();
    }

    function mostrarCargaModulo(contenedor, renderizar) {
      window.clearTimeout(temporizadorCargaModulo);
      contenedor.classList.remove('main-content-enter');
      if (observadorTablaCalificaciones) {
        observadorTablaCalificaciones.disconnect();
        observadorTablaCalificaciones = null;
      }
      contenedor.setAttribute('aria-busy', 'true');
      contenedor.innerHTML = `
        <div class="module-loading" role="status" aria-live="polite">
          <span class="module-loading-spinner" aria-hidden="true"></span>
          <span>Cargando módulo...</span>
        </div>
      `;

      temporizadorCargaModulo = window.setTimeout(() => {
        renderizar();
        contenedor.removeAttribute('aria-busy');
        requestAnimationFrame(() => {
          if (contenedor.getAttribute('aria-busy') !== 'true') {
            contenedor.classList.add('main-content-enter');
          }
        });
        temporizadorCargaModulo = null;
      }, 400);
    }

    // Vista Principal (Inicio)
    function mostrarInicio(boton) {
      activarBoton(boton);
      const contenedor = document.getElementById('main-content');
      mostrarCargaModulo(contenedor, () => {
        contenedor.innerHTML = `
        <div class="dashboard-header">
          <div class="welcome-box">
            <h2>¡Bienvenido(a), <span class="highlight-user">{USER}</span>!</h2>
            <p class="welcome-subtitle">Panel principal de Gestión de Liceo • C.E.E. Nelson Mandela</p>
        </div>

          <div class="user-meta-badges">
           <div class="meta-badge">
              <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <span><strong>Cargo:</strong> Docente</span>
          </div>
          <div class="meta-badge">
            <svg viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
            <span><strong>Área:</strong> Media General</span>
          </div>

        </div>
      </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">Secciones Asignadas</span>
            <span class="stat-sub">Cantidad de secciones que tienes asignadas.</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">Horarios</span>
            <span class="stat-sub">Hora de clases y salones asignados.</span>
          </div>
        </div>
      `;
      });
    }

    // Interacción visual para los módulos rápidos
    function seleccionarAccion(modulo, boton) {
      activarBoton(boton);
      const contenedor = document.getElementById('main-content');
      mostrarCargaModulo(contenedor, () => {
        const contenidoModulo = modulo === 'Cargar Calificaciones'
          ? `
            <div class="grade-filters">
              <div class="section-select" id="grade-section-select">
                <span class="student-search-label">Filtrar tabla por sección</span>
                <div class="section-select-control">
                  <button type="button" class="section-select-toggle" id="grade-section-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="grade-section-menu">
                    <span id="grade-section-selected-label">Selecciona una sección</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5z"/></svg>
                  </button>
                  <div class="section-select-menu" id="grade-section-menu" hidden>
                    <p class="section-select-empty" id="grade-section-empty">Actualmente no cuentas con una sección asignada.</p>
                    <div class="section-select-options" id="grade-section-options" role="radiogroup" aria-label="Secciones asignadas"></div>
                  </div>
                </div>
                <p class="student-search-hint" id="grade-section-hint">Elige una sección para ver la tabla.</p>
              </div>
              <div>
                <label class="student-search-label" for="grade-student-search">Buscar estudiante</label>
                <div class="student-search-control">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  <input id="grade-student-search" type="search" placeholder="Nombre o cédula del estudiante" aria-describedby="grade-student-hint">
                </div>
                <p class="student-search-hint" id="grade-student-hint">Busca por nombre o cédula.</p>
              </div>
            </div>
            <div class="grades-table-panel" id="grades-table-panel" hidden>
              <div class="grades-table-wrapper">
                <table class="grades-table">
                  <thead>
                    <tr>
                      <th scope="col">Cédula</th>
                      <th scope="col">Alumnos</th>
                      <th scope="col">Lapso 1</th>
                      <th scope="col">Lapso 2</th>
                      <th scope="col">Lapso 3</th>
                      <th scope="col">Definitiva</th>
                      <th scope="col">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="7" class="grades-empty-state">Los estudiantes aparecerán aquí al conectar la base de datos.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `
          : modulo === 'Consultar Estudiantes'
            ? `
            <div class="student-search">
              <label class="student-search-label" for="student-search">Buscar estudiante</label>
              <div class="student-search-control">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <input id="student-search" type="search" placeholder="Nombre o cédula del estudiante" aria-describedby="student-search-hint">
              </div>
              <p class="student-search-hint" id="student-search-hint">Busca por nombre o cédula del estudiante.</p>
            </div>
            `
            : '<p class="module-placeholder-text">Aquí puedes integrar los formularios, tablas o consultas correspondientes a este apartado.</p>';

        contenedor.innerHTML = `
        <div class="dashboard-header">
          <div>
            <h2>Módulo: ${modulo}</h2>
            <p>Has abierto la vista de trabajo para <strong>${modulo}</strong> dentro de Gestión de Liceo.</p>
          </div>
        </div>
        ${contenidoModulo}
      `;

      if (modulo === 'Cargar Calificaciones') {
        const tablaCalificaciones = contenedor.querySelector('.grades-table');
        const cuerpoTabla = tablaCalificaciones.querySelector('tbody');
        const panelTabla = contenedor.querySelector('#grades-table-panel');
        const botonSecciones = contenedor.querySelector('#grade-section-toggle');
        const menuSecciones = contenedor.querySelector('#grade-section-menu');
        const opcionesSeccion = contenedor.querySelector('#grade-section-options');
        const filtroEstudiante = contenedor.querySelector('#grade-student-search');

        renderizarOpcionesSeccion();

        function normalizarBusqueda(texto) {
          return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
        }

        function filtrarFilasCalificaciones() {
          const filas = Array.from(cuerpoTabla.querySelectorAll('tr'))
            .filter(fila => !fila.classList.contains('grades-no-results') && !fila.querySelector('.grades-empty-state'));
          const consultaEstudiante = normalizarBusqueda(filtroEstudiante.value);
          const opcionSeleccionada = opcionesSeccion.querySelector('.section-option-input:checked');
          const seccionSeleccionada = opcionSeleccionada ? normalizarBusqueda(opcionSeleccionada.value) : '';
          const filaVacia = cuerpoTabla.querySelector('.grades-empty-state');
          let coincidencias = 0;

          if (seccionSeleccionada && panelTabla.hidden) {
            panelTabla.hidden = false;
            panelTabla.classList.remove('grades-table-panel-enter');
            requestAnimationFrame(() => panelTabla.classList.add('grades-table-panel-enter'));
          } else if (!seccionSeleccionada) {
            panelTabla.hidden = true;
            panelTabla.classList.remove('grades-table-panel-enter');
          }

          filas.forEach(fila => {
            const cedula = fila.cells[0] ? fila.cells[0].textContent : '';
            const alumno = fila.cells[1] ? fila.cells[1].textContent : '';
            const seccion = normalizarBusqueda(fila.dataset.section || '');
            const coincideEstudiante = normalizarBusqueda(`${cedula} ${alumno}`).includes(consultaEstudiante);
            const coincideSeccion = seccionSeleccionada !== '' && seccionSeleccionada === seccion;
            const visible = coincideEstudiante && coincideSeccion;

            fila.hidden = !visible;
            if (visible) coincidencias += 1;
          });

          if (filas.length > 0 && filaVacia) {
            filaVacia.closest('tr').remove();
          }

          let filaSinResultados = cuerpoTabla.querySelector('.grades-no-results');
          if (seccionSeleccionada && filas.length > 0 && coincidencias === 0) {
            if (!filaSinResultados) {
              filaSinResultados = document.createElement('tr');
              filaSinResultados.className = 'grades-no-results';
              filaSinResultados.innerHTML = '<td colspan="7" class="grades-empty-state">No se encontraron estudiantes con esos criterios.</td>';
              cuerpoTabla.appendChild(filaSinResultados);
            }
          } else if (filaSinResultados) {
            filaSinResultados.remove();
          }
        }

        aplicarFiltroTablaCalificaciones = filtrarFilasCalificaciones;
        botonSecciones.addEventListener('click', () => {
          const abierto = botonSecciones.getAttribute('aria-expanded') === 'true';
          menuSecciones.hidden = abierto;
          botonSecciones.setAttribute('aria-expanded', String(!abierto));
        });
        opcionesSeccion.addEventListener('change', event => {
          if (!event.target.matches('.section-option-input')) return;
          contenedor.querySelector('#grade-section-selected-label').textContent = event.target.value;
          menuSecciones.hidden = true;
          botonSecciones.setAttribute('aria-expanded', 'false');
          botonSecciones.focus();
          filtrarFilasCalificaciones();
        });
        filtroEstudiante.addEventListener('input', filtrarFilasCalificaciones);
        observadorTablaCalificaciones = new MutationObserver(filtrarFilasCalificaciones);
        observadorTablaCalificaciones.observe(cuerpoTabla, { childList: true });

        tablaCalificaciones.addEventListener('input', event => {
          if (!event.target.matches('.grade-lapso-input')) return;

          const fila = event.target.closest('tr');
          const lapsos = Array.from(fila.querySelectorAll('.grade-lapso-input'))
            .map(input => input.value.trim() === '' ? null : Number(input.value));
          const definitiva = fila.querySelector('.grade-final');

          if (lapsos.length !== 3 || lapsos.some(nota => nota === null || !Number.isFinite(nota))) {
            definitiva.textContent = '—';
            return;
          }

          definitiva.textContent = (lapsos.reduce((total, nota) => total + nota, 0) / 3).toFixed(2);
        });
      }
      });
    }

    // Control de apertura/cierre de la barra lateral de MANDEL.IA
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

    // Envío de mensajes en el chat local
    function enviarMensaje(event) {
      event.preventDefault();
      const input = document.getElementById('chat-input');
      const texto = input.value.trim();
      if (!texto) return;

      agregarBurbuja(texto, 'user');
      input.value = '';

      // Simulación de respuesta local
      setTimeout(() => {
        agregarBurbuja(`Procesando consulta en la base de datos local sobre: "<em>${texto}</em>"... (Conecta aquí tu endpoint de Ollama / Python).`, 'ai');
      }, 450);
    }

    function enviarSugerencia(texto) {
      document.getElementById('chat-input').value = texto;
      enviarMensaje(new Event('submit'));
    }

    function cerrarMenuUsuario() {
      const boton = document.getElementById('user-menu-toggle');
      const menu = document.getElementById('user-menu');
      menu.hidden = true;
      boton.setAttribute('aria-expanded', 'false');
    }

    function cerrarSesion() {
      window.location.href = 'logout.html';
    }

    function abrirModuloUsuario(modulo) {
      cerrarMenuUsuario();
      seleccionarAccion(modulo, null);
    }

    const botonMenuUsuario = document.getElementById('user-menu-toggle');
    const menuUsuario = document.getElementById('user-menu');

    botonMenuUsuario.addEventListener('click', () => {
      const abierto = botonMenuUsuario.getAttribute('aria-expanded') === 'true';
      menuUsuario.hidden = abierto;
      botonMenuUsuario.setAttribute('aria-expanded', String(!abierto));
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.user-profile')) {
        cerrarMenuUsuario();
      }

      const selectorSecciones = document.getElementById('grade-section-select');
      if (selectorSecciones && !selectorSecciones.contains(event.target)) {
        const botonSecciones = document.getElementById('grade-section-toggle');
        const menuSecciones = document.getElementById('grade-section-menu');
        menuSecciones.hidden = true;
        botonSecciones.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menuUsuario.hidden) {
        cerrarMenuUsuario();
        botonMenuUsuario.focus();
      }

      const menuSecciones = document.getElementById('grade-section-menu');
      if (event.key === 'Escape' && menuSecciones && !menuSecciones.hidden) {
        menuSecciones.hidden = true;
        const botonSecciones = document.getElementById('grade-section-toggle');
        botonSecciones.setAttribute('aria-expanded', 'false');
        botonSecciones.focus();
      }
    });

    function agregarBurbuja(htmlTexto, remitente) {
      const contenedor = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = `msg-bubble ${remitente === 'user' ? 'msg-user' : 'msg-ai'}`;

      if (remitente === 'ai') {
        div.innerHTML = `<strong>MANDEL.IA</strong>${htmlTexto}`;
      } else {
        div.textContent = htmlTexto;
      }

      contenedor.appendChild(div);
      contenedor.scrollTop = contenedor.scrollHeight;
    }

    document.getElementById('actions-nav').addEventListener('click', event => {
      const boton = event.target.closest('.action-btn');
      if (!boton) return;

      if (boton.dataset.action === 'home') {
        mostrarInicio(boton);
      } else if (boton.dataset.module) {
        seleccionarAccion(boton.dataset.module, boton);
      }
    });

    document.querySelectorAll('[data-chat-toggle]').forEach(elemento => {
      elemento.addEventListener('click', toggleChatIA);

      if (elemento.classList.contains('ai-badge-header')) {
        elemento.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleChatIA();
          }
        });
      }
    });

    document.querySelectorAll('.suggestion-chip').forEach(boton => {
      boton.addEventListener('click', () => enviarSugerencia(boton.dataset.suggestion));
    });
    document.getElementById('chat-form').addEventListener('submit', enviarMensaje);

    document.getElementById('user-menu').addEventListener('click', event => {
      const boton = event.target.closest('.user-menu-item');
      if (!boton) return;

      if (boton.dataset.userModule) {
        abrirModuloUsuario(boton.dataset.userModule);
      } else if (boton.dataset.userAction === 'logout') {
        cerrarSesion();
      }
    });

    // Cargar la vista de inicio al abrir la página
    mostrarInicio(document.querySelector('.action-btn.active'));
