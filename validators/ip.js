import z from "zod";

const cidrRegex = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\/([0-9]|[12][0-9]|3[0-2])$/;

const network = z
  .string({ message: "La red IP es obligatoria" })
  .refine((val) => cidrRegex.test(val), {
    message: "Formato de red IP inválido. Debe ser CIDR IPv4, ej. 192.168.1.0/24",
  });

export function validateNet(net) {
  const result = network.safeParse(net);
  return result;
}
