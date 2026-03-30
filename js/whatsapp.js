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
  abrirWA(url) {
    window.open(url, '_blank');
  }
};
