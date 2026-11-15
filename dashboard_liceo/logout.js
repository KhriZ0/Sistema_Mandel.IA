const tarjetaSalida = document.querySelector('.logout-card');
    window.setTimeout(() => {
      tarjetaSalida.classList.add('is-leaving');
      window.setTimeout(() => {
        window.location.href = '../login/login.html';
      }, 300);
    }, 2400);
