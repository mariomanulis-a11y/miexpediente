// ── Controladores de vistas ───────────────────────────────────
const ViewController = {

  login() {}, // manejado inline en Views.login()

  solicitarAcceso() {
    window.solicitarWA = function() {
      var nombre = document.getElementById('sa-nombre').value.trim();
      var cel    = document.getElementById('sa-cel').value.trim();
      if (!nombre) { alert('Ingresá tu nombre.'); return; }
      WhatsApp.solicitarAcceso(nombre, cel);
    };
  },

  async dashboardProf(stats) {
    try {
      const u    = Store.getUser();
      const exps = await API.getExpedientes(u);
      const last = exps.slice(0, 5);
      const body = document.getElementById('recientes-body');
      if (!body) return;
      if (!last.length) { body.innerHTML = '<p class="empty-state-text" style="padding:.75rem">Sin expedientes aún.</p>'; return; }
      body.innerHTML = last.map(e => `
        <div class="expediente-card" onclick="Router.go('expediente-detalle','${e.id}')" style="margin-bottom:.5rem">
          <div class="expediente-card-header">
            <div>
              <div class="expediente-numero">${e.numero||''}</div>
              <div class="expediente-caratula">${Utils.truncate(e.caratula,55)}</div>
            </div>
            ${Utils.statusBadge(e.estado)}
          </div>
          <div class="expediente-meta">
            <span class="expediente-fecha">${Utils.formatDate(e.updatedAt)}</span>
          </div>
        </div>`).join('');
    } catch(err) { console.error(err); }
  },

  expedientes() {
    const tbody = document.getElementById('exp-tbody');
    if (!tbody) return;
    const all = Store.getExpedientes();

    function filtrar(estado) {
      return estado === 'todos' ? all : all.filter(e => e.estado === estado);
    }
    function renderRows(list) {
      if (!list.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Sin resultados</td></tr>'; return; }
      tbody.innerHTML = list.map(e => `
        <tr onclick="Router.go('expediente-detalle','${e.id}')" style="cursor:pointer">
          <td><span style="font-family:var(--font-mono);font-size:.78rem">${e.numero||'—'}</span></td>
          <td>${Utils.truncate(e.caratula,50)}</td>
          <td>${e.juzgado||'—'}</td>
          <td>${Utils.statusBadge(e.estado)}</td>
          <td>${Utils.formatDate(e.updatedAt)}</td>
        </tr>`).join('');
    }

    let estadoActivo = 'todos';
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', function() {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        estadoActivo = this.dataset.filter;
        renderRows(filtrar(estadoActivo));
      });
    });

    const search = document.getElementById('search-exp');
    if (search) {
      search.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        const base = filtrar(estadoActivo);
        renderRows(q ? base.filter(e => (e.caratula||'').toLowerCase().includes(q) || (e.numero||'').toLowerCase().includes(q)) : base);
      });
    }
  },

  expedienteDetalle(exp) {
    window.Controllers = window.Controllers || {};
    window.Controllers.abrirMovimiento = async function(expId) {
      openModal(`
        <div class="modal-header">
          <span class="modal-title">Agregar novedad</span>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="form-group">
          <label class="form-label">Descripción de la novedad</label>
          <textarea id="mov-texto" class="form-input" rows="4" placeholder="Ej: Se fijó audiencia para el 15/03/2025..."></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button id="btn-mov" class="btn btn-primary" onclick="guardarMov('${expId}')">Guardar</button>
        </div>`);
    };

    window.guardarMov = async function(expId) {
      var texto = document.getElementById('mov-texto').value.trim();
      if (!texto) { toast('Escribí la novedad.', 'error'); return; }
      var btn = document.getElementById('btn-mov');
      Utils.setLoading(btn, true);
      try {
        await API.agregarMovimiento(expId, texto, Store.getUser().uid);
        closeModal();
        toast('Novedad agregada', 'success');
        Router.go('expediente-detalle', expId);
      } catch(e) { toast('Error al guardar', 'error'); Utils.setLoading(btn, false); }
    };
  },

  clientes() {
    window.Controllers = window.Controllers || {};

    window.Controllers.nuevoCliente = function() {
      openModal(`
        <div class="modal-header">
          <span class="modal-title">Nuevo cliente</span>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="form-group"><label class="form-label">Apellido *</label><input id="nc-apellido" class="form-input" type="text"></div>
        <div class="form-group"><label class="form-label">Nombre *</label><input id="nc-nombre" class="form-input" type="text"></div>
        <div class="form-group"><label class="form-label">Email</label><input id="nc-email" class="form-input" type="email"></div>
        <div class="form-group"><label class="form-label">Celular (WhatsApp)</label><input id="nc-cel" class="form-input" type="tel" placeholder="549..."></div>
        <div class="form-group"><label class="form-label">DNI</label><input id="nc-dni" class="form-input" type="text"></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button id="btn-nc" class="btn btn-primary" onclick="Controllers._guardarNuevoCliente()">Guardar</button>
        </div>`);
    };

    window.Controllers._guardarNuevoCliente = async function() {
      var ap  = document.getElementById('nc-apellido').value.trim();
      var nom = document.getElementById('nc-nombre').value.trim();
      if (!ap||!nom) { toast('Apellido y nombre son obligatorios', 'error'); return; }
      var btn = document.getElementById('btn-nc');
      Utils.setLoading(btn, true);
      try {
        await API.crearCliente({
          apellido: ap, nombre: nom,
          email: document.getElementById('nc-email').value.trim(),
          celular: document.getElementById('nc-cel').value.trim(),
          dni: document.getElementById('nc-dni').value.trim(),
          tieneAcceso: false
        }, Store.getUser().uid);
        closeModal();
        toast('Cliente creado', 'success');
        Router.go('clientes');
      } catch(e) { toast('Error al crear cliente', 'error'); Utils.setLoading(btn, false); }
    };

    window.Controllers.habilitarCliente = function(id) {
      toast('Función disponible en próxima versión', 'info');
    };

    window.Controllers.editarCliente = function(id) {
      toast('Función disponible en próxima versión', 'info');
    };
  },

  nuevoExpediente() {
    window.Controllers = window.Controllers || {};
    window.Controllers.guardarExpediente = async function() {
      var caratula = document.getElementById('nexp-caratula').value.trim();
      if (!caratula) { toast('La carátula es obligatoria', 'error'); return; }
      var btn = document.getElementById('btn-guardar-exp');
      Utils.setLoading(btn, true);
      var mov = document.getElementById('nexp-mov').value.trim();
      var data = {
        caratula,
        numero:       document.getElementById('nexp-numero').value.trim(),
        estado:       document.getElementById('nexp-estado').value,
        juzgado:      document.getElementById('nexp-juzgado').value.trim(),
        fuero:        document.getElementById('nexp-fuero').value,
        actora:       document.getElementById('nexp-actora').value.trim(),
        demandada:    document.getElementById('nexp-demandada').value.trim(),
        fechaInicio:  document.getElementById('nexp-fecha').value,
        clienteId:    document.getElementById('nexp-cliente').value||null,
        observaciones:document.getElementById('nexp-obs').value.trim(),
        movimientos:  mov ? [{ texto: mov, fecha: new Date().toISOString(), profesionalId: Store.getUser().uid }] : []
      };
      try {
        const id = await API.crearExpediente(data, Store.getUser());
        toast('Expediente creado', 'success');
        Router.go('expediente-detalle', id);
      } catch(e) { toast('Error al crear expediente', 'error'); Utils.setLoading(btn, false); }
    };
  },

  configuracion() {
    window.Controllers = window.Controllers || {};
    window.Controllers.guardarConfig = function() {
      toast('Configuración guardada', 'success');
    };
  },

  perfil() {
    window.Controllers = window.Controllers || {};
    window.Controllers.guardarPerfil = async function() {
      var nombre = document.getElementById('prf-nombre').value.trim();
      var waEl   = document.getElementById('prf-wa');
      var uid    = Store.getUser().uid;
      var data   = { nombre };
      if (waEl) data.whatsapp = waEl.value.trim();
      try {
        await API.actualizarPerfil(uid, data);
        Store.getUser().nombre = nombre;
        toast('Perfil actualizado', 'success');
      } catch(e) { toast('Error al guardar perfil', 'error'); }
    };
  }
};
