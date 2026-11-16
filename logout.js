const tarjetaSalida = document.querySelector('.logout-card');
    sessionStorage.removeItem('mandel.usuario');
    sessionStorage.removeItem('mandel.rol');

    window.setTimeout(() => {
      tarjetaSalida.classList.add('is-leaving');
      window.setTimeout(() => {
            window.location.href = 'login/login.html';
      }, 300);
    }, 2400);
