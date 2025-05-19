const $ = (el) => document.querySelector(el);
const $$ = (el) => document.querySelectorAll(el);
//// ELEMENTOS
const inpUsername = $("#inp_username");
const inpPasswd = $("#inp_passwd");
const loginButton = $(".login_button");
const errorDisplay = $(".error_display");
// Dominio
const domain = window.location.origin;

//// Eventos
loginButton.addEventListener("click", HandleLogin);

inpPasswd.addEventListener("keydown", (e) => {
  // Si se presiona enter, enviamos el formulario
  if (e.key == "Enter") loginButton.click();
});

//// Funciones
async function HandleLogin() {
  // 2. Formar el JSON
  const data = {
    username: inpUsername.value,
    passwd: inpPasswd.value,
  };

  // 3. Enviar la petición
  const res = await SendLoginRequest(data);
  
  // 4. Procesar la respuesta
  if (!res.success) {
    ShowError(res.error);
    return;
  }

  // 4.2 Guardamos la información en el session storage
  sessionStorage.setItem("userdata", res.data);

  // Si somos admins podemos entrar
  window.location = "./panel";
}

async function SendLoginRequest(data) {
  const req = await fetch(`${domain}/account/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  console.log()

  return req.ok ? await req.json() : null;
}

function ShowError(error) {
  // Colocamos el texto y activamos el mensaje de error
  errorDisplay.textContent = typeof error == "string" ? error : error.error;
  errorDisplay.classList.add("active");

  // Funcion para marcar campos erroneos
  const markError = (fieldName) => {
    const field = document.querySelector(`input[name=${fieldName}]`);

    // Añadimos la clase de error
    field.classList.add("error");
    // Y un evento que se ejecuta una sola vez
    field.addEventListener(
      "input",
      (e) => {
        e.target.classList.remove("error");
      },
      { once: true }
    );
  };

  if (error.field) {
    markError(error.field);
    return;
  }

  // Si no hay campo marcamos ambos
  markError("username");
  markError("passwd");
}

function HideError() {
  errorDisplay.textContent = "";
  errorDisplay.classList.remove("active");
}
