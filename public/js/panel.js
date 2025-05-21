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
  addUser: (x = 60) => {
    return `<svg width="${x}px" height="${x}px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M17 10H20M23 10H20M20 10V7M20 10V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M1 20V19C1 15.134 4.13401 12 8 12V12C11.866 12 15 15.134 15 19V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;
  },
  user: (x = 60) => {
    return `<svg width="${x}px" height="${x}px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 20V19C5 15.134 8.13401 12 12 12V12C15.866 12 19 15.134 19 19V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;
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

accountSettingsBtn.addEventListener("click", handleSettings);

// Evento para registrar clicks sobre los hosts
document.addEventListener("click", function (e) {
  const hostEl = e.target.closest(".host");
  if (hostEl) {
    showContextMenu(hostEl, e);
  }
});

///////// Funciones
async function handleSettings(event) {
  // Ponemos un cargador
  enableLoader();

  // Pedimos los datos de los usuarios
  const accountData = await getAccountsData();

  if (!accountData || !accountData.success) {
    disableLoader();
    return ShowError(
      accountData.error ?? "Ha ocurrido un error cargando los usuarios"
    );
  }

  // Quitamos el loader
  disableLoader("settings");

  // Añadimos el boton de crear usuario
  const addUserBtn = document.createElement("button");
  addUserBtn.className = "add_user_btn";
  addUserBtn.innerHTML = Icons.addUser();

  mainView.appendChild(addUserBtn);

  ProcessUsers(accountData.users);

  userContextMenu(addUserBtn, [
    {
      html: `
      <form id="create-user-form" style="display:flex; flex-direction:column; gap:0.5rem;">
        <input name="username" placeholder="Usuario" required />
        <input name="passwd" type="password" placeholder="Contraseña" required />
        <button type="submit" class="create_user_btn">Crear</button>
      </form>
    `,
      onFormSubmit: async (form) => {
        const formData = new FormData(form);

        const body = {
          username: formData.get("username"),
          passwd: formData.get("passwd"),
        };

        const req = await fetch(domain + "/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const res = req.ok ? await req.json() : null;

        hideContextMenu();
        if (!res || !res.success) {
          return ShowError(
            res.error ?? "Ha ocurrido un error al crear el usuario"
          );
        }

        accountSettingsBtn.click();
      },
    },
  ]);
}

function ProcessUsers(users) {
  for (const user of users) {
    const div = document.createElement("div");
    div.className = "user";
    div.id = user.id; // Asignamos el id para recuperarlo mas adelante

    div.innerHTML = `
      ${Icons.user(45)}
      <span>${user.username}</span>
    `;

    mainView.appendChild(div);

    userContextMenu(div, [
      {
        label: "Eliminar",
        warning: true,
        action: () => {
          handleDeleteUser(user.id);
        },
      },
    ]);
  }
}

async function handleDeleteUser(id) {
  const req = await fetch(domain + "/account/" + id, { method: "DELETE" });

  const res = req.ok ? await req.json() : null;

  hideContextMenu();
  if (!res || !res.success) {
    return ShowError(res.error ?? "Ha ocurrido un error");
  }

  // Cerramos el menu y recargamos
  accountSettingsBtn.click();
}

async function getAccountsData() {
  const req = await fetch(domain + "/account/all");

  return req.ok ? await req.json() : null;
}

async function handleLogout(event) {
  event.preventDefault();

  console.log("Se esta borrando");
  // Hacemos la peticion
  const req = await fetch(`${domain}/account/logout`, { method: "POST" });

  console.log(req);

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
    return ShowError(res.error ?? "Ha ocurrido un error al cargar los equipos");
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
    return ShowError(
      res.error ?? "Ha ocurrido un error recuperando los equipos de esta clase"
    );
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
    return ShowError(
      res.error ?? "Ha ocurrido un error buscando nuevos equipos"
    );
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

// Gestion de errores

function ShowError(error) {
  // 1. Eliminar las alertas, display y errores anteriores
  CloseDisplays({ alert: false, display: false, error: true });
  // 2. Crear un nuevo back y error con el mensaje
  const back = document.createElement("div");
  back.className = "back";
  const errorD = document.createElement("div");
  errorD.className = "error";

  errorD.innerHTML = `
    <h4>Error</h4>
    <p>${error}</p>
    <button type="button" class="confirm_btn">
      <span>Aceptar</span>
    </button>
  `;

  // 3. Añadirlos a la pagina
  mainView.append(back);
  mainView.append(errorD);

  // 4. Añadir eventos
  const CloseError = () =>
    CloseDisplays({ alert: false, display: false, error: true });
  // Cerrar con el back
  back.addEventListener("click", CloseError);
  // Cerrar con el boton
  errorD.querySelector(".confirm_btn").addEventListener("click", CloseError);
}

function CloseDisplays({ error = true, alert = true, display = true } = {}) {
  // Funcion nombrada para eliminar
  const checkAndRemove = (Class) => {
    // Buscamos el elemento
    const element = $(Class);

    // Si está lo eliminamos
    if (element) {
      element.remove();
    }
  };

  // Indicamos que queremos cerrar para poder manejarlo mejor
  if (error) checkAndRemove(".error");

  if (alert) checkAndRemove(".alert");

  if (display) checkAndRemove(".display");

  // Borramos el back si está
  if ($(".back")) $(".back").remove();
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

function userContextMenu(element, options) {
  element.addEventListener("click", (e) => {
    e.stopPropagation();
    hideContextMenu();

    // 1) Overlay
    const overlay = document.createElement("div");
    overlay.className = "back radial-back";
    overlay.addEventListener("click", hideContextMenu);
    document.body.appendChild(overlay);

    // 2) Menú
    const menu = document.createElement("div");
    menu.className = "context-menu";

    let containsForm = false;

    // 3) Opciones
    options.forEach((opt) => {
      if (opt.html) {
        // Inyectamos contenido HTML (formulario)
        menu.innerHTML += opt.html;
        containsForm = true;
      } else {
        // Botón normal
        const btn = document.createElement("button");
        btn.className = "ctx-btn";
        if (opt.warning) btn.classList.add("warning");
        btn.textContent = opt.label;
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          opt.action(element);
        });
        menu.appendChild(btn);
      }
    });

    // Clase extra para menús con formularios
    if (containsForm) {
      menu.classList.add("context-menu-form");
    }

    // 4) Si hay formulario, capturar su envío
    const form = menu.querySelector("form");
    if (form && options[0].onFormSubmit) {
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        await options[0].onFormSubmit(form);
        hideContextMenu();
      });
    }

    // 5) Posicionar el menú junto al elemento
    const rect = element.getBoundingClientRect();
    const margin = 8;
    let left = rect.right + margin + window.scrollX;
    if (left + 200 > window.innerWidth) {
      left = rect.left - 200 - margin + window.scrollX;
    }
    const top = rect.top + window.scrollY;
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

    document.body.appendChild(menu);
  });
}

// Cierra y limpia overlay + menú
function hideContextMenu() {
  document
    .querySelectorAll(".back.radial-back, .context-menu")
    .forEach((el) => el.remove());
}

//////////////////////// Cuerpo
document.querySelector(".Clase1").click();
