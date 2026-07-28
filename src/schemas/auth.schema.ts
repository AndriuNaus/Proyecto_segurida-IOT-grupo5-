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

export const RegisterSchema = z.object({
  username: z.string({
    required_error: 'El campo "username" (correo) es requerido.',
    invalid_type_error: 'El campo "username" debe ser un texto.'
  }).trim().email('Correo electrónico no válido.'),
  password: z.string({
    required_error: 'El campo "password" es requerido.'
  })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula.')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número.'),
  role: z.enum(['cliente', 'admin', 'tecnico', 'Cliente', 'Admin', 'Tecnico'])
    .default('cliente')
    .transform(val => val.toLowerCase() as 'cliente' | 'admin' | 'tecnico'),
  primer_nombre: z.string().min(1, 'El primer nombre es requerido'),
  segundo_nombre: z.string().optional(),
  primer_apellido: z.string().min(1, 'El primer apellido es requerido'),
  segundo_apellido: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional()
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

