const API = '/productos';
let modoEdicion = false;
let idEditando = null;
let idAEliminar = null;

// INIT
document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();

  // cerrar modal al hacer click fuera
  document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) cerrarModal();
  });
});

// ==============================
// CARGAR PRODUCTOS
// ==============================
async function cargarProductos() {
  const categoria = document.getElementById('filtro-categoria').value;
  const orden = document.getElementById('filtro-orden').value;

  let url = API;
  const params = new URLSearchParams();

  if (categoria) params.append('categoria', categoria);
  if (orden) params.append('orden', orden);
  if ([...params].length) url += '?' + params.toString();

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) throw new Error(json.mensaje);

    renderizarTabla(json.data);

    document.getElementById('contador-productos').textContent =
      `${json.total} producto${json.total !== 1 ? 's' : ''}`;
  } catch (err) {
    mostrarFila(err.message);
  }
}

// ==============================
// TABLA (FIX REAL)
// ==============================
function renderizarTabla(productos) {
  const tbody = document.getElementById('tbody-productos');

  if (!productos.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="vacio">No hay productos</td></tr>`;
    return;
  }

  tbody.innerHTML = '';

  productos.forEach((p, i) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapar(p.nombre)}</td>
      <td>${escapar(p.descripcion)}</td>
      <td>S/ ${Number(p.precio).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>${escapar(p.categoria)}</td>
      <td>
        <button class="editar btn btn-warning">Editar</button>
        <button class="eliminar btn-sm-danger">Eliminar</button>
      </td>
    `;

    // ✅ EDITAR (sin null)
    tr.querySelector('.editar').addEventListener('click', () => {
      cargarParaEditar(p._id);
    });

    // ✅ ELIMINAR (sin null)
    tr.querySelector('.eliminar').addEventListener('click', () => {
      pedirConfirmacion(p._id, p.nombre);
    });

    tbody.appendChild(tr);
  });
}

function mostrarFila(msg) {
  document.getElementById('tbody-productos').innerHTML =
    `<tr><td colspan="7">${msg}</td></tr>`;
}

// ==============================
// GUARDAR
// ==============================
async function guardarProducto() {
  limpiarErrores();

  const datos = {
    nombre: document.getElementById('nombre').value.trim(),
    descripcion: document.getElementById('descripcion').value.trim(),
    precio: document.getElementById('precio').value,
    stock: document.getElementById('stock').value,
    categoria: document.getElementById('categoria').value,
  };

  if (!validarFormulario(datos)) return;

  const url = modoEdicion ? `${API}/${idEditando}` : API;
  const metodo = modoEdicion ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...datos,
        precio: parseFloat(datos.precio),
        stock: parseInt(datos.stock),
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      if (json.errores) {
        json.errores.forEach(e => mostrarErrorCampo(e.campo, e.mensaje));
      }
      return mostrarAlerta(json.mensaje, 'error');
    }

    mostrarAlerta(json.mensaje, 'success');
    limpiarFormulario();
    cargarProductos();

  } catch {
    mostrarAlerta('Error servidor', 'error');
  }
}

// ==============================
// EDITAR
// ==============================
async function cargarParaEditar(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.mensaje || 'Error al obtener producto');
    }

    const p = json.data;

    document.getElementById('nombre').value = p.nombre;
    document.getElementById('descripcion').value = p.descripcion;
    document.getElementById('precio').value = p.precio;
    document.getElementById('stock').value = p.stock;
    document.getElementById('categoria').value = p.categoria;

    // 🔥 ACTIVAR MODO EDICIÓN
    modoEdicion = true;
    idEditando = id;

    console.log('EDITANDO ID:', id); // debug

  } catch (err) {
    console.error(err);
    mostrarAlerta('Error al cargar producto', 'error');
  }
}

function cancelarEdicion() {
  limpiarFormulario();
}

// ==============================
// ELIMINAR (FIX AQUÍ)
// ==============================
function pedirConfirmacion(id, nombre) {
  idAEliminar = id;

  document.getElementById('modal-nombre-producto').textContent = nombre;
  document.getElementById('modal-overlay').style.display = 'flex';

  document.getElementById('btn-confirmar-eliminar').onclick = async () => {
    const idSeguro = idAEliminar; // 🔥 FIX
    cerrarModal();
    await eliminarProducto(idSeguro);
  };
}

async function eliminarProducto(id) {
  if (!id) return; // 🔥 evita null

  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const json = await res.json();

    mostrarAlerta(json.mensaje, res.ok ? 'success' : 'error');

    if (res.ok) cargarProductos();
  } catch {
    mostrarAlerta('Error al eliminar', 'error');
  }
}

function cerrarModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  idAEliminar = null;
}

// ==============================
// VALIDACIÓN
// ==============================
function validarFormulario(d) {
  let ok = true;

  if (!d.nombre) ok = false;
  if (!d.descripcion) ok = false;
  if (!d.precio || d.precio < 0) ok = false;
  if (!d.stock || d.stock < 0) ok = false;
  if (!d.categoria) ok = false;

  return ok;
}

// ==============================
// UTIL
// ==============================
function limpiarFormulario() {
  ['nombre','descripcion','precio','stock'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('categoria').value = '';
  modoEdicion = false;
  idEditando = null;
}

function mostrarAlerta(msg, tipo) {
  console.log(tipo, msg);
}

function limpiarErrores() {}

function mostrarErrorCampo() {}

function escapar(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}