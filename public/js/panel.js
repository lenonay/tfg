const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);
//// ELEMENTOS
const mainView = $("main");
// Botones
const classesBtns = $$(".class_btn");
const accountSettingsBtn = $(".account_settings_btn");
const logoutBtn = $(".logout_btn");
// Dominio
const domain = window.location.origin;
// Iconos
const Icons = {
  pc: (x = 60) => {
    return `<svg width="${x}px" height="${x}px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g fill="none" fill-rule="evenodd"> <path d="m0 0h32v32h-32z"></path> <path d="m27 3c2.7614237 0 5 2.23857625 5 5v12c0 2.7614237-2.2385763 5-5 5h-7v3h3c.5522847 0 1 .4477153 1 1s-.4477153 1-1 1h-14c-.55228475 0-1-.4477153-1-1s.44771525-1 1-1h3v-3h-7c-2.6887547 0-4.88181811-2.1223067-4.99538049-4.7831104l-.00461951-.2168896v-12c0-2.76142375 2.23857625-5 5-5zm-9 25v-3h-4v3zm9-23h-22c-1.65685425 0-3 1.34314575-3 3v12c0 1.6568542 1.34314575 3 3 3h22c1.6568542 0 3-1.3431458 3-3v-12c0-1.65685425-1.3431458-3-3-3z" fill="currentColor" fill-rule="nonzero"></path> </g> </g></svg>`;
  },
};

// Menu Contextual
const contextOptions = [
  {
    label: "Desbloquear",
    action: (hostEl) => handleUnblock(hostEl),
  },
  {
    label: "Bloquear",
    action: (hostEl) => handleBlock(hostEl),
  },
  {
    label: "Modo CAMPUS",
    action: (hostEl) => handleCampusBlock(hostEl),
  },
  {
    label: "Eliminar",
    action: (hostEl) => handleDeleteHost(hostEl),
    warning: true,
  },
];

////////// EVENTOS
logoutBtn.addEventListener("click", handleLogout);
for (const classBtn of classesBtns) {
  classBtn.addEventListener("click", handleClassBtn);
}

// Evento para registrar clicks sobre los hosts
document.addEventListener("click", function (e) {
  const hostEl = e.target.closest(".host");
  if (hostEl) {
    showContextMenu(hostEl, e);
  }
});

///////// Funciones
async function handleLogout() {
  // Hacemos la peticion
  const req = await fetch(`${domain}/account/login`, { method: "DELETE" });

  // Vamos al login
  window.location = "/";
}

async function handleClassBtn(event) {
  const className = event.target.textContent;

  // Ponemos un loader
  enableLoader();

  // Hacemos la petición de los hosts activos de esa clase
  const req = await fetch(domain + "/hosts/class/" + className);

  const res = req.ok ? await req.json() : null;

  if (!res || !res.success) {
    // TODO
    return;
  }

  // Procesamos la respuesta
  ProcessHosts(res.hosts, res.network, className);
}

function ProcessHosts(hosts, network, className) {
  const hostsGrid = SetView(network, className);

  // 1. Creamos el codigo html de cada host
  for (const host of hosts) {
    const div = document.createElement("div");
    div.className = "host";

    div.classList.add("code" + host.blocked);

    div.setAttribute("ip", host.ip); // Asignamos la IP
    div.setAttribute("className", className.replace(" ", ""));

    const hostID = host.ip.split(".").pop(); // Nos quedamos con el ultimo octeto de la IP

    div.innerHTML = `
      ${Icons.pc(60)}
      <span>${hostID}</span>
    `;

    hostsGrid.appendChild(div);
  }
}

function SetView(network, className) {
  // Desactivamos el loader
  disableLoader("viewer");
  mainView.setAttribute("className", className);

  // Creamos los elementos html
  const actionBar = document.createElement("div");
  actionBar.className = "action_bar";

  const hostsGrid = document.createElement("div");
  hostsGrid.className = "hosts_grid";

  const mapLegend = document.createElement("div");
  mapLegend.className = "map_legend";

  // Los metemos al contenedor
  mainView.appendChild(actionBar);
  mainView.appendChild(hostsGrid);
  mainView.appendChild(mapLegend);

  actionBar.innerHTML = `
    <div class="network">
      <h3>Red: <span>${network}</span><h3>
    </div>
    <div class="buttons">
      <button type="button" class="unblock_all_btn">Desbloquear todos</button>
      <button type="button" class="block_all_btn">Bloquear todos</button>
      <button type="button" class="cblock_all_btn">Modo CAMPUS</button>
      <button type="button" class="discover_btn">Descubrir Equipos</button>
    </div>
  `;

  mapLegend.innerHTML = `
    <div class="code0">
      ${Icons.pc(20)}
      <span>Navegación libre</span>
    </div>
    <div class="code1">
      ${Icons.pc(20)}
      <span>Navegación bloqueada</span>
    </div>
    <div class="code2">
      ${Icons.pc(20)}
      <span>Navegación restringida al CAMPUS</span>
    </div>
  `;

  // EVENTOS
  // Descubrir hosts y recargar la clase
  actionBar
    .querySelector(".unblock_all_btn")
    .addEventListener("click", async () => {
      await requestAll("unblock");
    });
  actionBar
    .querySelector(".block_all_btn")
    .addEventListener("click", async () => {
      await requestAll("block");
    });
  actionBar
    .querySelector(".cblock_all_btn")
    .addEventListener("click", async () => {
      await requestAll("c-block");
    });
  actionBar
    .querySelector(".discover_btn")
    .addEventListener("click", handleDiscover);

  return hostsGrid;
}

async function requestAll(mode) {
  // 1. Recuperamos el nombre de la clase
  const className = mainView.getAttribute("className");

  // 2. Ponemos un loader
  enableLoader();

  // 3. Hacemos la petición de recagar
  const req = await fetch(`${domain}/hosts/all/${mode}/${className}`, {
    method: "PUT",
  });

  const res = req.ok ? await req.json() : null;

  if (!res || !res.success) {
    disableLoader();
    // TODO mostrar error
  }

  setTimeout(() => {
    document.querySelector(`.${className.replace(" ", "")}`).click();
  }, 400);
}

async function handleDiscover() {
  // 1. Recuperamos el nombre de la clase
  const className = mainView.getAttribute("className");

  // 2. Ponemos un loader
  enableLoader();

  // 3. Hacemos la petición de recagar
  const req = await fetch(domain + "/hosts/reload/" + className);

  const res = req.ok ? await req.json() : null;

  if (!res || !res.success) {
    disableLoader();
    // TODO mostrar error
  }

  document.querySelector(`.${className.replace(" ", "")}`).click();
}

async function handleUnblock(hostEl) {
  const ip = hostEl.getAttribute("ip");
  const className = hostEl.getAttribute("className");

  await sendHostRequest("unblock", ip);

  hideContextMenu();
  setTimeout(() => {
    document.querySelector("." + className).click();
  }, 300);
}

async function handleBlock(hostEl) {
  const ip = hostEl.getAttribute("ip");
  const className = hostEl.getAttribute("className");

  await sendHostRequest("block", ip);

  hideContextMenu();
  setTimeout(() => {
    document.querySelector("." + className).click();
  }, 300);
}

async function handleCampusBlock(hostEl) {
  const ip = hostEl.getAttribute("ip");
  const className = hostEl.getAttribute("className");

  await sendHostRequest("c-block", ip);

  hideContextMenu();
  setTimeout(() => {
    document.querySelector("." + className).click();
  }, 300);
}

async function handleDeleteHost(hostEl) {
  const ip = hostEl.getAttribute("ip");
  const className = hostEl.getAttribute("className");

  await sendHostRequest("delete", ip);

  hideContextMenu();
  setTimeout(() => {
    document.querySelector("." + className).click();
  }, 300);
}

async function sendHostRequest(action, ip) {
  // 1. Hacemos la petición
  const req = await fetch(`${domain}/hosts/${action}/${ip}`, {
    method: "PUT",
  });

  // 2. Miramos el estado
  return req.ok ? await req.json() : null;
}

/// LOADERS
function enableLoader() {
  mainView.className = "loading";
  mainView.innerHTML = "<div class='loader'></div>";
}

function disableLoader(className = "") {
  mainView.className = className;
  mainView.innerHTML = "";
}

/// Menu contextual
function showContextMenu(hostEl, e) {
  hideContextMenu();

  // 1) Overlay
  const overlay = document.createElement("div");
  overlay.className = "back radial-back";
  overlay.addEventListener("click", hideContextMenu);
  document.body.appendChild(overlay);

  // 2) Menú
  const menu = document.createElement("div");
  menu.className = "context-menu";

  // 3) Botones
  contextOptions.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "ctx-btn";

    if (opt.warning) {
      btn.classList.add("warning");
    }

    btn.textContent = opt.label;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      opt.action(hostEl);
    });
    menu.appendChild(btn);
  });

  // 4) Posicionar el menú junto al host
  const rect = hostEl.getBoundingClientRect();
  // Intentamos mostrarlo a la derecha del host; si no cabe, a la izquierda
  const margin = 8;
  const top = rect.top + window.scrollY;
  let left = rect.right + margin + window.scrollX;
  if (left + 150 > window.innerWidth) {
    left = rect.left - 150 - margin + window.scrollX;
  }
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;

  document.body.appendChild(menu);
}

// Cierra y limpia overlay + menú
function hideContextMenu() {
  document
    .querySelectorAll(".back.radial-back, .context-menu")
    .forEach((el) => el.remove());
}

//////////////////////// Cuerpo
document.querySelector("#tmp").click();
