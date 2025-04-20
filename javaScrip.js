
let db;
const dbName = "comunidadGamer";

window.onload = () => {
  const request = indexedDB.open(dbName, 1);

  request.onerror = (e) => console.error("Error abriendo DB", e);

  request.onupgradeneeded = (e) => {
    db = e.target.result;
    const clienteStore = db.createObjectStore("clientes", { keyPath: "id", autoIncrement: true });
    const torneoStore = db.createObjectStore("torneos", { keyPath: "id", autoIncrement: true });
    const inscripcionStore = db.createObjectStore("inscripciones", { keyPath: "id", autoIncrement: true });
  };

  request.onsuccess = (e) => {
    db = e.target.result;
    cargarClientes();
    cargarTorneos();
    cargarInscripciones();
  };
};

// Funciones utilitarias
function guardarEnDB(storeName, data, callback) {
  const tx = db.transaction([storeName], "readwrite");
  const store = tx.objectStore(storeName);
  store.add(data);
  tx.oncomplete = callback;
}

function actualizarEnDB(storeName, data, callback) {
  const tx = db.transaction([storeName], "readwrite");
  const store = tx.objectStore(storeName);
  store.put(data);
  tx.oncomplete = callback;
}

function eliminarEnDB(storeName, id, callback) {
  const tx = db.transaction([storeName], "readwrite");
  const store = tx.objectStore(storeName);
  store.delete(id);
  tx.oncomplete = callback;
}

// CLIENTES
const formCliente = document.getElementById("formCliente");
formCliente.onsubmit = e => {
  e.preventDefault();
  const nombre = document.getElementById("clienteNombre").value;
  const departamento = document.getElementById("clienteDepartamento").value;

  if (clienteEditando) {
    clienteEditando.nombre = nombre;
    clienteEditando.departamento = departamento;
    actualizarEnDB("clientes", clienteEditando, () => {
      formCliente.reset();
      clienteEditando = null;
      cargarClientes();
    });
  } else {
    guardarEnDB("clientes", { nombre, departamento }, () => {
      formCliente.reset();
      cargarClientes();
    });
  }
};


function cargarClientes() {
  const tbody = document.getElementById("tablaClientes");
  const select = document.getElementById("selectCliente");
  tbody.innerHTML = "";
  select.innerHTML = '<option disabled selected>Seleccione cliente</option>';
  const tx = db.transaction("clientes", "readonly").objectStore("clientes").openCursor();
  tx.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const { id, nombre, departamento } = cursor.value;
      tbody.innerHTML += `<tr><td>${nombre}</td><td>${departamento}</td>
        <td>
  <button class='btn btn-sm btn-primary me-1' onclick='editarCliente(${id})'>Editar</button>
  <button class='btn btn-sm btn-danger' onclick='eliminarEnDB("clientes", ${id}, cargarClientes)'>Eliminar</button>
     </td> </tr>`;
      select.innerHTML += `<option value="${id}">${nombre}</option>`;
      cursor.continue();
    }
  };
}
// CREANDO FUNCCION EDITAR CLIENTES
let clienteEditando = null;

function editarCliente(id) {
  const tx = db.transaction("clientes", "readonly");
  const store = tx.objectStore("clientes");
  const req = store.get(id);

  req.onsuccess = () => {
    const cliente = req.result;
    document.getElementById("clienteNombre").value = cliente.nombre;
    document.getElementById("clienteDepartamento").value = cliente.departamento;
    clienteEditando = cliente;
  };
}

// TORNEOS
const formTorneo = document.getElementById("formTorneo");
formTorneo.onsubmit = e => {
  e.preventDefault();
  const nombre_torneo = document.getElementById("torneoNombre").value;
  const juego = document.getElementById("torneoJuego").value;
  const fecha = document.getElementById("torneoFecha").value;
  guardarEnDB("torneos", { nombre_torneo, juego, fecha }, () => {
    formTorneo.reset();
    cargarTorneos();
  });
};

function cargarTorneos() {
  const tbody = document.getElementById("tablaTorneos");
  const select = document.getElementById("selectTorneo");
  tbody.innerHTML = "";
  select.innerHTML = '<option disabled selected>Seleccione torneo</option>';
  const tx = db.transaction("torneos", "readonly").objectStore("torneos").openCursor();
  tx.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const { id, nombre_torneo, juego, fecha } = cursor.value;
      tbody.innerHTML += `<tr><td>${nombre_torneo}</td><td>${juego}</td><td>${fecha}</td>
        <td><button class='btn btn-sm btn-danger' onclick='eliminarEnDB("torneos", ${id}, cargarTorneos)'>Eliminar</button></td></tr>`;
      select.innerHTML += `<option value="${id}">${nombre_torneo}</option>`;
      cursor.continue();
    }
  };
}

// INSCRIPCIONES
const formInscripcion = document.getElementById("formInscripcion");
formInscripcion.onsubmit = e => {
  e.preventDefault();
  const cliente_id = parseInt(document.getElementById("selectCliente").value);
  const torneo_id = parseInt(document.getElementById("selectTorneo").value);
  guardarEnDB("inscripciones", { cliente_id, torneo_id }, () => {
    formInscripcion.reset();
    cargarInscripciones();
  });
};

function cargarInscripciones() {
  const tbody = document.getElementById("tablaInscripciones");
  tbody.innerHTML = "";

  const tx = db.transaction(["inscripciones", "clientes", "torneos"], "readonly");
  const insStore = tx.objectStore("inscripciones");
  const cliStore = tx.objectStore("clientes");
  const torStore = tx.objectStore("torneos");

  insStore.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const { id, cliente_id, torneo_id } = cursor.value;

      let clienteNombre = "";
      let torneoNombre = "";

      const clienteReq = cliStore.get(cliente_id);
      clienteReq.onsuccess = () => {
        clienteNombre = clienteReq.result?.nombre || "[Cliente eliminado]";
        const torneoReq = torStore.get(torneo_id);
        torneoReq.onsuccess = () => {
          torneoNombre = torneoReq.result?.nombre_torneo || "[Torneo eliminado]";

          tbody.innerHTML += `<tr><td>${clienteNombre}</td><td>${torneoNombre}</td>
            <td><button class='btn btn-sm btn-danger' onclick='eliminarEnDB("inscripciones", ${id}, cargarInscripciones)'>Eliminar</button></td></tr>`;
        };
      };
      cursor.continue();
    }
  };
}
