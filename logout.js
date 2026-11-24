const tarjetaSalida = document.querySelector('.logout-card');
sessionStorage.removeItem('mandel.usuario');
sessionStorage.removeItem('mandel.rol');

window.setTimeout(() => {
  if (tarjetaSalida) {
    tarjetaSalida.classList.add('is-leaving');
  }
  window.setTimeout(() => {
    window.location.replace('/login/login.html');
  }, 300);
}, 2400);