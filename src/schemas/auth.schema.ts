import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string({
    required_error: 'El campo "username" es requerido.',
    invalid_type_error: 'El campo "username" debe ser un texto.'
  }).trim().min(1, 'El campo "username" no puede estar vacío.'),
  password: z.string({
    required_error: 'El campo "password" es requerido.'
  }).min(4, 'El campo "password" debe tener al menos 4 caracteres.')
});

export type LoginInput = z.infer<typeof LoginSchema>;
