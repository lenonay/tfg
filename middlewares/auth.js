export function auth(req, res, next){
  // Si no tenemos sesión válida evitamos al acceso
  if(!req.session){
    res.status(401).send();
    return;
  }

  // Si tenemos sesion continuamos
  next();
}