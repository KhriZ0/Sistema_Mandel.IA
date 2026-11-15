function iniciarSesion(event) {
      event.preventDefault();
      const formulario = document.getElementById('login-form');
      if (!formulario.reportValidity() || formulario.classList.contains('is-submitting')) return;

      const boton = document.getElementById('login-submit');
      const contenedor = document.querySelector('.container');
      const estado = document.getElementById('login-status');
      const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
          window.location.href = '../dashboard_liceo/dashboard.html';
        }, movimientoReducido ? 0 : 300);
      }, movimientoReducido ? 250 : 500);
    }

    function togglePasswordVisibility() {
      const passwordInput = document.getElementById('password');
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }

    document.getElementById('login-form').addEventListener('submit', iniciarSesion);
    document.querySelector('.toggle-password').addEventListener('click', togglePasswordVisibility);
