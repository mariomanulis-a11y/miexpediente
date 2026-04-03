// ================================================================
// etapas.js — Motor de Lógica Procesal
// Provincia de Buenos Aires y Nación
// ================================================================

var EtapasProcesales = (function () {

  // ── Base de conocimiento ───────────────────────────────────────
  var FUEROS = {

    'Civil y Comercial PBA': {
      ley:   'CPCCBA (Ley 7.425 y modif.)',
      color: '#3b82f6',
      hito:  'Sentencia Definitiva de Primera Instancia',
      etapas: [
        {
          id: 1, nombre: 'Mediación',
          definicion: 'Instancia prejudicial obligatoria (art. 730 CPCCBA y Ley 13.951). Las partes concurren ante un mediador habilitado. Si fracasa, se labra el acta y queda expedita la vía judicial.',
          pendientes: ['Demanda/Contestación','Audiencia Preliminar','Prueba','Alegatos/Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 2, nombre: 'Demanda/Contestación',
          definicion: 'Etapa de trabe de la litis. La actora presenta la demanda (art. 330 CPCCBA); la demandada contesta y opone excepciones (art. 354). Se fijan los hechos controvertidos.',
          pendientes: ['Audiencia Preliminar','Prueba','Alegatos/Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 3, nombre: 'Audiencia Preliminar',
          definicion: 'Audiencia del art. 360 CPCCBA. El juez intenta la conciliación, fija los hechos controvertidos, provee la prueba admisible y establece el plazo probatorio.',
          pendientes: ['Prueba','Alegatos/Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 4, nombre: 'Prueba',
          definicion: 'Período de producción de la prueba ofrecida y admitida: documental, testimonial, pericial, informativa, confesional. Regido por arts. 362-475 CPCCBA.',
          pendientes: ['Alegatos/Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 5, nombre: 'Alegatos/Autos para Sentencia',
          definicion: 'Concluida la prueba, las partes presentan alegatos (art. 482 CPCCBA). El juez llama autos para sentencia (art. 484). Queda cerrado el debate.',
          pendientes: ['Sentencia Definitiva']
        },
        {
          id: 6, nombre: 'Sentencia Definitiva',
          definicion: 'El juez dicta sentencia resolviendo el fondo del litigio (art. 163 CPCCBA). Es el hito final de la primera instancia. Proceden los recursos de apelación ante la Cámara.',
          pendientes: []
        },
        {
          id: 7, nombre: 'Otra / Detalle',
          definicion: 'Etapa o incidente no clasificado en el flujo principal. Se ubica cronológicamente según el acto procesal descripto.',
          pendientes: []
        }
      ]
    },

    'Laboral PBA': {
      ley:   'Ley 11.653 (modif. Ley 15.057)',
      color: '#f59e0b',
      hito:  'Sentencia (Veredicto y Fallo)',
      etapas: [
        {
          id: 1, nombre: 'Instancia Administrativa',
          definicion: 'Trámite previo obligatorio ante el Ministerio de Trabajo PBA (SECLO provincial) o la Delegación Regional. Intento de conciliación. Si fracasa, habilita la vía judicial ante el Tribunal del Trabajo.',
          pendientes: ['Demanda/Contestación','Audiencia Art. 25','Producción de Prueba','Vista de Causa','Sentencia (Veredicto y Fallo)']
        },
        {
          id: 2, nombre: 'Demanda/Contestación',
          definicion: 'La demanda se interpone ante el Tribunal del Trabajo competente (art. 22 Ley 11.653). La demandada contesta y opone excepciones. Se integra el tribunal con sus tres jueces.',
          pendientes: ['Audiencia Art. 25','Producción de Prueba','Vista de Causa','Sentencia (Veredicto y Fallo)']
        },
        {
          id: 3, nombre: 'Audiencia Art. 25',
          definicion: 'Audiencia de conciliación y apertura a prueba (art. 25 Ley 11.653). El tribunal convoca a las partes, intenta el acuerdo, y en caso de fracaso abre el período de producción probatoria.',
          pendientes: ['Producción de Prueba','Vista de Causa','Sentencia (Veredicto y Fallo)']
        },
        {
          id: 4, nombre: 'Producción de Prueba',
          definicion: 'Etapa de producción de la prueba admitida: testimonial, pericial (médica, contable), informativa (AFIP, ANSES, ART), documental. Los peritos presentan sus dictámenes.',
          pendientes: ['Vista de Causa','Sentencia (Veredicto y Fallo)']
        },
        {
          id: 5, nombre: 'Vista de Causa',
          definicion: 'Audiencia oral ante el tribunal (art. 44 Ley 11.653). Se recibe la prueba testimonial y se escuchan los alegatos de las partes. Es el acto central del proceso oral laboral bonaerense.',
          pendientes: ['Sentencia (Veredicto y Fallo)']
        },
        {
          id: 6, nombre: 'Sentencia (Veredicto y Fallo)',
          definicion: 'El tribunal emite primero el Veredicto (cuestiones de hecho, art. 47 Ley 11.653) y luego el Fallo (aplicación del derecho). Es el hito final. Proceden recursos de Inaplicabilidad de Ley ante la SCBA.',
          pendientes: []
        },
        {
          id: 7, nombre: 'Otra / Detalle',
          definicion: 'Etapa o incidente no clasificado en el flujo principal. Se ubica cronológicamente según el acto procesal descripto.',
          pendientes: []
        }
      ]
    },

    'Laboral Nación': {
      ley:   'Ley 18.345 (modif. Ley 24.635)',
      color: '#8b5cf6',
      hito:  'Sentencia Definitiva',
      etapas: [
        {
          id: 1, nombre: 'SECLO',
          definicion: 'Servicio de Conciliación Laboral Obligatoria (Ley 24.635). Instancia prejudicial ante el MTESS. El conciliador convoca a las partes. Si no hay acuerdo, se expide el certificado habilitante para demandar ante la CNAT.',
          pendientes: ['Demanda/Contestación','Audiencia Art. 80','Producción de Prueba','Alegatos Art. 94','Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 2, nombre: 'Demanda/Contestación',
          definicion: 'La demanda se interpone ante la Cámara Nacional de Apelaciones del Trabajo (CNAT), que la sortea al juzgado de primera instancia (art. 65 Ley 18.345). La demandada contesta y opone defensas.',
          pendientes: ['Audiencia Art. 80','Producción de Prueba','Alegatos Art. 94','Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 3, nombre: 'Audiencia Art. 80',
          definicion: 'Audiencia de conciliación, contestación de demanda y apertura a prueba (art. 80 Ley 18.345). El juez intenta el acuerdo, fija los hechos controvertidos y provee la prueba. Es la audiencia central del proceso.',
          pendientes: ['Producción de Prueba','Alegatos Art. 94','Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 4, nombre: 'Producción de Prueba',
          definicion: 'Período probatorio: pericial (médica, contable, psicológica), informativa (AFIP, ANSES, mutual), testimonial. Los peritos actúan en el juzgado. Plazo máximo fijado por el juez en la audiencia del art. 80.',
          pendientes: ['Alegatos Art. 94','Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 5, nombre: 'Alegatos Art. 94',
          definicion: 'Concluida la prueba, las partes presentan sus alegatos por escrito (art. 94 Ley 18.345), sintetizando los hechos probados y el derecho aplicable. Plazo: 6 días para el actor, 6 para la demandada.',
          pendientes: ['Autos para Sentencia','Sentencia Definitiva']
        },
        {
          id: 6, nombre: 'Autos para Sentencia',
          definicion: 'El juez llama autos para sentencia, cerrando el debate (art. 95 Ley 18.345). No se admiten escritos de las partes. El plazo para dictar sentencia es de 60 días hábiles.',
          pendientes: ['Sentencia Definitiva']
        },
        {
          id: 7, nombre: 'Sentencia Definitiva',
          definicion: 'El juez de primera instancia dicta sentencia. Es el hito final. Proceden los recursos de apelación y nulidad ante la Sala correspondiente de la CNAT (art. 116 Ley 18.345).',
          pendientes: []
        }
      ]
    }
  };

  // ── Palabras clave para clasificar texto libre ─────────────────
  var KEYWORDS = {
    'Civil y Comercial PBA': [
      { id: 1, keys: ['mediacion','mediación','mediador','acta de mediacion'] },
      { id: 2, keys: ['demanda','contestacion','contestación','traslado','excepcion'] },
      { id: 3, keys: ['audiencia preliminar','art. 360','art 360','apertura a prueba'] },
      { id: 4, keys: ['prueba','pericia','perito','testimonial','informativa','oficio','absolución'] },
      { id: 5, keys: ['alegato','autos para sentencia','art. 482','art. 484','llamar autos'] },
      { id: 6, keys: ['sentencia','fallo','resolucion','resoluciónion definitiva'] }
    ],
    'Laboral PBA': [
      { id: 1, keys: ['seclo','instancia administrativa','ministerio de trabajo','conciliacion previa'] },
      { id: 2, keys: ['demanda','contestacion','contestación','traslado','excepcion'] },
      { id: 3, keys: ['art. 25','art 25','audiencia art','apertura','conciliacion'] },
      { id: 4, keys: ['prueba','pericia','perito','testimonial','informativa','anses','afip','art'] },
      { id: 5, keys: ['vista de causa','vista','audiencia oral','alegato'] },
      { id: 6, keys: ['veredicto','fallo','sentencia'] }
    ],
    'Laboral Nación': [
      { id: 1, keys: ['seclo','conciliacion previa','ley 24635','certificado habilitante'] },
      { id: 2, keys: ['demanda','contestacion','contestación','traslado','excepcion','sorteo'] },
      { id: 3, keys: ['art. 80','art 80','audiencia art','apertura'] },
      { id: 4, keys: ['prueba','pericia','perito','testimonial','informativa','anses','afip'] },
      { id: 5, keys: ['alegato','art. 94','art 94'] },
      { id: 6, keys: ['autos para sentencia','art. 95','art 95','llamar autos'] },
      { id: 7, keys: ['sentencia','fallo','resolucion'] }
    ]
  };

  // ── API pública ────────────────────────────────────────────────
  return {

    // Lista de nombres de fuero disponibles
    getFueros: function () {
      return Object.keys(FUEROS);
    },

    // Etapas de un fuero (array completo)
    getEtapas: function (fuero) {
      return fuero && FUEROS[fuero] ? FUEROS[fuero].etapas : [];
    },

    // Color y ley del fuero
    getMeta: function (fuero) {
      return fuero && FUEROS[fuero]
        ? { color: FUEROS[fuero].color, ley: FUEROS[fuero].ley, hito: FUEROS[fuero].hito }
        : { color: '#6b7280', ley: '', hito: '' };
    },

    // Info completa de una etapa: definición + checklist restante
    getInfo: function (fuero, etapaNombre) {
      if (!fuero || !FUEROS[fuero]) return null;
      var etapa = FUEROS[fuero].etapas.find(function (e) {
        return e.nombre === etapaNombre;
      });
      if (!etapa) return null;
      return {
        nombre:     etapa.nombre,
        definicion: etapa.definicion,
        pendientes: etapa.pendientes,
        hito:       FUEROS[fuero].hito,
        ley:        FUEROS[fuero].ley,
        color:      FUEROS[fuero].color
      };
    },

    // Roadmap: devuelve {completadas[], actual, pendientes[], hito, ley, color}
    // Usá esto para el stepper del cliente y el panel de etapas del admin.
    getRoadmap: function (fuero, etapaActual) {
      if (!fuero || !FUEROS[fuero] || !etapaActual) return null;
      // Excluimos "Otra / Detalle" (id 7) del flujo principal
      var etapas = FUEROS[fuero].etapas.filter(function (e) { return e.id !== 7; });
      var meta   = FUEROS[fuero];
      var idx    = -1;
      for (var i = 0; i < etapas.length; i++) {
        if (etapas[i].nombre === etapaActual) { idx = i; break; }
      }
      if (idx === -1) return null;
      return {
        completadas: etapas.slice(0, idx).map(function (e) { return e.nombre; }),
        actual:      etapas[idx].nombre,
        definicion:  etapas[idx].definicion,
        pendientes:  etapas.slice(idx + 1).map(function (e) { return e.nombre; }),
        hito:        meta.hito,
        ley:         meta.ley,
        color:       meta.color
      };
    },

    // Clasifica texto libre dentro del fuero y devuelve la etapa sugerida
    clasificar: function (fuero, texto) {
      if (!fuero || !FUEROS[fuero] || !texto) return null;
      var t   = texto.toLowerCase();
      var kws = KEYWORDS[fuero] || [];
      var match = null;
      kws.forEach(function (grupo) {
        if (match) return;
        if (grupo.keys.some(function (k) { return t.indexOf(k) >= 0; })) {
          match = FUEROS[fuero].etapas.find(function (e) { return e.id === grupo.id; });
        }
      });
      return match || null;
    }
  };

})();
