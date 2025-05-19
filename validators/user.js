import { z } from "zod";

const loginSchema = z
  .object({
    username: z
      .string({ message: "El usuario es obligatorio" })
      .nonempty({ message: "El usuario no puede estar vacío" }),
    passwd: z
      .string({ message: "La contraseña es obligatoria" })
      .min(5, { message: "La contraseña debe tener al menos 5 caracteres" }),
  })
  .strict();

export class UserValidator {
  static login(data) {
    // Validamos los campos recibidos
    const result = loginSchema.safeParse(data);

    // Si hubo éxito en la validación retornamos
    if (result.success) {
      return { success: true, data: result.data };
    }

    // Extraemos los mensajes de error y sus campos para enviarlos al frontend
    const errorMessages = result.error.errors.map((error) => {
      return { field: error.path[0], error: error.message };
    });

    // Retornamos el estado del error y el primer mensaje de error
    return { success: false, error: errorMessages[0] };
  }
}
