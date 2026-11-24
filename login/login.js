async function iniciarSesion(event) {
  event.preventDefault();
  const formulario = document.getElementById('login-form');
  if (!formulario.reportValidity() || formulario.classList.contains('is-submitting')) return;

  const boton = document.getElementById('login-submit');
  const contenedor = document.querySelector('.container');
  const estado = document.getElementById('login-status');
  const labelBoton = document.getElementById('login-submit-label');
  const spinner = document.getElementById('login-submit-spinner');
  const iconoBoton = document.getElementById('login-submit-icon');
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const usuario = formulario.elements.usuario.value.trim();
  const password = formulario.elements.password.value;
  const rol = formulario.elements.rol.value;

  formulario.classList.add('is-submitting');
  formulario.setAttribute('aria-busy', 'true');
  boton.disabled = true;
  labelBoton.textContent = 'Validando...';
  spinner.hidden = false;
  iconoBoton.hidden = true;
  estado.style.color = '#6b7280';
  estado.textContent = 'Verificando credenciales en PostgreSQL...';
  estado.hidden = false;

  try {
    let resultado;

    if (window.eel && typeof window.eel.autenticar_usuario === 'function') {
      resultado = await window.eel.autenticar_usuario(usuario, password, rol)();
    } else {
      throw new Error('El servidor Python no está activo. Ejecuta: python main.py');
    }

    if (!resultado.ok) {
      formulario.classList.remove('is-submitting');
      formulario.removeAttribute('aria-busy');
      boton.disabled = false;
      labelBoton.textContent = 'Iniciar sesión';
      spinner.hidden = true;
      iconoBoton.hidden = false;
      estado.style.color = '#c71f2d';
      estado.textContent = resultado.mensaje;
      return;
    }

    estado.style.color = '#15803d';
    estado.textContent = `¡Bienvenido(a), ${resultado.usuario}! Abriendo panel...`;

    sessionStorage.setItem('mandel.usuario', resultado.usuario);
    sessionStorage.setItem('mandel.rol', resultado.rol);

    window.setTimeout(() => {
      contenedor.classList.add('login-transition-out');
      window.setTimeout(() => {
        window.location.href = resultado.destino;
      }, movimientoReducido ? 0 : 300);
    }, movimientoReducido ? 200 : 450);

  } catch (error) {
    formulario.classList.remove('is-submitting');
    formulario.removeAttribute('aria-busy');
    boton.disabled = false;
    labelBoton.textContent = 'Iniciar sesión';
    spinner.hidden = true;
    iconoBoton.hidden = false;
    estado.style.color = '#c71f2d';
    estado.textContent = error.message || 'Error de conexión con el servidor local.';
  }
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