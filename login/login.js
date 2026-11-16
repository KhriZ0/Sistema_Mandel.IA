function iniciarSesion(event) {
      event.preventDefault();
      const formulario = document.getElementById('login-form');
      if (!formulario.reportValidity() || formulario.classList.contains('is-submitting')) return;

      const boton = document.getElementById('login-submit');
      const contenedor = document.querySelector('.container');
      const estado = document.getElementById('login-status');
      const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const usuario = formulario.elements.usuario.value.trim();
      const rol = formulario.elements.rol.value;
      const destino = rol === 'administracion' ? '../admin_dashboard.html' : '../liceo_dashboard.html';
      const urlDestino = new URL(destino, window.location.href);

      urlDestino.searchParams.set('usuario', usuario);
      urlDestino.searchParams.set('rol', rol);
      sessionStorage.setItem('mandel.usuario', usuario);
      sessionStorage.setItem('mandel.rol', rol);

      formulario.classList.add('is-submitting');
      formulario.setAttribute('aria-busy', 'true');
      boton.disabled = true;
      document.getElementById('login-submit-label').textContent = 'Ingresando...';
      document.getElementById('login-submit-spinner').hidden = false;
      document.getElementById('login-submit-icon').hidden = true;
      estado.hidden = false;

      window.setTimeout(() => {
        contenedor.classList.add('login-transition-out');
        window.setTimeout(() => {
          window.location.href = urlDestino.href;
        }, movimientoReducido ? 0 : 300);
      }, movimientoReducido ? 250 : 500);
    }

    function togglePasswordVisibility() {
      const passwordInput = document.getElementById('password');
      const mostrar = passwordInput.type === 'password';
      passwordInput.type = mostrar ? 'text' : 'password';

      const boton = document.querySelector('.toggle-password');
      boton.setAttribute('aria-pressed', String(mostrar));
      boton.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
    }

    document.getElementById('login-form').addEventListener('submit', iniciarSesion);
    document.querySelector('.toggle-password').addEventListener('click', togglePasswordVisibility);
