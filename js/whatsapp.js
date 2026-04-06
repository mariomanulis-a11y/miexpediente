const WA = {
  linkSolicitud(numero) {
    numero = numero || WA_CONFIG.numeroEstudio;
    const msg = encodeURIComponent(WA_CONFIG.mensaje);
    return 'https://wa.me/' + numero + '?text=' + msg;
  },
  linkInvitacion(numero, nombre, url) {
    const msg = encodeURIComponent(
      'Hola ' + nombre + ', te damos acceso a MiExpediente para que puedas consultar el estado de tu causa.\n\nIngresa con este link: ' + url + '\n\nEstudio Juridico Manulis'
    );
    return 'https://wa.me/' + numero + '?text=' + msg;
  },
  linkNovedades(numero, caratula, texto) {
    const msg = encodeURIComponent(
      'Hola, hay novedades en su causa ' + caratula + ':\n\n' + texto + '\n\nPara mas informacion ingrese a MiExpediente.'
    );
    return 'https://wa.me/' + numero + '?text=' + msg;
  },
  linkExpediente(numero, caratula, etapa, expId) {
    var base = location.origin + location.pathname.replace(/\/[^/]*$/, '/');
    var url  = base + '#/expediente-detalle?id=' + (expId || '');
    var msg = encodeURIComponent(
      '\u00a1Hola! Te damos la bienvenida a MVC Abogados. \u2696\ufe0f\n' +
      'Para seguir el avance de tu causa ' + caratula + ' en tiempo real, ingres\u00e1 aqu\u00ed: ' + url + '\n' +
      'Actualmente nos encontramos en la etapa: ' + etapa + '.\n' +
      'Pod\u00e9s ver los detalles y pasos faltantes en el link arriba. \u00a1Gracias!'
    );
    return 'https://wa.me/' + numero + '?text=' + msg;
  },
  abrirWA(url) {
    window.open(url, '_blank');
  }
};
